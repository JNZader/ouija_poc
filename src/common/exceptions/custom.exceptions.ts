import { HttpException, HttpStatus } from '@nestjs/common';

export class AIServiceUnavailableException extends HttpException {
  constructor(message = 'AI service is currently unavailable') {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'AI_SERVICE_UNAVAILABLE',
        message,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class SessionExpiredException extends HttpException {
  constructor(sessionToken: string) {
    super(
      {
        statusCode: HttpStatus.GONE,
        code: 'SESSION_EXPIRED',
        message: `Session ${sessionToken} has expired or ended`,
      },
      HttpStatus.GONE,
    );
  }
}

export class RoomFullException extends HttpException {
  constructor(roomCode: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code: 'ROOM_FULL',
        message: `Room ${roomCode} is full`,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidSpiritException extends HttpException {
  constructor(spiritId: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_SPIRIT',
        message: `Spirit ${spiritId} is not available`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(errors: unknown[]) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
