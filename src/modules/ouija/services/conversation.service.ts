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
    sessionId: number,
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
  private async getSessionHistory(
    sessionId: number,
    limit: number = 10,
  ): Promise<Array<{ role: string; content: string }>> {
    const messages = await this.prisma.sessionMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
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
  private formatSpiritResponse(
    rawResponse: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    personality: SpiritPersonality,
  ): string {
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
  async generateFarewellMessage(
    spiritPersonality: SpiritPersonality,
    spiritName: string,
  ): Promise<string> {
    const farewellMessages = {
      wise: `Que la paz te acompañe en tu camino, hijo mío. ${spiritName} regresa al silencio. Hasta que nos volvamos a encontrar...`,
      cryptic: `El círculo se cierra. ${spiritName} se desvanece en el enigma. Las respuestas que buscas ahora residen en ti.`,
      dark: `${spiritName} retorna a las sombras. Recuerda mis palabras cuando la oscuridad te alcance...`,
      playful: `¡El telón cae! ${spiritName} se despide con una reverencia. Fue un placer jugar contigo, querido mortal.`,
    };

    return farewellMessages[spiritPersonality] || `Hasta pronto, mortal. ${spiritName} se retira.`;
  }
}
