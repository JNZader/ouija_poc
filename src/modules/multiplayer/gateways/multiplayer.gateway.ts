import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { MultiplayerRoomService } from '../services/multiplayer-room.service';
import { ConversationService } from '../../ouija/services/conversation.service';
import { WsExceptionFilter } from '../filters/ws-exception.filter';
import { CreateRoomDto, JoinRoomDto, LeaveRoomDto, SendMessageDto } from '../dto/multiplayer.dto';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../interfaces/websocket-events.interface';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especificar dominios permitidos
    credentials: true,
  },
  namespace: '/multiplayer',
})
@UseFilters(new WsExceptionFilter())
@UsePipes(new ValidationPipe({ transform: true }))
export class MultiplayerGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(MultiplayerGateway.name);

  constructor(
    private readonly roomService: MultiplayerRoomService,
    private readonly conversationService: ConversationService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    try {
      // Remover participante de cualquier sala
      const roomCode = await this.roomService.removeParticipantBySocketId(client.id);

      if (roomCode) {
        // Notificar a otros participantes
        const participants = await this.roomService.getRoomParticipants(roomCode);

        this.server.to(roomCode).emit('user-left', {
          username: 'Unknown',
          userId: client.id,
          participants,
        });

        // Si la sala está vacía, terminarla
        if (participants.length === 0) {
          this.server.to(roomCode).emit('room-ended', {
            roomCode,
            reason: 'All participants left',
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error handling disconnect for ${client.id}:`, error.message);
    }
  }

  /**
   * Crear una nueva sala
   */
  @SubscribeMessage('create-room')
  async handleCreateRoom(@MessageBody() data: CreateRoomDto, @ConnectedSocket() client: Socket) {
    try {
      const roomData = await this.roomService.createRoom(
        data.spiritId,
        data.userId,
        data.username,
        client.id,
      );

      // Unir al cliente a la sala de Socket.io
      await client.join(roomData.roomCode);

      // Enviar respuesta al creador
      client.emit('room-created', roomData);

      this.logger.log(`Room ${roomData.roomCode} created by ${data.username}`);
    } catch (error) {
      this.logger.error('Error creating room:', error.message);
      client.emit('error', {
        code: 'CREATE_ROOM_ERROR',
        message: error.message,
      });
    }
  }

  /**
   * Unirse a una sala existente
   */
  @SubscribeMessage('join-room')
  async handleJoinRoom(@MessageBody() data: JoinRoomDto, @ConnectedSocket() client: Socket) {
    try {
      const roomData = await this.roomService.joinRoom(
        data.roomCode,
        data.userId,
        data.username,
        client.id,
      );

      // Unir al cliente a la sala de Socket.io
      await client.join(data.roomCode);

      // Notificar a otros participantes
      this.server.to(data.roomCode).emit('user-joined', {
        username: data.username,
        userId: data.userId,
        participants: roomData.participants,
      });

      // Enviar datos de la sala al nuevo participante
      client.emit('room-joined', roomData);

      // Enviar historial de mensajes
      const messages = await this.roomService.getRoomMessages(data.roomCode);
      for (const msg of messages) {
        client.emit('new-message', {
          messageId: msg.id.toString(),
          role: msg.role as 'user' | 'spirit',
          username: msg.username || undefined,
          content: msg.content,
          timestamp: msg.createdAt,
        });
      }

      this.logger.log(`User ${data.username} joined room ${data.roomCode}`);
    } catch (error) {
      this.logger.error('Error joining room:', error.message);
      client.emit('error', {
        code: 'JOIN_ROOM_ERROR',
        message: error.message,
      });
    }
  }

  /**
   * Salir de una sala
   */
  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@MessageBody() data: LeaveRoomDto, @ConnectedSocket() client: Socket) {
    try {
      await this.roomService.leaveRoom(data.roomCode, data.userId);

      // Salir de la sala de Socket.io
      await client.leave(data.roomCode);

      // Obtener participantes actualizados
      const participants = await this.roomService.getRoomParticipants(data.roomCode);

      // Notificar a otros participantes
      this.server.to(data.roomCode).emit('user-left', {
        username: 'User',
        userId: data.userId,
        participants,
      });

      this.logger.log(`User ${data.userId} left room ${data.roomCode}`);

      // Si no quedan participantes, terminar sala
      if (participants.length === 0) {
        this.server.to(data.roomCode).emit('room-ended', {
          roomCode: data.roomCode,
          reason: 'All participants left',
        });
      }
    } catch (error) {
      this.logger.error('Error leaving room:', error.message);
      client.emit('error', {
        code: 'LEAVE_ROOM_ERROR',
        message: error.message,
      });
    }
  }

  /**
   * Enviar mensaje en una sala
   */
  @SubscribeMessage('send-message')
  async handleSendMessage(@MessageBody() data: SendMessageDto, @ConnectedSocket() client: Socket) {
    try {
      // Guardar mensaje del usuario
      const userMessage = await this.roomService.saveMessage(
        data.roomCode,
        'user',
        data.message,
        data.username,
      );

      // Emitir mensaje del usuario a todos en la sala
      this.server.to(data.roomCode).emit('new-message', {
        messageId: userMessage.id.toString(),
        role: 'user',
        username: data.username,
        content: data.message,
        timestamp: userMessage.createdAt,
      });

      // Obtener información de la sala para generar respuesta del espíritu
      const room = await this.roomService.getRoom(data.roomCode);
      const messages = await this.roomService.getRoomMessages(data.roomCode);

      // Construir historial de conversación
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Generar respuesta del espíritu
      const spiritResponse = await this.conversationService.generateMultiplayerResponse(
        room.spirit.personality as 'wise' | 'cryptic' | 'dark' | 'playful',
        room.spirit.name,
        room.spirit.backstory,
        conversationHistory,
        data.message,
      );

      // Guardar respuesta del espíritu
      const spiritMessage = await this.roomService.saveMessage(
        data.roomCode,
        'spirit',
        spiritResponse,
      );

      // Emitir respuesta del espíritu a todos en la sala
      this.server.to(data.roomCode).emit('new-message', {
        messageId: spiritMessage.id.toString(),
        role: 'spirit',
        content: spiritResponse,
        timestamp: spiritMessage.createdAt,
      });

      this.logger.log(`Message sent in room ${data.roomCode} by ${data.username}`);
    } catch (error) {
      this.logger.error('Error sending message:', error.message);
      client.emit('error', {
        code: 'SEND_MESSAGE_ERROR',
        message: error.message,
      });
    }
  }

  /**
   * Ping/Pong para mantener conexión activa
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
  }
}
