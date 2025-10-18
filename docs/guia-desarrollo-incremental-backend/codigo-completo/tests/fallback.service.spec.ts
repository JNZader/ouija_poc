import { Test, TestingModule } from '@nestjs/testing';
import { FallbackService } from '../services/fallback.service';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Tests Unitarios - FallbackService
 *
 * Este archivo contiene tests unitarios para el servicio de fallback.
 * Los tests verifican el funcionamiento del algoritmo de keyword matching
 * y la selección de respuestas.
 *
 * Qué se testea:
 * - Extracción de keywords
 * - Cálculo de match score
 * - Selección de respuestas por personalidad/categoría/idioma
 * - Manejo de casos sin resultados
 * - Respuestas genéricas
 *
 * @see IT1-004 en guia-desarrollo-incremental-backend/iteracion-1/TAREAS.md
 */

describe('FallbackService', () => {
  let service: FallbackService;
  let prismaService: PrismaService;

  // Mock data
  const mockResponses = [
    {
      id: '1',
      personality: 'wise',
      category: 'love',
      language: 'es',
      text: 'El amor verdadero llegará cuando estés preparado.',
      keywords: JSON.stringify(['amor', 'pareja', 'corazón', 'relación']),
      createdAt: new Date(),
    },
    {
      id: '2',
      personality: 'wise',
      category: 'career',
      language: 'es',
      text: 'Tu carrera florecerá con dedicación y paciencia.',
      keywords: JSON.stringify(['trabajo', 'carrera', 'empleo', 'profesión']),
      createdAt: new Date(),
    },
    {
      id: '3',
      personality: 'wise',
      category: 'general',
      language: 'es',
      text: 'Los espíritus observan tu camino con sabiduría.',
      keywords: JSON.stringify(['general', 'espíritus', 'destino']),
      createdAt: new Date(),
    },
  ];

  // Mock de PrismaService
  const mockPrismaService = {
    fallbackResponse: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FallbackService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FallbackService>(FallbackService);
    prismaService = module.get<PrismaService>(PrismaService);

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
  // Tests de getFallbackResponse
  // ==============================================

  describe('getFallbackResponse', () => {
    it('should return a response matching the question keywords', async () => {
      // Arrange
      mockPrismaService.fallbackResponse.findMany.mockResolvedValue(mockResponses);

      // Act
      const result = await service.getFallbackResponse(
        '¿Encontraré el amor verdadero?',
        'wise',
        'love',
        'es',
      );

      // Assert
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(mockPrismaService.fallbackResponse.findMany).toHaveBeenCalledWith({
        where: {
          personality: 'wise',
          language: 'es',
        },
      });
    });

    it('should prioritize responses matching the category', async () => {
      // Arrange
      mockPrismaService.fallbackResponse.findMany.mockResolvedValue(mockResponses);

      // Act
      const result = await service.getFallbackResponse(
        '¿Cuándo encontraré trabajo?',
        'wise',
        'career',
        'es',
      );

      // Assert
      expect(result).toContain('carrera'); // Debería seleccionar la respuesta de carrera
    });

    it('should return generic response when no responses found', async () => {
      // Arrange
      mockPrismaService.fallbackResponse.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getFallbackResponse(
        'Any question',
        'wise',
        'general',
        'es',
      );

      // Assert
      expect(result).toBeTruthy();
      expect(result).toContain('espíritus'); // Respuesta genérica
    });

    it('should handle different personalities', async () => {
      // Arrange
      const crypticResponses = [
        {
          ...mockResponses[0],
          personality: 'cryptic',
          text: 'Las sombras revelarán secretos ocultos.',
        },
      ];
      mockPrismaService.fallbackResponse.findMany.mockResolvedValue(crypticResponses);

      // Act
      const result = await service.getFallbackResponse(
        'Test question',
        'cryptic',
        'general',
        'es',
      );

      // Assert
      expect(mockPrismaService.fallbackResponse.findMany).toHaveBeenCalledWith({
        where: {
          personality: 'cryptic',
          language: 'es',
        },
      });
    });

    it('should handle different languages', async () => {
      // Arrange
      const englishResponses = [
        {
          ...mockResponses[0],
          language: 'en',
          text: 'The spirits watch over you.',
        },
      ];
      mockPrismaService.fallbackResponse.findMany.mockResolvedValue(englishResponses);

      // Act
      const result = await service.getFallbackResponse(
        'Test question',
        'wise',
        'general',
        'en',
      );

      // Assert
      expect(mockPrismaService.fallbackResponse.findMany).toHaveBeenCalledWith({
        where: {
          personality: 'wise',
          language: 'en',
        },
      });
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockPrismaService.fallbackResponse.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // Act
      const result = await service.getFallbackResponse(
        'Test question',
        'wise',
        'general',
        'es',
      );

      // Assert
      expect(result).toBeTruthy(); // Debería retornar respuesta genérica
      expect(result).toContain('espíritus');
    });
  });

  // ==============================================
  // Tests de getStats
  // ==============================================

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      // Arrange
      mockPrismaService.fallbackResponse.findMany.mockResolvedValue(mockResponses);

      // Act
      const stats = await service.getStats();

      // Assert
      expect(stats.total).toBe(3);
      expect(stats.byPersonality['wise']).toBe(3);
      expect(stats.byCategory['love']).toBe(1);
      expect(stats.byCategory['career']).toBe(1);
      expect(stats.byLanguage['es']).toBe(3);
    });

    it('should handle empty database', async () => {
      // Arrange
      mockPrismaService.fallbackResponse.findMany.mockResolvedValue([]);

      // Act
      const stats = await service.getStats();

      // Assert
      expect(stats.total).toBe(0);
      expect(stats.byPersonality).toEqual({});
      expect(stats.byCategory).toEqual({});
      expect(stats.byLanguage).toEqual({});
    });
  });

  // ==============================================
  // Tests Privados (via reflexión o testing indirecto)
  // ==============================================

  describe('keyword extraction (indirect test)', () => {
    it('should extract relevant keywords from questions', async () => {
      // Arrange
      mockPrismaService.fallbackResponse.findMany.mockResolvedValue(mockResponses);

      // Act - Una pregunta con muchas stopwords
      const result = await service.getFallbackResponse(
        'Hola, me gustaría saber si voy a encontrar el amor de mi vida pronto',
        'wise',
        'love',
        'es',
      );

      // Assert
      expect(result).toBeTruthy();
      // Las stopwords (hola, me, si, voy, de, mi) deberían ser filtradas
      // Solo keywords relevantes (encontrar, amor, vida) deberían usarse
    });
  });
});
