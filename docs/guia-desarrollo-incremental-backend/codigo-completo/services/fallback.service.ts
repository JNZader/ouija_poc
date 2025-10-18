import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * FallbackService - Servicio de respuestas de fallback desde SQLite
 *
 * Este servicio es la última capa del sistema de fallback triple.
 * Cuando tanto Groq como Ollama fallan, este servicio retorna respuestas
 * pre-definidas almacenadas en la base de datos SQLite.
 *
 * Características:
 * - Keyword matching inteligente
 * - Filtrado por personalidad, categoría e idioma
 * - Selección aleatoria de respuestas
 * - Fallback a respuestas genéricas si no hay match
 * - Logging detallado
 *
 * Algoritmo de matching:
 * 1. Buscar respuestas que contengan palabras clave de la pregunta
 * 2. Filtrar por personalidad y lenguaje
 * 3. Priorizar respuestas de la categoría detectada
 * 4. Si no hay match, retornar respuesta genérica
 *
 * @see IT1-002 en guia-desarrollo-incremental-backend/iteracion-1/TAREAS.md
 */
@Injectable()
export class FallbackService {
  private readonly logger = new Logger(FallbackService.name);

  constructor(private prisma: PrismaService) {
    this.logger.log('💾 Fallback service initialized');
  }

  /**
   * Get a fallback response from database
   *
   * Algoritmo:
   * 1. Extraer keywords de la pregunta
   * 2. Buscar respuestas que contengan esas keywords
   * 3. Filtrar por personalidad y lenguaje
   * 4. Si hay match con categoría, priorizar esas
   * 5. Seleccionar aleatoriamente una respuesta
   * 6. Si no hay resultados, usar respuesta genérica
   *
   * @param question - Pregunta del usuario
   * @param personality - Personalidad deseada ('wise' | 'cryptic' | 'dark' | 'playful')
   * @param category - Categoría detectada de la pregunta
   * @param language - Idioma ('es' | 'en')
   * @returns Respuesta de fallback
   */
  async getFallbackResponse(
    question: string,
    personality: string,
    category: string,
    language: string,
  ): Promise<string> {
    const startTime = Date.now();

    try {
      this.logger.log(`💾 Searching fallback response...`);
      this.logger.log(`   Question: "${question.substring(0, 50)}..."`);
      this.logger.log(`   Personality: ${personality} | Category: ${category} | Language: ${language}`);

      // 1. Extraer keywords de la pregunta
      const keywords = this.extractKeywords(question);
      this.logger.log(`   Keywords extracted: ${keywords.join(', ')}`);

      // 2. Buscar respuestas que coincidan con los criterios
      const responses = await this.prisma.fallbackResponse.findMany({
        where: {
          personality,
          language,
        },
      });

      if (responses.length === 0) {
        this.logger.warn(`⚠️ No fallback responses found for personality=${personality}, language=${language}`);
        return this.getGenericResponse(personality, language);
      }

      // 3. Filtrar respuestas por keyword matching y categoría
      const scoredResponses = responses.map((response) => {
        const responseKeywords = JSON.parse(response.keywords) as string[];
        const matchScore = this.calculateMatchScore(keywords, responseKeywords);
        const categoryBonus = response.category === category ? 2 : 0;

        return {
          response,
          score: matchScore + categoryBonus,
        };
      });

      // 4. Ordenar por score y seleccionar las mejores
      scoredResponses.sort((a, b) => b.score - a.score);

      // 5. Tomar el top 3 y seleccionar aleatoriamente uno
      const topResponses = scoredResponses.slice(0, 3);
      const selected = topResponses[Math.floor(Math.random() * topResponses.length)];

      const elapsed = Date.now() - startTime;
      this.logger.log(`✅ Fallback response selected (score: ${selected.score}, ${elapsed}ms)`);
      this.logger.log(`   Category: ${selected.response.category}`);

      return selected.response.text;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      this.logger.error(`❌ Fallback failed after ${elapsed}ms: ${error.message}`);
      return this.getGenericResponse(personality, language);
    }
  }

  /**
   * Extract keywords from question
   *
   * Extrae palabras significativas de la pregunta, eliminando
   * palabras comunes (stopwords) y normalizando.
   *
   * @param question - Pregunta del usuario
   * @returns Array de keywords
   */
  private extractKeywords(question: string): string[] {
    const stopwords = [
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
      'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
      'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
      'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
      'mi', 'me', 'mi', 'yo', 'tu', 'te', 'es', 'son', 'está', 'estoy', 'puedo',
      'voy', 'va', 'qué', 'cómo', 'cuándo', 'dónde', 'quién', 'por qué',
    ];

    const words = question
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Eliminar puntuación
      .split(/\s+/)
      .filter((word) => word.length > 2) // Palabras de al menos 3 letras
      .filter((word) => !stopwords.includes(word)); // Eliminar stopwords

    return [...new Set(words)]; // Eliminar duplicados
  }

  /**
   * Calculate match score between question keywords and response keywords
   *
   * @param questionKeywords - Keywords de la pregunta
   * @param responseKeywords - Keywords de la respuesta
   * @returns Score de 0 a N (número de coincidencias)
   */
  private calculateMatchScore(questionKeywords: string[], responseKeywords: string[]): number {
    let score = 0;

    for (const qKeyword of questionKeywords) {
      for (const rKeyword of responseKeywords) {
        // Match exacto
        if (qKeyword === rKeyword) {
          score += 2;
        }
        // Match parcial (contiene)
        else if (qKeyword.includes(rKeyword) || rKeyword.includes(qKeyword)) {
          score += 1;
        }
      }
    }

    return score;
  }

  /**
   * Get a generic response when no specific match is found
   *
   * @param personality - Personalidad deseada
   * @param language - Idioma
   * @returns Respuesta genérica
   */
  private getGenericResponse(personality: string, language: string): string {
    const responses = {
      es: {
        wise: 'Los espíritus observan tu pregunta con atención. La respuesta se revelará cuando el momento sea propicio.',
        cryptic: 'Las sombras murmuran secretos que aún no puedo descifrar. Vuelve a preguntar cuando la luna esté más alta.',
        dark: 'La oscuridad no revela sus secretos tan fácilmente. Tendrás que buscar más profundo en tu alma.',
        playful: '¡Oh! Parece que los espíritus están jugando al escondite. Intenta con otra pregunta más específica.',
      },
      en: {
        wise: 'The spirits observe your question with attention. The answer will be revealed when the time is right.',
        cryptic: 'Shadows whisper secrets I cannot yet decipher. Ask again when the moon is higher.',
        dark: 'Darkness does not reveal its secrets so easily. You must search deeper in your soul.',
        playful: 'Oh! It seems the spirits are playing hide and seek. Try a more specific question.',
      },
    };

    return responses[language]?.[personality] || responses['es']['wise'];
  }

  /**
   * Get response count statistics
   *
   * Útil para debugging y monitoreo.
   *
   * @returns Estadísticas de respuestas en base de datos
   */
  async getStats(): Promise<{
    total: number;
    byPersonality: Record<string, number>;
    byCategory: Record<string, number>;
    byLanguage: Record<string, number>;
  }> {
    const responses = await this.prisma.fallbackResponse.findMany();

    const stats = {
      total: responses.length,
      byPersonality: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byLanguage: {} as Record<string, number>,
    };

    for (const response of responses) {
      // Count by personality
      stats.byPersonality[response.personality] =
        (stats.byPersonality[response.personality] || 0) + 1;

      // Count by category
      stats.byCategory[response.category] =
        (stats.byCategory[response.category] || 0) + 1;

      // Count by language
      stats.byLanguage[response.language] =
        (stats.byLanguage[response.language] || 0) + 1;
    }

    return stats;
  }
}
