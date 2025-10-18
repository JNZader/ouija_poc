import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * OllamaService - Servicio para interactuar con Ollama (IA local)
 *
 * Ollama es un servicio de IA que corre localmente en Docker.
 * Este servicio se conecta a la API de Ollama para generar respuestas místicas.
 *
 * Características:
 * - Timeout de 30 segundos para evitar bloqueos
 * - Health check para verificar disponibilidad
 * - Manejo de errores robusto
 * - Logging detallado para debugging
 *
 * Variables de entorno necesarias:
 * - OLLAMA_URL: URL del servicio Ollama (default: http://localhost:11434)
 * - OLLAMA_MODEL: Modelo a utilizar (default: qwen2.5:0.5b)
 *
 * @see https://ollama.ai/
 * @see IT2-002 en guia-desarrollo-incremental-backend/iteracion-2/TAREAS.md
 */
@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly ollamaUrl: string;
  private readonly model: string;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';

    this.logger.log(`🤖 Ollama service initialized`);
    this.logger.log(`   URL: ${this.ollamaUrl}`);
    this.logger.log(`   Model: ${this.model}`);
  }

  /**
   * Generate a response using Ollama
   *
   * @param prompt - El prompt a enviar a Ollama
   * @returns Respuesta generada por Ollama
   * @throws Error si Ollama no está disponible o falla la generación
   */
  async generate(prompt: string): Promise<string> {
    const startTime = Date.now();

    try {
      this.logger.log(`🤖 Calling Ollama (${this.model})...`);

      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.model,
          prompt,
          stream: false, // Deshabilitamos streaming para simplificar
        },
        {
          timeout: 30000, // 30 seconds timeout
        },
      );

      const generatedText = response.data.response.trim();
      const elapsed = Date.now() - startTime;

      this.logger.log(`✅ Ollama response generated in ${elapsed}ms`);

      return generatedText;
    } catch (error) {
      const elapsed = Date.now() - startTime;

      if (error.code === 'ECONNREFUSED') {
        this.logger.error(`❌ Ollama connection refused after ${elapsed}ms - Is Ollama running?`);
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.error(`❌ Ollama timeout after ${elapsed}ms`);
      } else {
        this.logger.error(`❌ Ollama generation failed after ${elapsed}ms: ${error.message}`);
      }

      throw new Error('Ollama service unavailable');
    }
  }

  /**
   * Check if Ollama is available
   *
   * Hace una petición simple al endpoint /api/tags para verificar
   * que Ollama esté corriendo y respondiendo.
   *
   * @returns true si Ollama está disponible, false en caso contrario
   */
  async healthCheck(): Promise<boolean> {
    try {
      await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      this.logger.log(`✅ Ollama health check passed`);
      return true;
    } catch (error) {
      this.logger.warn(`⚠️ Ollama health check failed: ${error.message}`);
      return false;
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
   * Get Ollama URL
   *
   * @returns URL del servicio Ollama
   */
  getUrl(): string {
    return this.ollamaUrl;
  }
}
