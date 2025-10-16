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

    it('should generate farewell message for wise personality', async () => {
      const result = await service.generateFarewellMessage('wise', 'Morgana');

      expect(result).toContain('Morgana');
    });

    it('should generate farewell message for cryptic personality', async () => {
      const result = await service.generateFarewellMessage('cryptic', 'Azazel');

      expect(result).toContain('Azazel');
    });

    it('should generate farewell message for playful personality', async () => {
      const result = await service.generateFarewellMessage('playful', 'Puck');

      expect(result).toContain('Puck');
    });
  });

  describe('generateSpiritResponse - Error Handling', () => {
    it('should handle AI service errors', async () => {
      mockPrismaService.sessionMessage.findMany.mockResolvedValue([]);
      mockAIService.generate.mockRejectedValue(new Error('AI service unavailable'));

      await expect(
        service.generateSpiritResponse(1, 'Test message', 'wise', 'Morgana', 'Historia'),
      ).rejects.toThrow('AI service unavailable');
    });

    it('should handle very long responses and truncate them', async () => {
      mockPrismaService.sessionMessage.findMany.mockResolvedValue([]);

      const longResponse = 'a'.repeat(600);
      mockAIService.generate.mockResolvedValue({
        content: longResponse,
        engine: 'ollama',
        timestamp: new Date(),
        processingTime: 1500,
      });

      const result = await service.generateSpiritResponse(1, 'Test', 'wise', 'Morgana', 'Historia');

      expect(result.length).toBeLessThanOrEqual(500);
      expect(result).toMatch(/\.\.\.$/);
    });

    it('should add punctuation if response lacks it', async () => {
      mockPrismaService.sessionMessage.findMany.mockResolvedValue([]);

      mockAIService.generate.mockResolvedValue({
        content: 'Esta es una respuesta sin puntuacion final',
        engine: 'ollama',
        timestamp: new Date(),
        processingTime: 1500,
      });

      const result = await service.generateSpiritResponse(1, 'Test', 'wise', 'Morgana', 'Historia');

      expect(result).toMatch(/\.\.\.$/);
    });
  });

  describe('generateMultiplayerResponse', () => {
    it('should generate response for multiplayer with conversation history', async () => {
      const conversationHistory = [
        { role: 'user', content: 'Hola' },
        { role: 'spirit', content: 'Saludos, mortal' },
      ];

      mockAIService.generate.mockResolvedValue({
        content: 'El camino está claro ante vosotros.',
        engine: 'ollama',
        timestamp: new Date(),
        processingTime: 1500,
      });

      const result = await service.generateMultiplayerResponse(
        'wise',
        'Morgana la Sabia',
        'Una curandera medieval...',
        conversationHistory,
        '¿Qué nos espera?',
      );

      expect(result).toContain('camino');
      expect(mockAIService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Hola' }),
            expect.objectContaining({ role: 'assistant', content: 'Saludos, mortal' }),
            expect.objectContaining({ role: 'user', content: '¿Qué nos espera?' }),
          ]),
          temperature: 0.9,
          maxTokens: 300,
        }),
      );
    });

    it('should handle multiplayer errors gracefully', async () => {
      mockAIService.generate.mockRejectedValue(new Error('AI engine failed'));

      await expect(
        service.generateMultiplayerResponse('wise', 'Morgana', 'Historia', [], 'Test'),
      ).rejects.toThrow('AI engine failed');
    });

    it('should generate response for different personalities in multiplayer', async () => {
      mockAIService.generate.mockResolvedValue({
        content: 'Respuesta del espíritu',
        engine: 'ollama',
        timestamp: new Date(),
        processingTime: 1500,
      });

      const personalities: Array<'wise' | 'cryptic' | 'dark' | 'playful'> = [
        'wise',
        'cryptic',
        'dark',
        'playful',
      ];

      for (const personality of personalities) {
        const result = await service.generateMultiplayerResponse(
          personality,
          'Espíritu',
          'Historia',
          [],
          'Test',
        );

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }
    });

    it('should work with empty conversation history', async () => {
      mockAIService.generate.mockResolvedValue({
        content: 'Primera respuesta',
        engine: 'ollama',
        timestamp: new Date(),
        processingTime: 1500,
      });

      const result = await service.generateMultiplayerResponse(
        'wise',
        'Morgana',
        'Historia',
        [],
        'Primera pregunta',
      );

      expect(result).toBeDefined();
      expect(mockAIService.generate).toHaveBeenCalled();
    });
  });
});
