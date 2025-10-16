import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from '../conversation.service';
import { AIService } from '../ai.service';
import { PrismaService } from '../../../../common/prisma/prisma.service';

describe('ConversationService', () => {
  let service: ConversationService;

  const mockAIService = {
    generate: jest.fn(),
  };

  const mockPrismaService = {
    sessionMessage: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: AIService,
          useValue: mockAIService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSpiritResponse', () => {
    it('should generate response with conversation context', async () => {
      mockPrismaService.sessionMessage.findMany.mockResolvedValue([
        { role: 'user', content: 'Hola' },
        { role: 'spirit', content: 'Saludos, mortal' },
      ]);

      mockAIService.generate.mockResolvedValue({
        content: 'Tu destino es brillante, hijo mío.',
        engine: 'ollama',
        timestamp: new Date(),
        processingTime: 1500,
      });

      const result = await service.generateSpiritResponse(
        1,
        '¿Cuál es mi futuro?',
        'wise',
        'Morgana la Sabia',
        'Una curandera medieval...',
      );

      expect(result).toContain('destino');
      expect(mockPrismaService.sessionMessage.findMany).toHaveBeenCalledWith({
        where: { sessionId: 1 },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { role: true, content: true },
      });
      expect(mockAIService.generate).toHaveBeenCalled();
    });

    it('should format response correctly', async () => {
      mockPrismaService.sessionMessage.findMany.mockResolvedValue([]);

      mockAIService.generate.mockResolvedValue({
        content: '"La respuesta está dentro de ti"',
        engine: 'ollama',
        timestamp: new Date(),
        processingTime: 1500,
      });

      const result = await service.generateSpiritResponse(
        1,
        'Pregunta',
        'wise',
        'Morgana',
        'Historia',
      );

      // Debe remover comillas y agregar puntuación si es necesario
      expect(result).toContain('La respuesta está dentro de ti');
    });
  });

  describe('generateWelcomeMessage', () => {
    it('should generate welcome message for wise personality', async () => {
      const result = await service.generateWelcomeMessage('wise', 'Morgana la Sabia');

      expect(result).toContain('Morgana la Sabia');
      expect(result).toContain('Saludos');
    });

    it('should generate welcome message for cryptic personality', async () => {
      const result = await service.generateWelcomeMessage('cryptic', 'Azazel');

      expect(result).toContain('Azazel');
    });
  });

  describe('generateFarewellMessage', () => {
    it('should generate farewell message for dark personality', async () => {
      const result = await service.generateFarewellMessage('dark', 'Lilith');

      expect(result).toContain('Lilith');
      expect(result).toContain('sombras');
    });
  });
});
