import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ConversationService } from './conversation.service';
import {
  CreateSessionDto,
  SendMessageDto,
  SessionResponseDto,
  ConversationResponseDto,
  SessionHistoryDto,
} from '../dto/session.dto';
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
      throw new BadRequestException(
        `Spirit ${spirit.name} is not available at the moment`,
      );
    }

    // Generar token único
    const sessionToken = this.generateSessionToken();

    // Crear sesión en base de datos
    const session = await this.prisma.ouijaSession.create({
      data: {
        spiritId: dto.spiritId,
        sessionToken,
        status: 'active',
      },
      include: {
        spirit: true,
      },
    });

    // Generar mensaje de bienvenida
    const welcomeMessage =
      await this.conversationService.generateWelcomeMessage(
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
      startedAt: session.createdAt,
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
      throw new NotFoundException(
        `Session with token ${dto.sessionToken} not found`,
      );
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
    const spiritResponseContent =
      await this.conversationService.generateSpiritResponse(
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
        timestamp: userMessage.createdAt,
      },
      spiritResponse: {
        messageId: spiritMessage.id,
        role: 'spirit',
        content: spiritMessage.content,
        timestamp: spiritMessage.createdAt,
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(
        `Session with token ${sessionToken} not found`,
      );
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
        timestamp: msg.createdAt,
      })),
      startedAt: session.createdAt,
      endedAt: session.endedAt,
    };
  }

  /**
   * Finaliza una sesión
   */
  async endSession(
    sessionToken: string,
  ): Promise<{ message: string; endedAt: Date }> {
    this.logger.log(`Ending session: ${sessionToken}`);

    const session = await this.prisma.ouijaSession.findUnique({
      where: { sessionToken },
      include: { spirit: true },
    });

    if (!session) {
      throw new NotFoundException(
        `Session with token ${sessionToken} not found`,
      );
    }

    if (session.status !== 'active') {
      throw new BadRequestException('Session is already ended');
    }

    // Generar mensaje de despedida
    const farewellMessage =
      await this.conversationService.generateFarewellMessage(
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
      endedAt: updatedSession.endedAt!,
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
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obtiene información de un espíritu específico
   */
  async getSpiritById(spiritId: number) {
    const spirit = await this.prisma.spirit.findUnique({
      where: { id: spiritId },
      select: {
        id: true,
        name: true,
        personality: true,
        backstory: true,
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
