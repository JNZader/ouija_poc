# Iteración 3: WebSockets y Multiplayer - Ouija Virtual API

## Duración: 1-2 semanas
## Objetivo: Implementar comunicación en tiempo real y salas multiplayer
## Story Points: 30-35
## Equipo: Real-time Dev + Backend Dev

---

# 🎯 OBJETIVOS DE LA ITERACIÓN

Al finalizar esta iteración, el equipo tendrá:

✅ WebSocket Gateway funcionando con Socket.io
✅ MultiplayerService para gestión de salas
✅ Sincronización en tiempo real entre participantes
✅ Redis para gestión de estado de salas
✅ Sistema de eventos WebSocket completo
✅ Tests de integración para WebSockets
✅ Documentación de eventos y flujos multiplayer

---

# 📋 BACKLOG DE LA ITERACIÓN

## Épica 1: Configurar WebSocket Gateway

### US-3.1: Implementar WebSocket Gateway con Socket.io
**Como** desarrollador backend
**Quiero** un gateway WebSocket que gestione conexiones en tiempo real
**Para** permitir comunicación bidireccional con clientes

**Story Points**: 5
**Asignado a**: Real-time Dev
**Prioridad**: CRÍTICA

#### Criterios de Aceptación
- [ ] Socket.io configurado en NestJS
- [ ] Manejo de conexiones y desconexiones
- [ ] Sistema de eventos WebSocket implementado
- [ ] Autenticación de sockets (opcional)
- [ ] Logging de eventos WebSocket
- [ ] Manejo robusto de errores

#### Tareas Técnicas

**T-3.1.1: Instalar dependencias de WebSocket** (0.25h)

```bash
npm install --save @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install --save-dev @types/socket.io
```

**T-3.1.2: Crear interfaces para eventos WebSocket** (0.5h)

```typescript
// src/modules/multiplayer/interfaces/websocket-events.interface.ts

/**
 * Eventos que el cliente envía al servidor
 */
export interface ClientToServerEvents {
  // Gestión de salas
  'create-room': (data: CreateRoomData) => void;
  'join-room': (data: JoinRoomData) => void;
  'leave-room': (data: LeaveRoomData) => void;

  // Mensajes
  'send-message': (data: SendMessageData) => void;

  // Heartbeat
  'ping': () => void;
}

/**
 * Eventos que el servidor envía al cliente
 */
export interface ServerToClientEvents {
  // Respuestas de sala
  'room-created': (data: RoomCreatedData) => void;
  'room-joined': (data: RoomJoinedData) => void;
  'user-joined': (data: UserJoinedData) => void;
  'user-left': (data: UserLeftData) => void;

  // Mensajes
  'new-message': (data: NewMessageData) => void;

  // Errores
  'error': (data: ErrorData) => void;

  // Estado de sala
  'room-ended': (data: RoomEndedData) => void;

  // Heartbeat
  'pong': () => void;
}

/**
 * Data types para eventos
 */
export interface CreateRoomData {
  spiritId: string;
  userId: string;
  username: string;
}

export interface JoinRoomData {
  roomCode: string;
  userId: string;
  username: string;
}

export interface LeaveRoomData {
  roomCode: string;
  userId: string;
}

export interface SendMessageData {
  roomCode: string;
  userId: string;
  username: string;
  message: string;
}

export interface RoomCreatedData {
  roomCode: string;
  spirit: {
    id: string;
    name: string;
    personality: string;
  };
  participants: ParticipantData[];
  maxParticipants: number;
}

export interface RoomJoinedData {
  roomCode: string;
  participants: ParticipantData[];
  spirit: {
    id: string;
    name: string;
    personality: string;
  };
}

export interface UserJoinedData {
  username: string;
  userId: string;
  participants: ParticipantData[];
}

export interface UserLeftData {
  username: string;
  userId: string;
  participants: ParticipantData[];
}

export interface NewMessageData {
  messageId: string;
  role: 'user' | 'spirit';
  username?: string;
  content: string;
  timestamp: Date;
}

export interface ErrorData {
  code: string;
  message: string;
}

export interface RoomEndedData {
  roomCode: string;
  reason: string;
  farewellMessage?: string;
}

export interface ParticipantData {
  userId: string;
  username: string;
  joinedAt: Date;
  isHost: boolean;
}
```

**T-3.1.3: Crear WebSocket Gateway** (2h)

```typescript
// src/modules/multiplayer/gateways/multiplayer.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseFilters } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MultiplayerService } from '../services/multiplayer.service';
import {
  CreateRoomData,
  JoinRoomData,
  LeaveRoomData,
  SendMessageData,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../interfaces/websocket-events.interface';
import { WsExceptionFilter } from '../filters/ws-exception.filter';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  namespace: '/multiplayer',
})
@UseFilters(WsExceptionFilter)
export class MultiplayerGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(MultiplayerGateway.name);

  constructor(private readonly multiplayerService: MultiplayerService) {}

  /**
   * Se ejecuta cuando el gateway se inicializa
   */
  afterInit(server: Server) {
    this.logger.log('🔌 WebSocket Gateway initialized');
    this.logger.log(`📡 Listening on namespace: /multiplayer`);
  }

  /**
   * Se ejecuta cuando un cliente se conecta
   */
  async handleConnection(client: Socket) {
    this.logger.log(`🟢 Client connected: ${client.id}`);

    // Aquí se podría implementar autenticación del socket
    // const token = client.handshake.auth.token;
    // await this.validateToken(token);
  }

  /**
   * Se ejecuta cuando un cliente se desconecta
   */
  async handleDisconnect(client: Socket) {
    this.logger.log(`🔴 Client disconnected: ${client.id}`);

    // Limpiar salas donde el cliente estaba conectado
    await this.multiplayerService.handleClientDisconnect(client.id);
  }

  // ==========================================
  // EVENTOS DE SALA
  // ==========================================

  /**
   * Crear nueva sala multiplayer
   */
  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @MessageBody() data: CreateRoomData,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`🎮 Creating room - Spirit: ${data.spiritId}, User: ${data.username}`);

    try {
      const room = await this.multiplayerService.createRoom(
        data.spiritId,
        data.userId,
        data.username,
        client.id,
      );

      // Unir al cliente a la sala de Socket.io
      await client.join(room.roomCode);

      // Emitir evento de sala creada
      client.emit('room-created', {
        roomCode: room.roomCode,
        spirit: room.spirit,
        participants: room.participants,
        maxParticipants: room.maxParticipants,
      });

      this.logger.log(`✅ Room created: ${room.roomCode}`);
    } catch (error) {
      this.logger.error(`❌ Error creating room: ${error.message}`);
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
  async handleJoinRoom(
    @MessageBody() data: JoinRoomData,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`🚪 Joining room - Code: ${data.roomCode}, User: ${data.username}`);

    try {
      const room = await this.multiplayerService.joinRoom(
        data.roomCode,
        data.userId,
        data.username,
        client.id,
      );

      // Unir al cliente a la sala de Socket.io
      await client.join(data.roomCode);

      // Notificar al usuario que se unió
      client.emit('room-joined', {
        roomCode: room.roomCode,
        participants: room.participants,
        spirit: room.spirit,
      });

      // Notificar a todos en la sala que un nuevo usuario se unió
      client.to(data.roomCode).emit('user-joined', {
        username: data.username,
        userId: data.userId,
        participants: room.participants,
      });

      this.logger.log(`✅ User ${data.username} joined room ${data.roomCode}`);
    } catch (error) {
      this.logger.error(`❌ Error joining room: ${error.message}`);
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
  async handleLeaveRoom(
    @MessageBody() data: LeaveRoomData,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`🚶 Leaving room - Code: ${data.roomCode}, User: ${data.userId}`);

    try {
      const result = await this.multiplayerService.leaveRoom(
        data.roomCode,
        data.userId,
        client.id,
      );

      // Salir de la sala de Socket.io
      await client.leave(data.roomCode);

      // Si la sala sigue existiendo, notificar a los demás
      if (result.participants.length > 0) {
        this.server.to(data.roomCode).emit('user-left', {
          username: result.username,
          userId: data.userId,
          participants: result.participants,
        });
      } else {
        // Si era el último participante, la sala se cerró
        this.logger.log(`🔒 Room ${data.roomCode} closed (no participants left)`);
      }

      this.logger.log(`✅ User ${data.userId} left room ${data.roomCode}`);
    } catch (error) {
      this.logger.error(`❌ Error leaving room: ${error.message}`);
      client.emit('error', {
        code: 'LEAVE_ROOM_ERROR',
        message: error.message,
      });
    }
  }

  // ==========================================
  // EVENTOS DE MENSAJES
  // ==========================================

  /**
   * Enviar mensaje en sala multiplayer
   */
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() data: SendMessageData,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`💬 Message in room ${data.roomCode} from ${data.username}`);

    try {
      const result = await this.multiplayerService.sendMessage(
        data.roomCode,
        data.userId,
        data.username,
        data.message,
      );

      // Emitir mensaje del usuario a todos en la sala
      this.server.to(data.roomCode).emit('new-message', {
        messageId: result.userMessage.messageId,
        role: 'user',
        username: data.username,
        content: result.userMessage.content,
        timestamp: result.userMessage.timestamp,
      });

      // Emitir respuesta del espíritu a todos en la sala
      this.server.to(data.roomCode).emit('new-message', {
        messageId: result.spiritResponse.messageId,
        role: 'spirit',
        content: result.spiritResponse.content,
        timestamp: result.spiritResponse.timestamp,
      });

      this.logger.log(`✅ Messages sent to room ${data.roomCode}`);
    } catch (error) {
      this.logger.error(`❌ Error sending message: ${error.message}`);
      client.emit('error', {
        code: 'SEND_MESSAGE_ERROR',
        message: error.message,
      });
    }
  }

  // ==========================================
  // HEARTBEAT
  // ==========================================

  /**
   * Ping-pong para verificar conexión
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================

  /**
   * Enviar mensaje de error a un cliente específico
   */
  sendErrorToClient(clientId: string, code: string, message: string) {
    this.server.to(clientId).emit('error', { code, message });
  }

  /**
   * Finalizar una sala (usado por el servicio)
   */
  async endRoom(roomCode: string, reason: string, farewellMessage?: string) {
    this.server.to(roomCode).emit('room-ended', {
      roomCode,
      reason,
      farewellMessage,
    });

    // Desconectar a todos los clientes de la sala
    const sockets = await this.server.in(roomCode).fetchSockets();
    for (const socket of sockets) {
      socket.leave(roomCode);
    }

    this.logger.log(`🔒 Room ${roomCode} ended: ${reason}`);
  }
}
```

**T-3.1.4: Crear filtro de excepciones para WebSocket** (0.5h)

```typescript
// src/modules/multiplayer/filters/ws-exception.filter.ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof WsException) {
      errorMessage = exception.message;
      errorCode = 'WS_ERROR';
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    this.logger.error(`WebSocket error for client ${client.id}: ${errorMessage}`);

    client.emit('error', {
      code: errorCode,
      message: errorMessage,
    });
  }
}
```

**T-3.1.5: Actualizar .env con configuración WebSocket** (0.25h)

```bash
# .env
# WebSocket
WS_PORT=3000
WS_NAMESPACE=/multiplayer
CORS_ORIGINS=http://localhost:3001,http://localhost:5173

# Multiplayer
MAX_PARTICIPANTS_PER_ROOM=4
ROOM_CODE_LENGTH=6
ROOM_INACTIVITY_TIMEOUT=300000
```

---

## Épica 2: Implementar MultiplayerService

### US-3.2: Crear MultiplayerService con Lógica de Salas
**Como** desarrollador backend
**Quiero** un servicio que gestione salas multiplayer y su estado
**Para** coordinar múltiples usuarios comunicándose con un espíritu

**Story Points**: 8
**Asignado a**: Real-time Dev
**Prioridad**: CRÍTICA

#### Criterios de Aceptación
- [ ] Crear salas con códigos únicos
- [ ] Gestionar participantes en salas
- [ ] Enviar mensajes en contexto multiplayer
- [ ] Manejar desconexiones inesperadas
- [ ] Limpiar salas inactivas
- [ ] Integración con Redis para estado de sala

#### Tareas Técnicas

**T-3.2.1: Instalar Redis client** (0.25h)

```bash
npm install --save ioredis
npm install --save-dev @types/ioredis
```

**T-3.2.2: Crear RedisService** (1h)

```typescript
// src/common/redis/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected');
    });

    this.client.on('error', (error) => {
      this.logger.error(`❌ Redis error: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  /**
   * Guardar objeto JSON en Redis con TTL opcional
   */
  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  /**
   * Obtener objeto JSON de Redis
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  /**
   * Eliminar clave
   */
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Verificar si existe una clave
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Agregar elemento a un Set
   */
  async addToSet(key: string, member: string): Promise<void> {
    await this.client.sadd(key, member);
  }

  /**
   * Remover elemento de un Set
   */
  async removeFromSet(key: string, member: string): Promise<void> {
    await this.client.srem(key, member);
  }

  /**
   * Obtener todos los miembros de un Set
   */
  async getSetMembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  /**
   * Obtener cliente Redis nativo (para operaciones avanzadas)
   */
  getClient(): Redis {
    return this.client;
  }
}
```

**T-3.2.3: Crear RedisModule** (0.25h)

```typescript
// src/common/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

**T-3.2.4: Crear DTOs para multiplayer** (0.5h)

```typescript
// src/modules/multiplayer/dto/multiplayer.dto.ts
import { IsString, IsUUID, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMultiplayerRoomDto {
  @ApiProperty({ description: 'ID del espíritu' })
  @IsUUID()
  @IsNotEmpty()
  spiritId: string;

  @ApiProperty({ description: 'ID del usuario (host)' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Máximo de participantes (opcional)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(10)
  maxParticipants?: number = 4;
}

export class JoinMultiplayerRoomDto {
  @ApiProperty({ description: 'Código de la sala' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  roomCode: string;

  @ApiProperty({ description: 'ID del usuario' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty()
  username: string;
}

export class MultiplayerRoomResponseDto {
  @ApiProperty()
  roomCode: string;

  @ApiProperty()
  spirit: {
    id: string;
    name: string;
    personality: string;
  };

  @ApiProperty()
  participants: ParticipantDto[];

  @ApiProperty()
  maxParticipants: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
}

export class ParticipantDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty()
  isHost: boolean;
}
```

**T-3.2.5: Implementar MultiplayerService** (4h)

```typescript
// src/modules/multiplayer/services/multiplayer.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { ConversationService } from '../../ouija/services/conversation.service';
import { randomBytes } from 'crypto';
import { ParticipantData } from '../interfaces/websocket-events.interface';

interface RoomData {
  roomCode: string;
  roomId: string;
  spiritId: string;
  spirit: {
    id: string;
    name: string;
    personality: string;
  };
  participants: ParticipantData[];
  maxParticipants: number;
  status: 'waiting' | 'active' | 'ended';
  createdAt: Date;
  socketMap: { [userId: string]: string }; // Map userId -> socketId
}

@Injectable()
export class MultiplayerService {
  private readonly logger = new Logger(MultiplayerService.name);
  private readonly ROOM_PREFIX = 'multiplayer:room:';
  private readonly SOCKET_PREFIX = 'multiplayer:socket:';
  private readonly ACTIVE_ROOMS_SET = 'multiplayer:active_rooms';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private conversationService: ConversationService,
  ) {}

  /**
   * Crea una nueva sala multiplayer
   */
  async createRoom(
    spiritId: string,
    userId: string,
    username: string,
    socketId: string,
    maxParticipants: number = 4,
  ): Promise<RoomData> {
    this.logger.log(`Creating multiplayer room - Spirit: ${spiritId}, Host: ${username}`);

    // Verificar que el espíritu existe y está activo
    const spirit = await this.prisma.spirit.findUnique({
      where: { id: spiritId },
    });

    if (!spirit) {
      throw new NotFoundException(`Spirit with ID ${spiritId} not found`);
    }

    if (!spirit.isActive) {
      throw new BadRequestException(`Spirit ${spirit.name} is not available`);
    }

    // Generar código único de sala
    const roomCode = this.generateRoomCode();

    // Crear sala en base de datos
    const room = await this.prisma.multiplayerRoom.create({
      data: {
        spiritId,
        roomCode,
        status: 'waiting',
        maxParticipants,
        hostUserId: userId,
      },
    });

    // Crear participante (host)
    await this.prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId,
        username,
        isHost: true,
      },
    });

    // Crear datos de sala en Redis
    const roomData: RoomData = {
      roomCode,
      roomId: room.id,
      spiritId: spirit.id,
      spirit: {
        id: spirit.id,
        name: spirit.name,
        personality: spirit.personality,
      },
      participants: [
        {
          userId,
          username,
          joinedAt: new Date(),
          isHost: true,
        },
      ],
      maxParticipants,
      status: 'waiting',
      createdAt: new Date(),
      socketMap: { [userId]: socketId },
    };

    // Guardar en Redis con TTL de 1 hora
    await this.redis.setJSON(`${this.ROOM_PREFIX}${roomCode}`, roomData, 3600);
    await this.redis.addToSet(this.ACTIVE_ROOMS_SET, roomCode);
    await this.redis.setJSON(`${this.SOCKET_PREFIX}${socketId}`, { roomCode, userId }, 3600);

    // Generar mensaje de bienvenida del espíritu
    const welcomeMessage = await this.conversationService.generateWelcomeMessage(
      spirit.personality as any,
      spirit.name,
    );

    // Guardar mensaje de bienvenida en la sala
    await this.saveRoomMessage(room.id, 'spirit', welcomeMessage);

    this.logger.log(`✅ Room created: ${roomCode}`);

    return roomData;
  }

  /**
   * Unirse a una sala existente
   */
  async joinRoom(
    roomCode: string,
    userId: string,
    username: string,
    socketId: string,
  ): Promise<RoomData> {
    this.logger.log(`User ${username} joining room ${roomCode}`);

    // Obtener sala de Redis
    const roomData = await this.getRoomData(roomCode);

    if (!roomData) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }

    if (roomData.status === 'ended') {
      throw new BadRequestException('Room has ended');
    }

    // Verificar si el usuario ya está en la sala
    const existingParticipant = roomData.participants.find((p) => p.userId === userId);
    if (existingParticipant) {
      // Actualizar socketId si cambió
      roomData.socketMap[userId] = socketId;
      await this.redis.setJSON(`${this.ROOM_PREFIX}${roomCode}`, roomData, 3600);
      return roomData;
    }

    // Verificar capacidad
    if (roomData.participants.length >= roomData.maxParticipants) {
      throw new BadRequestException('Room is full');
    }

    // Agregar participante
    const participant: ParticipantData = {
      userId,
      username,
      joinedAt: new Date(),
      isHost: false,
    };

    roomData.participants.push(participant);
    roomData.socketMap[userId] = socketId;

    // Si es el segundo participante, activar la sala
    if (roomData.participants.length === 2 && roomData.status === 'waiting') {
      roomData.status = 'active';
      await this.prisma.multiplayerRoom.update({
        where: { id: roomData.roomId },
        data: { status: 'active' },
      });
    }

    // Guardar en base de datos
    await this.prisma.roomParticipant.create({
      data: {
        roomId: roomData.roomId,
        userId,
        username,
        isHost: false,
      },
    });

    // Actualizar Redis
    await this.redis.setJSON(`${this.ROOM_PREFIX}${roomCode}`, roomData, 3600);
    await this.redis.setJSON(`${this.SOCKET_PREFIX}${socketId}`, { roomCode, userId }, 3600);

    this.logger.log(`✅ User ${username} joined room ${roomCode}`);

    return roomData;
  }

  /**
   * Salir de una sala
   */
  async leaveRoom(
    roomCode: string,
    userId: string,
    socketId: string,
  ): Promise<{ participants: ParticipantData[]; username: string }> {
    this.logger.log(`User ${userId} leaving room ${roomCode}`);

    const roomData = await this.getRoomData(roomCode);

    if (!roomData) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }

    // Encontrar participante
    const participantIndex = roomData.participants.findIndex((p) => p.userId === userId);
    if (participantIndex === -1) {
      throw new NotFoundException('User not found in room');
    }

    const participant = roomData.participants[participantIndex];
    const username = participant.username;

    // Remover participante
    roomData.participants.splice(participantIndex, 1);
    delete roomData.socketMap[userId];

    // Remover de base de datos
    await this.prisma.roomParticipant.deleteMany({
      where: {
        roomId: roomData.roomId,
        userId,
      },
    });

    // Si no quedan participantes, cerrar sala
    if (roomData.participants.length === 0) {
      await this.closeRoom(roomCode, roomData.roomId);
      return { participants: [], username };
    }

    // Si el host se fue, asignar nuevo host
    if (participant.isHost && roomData.participants.length > 0) {
      roomData.participants[0].isHost = true;
      await this.prisma.roomParticipant.updateMany({
        where: {
          roomId: roomData.roomId,
          userId: roomData.participants[0].userId,
        },
        data: { isHost: true },
      });
    }

    // Actualizar Redis
    await this.redis.setJSON(`${this.ROOM_PREFIX}${roomCode}`, roomData, 3600);
    await this.redis.delete(`${this.SOCKET_PREFIX}${socketId}`);

    return { participants: roomData.participants, username };
  }

  /**
   * Enviar mensaje en una sala
   */
  async sendMessage(
    roomCode: string,
    userId: string,
    username: string,
    message: string,
  ): Promise<{
    userMessage: { messageId: string; content: string; timestamp: Date };
    spiritResponse: { messageId: string; content: string; timestamp: Date };
  }> {
    this.logger.log(`Message in room ${roomCode} from ${username}`);

    const roomData = await this.getRoomData(roomCode);

    if (!roomData) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }

    if (roomData.status !== 'active') {
      throw new BadRequestException('Room is not active');
    }

    // Verificar que el usuario está en la sala
    const participant = roomData.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new BadRequestException('User is not in the room');
    }

    // Guardar mensaje del usuario
    const userMessage = await this.saveRoomMessage(
      roomData.roomId,
      'user',
      message,
      username,
    );

    // Generar respuesta del espíritu
    const spiritResponseContent = await this.conversationService.generateSpiritResponse(
      roomData.roomId,
      message,
      roomData.spirit.personality as any,
      roomData.spirit.name,
      '', // backstory se puede obtener de la BD si es necesario
    );

    // Guardar respuesta del espíritu
    const spiritMessage = await this.saveRoomMessage(
      roomData.roomId,
      'spirit',
      spiritResponseContent,
    );

    return {
      userMessage: {
        messageId: userMessage.id,
        content: userMessage.content,
        timestamp: userMessage.timestamp,
      },
      spiritResponse: {
        messageId: spiritMessage.id,
        content: spiritMessage.content,
        timestamp: spiritMessage.timestamp,
      },
    };
  }

  /**
   * Manejar desconexión de cliente
   */
  async handleClientDisconnect(socketId: string): Promise<void> {
    this.logger.log(`Handling disconnect for socket ${socketId}`);

    // Obtener información del socket
    const socketData = await this.redis.getJSON<{ roomCode: string; userId: string }>(
      `${this.SOCKET_PREFIX}${socketId}`,
    );

    if (!socketData) {
      return; // Socket no estaba en ninguna sala
    }

    try {
      await this.leaveRoom(socketData.roomCode, socketData.userId, socketId);
    } catch (error) {
      this.logger.error(`Error handling disconnect: ${error.message}`);
    }
  }

  /**
   * Obtener lista de salas activas
   */
  async getActiveRooms(): Promise<RoomData[]> {
    const roomCodes = await this.redis.getSetMembers(this.ACTIVE_ROOMS_SET);
    const rooms: RoomData[] = [];

    for (const roomCode of roomCodes) {
      const roomData = await this.getRoomData(roomCode);
      if (roomData && roomData.status !== 'ended') {
        rooms.push(roomData);
      }
    }

    return rooms;
  }

  /**
   * Obtener información de una sala
   */
  async getRoomInfo(roomCode: string): Promise<RoomData> {
    const roomData = await this.getRoomData(roomCode);

    if (!roomData) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }

    return roomData;
  }

  // ==========================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ==========================================

  /**
   * Obtener datos de sala desde Redis
   */
  private async getRoomData(roomCode: string): Promise<RoomData | null> {
    return await this.redis.getJSON<RoomData>(`${this.ROOM_PREFIX}${roomCode}`);
  }

  /**
   * Cerrar una sala
   */
  private async closeRoom(roomCode: string, roomId: string): Promise<void> {
    this.logger.log(`Closing room ${roomCode}`);

    // Actualizar estado en base de datos
    await this.prisma.multiplayerRoom.update({
      where: { id: roomId },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    });

    // Remover de Redis
    await this.redis.delete(`${this.ROOM_PREFIX}${roomCode}`);
    await this.redis.removeFromSet(this.ACTIVE_ROOMS_SET, roomCode);
  }

  /**
   * Guardar mensaje en la sala
   */
  private async saveRoomMessage(
    roomId: string,
    role: 'user' | 'spirit',
    content: string,
    username?: string,
  ) {
    return await this.prisma.roomMessage.create({
      data: {
        roomId,
        role,
        content,
        username: role === 'user' ? username : null,
      },
    });
  }

  /**
   * Generar código único de sala
   */
  private generateRoomCode(): string {
    // Generar código de 6 caracteres alfanuméricos
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres ambiguos
    let code = '';
    const bytes = randomBytes(6);

    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }

    return code;
  }
}
```

**T-3.2.6: Actualizar schema.prisma para mensajes de sala** (0.5h)

```prisma
// prisma/schema.prisma
// Agregar modelo RoomMessage

model RoomMessage {
  id        String   @id @default(uuid())
  roomId    String
  role      String   // 'user' | 'spirit'
  content   String   @db.Text
  username  String?  // Solo para mensajes de usuarios
  timestamp DateTime @default(now())

  room      MultiplayerRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId, timestamp])
  @@map("room_messages")
}

// Actualizar MultiplayerRoom para incluir relación
model MultiplayerRoom {
  id              String   @id @default(uuid())
  spiritId        String
  roomCode        String   @unique
  status          String   // 'waiting' | 'active' | 'ended'
  maxParticipants Int      @default(4)
  hostUserId      String
  createdAt       DateTime @default(now())
  endedAt         DateTime?

  spirit       Spirit            @relation(fields: [spiritId], references: [id])
  participants RoomParticipant[]
  messages     RoomMessage[]     // Nueva relación

  @@index([roomCode])
  @@index([status, createdAt])
  @@map("multiplayer_rooms")
}
```

**T-3.2.7: Crear migración de Prisma** (0.25h)

```bash
npx prisma migrate dev --name add_room_messages
npx prisma generate
```

**T-3.2.8: Actualizar AppModule con Redis y Multiplayer** (0.25h)

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { OuijaModule } from './modules/ouija/ouija.module';
import { MultiplayerModule } from './modules/multiplayer/multiplayer.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule,
    OuijaModule,
    MultiplayerModule,
    HealthModule,
  ],
})
export class AppModule {}
```

**T-3.2.9: Crear MultiplayerModule** (0.25h)

```typescript
// src/modules/multiplayer/multiplayer.module.ts
import { Module } from '@nestjs/common';
import { MultiplayerGateway } from './gateways/multiplayer.gateway';
import { MultiplayerService } from './services/multiplayer.service';
import { MultiplayerController } from './controllers/multiplayer.controller';
import { OuijaModule } from '../ouija/ouija.module';

@Module({
  imports: [OuijaModule],
  controllers: [MultiplayerController],
  providers: [MultiplayerGateway, MultiplayerService],
  exports: [MultiplayerService],
})
export class MultiplayerModule {}
```

---

## Épica 3: REST Endpoints para Multiplayer

### US-3.3: Crear Endpoints REST para Salas Multiplayer
**Como** cliente frontend
**Quiero** endpoints REST para gestionar salas antes de conectar por WebSocket
**Para** facilitar la creación y consulta de salas

**Story Points**: 3
**Asignado a**: Backend Dev
**Prioridad**: MEDIA

#### Criterios de Aceptación
- [ ] POST /api/multiplayer/room/create
- [ ] GET /api/multiplayer/rooms/active
- [ ] GET /api/multiplayer/room/:code
- [ ] Swagger documentado

#### Tareas Técnicas

**T-3.3.1: Crear MultiplayerController** (1.5h)

```typescript
// src/modules/multiplayer/controllers/multiplayer.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { MultiplayerService } from '../services/multiplayer.service';
import {
  CreateMultiplayerRoomDto,
  MultiplayerRoomResponseDto,
} from '../dto/multiplayer.dto';

@ApiTags('multiplayer')
@Controller('multiplayer')
export class MultiplayerController {
  constructor(private readonly multiplayerService: MultiplayerService) {}

  @Post('room/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear sala multiplayer',
    description:
      'Crea una nueva sala para comunicación grupal con un espíritu. ' +
      'Retorna un código único que otros usuarios pueden usar para unirse.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sala creada exitosamente',
    type: MultiplayerRoomResponseDto,
  })
  async createRoom(@Body() dto: CreateMultiplayerRoomDto) {
    // Nota: socketId será manejado por el WebSocket Gateway
    // Este endpoint es solo para crear la sala en la BD
    // El usuario debe conectarse por WebSocket después
    const room = await this.multiplayerService.createRoom(
      dto.spiritId,
      dto.userId,
      dto.username,
      'temp', // Socket ID temporal, será actualizado en WebSocket
      dto.maxParticipants,
    );

    return {
      roomCode: room.roomCode,
      spirit: room.spirit,
      participants: room.participants,
      maxParticipants: room.maxParticipants,
      status: room.status,
      createdAt: room.createdAt,
    };
  }

  @Get('rooms/active')
  @ApiOperation({
    summary: 'Listar salas activas',
    description: 'Retorna todas las salas multiplayer activas disponibles para unirse',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de salas activas',
    type: [MultiplayerRoomResponseDto],
  })
  async getActiveRooms() {
    const rooms = await this.multiplayerService.getActiveRooms();

    return rooms.map((room) => ({
      roomCode: room.roomCode,
      spirit: room.spirit,
      participants: room.participants,
      maxParticipants: room.maxParticipants,
      status: room.status,
      createdAt: room.createdAt,
    }));
  }

  @Get('room/:code')
  @ApiOperation({
    summary: 'Obtener información de sala específica',
    description: 'Retorna los detalles completos de una sala por su código',
  })
  @ApiParam({
    name: 'code',
    description: 'Código único de la sala (6 caracteres)',
    example: 'ABC123',
  })
  @ApiResponse({
    status: 200,
    description: 'Información de la sala',
    type: MultiplayerRoomResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Sala no encontrada' })
  async getRoomInfo(@Param('code') code: string) {
    const room = await this.multiplayerService.getRoomInfo(code);

    return {
      roomCode: room.roomCode,
      spirit: room.spirit,
      participants: room.participants,
      maxParticipants: room.maxParticipants,
      status: room.status,
      createdAt: room.createdAt,
    };
  }
}
```

---

## Épica 4: Testing para Multiplayer

### US-3.4: Crear Tests para Multiplayer y WebSocket
**Como** desarrollador backend
**Quiero** tests completos para funcionalidad multiplayer
**Para** garantizar estabilidad en comunicación en tiempo real

**Story Points**: 5
**Asignado a**: Real-time Dev + QA
**Prioridad**: ALTA

#### Criterios de Aceptación
- [ ] Tests unitarios para MultiplayerService
- [ ] Tests de integración para WebSocket Gateway
- [ ] Tests E2E para flujos completos multiplayer
- [ ] Cobertura >80%

#### Tareas Técnicas

**T-3.4.1: Crear tests para MultiplayerService** (2h)

```typescript
// src/modules/multiplayer/services/__tests__/multiplayer.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MultiplayerService } from '../multiplayer.service';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { RedisService } from '../../../../common/redis/redis.service';
import { ConversationService } from '../../../ouija/services/conversation.service';

describe('MultiplayerService', () => {
  let service: MultiplayerService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let conversationService: ConversationService;

  const mockPrismaService = {
    spirit: {
      findUnique: jest.fn(),
    },
    multiplayerRoom: {
      create: jest.fn(),
      update: jest.fn(),
    },
    roomParticipant: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
    roomMessage: {
      create: jest.fn(),
    },
  };

  const mockRedisService = {
    setJSON: jest.fn(),
    getJSON: jest.fn(),
    delete: jest.fn(),
    addToSet: jest.fn(),
    removeFromSet: jest.fn(),
    getSetMembers: jest.fn(),
  };

  const mockConversationService = {
    generateWelcomeMessage: jest.fn(),
    generateSpiritResponse: jest.fn(),
  };

  const mockSpirit = {
    id: 'spirit-123',
    name: 'Morgana',
    personality: 'wise',
    isActive: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiplayerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConversationService, useValue: mockConversationService },
      ],
    }).compile();

    service = module.get<MultiplayerService>(MultiplayerService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    conversationService = module.get<ConversationService>(ConversationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a multiplayer room successfully', async () => {
      mockPrismaService.spirit.findUnique.mockResolvedValue(mockSpirit);
      mockPrismaService.multiplayerRoom.create.mockResolvedValue({
        id: 'room-123',
        roomCode: 'ABC123',
        spiritId: mockSpirit.id,
        status: 'waiting',
        maxParticipants: 4,
      });
      mockPrismaService.roomParticipant.create.mockResolvedValue({});
      mockConversationService.generateWelcomeMessage.mockResolvedValue('Welcome!');
      mockPrismaService.roomMessage.create.mockResolvedValue({});

      const result = await service.createRoom(
        mockSpirit.id,
        'user-1',
        'Alice',
        'socket-1',
        4,
      );

      expect(result).toHaveProperty('roomCode');
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].username).toBe('Alice');
      expect(result.participants[0].isHost).toBe(true);
    });

    it('should throw NotFoundException if spirit not found', async () => {
      mockPrismaService.spirit.findUnique.mockResolvedValue(null);

      await expect(
        service.createRoom('invalid-id', 'user-1', 'Alice', 'socket-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if spirit not active', async () => {
      mockPrismaService.spirit.findUnique.mockResolvedValue({
        ...mockSpirit,
        isActive: false,
      });

      await expect(
        service.createRoom(mockSpirit.id, 'user-1', 'Alice', 'socket-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('joinRoom', () => {
    const mockRoomData = {
      roomCode: 'ABC123',
      roomId: 'room-123',
      spiritId: mockSpirit.id,
      spirit: {
        id: mockSpirit.id,
        name: mockSpirit.name,
        personality: mockSpirit.personality,
      },
      participants: [
        {
          userId: 'user-1',
          username: 'Alice',
          joinedAt: new Date(),
          isHost: true,
        },
      ],
      maxParticipants: 4,
      status: 'waiting' as const,
      createdAt: new Date(),
      socketMap: { 'user-1': 'socket-1' },
    };

    it('should join room successfully', async () => {
      mockRedisService.getJSON.mockResolvedValue(mockRoomData);
      mockPrismaService.roomParticipant.create.mockResolvedValue({});

      const result = await service.joinRoom('ABC123', 'user-2', 'Bob', 'socket-2');

      expect(result.participants).toHaveLength(2);
      expect(result.participants[1].username).toBe('Bob');
      expect(result.status).toBe('active'); // Should activate with 2 participants
    });

    it('should throw NotFoundException if room not found', async () => {
      mockRedisService.getJSON.mockResolvedValue(null);

      await expect(
        service.joinRoom('INVALID', 'user-2', 'Bob', 'socket-2'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if room is full', async () => {
      const fullRoom = {
        ...mockRoomData,
        participants: [
          { userId: 'user-1', username: 'Alice', joinedAt: new Date(), isHost: true },
          { userId: 'user-2', username: 'Bob', joinedAt: new Date(), isHost: false },
          { userId: 'user-3', username: 'Charlie', joinedAt: new Date(), isHost: false },
          { userId: 'user-4', username: 'David', joinedAt: new Date(), isHost: false },
        ],
        maxParticipants: 4,
      };

      mockRedisService.getJSON.mockResolvedValue(fullRoom);

      await expect(
        service.joinRoom('ABC123', 'user-5', 'Eve', 'socket-5'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendMessage', () => {
    const mockRoomData = {
      roomCode: 'ABC123',
      roomId: 'room-123',
      spiritId: mockSpirit.id,
      spirit: {
        id: mockSpirit.id,
        name: mockSpirit.name,
        personality: mockSpirit.personality,
      },
      participants: [
        { userId: 'user-1', username: 'Alice', joinedAt: new Date(), isHost: true },
        { userId: 'user-2', username: 'Bob', joinedAt: new Date(), isHost: false },
      ],
      maxParticipants: 4,
      status: 'active' as const,
      createdAt: new Date(),
      socketMap: { 'user-1': 'socket-1', 'user-2': 'socket-2' },
    };

    it('should send message and receive spirit response', async () => {
      mockRedisService.getJSON.mockResolvedValue(mockRoomData);
      mockPrismaService.roomMessage.create
        .mockResolvedValueOnce({
          id: 'msg-user-1',
          content: 'Hello spirit',
          timestamp: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'msg-spirit-1',
          content: 'Greetings, mortal',
          timestamp: new Date(),
        });
      mockConversationService.generateSpiritResponse.mockResolvedValue('Greetings, mortal');

      const result = await service.sendMessage('ABC123', 'user-1', 'Alice', 'Hello spirit');

      expect(result.userMessage.content).toBe('Hello spirit');
      expect(result.spiritResponse.content).toBe('Greetings, mortal');
    });

    it('should throw BadRequestException if user not in room', async () => {
      mockRedisService.getJSON.mockResolvedValue(mockRoomData);

      await expect(
        service.sendMessage('ABC123', 'user-999', 'Unknown', 'Test'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

**T-3.4.2: Crear tests E2E para WebSocket** (2h)

```typescript
// test/multiplayer.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Multiplayer WebSocket (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let spiritId: string;
  let roomCode: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3001);

    prisma = app.get<PrismaService>(PrismaService);

    // Obtener un espíritu para tests
    const spirit = await prisma.spirit.findFirst({
      where: { isActive: true },
    });
    spiritId = spirit.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Crear sockets de cliente
    clientSocket1 = io('http://localhost:3001/multiplayer', {
      transports: ['websocket'],
    });

    clientSocket2 = io('http://localhost:3001/multiplayer', {
      transports: ['websocket'],
    });
  });

  afterEach(() => {
    clientSocket1.close();
    clientSocket2.close();
  });

  it('should create a multiplayer room', (done) => {
    clientSocket1.on('room-created', (data) => {
      expect(data).toHaveProperty('roomCode');
      expect(data).toHaveProperty('spirit');
      expect(data.participants).toHaveLength(1);
      expect(data.participants[0].username).toBe('Alice');

      roomCode = data.roomCode;
      done();
    });

    clientSocket1.emit('create-room', {
      spiritId,
      userId: 'user-1',
      username: 'Alice',
    });
  });

  it('should allow second user to join room', (done) => {
    let roomCreated = false;

    // Cliente 1 crea sala
    clientSocket1.on('room-created', (data) => {
      roomCode = data.roomCode;
      roomCreated = true;

      // Cliente 2 se une
      clientSocket2.emit('join-room', {
        roomCode,
        userId: 'user-2',
        username: 'Bob',
      });
    });

    // Cliente 1 recibe notificación de nuevo usuario
    clientSocket1.on('user-joined', (data) => {
      expect(data.username).toBe('Bob');
      expect(data.participants).toHaveLength(2);
    });

    // Cliente 2 recibe confirmación de unión
    clientSocket2.on('room-joined', (data) => {
      expect(data.roomCode).toBe(roomCode);
      expect(data.participants).toHaveLength(2);
      done();
    });

    clientSocket1.emit('create-room', {
      spiritId,
      userId: 'user-1',
      username: 'Alice',
    });
  });

  it('should broadcast messages to all participants', (done) => {
    let messagesReceived = 0;

    // Cliente 1 crea sala
    clientSocket1.on('room-created', (data) => {
      roomCode = data.roomCode;

      // Cliente 2 se une
      clientSocket2.emit('join-room', {
        roomCode,
        userId: 'user-2',
        username: 'Bob',
      });
    });

    clientSocket2.on('room-joined', () => {
      // Cliente 1 envía mensaje
      clientSocket1.emit('send-message', {
        roomCode,
        userId: 'user-1',
        username: 'Alice',
        message: 'Hello everyone!',
      });
    });

    // Ambos clientes deben recibir los mensajes
    const handleNewMessage = (data) => {
      messagesReceived++;

      if (messagesReceived === 4) {
        // 2 clientes × 2 mensajes (user + spirit)
        done();
      }
    };

    clientSocket1.on('new-message', handleNewMessage);
    clientSocket2.on('new-message', handleNewMessage);

    clientSocket1.emit('create-room', {
      spiritId,
      userId: 'user-1',
      username: 'Alice',
    });
  }, 30000);

  it('should handle user leaving room', (done) => {
    // Cliente 1 crea sala
    clientSocket1.on('room-created', (data) => {
      roomCode = data.roomCode;

      // Cliente 2 se une
      clientSocket2.emit('join-room', {
        roomCode,
        userId: 'user-2',
        username: 'Bob',
      });
    });

    clientSocket2.on('room-joined', () => {
      // Cliente 2 se va
      clientSocket2.emit('leave-room', {
        roomCode,
        userId: 'user-2',
      });
    });

    // Cliente 1 recibe notificación
    clientSocket1.on('user-left', (data) => {
      expect(data.username).toBe('Bob');
      expect(data.participants).toHaveLength(1);
      done();
    });

    clientSocket1.emit('create-room', {
      spiritId,
      userId: 'user-1',
      username: 'Alice',
    });
  });
});
```

**T-3.4.3: Actualizar package.json con scripts de test** (0.25h)

```json
{
  "scripts": {
    "test:multiplayer": "jest --testPathPattern=multiplayer",
    "test:e2e:multiplayer": "jest --config ./test/jest-e2e.json --testPathPattern=multiplayer"
  }
}
```

---

## Épica 5: Documentación y Monitoreo

### US-3.5: Documentar WebSocket API y Agregar Monitoreo
**Como** desarrollador frontend
**Quiero** documentación clara de eventos WebSocket
**Para** integrar fácilmente el cliente

**Story Points**: 2
**Asignado a**: Backend Dev
**Prioridad**: MEDIA

#### Tareas Técnicas

**T-3.5.1: Crear documentación de eventos WebSocket** (1h)

```markdown
// docs/WEBSOCKET_API.md
# WebSocket API Documentation - Ouija Virtual

## Conexión

### Endpoint
```
ws://localhost:3000/multiplayer
```

### Autenticación (Opcional)
Si se implementa autenticación:
```javascript
const socket = io('http://localhost:3000/multiplayer', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Eventos del Cliente al Servidor

### 1. create-room
Crea una nueva sala multiplayer.

**Payload:**
```typescript
{
  spiritId: string;    // UUID del espíritu
  userId: string;      // ID único del usuario
  username: string;    // Nombre visible (2-50 chars)
}
```

**Respuestas:**
- `room-created` - Sala creada exitosamente
- `error` - Error al crear sala

**Ejemplo:**
```javascript
socket.emit('create-room', {
  spiritId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user_alice_123',
  username: 'Alice'
});
```

### 2. join-room
Unirse a una sala existente.

**Payload:**
```typescript
{
  roomCode: string;    // Código de 6 caracteres
  userId: string;      // ID único del usuario
  username: string;    // Nombre visible
}
```

**Respuestas:**
- `room-joined` - Unión exitosa
- `user-joined` - Broadcast a otros participantes
- `error` - Error al unirse

### 3. send-message
Enviar mensaje en una sala activa.

**Payload:**
```typescript
{
  roomCode: string;    // Código de la sala
  userId: string;      // ID del usuario
  username: string;    // Nombre del usuario
  message: string;     // Mensaje (1-500 chars)
}
```

**Respuestas:**
- `new-message` - Broadcast a todos (usuario + espíritu)
- `error` - Error al enviar

### 4. leave-room
Salir de una sala.

**Payload:**
```typescript
{
  roomCode: string;
  userId: string;
}
```

**Respuestas:**
- `user-left` - Broadcast a participantes restantes

## Eventos del Servidor al Cliente

### room-created
Se emite al usuario que creó la sala.

**Payload:**
```typescript
{
  roomCode: string;
  spirit: {
    id: string;
    name: string;
    personality: string;
  };
  participants: Participant[];
  maxParticipants: number;
}
```

### room-joined
Se emite al usuario que se unió a la sala.

**Payload:**
```typescript
{
  roomCode: string;
  participants: Participant[];
  spirit: {...};
}
```

### user-joined
Broadcast a todos cuando un nuevo usuario se une.

**Payload:**
```typescript
{
  username: string;
  userId: string;
  participants: Participant[];
}
```

### new-message
Broadcast cuando se envía un mensaje.

**Payload:**
```typescript
{
  messageId: string;
  role: 'user' | 'spirit';
  username?: string;    // Solo para mensajes de usuario
  content: string;
  timestamp: Date;
}
```

### error
Se emite cuando ocurre un error.

**Payload:**
```typescript
{
  code: string;         // Código de error
  message: string;      // Mensaje descriptivo
}
```

**Códigos de error comunes:**
- `CREATE_ROOM_ERROR` - Error al crear sala
- `JOIN_ROOM_ERROR` - Error al unirse
- `SEND_MESSAGE_ERROR` - Error al enviar mensaje
- `LEAVE_ROOM_ERROR` - Error al salir

## Ejemplo de Uso (Cliente JavaScript)

```javascript
import { io } from 'socket.io-client';

// Conectar
const socket = io('http://localhost:3000/multiplayer');

// Escuchar eventos de conexión
socket.on('connect', () => {
  console.log('Connected!', socket.id);
});

// Crear sala
socket.emit('create-room', {
  spiritId: 'spirit-uuid-here',
  userId: 'my-user-id',
  username: 'Alice'
});

// Recibir confirmación de sala creada
socket.on('room-created', (data) => {
  console.log('Room created:', data.roomCode);
  console.log('Spirit:', data.spirit.name);
});

// Unirse a sala
socket.emit('join-room', {
  roomCode: 'ABC123',
  userId: 'my-user-id',
  username: 'Bob'
});

// Recibir mensajes
socket.on('new-message', (data) => {
  if (data.role === 'user') {
    console.log(`${data.username}: ${data.content}`);
  } else {
    console.log(`Spirit: ${data.content}`);
  }
});

// Enviar mensaje
socket.emit('send-message', {
  roomCode: 'ABC123',
  userId: 'my-user-id',
  username: 'Bob',
  message: '¿Cuál es mi destino?'
});

// Manejar errores
socket.on('error', (data) => {
  console.error(`Error [${data.code}]:`, data.message);
});

// Salir de sala
socket.emit('leave-room', {
  roomCode: 'ABC123',
  userId: 'my-user-id'
});

// Desconectar
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

## Límites y Restricciones

- **Máximo de participantes por sala:** 4 (configurable)
- **Longitud de mensaje:** 1-500 caracteres
- **Longitud de username:** 2-50 caracteres
- **Timeout de inactividad:** 5 minutos
- **Rate limiting:** 20 mensajes por minuto por usuario

## Flujo Típico

1. Usuario A crea sala → Recibe `room-created`
2. Usuario B se une → A recibe `user-joined`, B recibe `room-joined`
3. Usuario A envía mensaje → Todos reciben 2× `new-message` (user + spirit)
4. Usuario B se va → A recibe `user-left`
5. Último usuario sale → Sala se cierra automáticamente
```

**T-3.5.2: Actualizar HealthController con estado de WebSocket** (0.5h)

```typescript
// src/modules/health/health.controller.ts
// Agregar verificación de WebSocket en detailedHealthCheck

async detailedHealthCheck() {
  // ... código existente ...

  // Verificar WebSocket Gateway
  let websocketStatus = 'ok';
  try {
    const activeRooms = await this.multiplayerService.getActiveRooms();
    websocketStatus = 'ok';
  } catch (error) {
    websocketStatus = 'error';
  }

  return {
    // ... respuesta existente ...
    components: {
      // ... componentes existentes ...
      websocket: {
        status: websocketStatus,
        activeRooms: activeRooms?.length || 0,
      },
    },
  };
}
```

---

## Checklist de Cierre de Iteración 3

### Validación Técnica
- [ ] WebSocket Gateway funcionando correctamente
- [ ] Conexiones y desconexiones manejadas
- [ ] MultiplayerService creando y gestionando salas
- [ ] Redis almacenando estado de salas
- [ ] Mensajes broadcast a todos los participantes
- [ ] Manejo de desconexiones inesperadas
- [ ] Limpieza automática de salas vacías
- [ ] REST endpoints funcionando
- [ ] Tests pasando (>80% coverage)

### Pruebas Manuales
- [ ] Crear sala desde cliente WebSocket
- [ ] Múltiples usuarios uniéndose a sala
- [ ] Enviar y recibir mensajes en tiempo real
- [ ] Respuestas del espíritu broadcast a todos
- [ ] Usuario sale de sala voluntariamente
- [ ] Usuario se desconecta inesperadamente
- [ ] Sala se cierra al salir último participante
- [ ] Verificar límite de participantes
- [ ] Probar con 3-4 usuarios simultáneos

### Testing
- [ ] Tests unitarios para MultiplayerService
- [ ] Tests E2E para WebSocket completos
- [ ] Tests de carga (múltiples conexiones)
- [ ] Tests de reconexión
- [ ] Cobertura >80%

### Documentación
- [ ] WEBSOCKET_API.md completo
- [ ] Ejemplos de código para clientes
- [ ] Swagger actualizado para REST endpoints
- [ ] README actualizado con setup de Redis

### Performance y Monitoreo
- [ ] Latencia WebSocket < 100ms
- [ ] Redis respondiendo correctamente
- [ ] Health check reportando estado WebSocket
- [ ] Logs estructurados para eventos
- [ ] Sin memory leaks en conexiones largas

---

## Testing Manual - Guía Rápida

### 1. Setup Inicial

```bash
# Asegurar que Redis está corriendo
docker-compose up -d redis

# Verificar conexión Redis
redis-cli ping
# Debe retornar: PONG

# Iniciar servidor
npm run start:dev
```

### 2. Probar con Cliente WebSocket (Postman o cliente simple)

**Cliente de prueba en Node.js:**

```javascript
// test-client.js
const io = require('socket.io-client');

const socket = io('http://localhost:3000/multiplayer');

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);

  // Crear sala
  socket.emit('create-room', {
    spiritId: 'SPIRIT_ID_AQUI',
    userId: 'user_test_1',
    username: 'TestUser1',
  });
});

socket.on('room-created', (data) => {
  console.log('🎮 Room created:', data);
});

socket.on('new-message', (data) => {
  console.log(`💬 [${data.role}] ${data.content}`);
});

socket.on('error', (data) => {
  console.error('❌ Error:', data);
});

socket.on('disconnect', () => {
  console.log('🔴 Disconnected');
});
```

### 3. Verificar Estado en Redis

```bash
# Ver todas las claves
redis-cli KEYS "*"

# Ver datos de una sala
redis-cli GET "multiplayer:room:ABC123"

# Ver salas activas
redis-cli SMEMBERS "multiplayer:active_rooms"
```

---

## Siguientes Pasos

Una vez completada la iteración 3, proceder a:

📖 **Iteración 4** - Testing & Polish (cobertura, performance, error handling)

**Estado**: 🚀 EN PROGRESO | Siguiente: ✨ ITERACIÓN 4

---

## Recursos Adicionales

### Variables de Entorno Adicionales

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# WebSocket
WS_CORS_ORIGINS=http://localhost:3001,http://localhost:5173

# Multiplayer
MAX_PARTICIPANTS_PER_ROOM=4
ROOM_INACTIVITY_TIMEOUT=300000
```

### Comandos Útiles

```bash
# Redis
redis-cli                    # CLI de Redis
redis-cli FLUSHALL          # Limpiar toda la base de datos
redis-cli MONITOR           # Ver comandos en tiempo real

# Tests
npm run test:multiplayer           # Tests de multiplayer
npm run test:e2e:multiplayer      # Tests E2E WebSocket

# Logs
docker-compose logs -f redis      # Ver logs de Redis
```

### Troubleshooting

**Problema: WebSocket no conecta**
- Verificar CORS_ORIGINS en .env
- Verificar que el puerto 3000 está abierto
- Revisar logs del servidor

**Problema: Redis no conecta**
- Verificar que Redis está corriendo: `docker-compose ps`
- Verificar REDIS_HOST y REDIS_PORT
- Revisar logs: `docker-compose logs redis`

**Problema: Mensajes no se broadcast**
- Verificar que los usuarios están en la misma sala (socket.join)
- Revisar logs del gateway
- Verificar que el roomCode es correcto

**Problema: Salas no se limpian**
- Verificar TTL en Redis
- Implementar job de limpieza si es necesario
- Revisar handleClientDisconnect

---

**¡Éxito en la implementación de la Iteración 3! 🚀🎮**
