import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'ID del espíritu con el que se quiere comunicar',
    example: 1,
  })
  @IsNotEmpty()
  spiritId: number;

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
  sessionId: number;

  @ApiProperty({ description: 'Información del espíritu' })
  spirit: {
    id: number;
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
  messageId: number;

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
    id: number;
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
  endedAt?: Date | null;
}
