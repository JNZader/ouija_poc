import { Test, TestingModule } from '@nestjs/testing';
import { MultiplayerRoomService } from '../multiplayer-room.service';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MultiplayerRoomService', () => {
  let service: MultiplayerRoomService;
  let prismaService: PrismaService;

  const mockSpirit = {
    id: 1,
    name: 'Morgana la Sabia',
    personality: 'wise',
    backstory: 'Ancient wise spirit',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRoom = {
    id: 1,
    roomCode: 'ABC12345',
    spiritId: 1,
    hostUserId: 'user123',
    status: 'active',
    maxPlayers: 10,
    isPrivate: false,
    createdAt: new Date(),
    endedAt: null,
    spirit: mockSpirit,
    participants: [],
  };

  const mockParticipant = {
    id: 1,
    roomId: 1,
    userId: 'user123',
    username: 'TestUser',
    socketId: 'socket123',
    isActive: true,
    joinedAt: new Date(),
    leftAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiplayerRoomService,
        {
          provide: PrismaService,
          useValue: {
            spirit: {
              findFirst: jest.fn(),
            },
            multiplayerRoom: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            roomParticipant: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              updateMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            sessionMessage: {
              create: jest.fn(),
            },
            ouijaSession: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MultiplayerRoomService>(MultiplayerRoomService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a room successfully', async () => {
      jest.spyOn(prismaService.spirit, 'findFirst').mockResolvedValue(mockSpirit);
      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        return callback({
          multiplayerRoom: {
            create: jest.fn().mockResolvedValue({
              ...mockRoom,
              spirit: mockSpirit,
            }),
          },
          roomParticipant: {
            create: jest.fn().mockResolvedValue(mockParticipant),
          },
        });
      });

      const result = await service.createRoom('1', 'user123', 'TestUser', 'socket123');

      expect(result).toHaveProperty('roomCode');
      expect(result).toHaveProperty('spirit');
      expect(result).toHaveProperty('participants');
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].username).toBe('TestUser');
    });

    it('should throw NotFoundException if spirit not found', async () => {
      jest.spyOn(prismaService.spirit, 'findFirst').mockResolvedValue(null);

      await expect(service.createRoom('999', 'user123', 'TestUser', 'socket123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('joinRoom', () => {
    it('should join a room successfully', async () => {
      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue({
        ...mockRoom,
        participants: [mockParticipant],
      } as never);
      jest.spyOn(prismaService.roomParticipant, 'create').mockResolvedValue({
        ...mockParticipant,
        userId: 'user456',
        username: 'NewUser',
      });
      jest
        .spyOn(prismaService.roomParticipant, 'findMany')
        .mockResolvedValue([
          mockParticipant,
          { ...mockParticipant, userId: 'user456', username: 'NewUser', id: 2 },
        ]);

      const result = await service.joinRoom('ABC12345', 'user456', 'NewUser', 'socket456');

      expect(result).toHaveProperty('roomCode', 'ABC12345');
      expect(result.participants).toHaveLength(2);
    });

    it('should throw NotFoundException if room not found', async () => {
      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue(null);

      await expect(service.joinRoom('INVALID', 'user456', 'NewUser', 'socket456')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if room is full', async () => {
      const fullParticipants = Array.from({ length: 10 }, (_, i) => ({
        ...mockParticipant,
        id: i + 1,
        userId: `user${i}`,
      }));

      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue({
        ...mockRoom,
        participants: fullParticipants,
      } as never);

      await expect(service.joinRoom('ABC12345', 'user456', 'NewUser', 'socket456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user already in room', async () => {
      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue({
        ...mockRoom,
        participants: [mockParticipant],
      } as never);

      await expect(
        service.joinRoom('ABC12345', 'user123', 'TestUser', 'socket456'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('leaveRoom', () => {
    it('should leave a room successfully', async () => {
      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue({
        ...mockRoom,
        participants: [mockParticipant],
      } as never);
      jest.spyOn(prismaService.roomParticipant, 'updateMany').mockResolvedValue({ count: 1 });
      jest.spyOn(prismaService.roomParticipant, 'count').mockResolvedValue(1);

      await service.leaveRoom('ABC12345', 'user123');

      expect(prismaService.roomParticipant.updateMany).toHaveBeenCalled();
    });

    it('should end room if last participant leaves', async () => {
      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue({
        ...mockRoom,
        participants: [mockParticipant],
      } as never);
      jest.spyOn(prismaService.roomParticipant, 'updateMany').mockResolvedValue({ count: 1 });
      jest.spyOn(prismaService.roomParticipant, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.multiplayerRoom, 'update').mockResolvedValue({
        ...mockRoom,
        status: 'ended',
      });

      await service.leaveRoom('ABC12345', 'user123');

      expect(prismaService.multiplayerRoom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roomCode: 'ABC12345' },
          data: expect.objectContaining({ status: 'ended' }),
        }),
      );
    });
  });

  describe('getRoomParticipants', () => {
    it('should return room participants', async () => {
      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue({
        ...mockRoom,
        participants: [mockParticipant],
      } as never);

      const result = await service.getRoomParticipants('ABC12345');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('username', 'TestUser');
      expect(result[0]).toHaveProperty('isHost', true);
    });

    it('should throw NotFoundException if room not found', async () => {
      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue(null);

      await expect(service.getRoomParticipants('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeParticipantBySocketId', () => {
    it('should remove participant by socket ID', async () => {
      jest.spyOn(prismaService.roomParticipant, 'findFirst').mockResolvedValue({
        ...mockParticipant,
        room: mockRoom,
      } as never);
      jest.spyOn(prismaService.roomParticipant, 'update').mockResolvedValue(mockParticipant);
      jest.spyOn(prismaService.roomParticipant, 'count').mockResolvedValue(1);

      const result = await service.removeParticipantBySocketId('socket123');

      expect(result).toBe('ABC12345');
      expect(prismaService.roomParticipant.update).toHaveBeenCalled();
    });

    it('should return null if participant not found', async () => {
      jest.spyOn(prismaService.roomParticipant, 'findFirst').mockResolvedValue(null);

      const result = await service.removeParticipantBySocketId('invalid');

      expect(result).toBeNull();
    });
  });

  describe('saveMessage', () => {
    it('should save a message', async () => {
      const mockSession = {
        id: 1,
        sessionToken: 'token123',
        spiritId: 1,
        status: 'active',
        userId: 'user123',
        multiplayerRoomId: 1,
        createdAt: new Date(),
        endedAt: null,
      };

      const mockMessage = {
        id: 1,
        sessionId: 1,
        role: 'user',
        content: 'Hello spirit',
        username: 'TestUser',
        metadata: null,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue({
        ...mockRoom,
        sessions: [mockSession],
      } as never);
      jest.spyOn(prismaService.sessionMessage, 'create').mockResolvedValue(mockMessage);

      const result = await service.saveMessage('ABC12345', 'user', 'Hello spirit', 'TestUser');

      expect(result).toHaveProperty('content', 'Hello spirit');
      expect(prismaService.sessionMessage.create).toHaveBeenCalled();
    });

    it('should create session if none exists', async () => {
      const mockSession = {
        id: 1,
        sessionToken: 'token123',
        spiritId: 1,
        status: 'active',
        userId: 'user123',
        multiplayerRoomId: 1,
        createdAt: new Date(),
        endedAt: null,
      };

      const mockMessage = {
        id: 1,
        sessionId: 1,
        role: 'user',
        content: 'Hello spirit',
        username: 'TestUser',
        metadata: null,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.multiplayerRoom, 'findUnique').mockResolvedValue({
        ...mockRoom,
        sessions: [],
      } as never);
      jest.spyOn(prismaService.ouijaSession, 'create').mockResolvedValue(mockSession);
      jest.spyOn(prismaService.sessionMessage, 'create').mockResolvedValue(mockMessage);

      const result = await service.saveMessage('ABC12345', 'user', 'Hello spirit', 'TestUser');

      expect(result).toHaveProperty('content', 'Hello spirit');
      expect(prismaService.ouijaSession.create).toHaveBeenCalled();
    });
  });
});
