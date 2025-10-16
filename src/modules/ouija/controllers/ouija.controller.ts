import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SpiritSessionService } from '../services/spirit-session.service';
import {
  CreateSessionDto,
  SendMessageDto,
  SessionResponseDto,
  ConversationResponseDto,
  SessionHistoryDto,
} from '../dto/session.dto';

@ApiTags('ouija')
@Controller('ouija')
export class OuijaController {
  constructor(private readonly sessionService: SpiritSessionService) {}

  // ==========================================
  // ENDPOINTS DE ESPÍRITUS
  // ==========================================

  @Get('spirits')
  @ApiOperation({
    summary: 'Obtener lista de espíritus disponibles',
    description:
      'Retorna todos los espíritus activos que pueden ser invocados para una sesión',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de espíritus disponibles',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Morgana la Sabia' },
          personality: { type: 'string', example: 'wise' },
          backstory: {
            type: 'string',
            example: 'Una curandera medieval del siglo XII...',
          },
        },
      },
    },
  })
  async getAvailableSpirits() {
    return this.sessionService.getAvailableSpirits();
  }

  @Get('spirits/:id')
  @ApiOperation({
    summary: 'Obtener información de un espíritu específico',
    description: 'Retorna los detalles completos de un espíritu por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del espíritu',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Información del espíritu',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        personality: { type: 'string' },
        backstory: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Espíritu no encontrado' })
  async getSpiritById(@Param('id') id: string) {
    return this.sessionService.getSpiritById(parseInt(id, 10));
  }

  // ==========================================
  // ENDPOINTS DE SESIÓN
  // ==========================================

  @Post('session/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva sesión con un espíritu',
    description:
      'Inicia una nueva sesión de conversación con el espíritu seleccionado. Retorna un token único para la sesión.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sesión creada exitosamente',
    type: SessionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Espíritu no disponible o datos inválidos',
  })
  @ApiNotFoundResponse({ description: 'Espíritu no encontrado' })
  async createSession(
    @Body() dto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    return this.sessionService.createSession(dto);
  }

  @Post('session/ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar mensaje a un espíritu en sesión activa',
    description:
      'Envía una pregunta o mensaje al espíritu y recibe su respuesta mística. La sesión debe estar activa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensaje enviado y respuesta recibida',
    type: ConversationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Sesión no activa o mensaje inválido',
  })
  @ApiNotFoundResponse({ description: 'Sesión no encontrada' })
  async sendMessage(
    @Body() dto: SendMessageDto,
  ): Promise<ConversationResponseDto> {
    return this.sessionService.sendMessage(dto);
  }

  @Post('session/:token/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finalizar sesión activa',
    description:
      'Termina la sesión de conversación con el espíritu. El espíritu enviará un mensaje de despedida.',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único de la sesión',
    example: 'sess_1a2b3c4d-a1b2-c3d4-e5f6-g7h8i9j0k1l2',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión finalizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Que la paz te acompañe...' },
        endedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Sesión ya finalizada' })
  @ApiNotFoundResponse({ description: 'Sesión no encontrada' })
  async endSession(@Param('token') token: string) {
    return this.sessionService.endSession(token);
  }

  @Get('session/:token/history')
  @ApiOperation({
    summary: 'Obtener historial completo de una sesión',
    description:
      'Retorna todos los mensajes intercambiados en la sesión, incluyendo mensajes del usuario y del espíritu.',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único de la sesión',
    example: 'sess_1a2b3c4d-a1b2-c3d4-e5f6-g7h8i9j0k1l2',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de la sesión',
    type: SessionHistoryDto,
  })
  @ApiNotFoundResponse({ description: 'Sesión no encontrada' })
  async getSessionHistory(
    @Param('token') token: string,
  ): Promise<SessionHistoryDto> {
    return this.sessionService.getSessionHistory(token);
  }

  @Get('session/:token/status')
  @ApiOperation({
    summary: 'Verificar estado de una sesión',
    description:
      'Retorna información básica sobre el estado actual de la sesión (activa, finalizada, etc.)',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único de la sesión',
    example: 'sess_1a2b3c4d-a1b2-c3d4-e5f6-g7h8i9j0k1l2',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la sesión',
    schema: {
      type: 'object',
      properties: {
        sessionToken: { type: 'string' },
        status: { type: 'string', example: 'active' },
        spiritName: { type: 'string', example: 'Morgana la Sabia' },
        messageCount: { type: 'number', example: 5 },
        startedAt: { type: 'string', format: 'date-time' },
        endedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Sesión no encontrada' })
  async getSessionStatus(@Param('token') token: string) {
    const history = await this.sessionService.getSessionHistory(token);

    return {
      sessionToken: history.sessionToken,
      status: history.status,
      spiritName: history.spirit.name,
      messageCount: history.messages.length,
      startedAt: history.startedAt,
      endedAt: history.endedAt,
    };
  }
}
