import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SpiritSessionService } from '../spirit-session.service';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { ConversationService } from '../conversation.service';

describe('SpiritSessionService', () => {
  let service: SpiritSessionService;

  const mockPrismaService = {
    spirit: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    ouijaSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sessionMessage: {
      create: jest.fn(),
    },
  };

  const mockConversationService = {
    generateWelcomeMessage: jest.fn(),
    generateSpiritResponse: jest.fn(),
    generateFarewellMessage: jest.fn(),
  };

  const mockSpirit = {
    id: 1,
    name: 'Morgana la Sabia',
    personality: 'wise',
    backstory: 'Una curandera medieval...',
    isActive: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpiritSessionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
      ],
    }).compile();

    service = module.get<SpiritSessionService>(SpiritSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      mockPrismaService.spirit.findUnique.mockResolvedValue(mockSpirit);
      mockPrismaService.ouijaSession.create.mockResolvedValue({
        id: 1,
        sessionToken: 'sess_abc123',
        spiritId: mockSpirit.id,
        status: 'active',
        createdAt: new Date(),
        endedAt: null,
        userId: null,
        multiplayerRoomId: null,
        spirit: mockSpirit,
      });
      mockConversationService.generateWelcomeMessage.mockResolvedValue('Bienvenido, mortal');
      mockPrismaService.sessionMessage.create.mockResolvedValue({});

      const result = await service.createSession({ spiritId: mockSpirit.id });

      expect(result).toHaveProperty('sessionToken');
      expect(result).toHaveProperty('welcomeMessage');
      expect(result.spirit.name).toBe('Morgana la Sabia');
      expect(mockPrismaService.spirit.findUnique).toHaveBeenCalledWith({
        where: { id: mockSpirit.id },
      });
    });

    it('should throw NotFoundException if spirit not found', async () => {
      mockPrismaService.spirit.findUnique.mockResolvedValue(null);

      await expect(service.createSession({ spiritId: 999 })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if spirit is not active', async () => {
      mockPrismaService.spirit.findUnique.mockResolvedValue({
        ...mockSpirit,
        isActive: false,
      });

      await expect(service.createSession({ spiritId: mockSpirit.id })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('sendMessage', () => {
    const mockSession = {
      id: 1,
      sessionToken: 'sess_abc123',
      spiritId: mockSpirit.id,
      status: 'active',
      createdAt: new Date(),
      endedAt: null,
      userId: null,
      multiplayerRoomId: null,
      spirit: mockSpirit,
    };

    it('should send message and receive spirit response', async () => {
      mockPrismaService.ouijaSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.sessionMessage.create
        .mockResolvedValueOnce({
          id: 1,
          sessionId: 1,
          role: 'user',
          content: '¿Cuál es mi destino?',
          createdAt: new Date(),
          username: null,
          metadata: null,
        })
        .mockResolvedValueOnce({
          id: 2,
          sessionId: 1,
          role: 'spirit',
          content: 'Tu destino es brillante',
          createdAt: new Date(),
          username: null,
          metadata: null,
        });
      mockConversationService.generateSpiritResponse.mockResolvedValue('Tu destino es brillante');

      const result = await service.sendMessage({
        sessionToken: 'sess_abc123',
        message: '¿Cuál es mi destino?',
      });

      expect(result).toHaveProperty('userMessage');
      expect(result).toHaveProperty('spiritResponse');
      expect(result.spiritResponse.content).toBe('Tu destino es brillante');
    });

    it('should throw NotFoundException if session not found', async () => {
      mockPrismaService.ouijaSession.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage({
          sessionToken: 'invalid-token',
          message: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if session is not active', async () => {
      mockPrismaService.ouijaSession.findUnique.mockResolvedValue({
        ...mockSession,
        status: 'ended',
      });

      await expect(
        service.sendMessage({
          sessionToken: 'sess_abc123',
          message: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSessionHistory', () => {
    it('should return session history with messages', async () => {
      mockPrismaService.ouijaSession.findUnique.mockResolvedValue({
        id: 1,
        sessionToken: 'sess_abc123',
        status: 'active',
        createdAt: new Date(),
        endedAt: null,
        userId: null,
        spiritId: 1,
        multiplayerRoomId: null,
        spirit: mockSpirit,
        messages: [
          {
            id: 1,
            sessionId: 1,
            role: 'spirit',
            content: 'Bienvenido',
            createdAt: new Date(),
            username: null,
            metadata: null,
          },
          {
            id: 2,
            sessionId: 1,
            role: 'user',
            content: 'Hola',
            createdAt: new Date(),
            username: null,
            metadata: null,
          },
        ],
      });

      const result = await service.getSessionHistory('sess_abc123');

      expect(result).toHaveProperty('messages');
      expect(result.messages).toHaveLength(2);
      expect(result.spirit.name).toBe('Morgana la Sabia');
    });
  });

  describe('endSession', () => {
    it('should end session successfully', async () => {
      mockPrismaService.ouijaSession.findUnique.mockResolvedValue({
        id: 1,
        sessionToken: 'sess_abc123',
        status: 'active',
        createdAt: new Date(),
        endedAt: null,
        userId: null,
        spiritId: 1,
        multiplayerRoomId: null,
        spirit: mockSpirit,
      });
      mockConversationService.generateFarewellMessage.mockResolvedValue('Hasta pronto');
      mockPrismaService.sessionMessage.create.mockResolvedValue({});
      mockPrismaService.ouijaSession.update.mockResolvedValue({
        id: 1,
        sessionToken: 'sess_abc123',
        status: 'ended',
        createdAt: new Date(),
        endedAt: new Date(),
        userId: null,
        spiritId: 1,
        multiplayerRoomId: null,
      });

      const result = await service.endSession('sess_abc123');

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('endedAt');
      expect(result.message).toBe('Hasta pronto');
    });
  });

  describe('getAvailableSpirits', () => {
    it('should return list of active spirits', async () => {
      mockPrismaService.spirit.findMany.mockResolvedValue([mockSpirit]);

      const result = await service.getAvailableSpirits();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Morgana la Sabia');
      expect(mockPrismaService.spirit.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: expect.any(Object),
        orderBy: { name: 'asc' },
      });
    });
  });
});
