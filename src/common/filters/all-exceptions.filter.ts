import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let errors: unknown = null;

    // HttpException (NestJS)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = ((exceptionResponse as Record<string, unknown>).message as string) || message;
        errors = (exceptionResponse as Record<string, unknown>).errors || null;
        code =
          ((exceptionResponse as Record<string, unknown>).code as string) ||
          this.getErrorCode(status);
      }
    }
    // Prisma Errors
    else if (exception instanceof PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'DATABASE_ERROR';

      switch (exception.code) {
        case 'P2002':
          message = 'Unique constraint violation';
          code = 'DUPLICATE_ENTRY';
          break;
        case 'P2025':
          message = 'Record not found';
          code = 'NOT_FOUND';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2003':
          message = 'Foreign key constraint failed';
          code = 'INVALID_REFERENCE';
          break;
        default:
          message = 'Database operation failed';
      }
    }
    // Generic Error
    else if (exception instanceof Error) {
      message = exception.message;
      code = 'APPLICATION_ERROR';
    }

    // Preparar respuesta de error
    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    if (errors) {
      errorResponse.errors = errors;
    }

    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
      errorResponse.details = exception;
    }

    // Log según severidad
    if (status >= 500) {
      this.logger.error(
        `[${status}] ${request.method} ${request.url} - ${message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    } else if (status >= 400) {
      this.logger.warn(`[${status}] ${request.method} ${request.url} - ${message}`);
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
    };

    return codeMap[status] || 'UNKNOWN_ERROR';
  }
}
