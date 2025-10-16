import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(message: string, context?: string, meta?: object) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: object) {
    this.logger.error(message, { context, trace, ...meta });
  }

  warn(message: string, context?: string, meta?: object) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: object) {
    this.logger.debug(message, { context, ...meta });
  }

  verbose(message: string, context?: string, meta?: object) {
    this.logger.verbose(message, { context, ...meta });
  }

  // Custom methods for structured logging
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
  ) {
    this.logger.info('HTTP Request', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      duration,
      userId,
    });
  }

  logAIRequest(
    engine: string,
    model: string,
    tokenCount: number,
    duration: number,
    success: boolean,
  ) {
    this.logger.info('AI Request', {
      context: 'AI',
      engine,
      model,
      tokenCount,
      duration,
      success,
    });
  }

  logWebSocketEvent(
    event: string,
    roomId?: string,
    userId?: string,
    meta?: object,
  ) {
    this.logger.info('WebSocket Event', {
      context: 'WebSocket',
      event,
      roomId,
      userId,
      ...meta,
    });
  }

  logDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
  ) {
    this.logger.debug('Database Query', {
      context: 'Database',
      operation,
      table,
      duration,
      success,
    });
  }
}
