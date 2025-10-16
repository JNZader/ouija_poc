import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof WsException) {
      errorMessage = exception.message;
      errorCode = 'WS_ERROR';
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    this.logger.error(
      `WebSocket error for client ${client.id}: ${errorMessage}`,
    );

    client.emit('error', {
      code: errorCode,
      message: errorMessage,
    });
  }
}
