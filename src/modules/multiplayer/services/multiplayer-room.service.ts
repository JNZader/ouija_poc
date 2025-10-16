import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ParticipantData,
  RoomCreatedData,
  RoomJoinedData,
} from '../interfaces/websocket-events.interface';

@Injectable()
export class MultiplayerRoomService {
  private readonly logger = new Logger(MultiplayerRoomService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Genera un código único de sala de 8 caracteres
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Crea una nueva sala multijugador
   */
  async createRoom(
    spiritId: string,
    userId: string,
    username: string,
    socketId: string,
  ): Promise<RoomCreatedData> {
    // Validar que el espíritu exista
    const spirit = await this.prisma.spirit.findFirst({
      where: {
        id: parseInt(spiritId, 10),
        isActive: true,
      },
    });

    if (!spirit) {
      throw new NotFoundException(`Spirit with ID ${spiritId} not found`);
    }

    // Generar código único
    let roomCode = this.generateRoomCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await this.prisma.multiplayerRoom.findUnique({
        where: { roomCode },
      });

      if (!existing) break;

      roomCode = this.generateRoomCode();
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new BadRequestException('Could not generate unique room code');
    }

    // Crear sala y participante en una transacción
    const room = await this.prisma.$transaction(async (tx) => {
      const newRoom = await tx.multiplayerRoom.create({
        data: {
          roomCode,
          spiritId: spirit.id,
          hostUserId: userId,
          status: 'active',
          maxPlayers: 10,
        },
        include: {
          spirit: true,
        },
      });

      await tx.roomParticipant.create({
        data: {
          roomId: newRoom.id,
          userId,
          username,
          socketId,
          isActive: true,
        },
      });

      return newRoom;
    });

    this.logger.log(`Room created: ${roomCode} by ${username}`);

    return {
      roomCode: room.roomCode,
      spirit: {
        id: spirit.id.toString(),
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
      maxParticipants: room.maxPlayers,
    };
  }

  /**
   * Unirse a una sala existente
   */
  async joinRoom(
    roomCode: string,
    userId: string,
    username: string,
    socketId: string,
  ): Promise<RoomJoinedData> {
    // Buscar la sala
    const room = await this.prisma.multiplayerRoom.findUnique({
      where: { roomCode },
      include: {
        spirit: true,
        participants: {
          where: { isActive: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }

    if (room.status !== 'active') {
      throw new BadRequestException('Room is not active');
    }

    // Verificar capacidad
    if (room.participants.length >= room.maxPlayers) {
      throw new BadRequestException('Room is full');
    }

    // Verificar si el usuario ya está en la sala
    const existingParticipant = room.participants.find(
      (p) => p.userId === userId && p.isActive,
    );

    if (existingParticipant) {
      throw new BadRequestException('User already in room');
    }

    // Añadir participante
    await this.prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId,
        username,
        socketId,
        isActive: true,
      },
    });

    // Obtener lista actualizada de participantes
    const updatedParticipants = await this.prisma.roomParticipant.findMany({
      where: {
        roomId: room.id,
        isActive: true,
      },
      orderBy: { joinedAt: 'asc' },
    });

    this.logger.log(`User ${username} joined room ${roomCode}`);

    const participants: ParticipantData[] = updatedParticipants.map((p) => ({
      userId: p.userId || '',
      username: p.username,
      joinedAt: p.joinedAt,
      isHost: p.userId === room.hostUserId,
    }));

    return {
      roomCode: room.roomCode,
      participants,
      spirit: {
        id: room.spirit.id.toString(),
        name: room.spirit.name,
        personality: room.spirit.personality,
      },
    };
  }

  /**
   * Salir de una sala
   */
  async leaveRoom(roomCode: string, userId: string): Promise<void> {
    const room = await this.prisma.multiplayerRoom.findUnique({
      where: { roomCode },
      include: {
        participants: {
          where: { isActive: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }

    // Marcar participante como inactivo
    await this.prisma.roomParticipant.updateMany({
      where: {
        roomId: room.id,
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    this.logger.log(`User ${userId} left room ${roomCode}`);

    // Si era el último participante, cerrar la sala
    const activeParticipants = await this.prisma.roomParticipant.count({
      where: {
        roomId: room.id,
        isActive: true,
      },
    });

    if (activeParticipants === 0) {
      await this.endRoom(roomCode);
    }
  }

  /**
   * Obtener participantes activos de una sala
   */
  async getRoomParticipants(roomCode: string): Promise<ParticipantData[]> {
    const room = await this.prisma.multiplayerRoom.findUnique({
      where: { roomCode },
      include: {
        participants: {
          where: { isActive: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }

    return room.participants.map((p) => ({
      userId: p.userId || '',
      username: p.username,
      joinedAt: p.joinedAt,
      isHost: p.userId === room.hostUserId,
    }));
  }

  /**
   * Obtener información de la sala
   */
  async getRoom(roomCode: string) {
    const room = await this.prisma.multiplayerRoom.findUnique({
      where: { roomCode },
      include: {
        spirit: true,
        participants: {
          where: { isActive: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }

    return room;
  }

  /**
   * Finalizar una sala
   */
  async endRoom(roomCode: string): Promise<void> {
    await this.prisma.multiplayerRoom.update({
      where: { roomCode },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    });

    this.logger.log(`Room ${roomCode} ended`);
  }

  /**
   * Remover participante por socketId (útil para desconexiones)
   */
  async removeParticipantBySocketId(socketId: string): Promise<string | null> {
    const participant = await this.prisma.roomParticipant.findFirst({
      where: {
        socketId,
        isActive: true,
      },
      include: {
        room: true,
      },
    });

    if (!participant) {
      return null;
    }

    await this.prisma.roomParticipant.update({
      where: { id: participant.id },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    // Verificar si quedan participantes activos
    const activeCount = await this.prisma.roomParticipant.count({
      where: {
        roomId: participant.roomId,
        isActive: true,
      },
    });

    if (activeCount === 0) {
      await this.endRoom(participant.room.roomCode);
    }

    return participant.room.roomCode;
  }

  /**
   * Guardar mensaje en la base de datos
   */
  async saveMessage(
    roomCode: string,
    role: 'user' | 'spirit',
    content: string,
    username?: string,
  ): Promise<any> {
    const room = await this.prisma.multiplayerRoom.findUnique({
      where: { roomCode },
      include: {
        sessions: {
          where: { status: 'active' },
          take: 1,
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }

    // Si no hay sesión asociada, crear una
    let sessionId: number;
    if (room.sessions.length === 0) {
      const newSession = await this.prisma.ouijaSession.create({
        data: {
          spiritId: room.spiritId,
          status: 'active',
          multiplayerRoomId: room.id,
        },
      });
      sessionId = newSession.id;
    } else {
      sessionId = room.sessions[0].id;
    }

    // Guardar mensaje
    const message = await this.prisma.sessionMessage.create({
      data: {
        sessionId,
        role,
        content,
        username,
      },
    });

    return message;
  }

  /**
   * Obtener historial de mensajes de una sala
   */
  async getRoomMessages(roomCode: string, limit: number = 50) {
    const room = await this.prisma.multiplayerRoom.findUnique({
      where: { roomCode },
      include: {
        sessions: {
          where: { status: 'active' },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: limit,
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with code ${roomCode} not found`);
    }

    if (room.sessions.length === 0) {
      return [];
    }

    return room.sessions[0].messages.reverse();
  }
}
