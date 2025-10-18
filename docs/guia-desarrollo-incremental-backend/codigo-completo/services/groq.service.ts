import { Injectable, Logger } from '@nestjs/common';

/**
 * Interfaces para la API de Groq
 */
interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * GroqService - Servicio para interactuar con Groq Cloud API
 *
 * Groq es una API de IA en la nube ultra-rápida (10x más rápida que Ollama).
 * Este servicio se utiliza como fallback primario cuando Ollama no está disponible.
 *
 * Características:
 * - Respuestas extremadamente rápidas (~500ms vs ~5000ms de Ollama)
 * - API compatible con OpenAI
 * - Rate limiting incorporado
 * - Manejo de errores robusto
 *
 * Variables de entorno necesarias:
 * - GROQ_API_KEY: API key de Groq (obtener en https://console.groq.com/keys)
 * - GROQ_MODEL: Modelo a utilizar (default: llama-3.1-8b-instant)
 *
 * Limitaciones del free tier:
 * - 30 requests por minuto
 * - 6000 tokens por minuto
 *
 * @see https://console.groq.com/docs
 * @see IT3-001 en guia-desarrollo-incremental-backend/iteracion-3/TAREAS.md
 */
@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    if (!this.apiKey) {
      this.logger.warn('⚠️ GROQ_API_KEY not configured. Groq fallback will not work.');
      this.logger.warn('   Get your API key at: https://console.groq.com/keys');
    } else {
      this.logger.log(`✅ Groq service initialized with model: ${this.model}`);
      this.logger.log(`   API Key configured: ${this.apiKey.substring(0, 10)}...`);
    }
  }

  /**
   * Check if Groq is available
   *
   * Verifica si hay una API key configurada.
   * No hace una petición real para no consumir rate limit.
   *
   * @returns true si hay API key configurada, false en caso contrario
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate response using Groq API
   *
   * Envía un prompt a Groq y retorna la respuesta generada.
   *
   * Configuración:
   * - temperature: 0.8 (balance entre creatividad y coherencia)
   * - max_tokens: 150 (respuestas concisas)
   *
   * @param prompt - El prompt a enviar a Groq
   * @returns Respuesta generada por Groq
   * @throws Error si no hay API key o si falla la petición
   */
  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    const startTime = Date.now();

    try {
      const request: GroqRequest = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8, // Balance entre creatividad y coherencia
        max_tokens: 150,  // Respuestas concisas
      };

      this.logger.log(`🚀 Calling Groq API (${this.model})...`);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();

        // Manejo específico de errores comunes
        if (response.status === 429) {
          this.logger.error(`❌ Groq rate limit exceeded`);
          throw new Error('Groq rate limit exceeded');
        } else if (response.status === 401) {
          this.logger.error(`❌ Groq authentication failed - Invalid API key`);
          throw new Error('Groq authentication failed');
        } else {
          this.logger.error(`❌ Groq API error (${response.status}): ${error}`);
          throw new Error(`Groq API error (${response.status}): ${error}`);
        }
      }

      const data: GroqResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Groq API');
      }

      const generatedText = data.choices[0].message.content.trim();
      const elapsed = Date.now() - startTime;

      // Log de tokens utilizados (útil para monitoreo)
      if (data.usage) {
        this.logger.log(`   Tokens: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
      }

      this.logger.log(`✅ Groq response generated in ${elapsed}ms`);

      return generatedText;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      this.logger.error(`❌ Groq generation failed after ${elapsed}ms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current model name
   *
   * @returns Nombre del modelo configurado
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get available models (for reference)
   *
   * Modelos recomendados:
   * - llama-3.1-8b-instant (rápido, balanceado)
   * - llama-3.1-70b-versatile (más potente, más lento)
   * - mixtral-8x7b-32768 (contexto largo)
   *
   * @returns Lista de modelos populares
   */
  getAvailableModels(): string[] {
    return [
      'llama-3.1-8b-instant',
      'llama-3.1-70b-versatile',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ];
  }
}
