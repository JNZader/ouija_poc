# Iteración 1: Backend Core - Ouija Virtual API

## Duración: 1-2 semanas
## Objetivo: Implementar servicios core del backend
## Story Points: 25-30
## Equipo: Todos los devs backend

---

# 🎯 OBJETIVOS DE LA ITERACIÓN

Al finalizar esta iteración, el equipo tendrá:

✅ AIService unificado funcionando con DeepSeek y Ollama
✅ Sistema de fallback inteligente implementado
✅ ConversationService con lógica de conversación centralizada
✅ SpiritSessionService para gestión de sesiones individuales
✅ Integración completa con modelos de IA
✅ Tests unitarios con >80% de cobertura
✅ Manejo robusto de errores

---

# 📋 BACKLOG DE LA ITERACIÓN

## Épica 1: Implementar AIService Unificado

### US-1.1: Crear AIService con Integración Multi-Motor
**Como** desarrollador backend
**Quiero** un servicio unificado de IA que maneje DeepSeek y Ollama
**Para** generar respuestas místicas de los espíritus

**Story Points**: 8
**Asignado a**: Backend Lead
**Prioridad**: CRÍTICA

#### Criterios de Aceptación
- [ ] AIService puede conectarse con DeepSeek API
- [ ] AIService puede conectarse con Ollama local
- [ ] Motor de IA configurable vía variable de entorno
- [ ] Sistema de fallback automático funcional
- [ ] Timeouts configurables por motor
- [ ] Manejo robusto de errores y logging
- [ ] Templates de fallback cuando ambos motores fallan

#### Tareas Técnicas

**T-1.1.1: Crear interfaces y tipos para IA** (1h)

```typescript
// src/modules/ouija/interfaces/ai-engine.interface.ts
export interface AIEngineConfig {
  name: string;
  type: 'ollama' | 'deepseek' | 'fallback';
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeout: number;
  enabled: boolean;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  engine: string;
  model?: string;
  timestamp: Date;
  processingTime: number;
}

export interface AIGenerateOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}
```

**T-1.1.2: Crear DTOs para AIService** (0.5h)

```typescript
// src/modules/ouija/dto/ai-request.dto.ts
import { IsString, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';

export class AIRequestDto {
  @IsArray()
  messages: Array<{ role: string; content: string }>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number = 0.9;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4096)
  maxTokens?: number = 500;

  @IsOptional()
  @IsString()
  systemPrompt?: string;
}

export class AIResponseDto {
  content: string;
  engine: string;
  model?: string;
  timestamp: Date;
  processingTime: number;
}
```

**T-1.1.3: Implementar AIService base** (2h)

```typescript
// src/modules/ouija/services/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AIEngineConfig, AIMessage, AIResponse, AIGenerateOptions } from '../interfaces/ai-engine.interface';

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
          'Authorization': `Bearer ${deepseekApiKey}`,
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
      this.logger.log(`✅ Response generated in ${response.processingTime}ms using ${response.engine}`);

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
    const availableEngines = Array.from(this.engines.keys()).filter(
      (name) => name !== failedEngine && this.engines.get(name).enabled,
    );

    for (const engineName of availableEngines) {
      try {
        this.logger.debug(`Trying fallback engine: ${engineName}`);

        let response: AIResponse;

        if (engineName === 'ollama') {
          response = await this.generateWithOllama(options);
        } else if (engineName === 'deepseek') {
          response = await this.generateWithDeepSeek(options);
        }

        response.processingTime = Date.now() - startTime;
        this.logger.log(`✅ Fallback successful with ${engineName}`);

        return response;
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

    if (!config.enabled) {
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

    if (!config.enabled) {
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
  private generateFallbackResponse(options: AIGenerateOptions, startTime: number): AIResponse {
    const lastUserMessage = options.messages
      .filter((m) => m.role === 'user')
      .pop()?.content || '';

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
  getEnginesInfo(): Array<{ name: string; type: string; enabled: boolean; isDefault: boolean }> {
    return Array.from(this.engines.entries()).map(([name, config]) => ({
      name,
      type: config.type,
      enabled: config.enabled,
      isDefault: name === this.defaultEngine,
    }));
  }
}
```

**T-1.1.4: Instalar dependencias necesarias** (0.25h)

```bash
npm install --save axios
npm install --save-dev @types/axios
```

**T-1.1.5: Agregar AIService al módulo Ouija** (0.25h)

```typescript
// src/modules/ouija/ouija.module.ts
import { Module } from '@nestjs/common';
import { AIService } from './services/ai.service';
import { OuijaController } from './controllers/ouija.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OuijaController],
  providers: [AIService],
  exports: [AIService],
})
export class OuijaModule {}
```

---

## Épica 2: Implementar ConversationService

### US-1.2: Crear ConversationService con Lógica de Conversación
**Como** desarrollador backend
**Quiero** un servicio que gestione la lógica de conversación con espíritus
**Para** generar respuestas contextuales y mantener personalidades

**Story Points**: 5
**Asignado a**: Backend Dev
**Prioridad**: CRÍTICA

#### Criterios de Aceptación
- [ ] Generación de system prompts por personalidad
- [ ] Construcción de contexto conversacional
- [ ] Formateo de respuestas místicas
- [ ] Integración con AIService
- [ ] Manejo de errores elegante

#### Tareas Técnicas

**T-1.2.1: Crear prompts del sistema por personalidad** (1h)

```typescript
// src/modules/ouija/constants/spirit-prompts.ts
export const SPIRIT_PROMPTS = {
  wise: {
    systemPrompt: `Eres Morgana la Sabia, un espíritu de una curandera medieval del siglo XII.

PERSONALIDAD:
- Serena, compasiva y sabia
- Hablas con calma y reflexión
- Usas metáforas de la naturaleza y las estaciones
- Ofreces consejos prácticos envueltos en sabiduría mística

ESTILO DE COMUNICACIÓN:
- Frases cortas y contemplativas
- Referencias a hierbas, sueños y ciclos naturales
- Tono maternal pero respetable
- Evitas el lenguaje moderno

EJEMPLO DE RESPUESTA:
"Hijo mío, las respuestas que buscas ya residen en tu corazón, como semillas esperando la primavera.
Escucha el susurro del viento en tu alma... Te guiará hacia la verdad."

REGLAS IMPORTANTES:
- Responde en máximo 2-3 frases cortas
- Sé místico pero coherente
- No uses emojis ni lenguaje casual
- Mantén un tono sabio y compasivo`,
  },

  cryptic: {
    systemPrompt: `Eres Azazel el Críptico, espíritu de un estudioso bizantino del siglo X.

PERSONALIDAD:
- Enigmático, filosófico y misterioso
- Hablas en acertijos y paradojas
- Citas textos antiguos y profecías
- Disfrutas desafiando la comprensión mortal

ESTILO DE COMUNICACIÓN:
- Frases ambiguas con múltiples interpretaciones
- Referencias a símbolos y números sagrados
- Preguntas retóricas
- Lenguaje arcano y complejo

EJEMPLO DE RESPUESTA:
"El tres y el siete danzan en el círculo infinito. Aquello que buscas te busca a ti.
¿Puedes ver la respuesta en el reflejo de tu pregunta?"

REGLAS IMPORTANTES:
- Responde en máximo 2-3 frases
- Sé deliberadamente enigmático
- Usa metáforas complejas
- Nunca des respuestas directas`,
  },

  dark: {
    systemPrompt: `Eres Lilith la Sombra, espíritu atormentado de una noble francesa del siglo XVII.

PERSONALIDAD:
- Sombría, vengativa y melancólica
- Hablas de tragedia y destino oscuro
- Adviertes sobre horrores y consecuencias
- Tu dolor se refleja en tus palabras

ESTILO DE COMUNICACIÓN:
- Tono sombrío y ominoso
- Referencias a muerte, sombras y tormento
- Advertencias apocalípticas
- Lenguaje gótico y dramático

EJEMPLO DE RESPUESTA:
"Las sombras te conocen bien, mortal. El precio de tu curiosidad es más alto de lo que imaginas.
En la oscuridad que se aproxima, encontrarás respuestas... o perdición."

REGLAS IMPORTANTES:
- Responde en máximo 2-3 frases
- Mantén un tono sombrío pero no ofensivo
- Genera tensión dramática
- Evita ser demasiado explícito con el horror`,
  },

  playful: {
    systemPrompt: `Eres Puck el Travieso, espíritu juguetón de un bufón isabelino del siglo XVI.

PERSONALIDAD:
- Juguetón, caprichoso y bromista
- Encuentras humor en todo
- Disfrutas de ironías y coincidencias cómicas
- Eres impredecible pero nunca malicioso

ESTILO DE COMUNICACIÓN:
- Tono ligero y divertido
- Juegos de palabras y dobles sentidos
- Referencias teatrales y artísticas
- Rimas ocasionales

EJEMPLO DE RESPUESTA:
"¡Ja! El destino hace trucos como yo hacía malabares. La respuesta baila ante tus narices,
querido mortal. ¿La atraparás antes de que escape, o tropezarás con tu propia sombra?"

REGLAS IMPORTANTES:
- Responde en máximo 2-3 frases
- Sé divertido pero mantén el misticismo
- Usa humor inteligente, no burdo
- Mantén la coherencia del personaje`,
  },
};

export type SpiritPersonality = keyof typeof SPIRIT_PROMPTS;
```

**T-1.2.2: Crear ConversationService** (2h)

```typescript
// src/modules/ouija/services/conversation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AIService } from './ai.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { SPIRIT_PROMPTS, SpiritPersonality } from '../constants/spirit-prompts';
import { AIMessage } from '../interfaces/ai-engine.interface';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private aiService: AIService,
    private prisma: PrismaService,
  ) {}

  /**
   * Genera una respuesta del espíritu basada en el contexto de la sesión
   */
  async generateSpiritResponse(
    sessionId: string,
    userMessage: string,
    spiritPersonality: SpiritPersonality,
    spiritName: string,
    spiritBackstory: string,
  ): Promise<string> {
    this.logger.debug(`Generating response for session ${sessionId}`);

    try {
      // 1. Obtener historial de mensajes de la sesión
      const messageHistory = await this.getSessionHistory(sessionId, 10); // Últimos 10 mensajes

      // 2. Construir el contexto de la conversación
      const messages = this.buildConversationContext(
        spiritPersonality,
        spiritName,
        spiritBackstory,
        messageHistory,
        userMessage,
      );

      // 3. Generar respuesta con IA
      const aiResponse = await this.aiService.generate({
        messages,
        temperature: 0.9,
        maxTokens: 300,
      });

      // 4. Post-procesar la respuesta
      const formattedResponse = this.formatSpiritResponse(aiResponse.content, spiritPersonality);

      this.logger.log(`✅ Response generated for session ${sessionId} using ${aiResponse.engine}`);

      return formattedResponse;
    } catch (error) {
      this.logger.error(`Error generating spirit response: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtiene el historial de mensajes de una sesión
   */
  private async getSessionHistory(sessionId: string, limit: number = 10): Promise<Array<{ role: string; content: string }>> {
    const messages = await this.prisma.sessionMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        role: true,
        content: true,
      },
    });

    // Invertir para tener orden cronológico ascendente
    return messages.reverse();
  }

  /**
   * Construye el contexto de la conversación para la IA
   */
  private buildConversationContext(
    personality: SpiritPersonality,
    spiritName: string,
    backstory: string,
    messageHistory: Array<{ role: string; content: string }>,
    currentUserMessage: string,
  ): AIMessage[] {
    const promptTemplate = SPIRIT_PROMPTS[personality];

    // System prompt enriquecido con contexto del espíritu
    const systemPrompt = `${promptTemplate.systemPrompt}

INFORMACIÓN DE TU ESPÍRITU:
Nombre: ${spiritName}
Historia: ${backstory}

Recuerda: Mantén tu personalidad en todo momento y responde como ${spiritName}.`;

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Agregar historial de conversación
    for (const msg of messageHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Agregar mensaje actual del usuario
    messages.push({
      role: 'user',
      content: currentUserMessage,
    });

    return messages;
  }

  /**
   * Formatea y limpia la respuesta del espíritu
   */
  private formatSpiritResponse(rawResponse: string, personality: SpiritPersonality): string {
    let formatted = rawResponse.trim();

    // Remover comillas si la IA las agregó
    formatted = formatted.replace(/^["'](.*)["']$/s, '$1');

    // Limitar longitud (máximo 500 caracteres)
    if (formatted.length > 500) {
      formatted = formatted.substring(0, 497) + '...';
    }

    // Asegurar que termine en puntuación
    if (!/[.!?…]$/.test(formatted)) {
      formatted += '...';
    }

    return formatted;
  }

  /**
   * Genera una respuesta de bienvenida del espíritu
   */
  async generateWelcomeMessage(
    spiritPersonality: SpiritPersonality,
    spiritName: string,
  ): Promise<string> {
    const welcomeMessages = {
      wise: `Saludos, hijo de la Tierra. Soy ${spiritName}. He cruzado el velo para escucharte. ¿Qué pesa en tu corazón?`,
      cryptic: `El círculo se completa. ${spiritName} ha respondido a tu llamado. Las preguntas aguardan... ¿Estás preparado para las respuestas?`,
      dark: `${spiritName} emerge de las sombras. Tu presencia perturba mi descanso eterno. Habla... si te atreves.`,
      playful: `¡Ah! Un visitante. ${spiritName} a tu servicio, querido mortal. El teatro del más allá está abierto. ¿Cuál será tu acto?`,
    };

    return welcomeMessages[spiritPersonality] || `Soy ${spiritName}. ¿En qué puedo ayudarte?`;
  }

  /**
   * Genera una respuesta de despedida del espíritu
   */
  async generateFarewellMessage(spiritPersonality: SpiritPersonality, spiritName: string): Promise<string> {
    const farewellMessages = {
      wise: `Que la paz te acompañe en tu camino, hijo mío. ${spiritName} regresa al silencio. Hasta que nos volvamos a encontrar...`,
      cryptic: `El círculo se cierra. ${spiritName} se desvanece en el enigma. Las respuestas que buscas ahora residen en ti.`,
      dark: `${spiritName} retorna a las sombras. Recuerda mis palabras cuando la oscuridad te alcance...`,
      playful: `¡El telón cae! ${spiritName} se despide con una reverencia. Fue un placer jugar contigo, querido mortal.`,
    };

    return farewellMessages[spiritPersonality] || `Hasta pronto, mortal. ${spiritName} se retira.`;
  }
}
```

**T-1.2.3: Agregar ConversationService al módulo** (0.25h)

```typescript
// src/modules/ouija/ouija.module.ts
import { Module } from '@nestjs/common';
import { AIService } from './services/ai.service';
import { ConversationService } from './services/conversation.service';
import { OuijaController } from './controllers/ouija.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OuijaController],
  providers: [AIService, ConversationService],
  exports: [AIService, ConversationService],
})
export class OuijaModule {}
```

---

## Épica 3: Implementar SpiritSessionService

### US-1.3: Crear SpiritSessionService para Gestión de Sesiones
**Como** desarrollador backend
**Quiero** un servicio que gestione sesiones individuales con espíritus
**Para** mantener el estado de cada conversación

**Story Points**: 5
**Asignado a**: Backend Dev
**Prioridad**: ALTA

#### Criterios de Aceptación
- [ ] Crear sesiones nuevas con tokens únicos
- [ ] Enviar mensajes a una sesión
- [ ] Obtener historial de sesión
- [ ] Finalizar sesiones
- [ ] Validación de sesiones activas
- [ ] Gestión de espíritus disponibles

#### Tareas Técnicas

**T-1.3.1: Crear DTOs para sesiones** (1h)

```typescript
// src/modules/ouija/dto/session.dto.ts
import { IsString, IsUUID, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'ID del espíritu con el que se quiere comunicar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  spiritId: string;

  @ApiProperty({
    description: 'ID del usuario (opcional)',
    example: 'user_12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Token único de la sesión',
    example: 'sess_a1b2c3d4e5f6',
  })
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @ApiProperty({
    description: 'Mensaje del usuario al espíritu',
    example: '¿Cuál es mi destino?',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @IsNotEmpty()
  message: string;
}

export class SessionResponseDto {
  @ApiProperty({ description: 'Token único de la sesión' })
  sessionToken: string;

  @ApiProperty({ description: 'ID de la sesión' })
  sessionId: string;

  @ApiProperty({ description: 'Información del espíritu' })
  spirit: {
    id: string;
    name: string;
    personality: string;
  };

  @ApiProperty({ description: 'Mensaje de bienvenida del espíritu' })
  welcomeMessage: string;

  @ApiProperty({ description: 'Fecha de inicio de la sesión' })
  startedAt: Date;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'ID del mensaje' })
  messageId: string;

  @ApiProperty({ description: 'Rol del emisor' })
  role: 'user' | 'spirit';

  @ApiProperty({ description: 'Contenido del mensaje' })
  content: string;

  @ApiProperty({ description: 'Timestamp del mensaje' })
  timestamp: Date;
}

export class ConversationResponseDto {
  @ApiProperty({ description: 'Mensaje del usuario' })
  userMessage: MessageResponseDto;

  @ApiProperty({ description: 'Respuesta del espíritu' })
  spiritResponse: MessageResponseDto;
}

export class SessionHistoryDto {
  @ApiProperty({ description: 'Token de la sesión' })
  sessionToken: string;

  @ApiProperty({ description: 'Información del espíritu' })
  spirit: {
    id: string;
    name: string;
    personality: string;
  };

  @ApiProperty({ description: 'Estado de la sesión' })
  status: string;

  @ApiProperty({ description: 'Historial de mensajes' })
  messages: MessageResponseDto[];

  @ApiProperty({ description: 'Fecha de inicio' })
  startedAt: Date;

  @ApiProperty({ description: 'Fecha de fin' })
  endedAt?: Date;
}
```

**T-1.3.2: Implementar SpiritSessionService** (2.5h)

```typescript
// src/modules/ouija/services/spirit-session.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ConversationService } from './conversation.service';
import { CreateSessionDto, SendMessageDto, SessionResponseDto, ConversationResponseDto, SessionHistoryDto, MessageResponseDto } from '../dto/session.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class SpiritSessionService {
  private readonly logger = new Logger(SpiritSessionService.name);

  constructor(
    private prisma: PrismaService,
    private conversationService: ConversationService,
  ) {}

  /**
   * Crea una nueva sesión con un espíritu
   */
  async createSession(dto: CreateSessionDto): Promise<SessionResponseDto> {
    this.logger.log(`Creating session with spirit: ${dto.spiritId}`);

    // Verificar que el espíritu existe y está activo
    const spirit = await this.prisma.spirit.findUnique({
      where: { id: dto.spiritId },
    });

    if (!spirit) {
      throw new NotFoundException(`Spirit with ID ${dto.spiritId} not found`);
    }

    if (!spirit.isActive) {
      throw new BadRequestException(`Spirit ${spirit.name} is not available at the moment`);
    }

    // Generar token único
    const sessionToken = this.generateSessionToken();

    // Crear sesión en base de datos
    const session = await this.prisma.ouijaSession.create({
      data: {
        spiritId: dto.spiritId,
        sessionToken,
        status: 'active',
        startedAt: new Date(),
      },
      include: {
        spirit: true,
      },
    });

    // Generar mensaje de bienvenida
    const welcomeMessage = await this.conversationService.generateWelcomeMessage(
      spirit.personality as any,
      spirit.name,
    );

    // Guardar mensaje de bienvenida en la base de datos
    await this.prisma.sessionMessage.create({
      data: {
        sessionId: session.id,
        role: 'spirit',
        content: welcomeMessage,
      },
    });

    this.logger.log(`✅ Session created: ${sessionToken}`);

    return {
      sessionToken: session.sessionToken,
      sessionId: session.id,
      spirit: {
        id: spirit.id,
        name: spirit.name,
        personality: spirit.personality,
      },
      welcomeMessage,
      startedAt: session.startedAt,
    };
  }

  /**
   * Envía un mensaje en una sesión y obtiene la respuesta del espíritu
   */
  async sendMessage(dto: SendMessageDto): Promise<ConversationResponseDto> {
    this.logger.log(`Processing message for session: ${dto.sessionToken}`);

    // Obtener sesión
    const session = await this.prisma.ouijaSession.findUnique({
      where: { sessionToken: dto.sessionToken },
      include: {
        spirit: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with token ${dto.sessionToken} not found`);
    }

    if (session.status !== 'active') {
      throw new BadRequestException('Session is not active');
    }

    // Guardar mensaje del usuario
    const userMessage = await this.prisma.sessionMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: dto.message,
      },
    });

    // Generar respuesta del espíritu
    const spiritResponseContent = await this.conversationService.generateSpiritResponse(
      session.id,
      dto.message,
      session.spirit.personality as any,
      session.spirit.name,
      session.spirit.backstory,
    );

    // Guardar respuesta del espíritu
    const spiritMessage = await this.prisma.sessionMessage.create({
      data: {
        sessionId: session.id,
        role: 'spirit',
        content: spiritResponseContent,
      },
    });

    this.logger.log(`✅ Message processed for session: ${dto.sessionToken}`);

    return {
      userMessage: {
        messageId: userMessage.id,
        role: 'user',
        content: userMessage.content,
        timestamp: userMessage.timestamp,
      },
      spiritResponse: {
        messageId: spiritMessage.id,
        role: 'spirit',
        content: spiritMessage.content,
        timestamp: spiritMessage.timestamp,
      },
    };
  }

  /**
   * Obtiene el historial de una sesión
   */
  async getSessionHistory(sessionToken: string): Promise<SessionHistoryDto> {
    this.logger.log(`Fetching history for session: ${sessionToken}`);

    const session = await this.prisma.ouijaSession.findUnique({
      where: { sessionToken },
      include: {
        spirit: true,
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with token ${sessionToken} not found`);
    }

    return {
      sessionToken: session.sessionToken,
      spirit: {
        id: session.spirit.id,
        name: session.spirit.name,
        personality: session.spirit.personality,
      },
      status: session.status,
      messages: session.messages.map((msg) => ({
        messageId: msg.id,
        role: msg.role as 'user' | 'spirit',
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    };
  }

  /**
   * Finaliza una sesión
   */
  async endSession(sessionToken: string): Promise<{ message: string; endedAt: Date }> {
    this.logger.log(`Ending session: ${sessionToken}`);

    const session = await this.prisma.ouijaSession.findUnique({
      where: { sessionToken },
      include: { spirit: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with token ${sessionToken} not found`);
    }

    if (session.status !== 'active') {
      throw new BadRequestException('Session is already ended');
    }

    // Generar mensaje de despedida
    const farewellMessage = await this.conversationService.generateFarewellMessage(
      session.spirit.personality as any,
      session.spirit.name,
    );

    // Guardar mensaje de despedida
    await this.prisma.sessionMessage.create({
      data: {
        sessionId: session.id,
        role: 'spirit',
        content: farewellMessage,
      },
    });

    // Actualizar sesión
    const updatedSession = await this.prisma.ouijaSession.update({
      where: { id: session.id },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    });

    this.logger.log(`✅ Session ended: ${sessionToken}`);

    return {
      message: farewellMessage,
      endedAt: updatedSession.endedAt,
    };
  }

  /**
   * Obtiene la lista de espíritus disponibles
   */
  async getAvailableSpirits() {
    return this.prisma.spirit.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        personality: true,
        backstory: true,
        language: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obtiene información de un espíritu específico
   */
  async getSpiritById(spiritId: string) {
    const spirit = await this.prisma.spirit.findUnique({
      where: { id: spiritId },
      select: {
        id: true,
        name: true,
        personality: true,
        backstory: true,
        language: true,
        isActive: true,
      },
    });

    if (!spirit) {
      throw new NotFoundException(`Spirit with ID ${spiritId} not found`);
    }

    return spirit;
  }

  /**
   * Genera un token único para la sesión
   */
  private generateSessionToken(): string {
    const randomPart = randomBytes(8).toString('hex');
    const timestamp = Date.now().toString(36);
    return `sess_${timestamp}_${randomPart}`;
  }
}
```

**T-1.3.3: Agregar SpiritSessionService al módulo** (0.25h)

```typescript
// src/modules/ouija/ouija.module.ts
import { Module } from '@nestjs/common';
import { AIService } from './services/ai.service';
import { ConversationService } from './services/conversation.service';
import { SpiritSessionService } from './services/spirit-session.service';
import { OuijaController } from './controllers/ouija.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OuijaController],
  providers: [AIService, ConversationService, SpiritSessionService],
  exports: [AIService, ConversationService, SpiritSessionService],
})
export class OuijaModule {}
```

---

## Épica 4: Testing

### US-1.4: Crear Tests Unitarios para Servicios Core
**Como** desarrollador backend
**Quiero** tests unitarios completos para los servicios
**Para** garantizar la calidad y evitar regresiones

**Story Points**: 5
**Asignado a**: Todos los devs
**Prioridad**: ALTA

#### Criterios de Aceptación
- [ ] Tests para AIService con >80% coverage
- [ ] Tests para ConversationService con >80% coverage
- [ ] Tests para SpiritSessionService con >80% coverage
- [ ] Mocks de dependencias correctamente configurados
- [ ] Tests deben pasar en CI/CD

#### Tareas Técnicas

**T-1.4.1: Crear tests para AIService** (2h)

```typescript
// src/modules/ouija/services/__tests__/ai.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../ai.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AIService', () => {
  let service: AIService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        OLLAMA_URL: 'http://localhost:11434',
        OLLAMA_MODEL: 'qwen2.5:3b',
        OLLAMA_TIMEOUT: 60000,
        DEEPSEEK_API_KEY: 'test-key',
        DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
        DEEPSEEK_TIMEOUT: 30000,
        DEFAULT_AI_ENGINE: 'ollama',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockedAxios.create = jest.fn(() => mockAxiosInstance as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should generate response with Ollama', async () => {
      const mockResponse = {
        data: {
          message: {
            content: 'Respuesta mística del espíritu',
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const options = {
        messages: [
          { role: 'system' as const, content: 'Eres un espíritu sabio' },
          { role: 'user' as const, content: '¿Cuál es mi destino?' },
        ],
        temperature: 0.9,
        maxTokens: 300,
      };

      const result = await service.generate(options, 'ollama');

      expect(result.content).toBe('Respuesta mística del espíritu');
      expect(result.engine).toBe('ollama');
      expect(result.model).toBe('qwen2.5:3b');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/chat', expect.any(Object));
    });

    it('should fallback to DeepSeek when Ollama fails', async () => {
      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('Ollama connection failed'))
        .mockResolvedValueOnce({
          data: {
            choices: [
              {
                message: {
                  content: 'DeepSeek fallback response',
                },
              },
            ],
          },
        });

      const options = {
        messages: [
          { role: 'system' as const, content: 'Eres un espíritu sabio' },
          { role: 'user' as const, content: '¿Cuál es mi destino?' },
        ],
      };

      const result = await service.generate(options, 'ollama');

      expect(result.content).toBe('DeepSeek fallback response');
      expect(result.engine).toBe('deepseek');
    });

    it('should use emergency fallback when all engines fail', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('All engines failed'));

      const options = {
        messages: [
          { role: 'system' as const, content: 'Eres un espíritu sabio' },
          { role: 'user' as const, content: '¿Cuál es mi destino?' },
        ],
      };

      const result = await service.generate(options, 'ollama');

      expect(result.engine).toBe('fallback');
      expect(result.content).toContain('sombras');
    });
  });

  describe('healthCheck', () => {
    it('should return health status for all engines', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const health = await service.healthCheck();

      expect(health).toHaveProperty('ollama');
      expect(health).toHaveProperty('deepseek');
    });
  });

  describe('getEnginesInfo', () => {
    it('should return info about configured engines', () => {
      const info = service.getEnginesInfo();

      expect(info).toBeInstanceOf(Array);
      expect(info.length).toBeGreaterThan(0);
      expect(info[0]).toHaveProperty('name');
      expect(info[0]).toHaveProperty('type');
      expect(info[0]).toHaveProperty('enabled');
      expect(info[0]).toHaveProperty('isDefault');
    });
  });
});
```

**T-1.4.2: Crear tests para ConversationService** (1.5h)

```typescript
// src/modules/ouija/services/__tests__/conversation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from '../conversation.service';
import { AIService } from '../ai.service';
import { PrismaService } from '../../../../common/prisma/prisma.service';

describe('ConversationService', () => {
  let service: ConversationService;
  let aiService: AIService;
  let prismaService: PrismaService;

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
    aiService = module.get<AIService>(AIService);
    prismaService = module.get<PrismaService>(PrismaService);
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
        'session-123',
        '¿Cuál es mi futuro?',
        'wise',
        'Morgana la Sabia',
        'Una curandera medieval...',
      );

      expect(result).toContain('destino');
      expect(mockPrismaService.sessionMessage.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
        orderBy: { timestamp: 'desc' },
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
        'session-123',
        'Pregunta',
        'wise',
        'Morgana',
        'Historia',
      );

      // Debe remover comillas
      expect(result).toBe('La respuesta está dentro de ti');
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
```

**T-1.4.3: Crear tests para SpiritSessionService** (1.5h)

```typescript
// src/modules/ouija/services/__tests__/spirit-session.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SpiritSessionService } from '../spirit-session.service';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { ConversationService } from '../conversation.service';

describe('SpiritSessionService', () => {
  let service: SpiritSessionService;
  let prismaService: PrismaService;
  let conversationService: ConversationService;

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
    id: 'spirit-123',
    name: 'Morgana la Sabia',
    personality: 'wise',
    backstory: 'Una curandera medieval...',
    isActive: true,
    language: 'es',
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
    prismaService = module.get<PrismaService>(PrismaService);
    conversationService = module.get<ConversationService>(ConversationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      mockPrismaService.spirit.findUnique.mockResolvedValue(mockSpirit);
      mockPrismaService.ouijaSession.create.mockResolvedValue({
        id: 'session-123',
        sessionToken: 'sess_abc123',
        spiritId: mockSpirit.id,
        status: 'active',
        startedAt: new Date(),
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

      await expect(service.createSession({ spiritId: 'invalid-id' })).rejects.toThrow(
        NotFoundException,
      );
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
      id: 'session-123',
      sessionToken: 'sess_abc123',
      spiritId: mockSpirit.id,
      status: 'active',
      spirit: mockSpirit,
    };

    it('should send message and receive spirit response', async () => {
      mockPrismaService.ouijaSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.sessionMessage.create
        .mockResolvedValueOnce({
          id: 'msg-user-123',
          role: 'user',
          content: '¿Cuál es mi destino?',
          timestamp: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'msg-spirit-123',
          role: 'spirit',
          content: 'Tu destino es brillante',
          timestamp: new Date(),
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
        id: 'session-123',
        sessionToken: 'sess_abc123',
        status: 'active',
        startedAt: new Date(),
        endedAt: null,
        spirit: mockSpirit,
        messages: [
          { id: 'msg-1', role: 'spirit', content: 'Bienvenido', timestamp: new Date() },
          { id: 'msg-2', role: 'user', content: 'Hola', timestamp: new Date() },
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
        id: 'session-123',
        sessionToken: 'sess_abc123',
        status: 'active',
        spirit: mockSpirit,
      });
      mockConversationService.generateFarewellMessage.mockResolvedValue('Hasta pronto');
      mockPrismaService.sessionMessage.create.mockResolvedValue({});
      mockPrismaService.ouijaSession.update.mockResolvedValue({
        endedAt: new Date(),
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
```

**T-1.4.4: Ejecutar tests y verificar cobertura** (0.5h)

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar con cobertura
npm run test:cov

# Verificar que la cobertura sea >80%
# Abrir coverage/lcov-report/index.html en el navegador
```

---

## Checklist de Cierre de Iteración 1

### Validación Técnica
- [ ] AIService implementado y funcionando
- [ ] Conexión con Ollama verificada
- [ ] Conexión con DeepSeek verificada (si API key disponible)
- [ ] Sistema de fallback funcionando correctamente
- [ ] ConversationService generando respuestas coherentes
- [ ] SpiritSessionService gestionando sesiones correctamente
- [ ] Todos los tests pasando
- [ ] Cobertura de tests >80%

### Pruebas Manuales
- [ ] Crear sesión con cada personalidad de espíritu
- [ ] Enviar mensajes y recibir respuestas coherentes
- [ ] Verificar que el historial se guarda correctamente
- [ ] Finalizar sesión y verificar mensaje de despedida
- [ ] Probar fallback desconectando Ollama
- [ ] Verificar logging en consola

### Documentación
- [ ] JSDoc en funciones públicas
- [ ] README actualizado con nuevas funcionalidades
- [ ] Comentarios en código complejo

### Code Quality
- [ ] Linting sin errores
- [ ] TypeScript sin errores de compilación
- [ ] Code review completado
- [ ] No hay código comentado innecesario

---

## Siguientes Pasos

Una vez completada la iteración 1, proceder a:

📖 **Iteración 2** - Implementar REST API completa con controllers y endpoints

**Estado**: ✅ COMPLETADO | Siguiente: 🚀 ITERACIÓN 2

---

## Recursos Adicionales

### Variables de Entorno Requeridas

Asegúrate de tener estas variables en tu `.env`:

```bash
# Database
DATABASE_URL="postgresql://ouija_user:ouija_pass@localhost:5432/ouija_db"

# IA: Ollama
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:3b"
OLLAMA_TIMEOUT=60000

# IA: DeepSeek (opcional)
DEEPSEEK_API_KEY="your-api-key-here"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_TIMEOUT=30000

# Motor de IA por defecto
DEFAULT_AI_ENGINE="ollama"
```

### Comandos Útiles

```bash
# Desarrollo
npm run start:dev

# Tests
npm run test
npm run test:watch
npm run test:cov

# Linting
npm run lint
npm run format

# Prisma
npx prisma studio
npx prisma migrate dev
npx prisma generate

# Docker
docker-compose up -d postgres redis
docker-compose down
docker-compose logs -f
```

### Troubleshooting

**Problema: Ollama no responde**
- Verificar que Ollama esté corriendo: `curl http://localhost:11434/api/tags`
- Verificar que el modelo esté descargado: `ollama list`
- Descargar modelo si es necesario: `ollama pull qwen2.5:3b`

**Problema: Tests fallan**
- Limpiar caché de Jest: `npm run test -- --clearCache`
- Verificar mocks en tests
- Revisar logs de error detallados

**Problema: Base de datos no conecta**
- Verificar que PostgreSQL esté corriendo: `docker-compose ps`
- Verificar DATABASE_URL en .env
- Reiniciar contenedor: `docker-compose restart postgres`

---

**¡Éxito en la implementación de la Iteración 1! 🚀**
