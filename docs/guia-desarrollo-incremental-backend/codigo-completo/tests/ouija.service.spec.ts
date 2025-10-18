import { Test, TestingModule } from '@nestjs/testing';
import { OuijaService } from '../services/ouija.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { OllamaService } from '../services/ollama.service';
import { GroqService } from '../services/groq.service';
import { PromptsService } from '../services/prompts.service';

/**
 * Tests Unitarios - OuijaService
 *
 * Este archivo contiene tests unitarios para el servicio principal de Ouija.
 * Los tests verifican el sistema de fallback triple y el manejo de cache.
 *
 * Qué se testea:
 * - Sistema de fallback triple (Groq → Ollama → Database)
 * - Cache de preguntas repetidas
 * - Respuestas de "espíritu molesto" después de 3+ repeticiones
 * - Detección de categorías
 * - Manejo de errores
 *
 * @see IT1-004 en guia-desarrollo-incremental-backend/iteracion-1/TAREAS.md
 */

describe('OuijaService', () => {
  let service: OuijaService;
  let prismaService: PrismaService;
  let ollamaService: OllamaService;
  let groqService: GroqService;
  let promptsService: PromptsService;

  // Mocks
  const mockPrismaService = {
    fallbackResponse: {
      findMany: jest.fn(),
    },
  };

  const mockOllamaService = {
    generate: jest.fn(),
    healthCheck: jest.fn(),
    getModel: jest.fn().mockReturnValue('qwen2.5:0.5b'),
  };

  const mockGroqService = {
    generate: jest.fn(),
    isAvailable: jest.fn(),
    getModel: jest.fn().mockReturnValue('llama-3.1-8b-instant'),
  };

  const mockPromptsService = {
    generatePrompt: jest.fn(),
    getAnnoyedPrompt: jest.fn(),
    detectCategory: jest.fn().mockReturnValue('general'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OuijaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OllamaService, useValue: mockOllamaService },
        { provide: GroqService, useValue: mockGroqService },
        { provide: PromptsService, useValue: mockPromptsService },
      ],
    }).compile();

    service = module.get<OuijaService>(OuijaService);
    prismaService = module.get<PrismaService>(PrismaService);
    ollamaService = module.get<OllamaService>(OllamaService);
    groqService = module.get<GroqService>(GroqService);
    promptsService = module.get<PromptsService>(PromptsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  // ==============================================
  // Tests de Creación del Servicio
  // ==============================================

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==============================================
  // Tests de processQuestion
  // ==============================================

  describe('processQuestion', () => {
    const testQuestion = '¿Qué me depara el futuro?';

    it('should use Groq as primary source when available', async () => {
      // Arrange
      mockGroqService.isAvailable.mockReturnValue(true);
      mockGroqService.generate.mockResolvedValue('Las estrellas indican un futuro brillante.');
      mockPromptsService.generatePrompt.mockReturnValue('Prompt generado');

      // Act
      const result = await service.processQuestion(testQuestion, 'wise', 'es');

      // Assert
      expect(result.source).toBe('groq');
      expect(result.response).toContain('futuro brillante');
      expect(mockGroqService.generate).toHaveBeenCalled();
      expect(mockOllamaService.generate).not.toHaveBeenCalled();
    });

    it('should fallback to Ollama when Groq fails', async () => {
      // Arrange
      mockGroqService.isAvailable.mockReturnValue(true);
      mockGroqService.generate.mockRejectedValue(new Error('Groq error'));
      mockOllamaService.generate.mockResolvedValue('Los espíritus te guían.');
      mockPromptsService.generatePrompt.mockReturnValue('Prompt generado');

      // Act
      const result = await service.processQuestion(testQuestion, 'wise', 'es');

      // Assert
      expect(result.source).toBe('ollama');
      expect(mockGroqService.generate).toHaveBeenCalled();
      expect(mockOllamaService.generate).toHaveBeenCalled();
    });

    it('should fallback to database when both AI services fail', async () => {
      // Arrange
      mockGroqService.isAvailable.mockReturnValue(true);
      mockGroqService.generate.mockRejectedValue(new Error('Groq error'));
      mockOllamaService.generate.mockRejectedValue(new Error('Ollama error'));
      mockPrismaService.fallbackResponse.findMany.mockResolvedValue([
        {
          id: '1',
          personality: 'wise',
          category: 'general',
          language: 'es',
          text: 'Los espíritus observan tu camino.',
          keywords: JSON.stringify(['general', 'destino']),
          createdAt: new Date(),
        },
      ]);

      // Act
      const result = await service.processQuestion(testQuestion, 'wise', 'es');

      // Assert
      expect(result.source).toBe('database');
      expect(mockGroqService.generate).toHaveBeenCalled();
      expect(mockOllamaService.generate).toHaveBeenCalled();
      expect(mockPrismaService.fallbackResponse.findMany).toHaveBeenCalled();
    });

    it('should cache responses for repeated questions', async () => {
      // Arrange
      mockGroqService.isAvailable.mockReturnValue(true);
      mockGroqService.generate.mockResolvedValue('Primera respuesta');
      mockPromptsService.generatePrompt.mockReturnValue('Prompt generado');

      // Act - Primera pregunta
      const result1 = await service.processQuestion(testQuestion, 'wise', 'es');

      // Segunda pregunta (misma)
      const result2 = await service.processQuestion(testQuestion, 'wise', 'es');

      // Assert
      expect(result1.response).toBe(result2.response);
      // Groq debería ser llamado solo una vez (primera vez)
      expect(mockGroqService.generate).toHaveBeenCalledTimes(1);
    });

    it('should return annoyed response after 3+ repetitions', async () => {
      // Arrange
      mockGroqService.isAvailable.mockReturnValue(true);
      mockGroqService.generate.mockResolvedValue('Primera respuesta');
      mockOllamaService.generate.mockResolvedValue('Respuesta molesta');
      mockPromptsService.generatePrompt.mockReturnValue('Prompt generado');
      mockPromptsService.getAnnoyedPrompt.mockReturnValue('Prompt molesto');

      // Act - Preguntar 3 veces
      await service.processQuestion(testQuestion, 'wise', 'es');
      await service.processQuestion(testQuestion, 'wise', 'es');
      const result3 = await service.processQuestion(testQuestion, 'wise', 'es');

      // Assert
      expect(result3.source).toBe('annoyed');
      expect(mockPromptsService.getAnnoyedPrompt).toHaveBeenCalled();
    });

    it('should detect category from question', async () => {
      // Arrange
      mockGroqService.isAvailable.mockReturnValue(true);
      mockGroqService.generate.mockResolvedValue('Respuesta');
      mockPromptsService.generatePrompt.mockReturnValue('Prompt generado');
      mockPromptsService.detectCategory.mockReturnValue('love');

      // Act
      const result = await service.processQuestion('¿Encontraré el amor?', 'wise', 'es');

      // Assert
      expect(result.category).toBe('love');
      expect(mockPromptsService.detectCategory).toHaveBeenCalledWith('¿Encontraré el amor?');
    });

    it('should handle different personalities', async () => {
      // Arrange
      mockGroqService.isAvailable.mockReturnValue(true);
      mockGroqService.generate.mockResolvedValue('Respuesta críptica');
      mockPromptsService.generatePrompt.mockReturnValue('Prompt generado');

      // Act
      const result = await service.processQuestion(testQuestion, 'cryptic', 'es');

      // Assert
      expect(result.personality).toBe('cryptic');
      expect(mockPromptsService.generatePrompt).toHaveBeenCalledWith(
        testQuestion,
        'cryptic',
        expect.any(String),
        'es',
      );
    });

    it('should handle different languages', async () => {
      // Arrange
      mockGroqService.isAvailable.mockReturnValue(true);
      mockGroqService.generate.mockResolvedValue('English response');
      mockPromptsService.generatePrompt.mockReturnValue('English prompt');

      // Act
      const result = await service.processQuestion('What does the future hold?', 'wise', 'en');

      // Assert
      expect(result.language).toBe('en');
    });
  });

  // ==============================================
  // Tests de Edge Cases
  // ==============================================

  describe('edge cases', () => {
    it('should handle empty question', async () => {
      // Arrange
      mockGroqService.isAvailable.mockReturnValue(true);
      mockGroqService.generate.mockResolvedValue('Respuesta');
      mockPromptsService.generatePrompt.mockReturnValue('Prompt generado');
      mockPromptsService.detectCategory.mockReturnValue('general');

      // Act
      const result = await service.processQuestion('', 'wise', 'es');

      // Assert
      expect(result).toBeDefined();
      expect(result.source).toBeDefined();
    });

    it('should handle very long question', async () => {
      // Arrange
      const longQuestion = 'A'.repeat(1000);
      mockGroqService.isAvailable.mockReturnValue(true);
      mockGroqService.generate.mockResolvedValue('Respuesta');
      mockPromptsService.generatePrompt.mockReturnValue('Prompt generado');
      mockPromptsService.detectCategory.mockReturnValue('general');

      // Act
      const result = await service.processQuestion(longQuestion, 'wise', 'es');

      // Assert
      expect(result).toBeDefined();
    });
  });
});
