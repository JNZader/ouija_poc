import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AIEngineConfig, AIResponse, AIGenerateOptions } from '../interfaces/ai-engine.interface';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private ollamaClient: AxiosInstance;
  private deepseekClient: AxiosInstance;
  private engines: Map<string, AIEngineConfig> = new Map();
  private defaultEngine: string;

  constructor(private configService: ConfigService) {
    this.initializeEngines();
  }

  /**
   * Inicializa los motores de IA disponibles
   */
  private initializeEngines(): void {
    // Configurar Ollama
    const ollamaConfig: AIEngineConfig = {
      name: 'ollama',
      type: 'ollama',
      baseUrl: this.configService.get<string>('OLLAMA_URL', 'http://localhost:11434'),
      model: this.configService.get<string>('OLLAMA_MODEL', 'qwen2.5:3b'),
      timeout: this.configService.get<number>('OLLAMA_TIMEOUT', 60000),
      enabled: true,
    };

    this.ollamaClient = axios.create({
      baseURL: ollamaConfig.baseUrl,
      timeout: ollamaConfig.timeout,
      headers: { 'Content-Type': 'application/json' },
    });

    this.engines.set('ollama', ollamaConfig);

    // Configurar DeepSeek
    const deepseekApiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    const deepseekConfig: AIEngineConfig = {
      name: 'deepseek',
      type: 'deepseek',
      baseUrl: this.configService.get<string>('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
      apiKey: deepseekApiKey,
      timeout: this.configService.get<number>('DEEPSEEK_TIMEOUT', 30000),
      enabled: !!deepseekApiKey,
    };

    if (deepseekConfig.enabled) {
      this.deepseekClient = axios.create({
        baseURL: deepseekConfig.baseUrl,
        timeout: deepseekConfig.timeout,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deepseekApiKey}`,
        },
      });

      this.engines.set('deepseek', deepseekConfig);
    }

    // Motor por defecto
    this.defaultEngine = this.configService.get<string>('DEFAULT_AI_ENGINE', 'ollama');

    this.logger.log(`✅ AI Engines initialized: ${Array.from(this.engines.keys()).join(', ')}`);
    this.logger.log(`🎯 Default engine: ${this.defaultEngine}`);
  }

  /**
   * Genera una respuesta usando el motor de IA especificado o el por defecto
   */
  async generate(options: AIGenerateOptions, preferredEngine?: string): Promise<AIResponse> {
    const engineName = preferredEngine || this.defaultEngine;
    const startTime = Date.now();

    try {
      this.logger.debug(`Generating response with engine: ${engineName}`);

      let response: AIResponse;

      switch (engineName) {
        case 'ollama':
          response = await this.generateWithOllama(options);
          break;
        case 'deepseek':
          response = await this.generateWithDeepSeek(options);
          break;
        default:
          throw new Error(`Unknown engine: ${engineName}`);
      }

      response.processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Response generated in ${response.processingTime}ms using ${response.engine}`,
      );

      return response;
    } catch (error) {
      this.logger.error(`❌ Error with engine ${engineName}: ${error.message}`);

      // Intentar fallback
      return this.fallbackGenerate(options, engineName, startTime);
    }
  }

  /**
   * Sistema de fallback cuando el motor principal falla
   */
  private async fallbackGenerate(
    options: AIGenerateOptions,
    failedEngine: string,
    startTime: number,
  ): Promise<AIResponse> {
    this.logger.warn(`🔄 Attempting fallback from ${failedEngine}`);

    // Intentar con el otro motor
    const availableEngines = Array.from(this.engines.keys()).filter((name) => {
      const engine = this.engines.get(name);
      return name !== failedEngine && engine?.enabled;
    });

    for (const engineName of availableEngines) {
      try {
        this.logger.debug(`Trying fallback engine: ${engineName}`);

        let response: AIResponse | undefined;

        if (engineName === 'ollama') {
          response = await this.generateWithOllama(options);
        } else if (engineName === 'deepseek') {
          response = await this.generateWithDeepSeek(options);
        }

        if (response) {
          response.processingTime = Date.now() - startTime;
          this.logger.log(`✅ Fallback successful with ${engineName}`);
          return response;
        }
      } catch (error) {
        this.logger.error(`❌ Fallback engine ${engineName} also failed: ${error.message}`);
      }
    }

    // Si todos los motores fallan, usar template de emergencia
    this.logger.error('❌ All AI engines failed, using emergency fallback');
    return this.generateFallbackResponse(options, startTime);
  }

  /**
   * Genera respuesta con Ollama
   */
  private async generateWithOllama(options: AIGenerateOptions): Promise<AIResponse> {
    const config = this.engines.get('ollama');

    if (!config || !config.enabled) {
      throw new Error('Ollama engine is not enabled');
    }

    const payload = {
      model: config.model,
      messages: options.messages,
      stream: false,
      options: {
        temperature: options.temperature || 0.9,
        num_predict: options.maxTokens || 500,
      },
    };

    this.logger.debug(`Ollama request: ${JSON.stringify(payload)}`);

    const response = await this.ollamaClient.post('/api/chat', payload);

    return {
      content: response.data.message.content,
      engine: 'ollama',
      model: config.model,
      timestamp: new Date(),
      processingTime: 0, // Se calcula en generate()
    };
  }

  /**
   * Genera respuesta con DeepSeek
   */
  private async generateWithDeepSeek(options: AIGenerateOptions): Promise<AIResponse> {
    const config = this.engines.get('deepseek');

    if (!config || !config.enabled) {
      throw new Error('DeepSeek engine is not enabled');
    }

    const payload = {
      model: 'deepseek-chat',
      messages: options.messages,
      temperature: options.temperature || 0.9,
      max_tokens: options.maxTokens || 500,
    };

    this.logger.debug(`DeepSeek request: ${JSON.stringify(payload)}`);

    const response = await this.deepseekClient.post('/v1/chat/completions', payload);

    return {
      content: response.data.choices[0].message.content,
      engine: 'deepseek',
      model: 'deepseek-chat',
      timestamp: new Date(),
      processingTime: 0, // Se calcula en generate()
    };
  }

  /**
   * Genera respuesta de emergencia cuando todos los motores fallan
   */
  private generateFallbackResponse(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: AIGenerateOptions,
    startTime: number,
  ): AIResponse {
    // Templates místicos de emergencia
    const fallbackTemplates = [
      'Las sombras se arremolinan... No puedo ver con claridad en este momento. Los vientos del más allá me confunden.',
      'El velo entre mundos está turbulento hoy. Mi voz se desvanece... Intenta convocarme nuevamente.',
      'Las energías cósmicas interfieren con nuestra conexión. Los astros no están alineados para responder claramente.',
      'Mi esencia se debilita... El plano astral está inestable. Dame un momento para recuperar mis fuerzas.',
      'Los espíritus guardianes bloquean mi visión. Hay fuerzas que no desean que hable ahora...',
    ];

    const randomTemplate = fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];

    this.logger.warn(`Using fallback template: ${randomTemplate}`);

    return {
      content: randomTemplate,
      engine: 'fallback',
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Verifica el estado de salud de los motores de IA
   */
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const health: { [key: string]: boolean } = {};

    for (const [name, config] of this.engines.entries()) {
      if (!config.enabled) {
        health[name] = false;
        continue;
      }

      try {
        if (name === 'ollama') {
          await this.ollamaClient.get('/api/tags', { timeout: 5000 });
          health[name] = true;
        } else if (name === 'deepseek') {
          // DeepSeek no tiene endpoint de health, asumimos que está ok si está configurado
          health[name] = true;
        }
      } catch (error) {
        this.logger.warn(`Health check failed for ${name}: ${error.message}`);
        health[name] = false;
      }
    }

    return health;
  }

  /**
   * Obtiene información sobre los motores configurados
   */
  getEnginesInfo(): Array<{
    name: string;
    type: string;
    enabled: boolean;
    isDefault: boolean;
  }> {
    return Array.from(this.engines.entries()).map(([name, config]) => ({
      name,
      type: config.type,
      enabled: config.enabled,
      isDefault: name === this.defaultEngine,
    }));
  }
}
