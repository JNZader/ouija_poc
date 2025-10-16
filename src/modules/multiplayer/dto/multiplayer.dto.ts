import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO para crear una sala multijugador
 */
export class CreateRoomDto {
  @IsUUID()
  @IsNotEmpty()
  spiritId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

/**
 * DTO para unirse a una sala
 */
export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomCode: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

/**
 * DTO para salir de una sala
 */
export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  roomCode: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

/**
 * DTO para enviar un mensaje
 */
export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  roomCode: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
