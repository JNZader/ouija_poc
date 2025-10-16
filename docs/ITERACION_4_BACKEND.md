# Iteración 4: Testing & Polish - Ouija Virtual API

## Duración: 3-5 días
## Objetivo: Alcanzar cobertura >80%, optimizar performance y pulir el sistema
## Story Points: 15-20
## Equipo: Todos los devs + QA

---

# 🎯 OBJETIVOS DE LA ITERACIÓN

Al finalizar esta iteración, el equipo tendrá:

✅ Cobertura de tests unitarios >80%
✅ Tests E2E completos para todos los flujos críticos
✅ Error handling robusto y consistente
✅ Logging estructurado con Winston
✅ Performance optimizado (<200ms REST, <3s IA)
✅ Documentación técnica completa
✅ Code quality al 100% (linting, TypeScript)
✅ Sistema listo para producción

---

# 📋 BACKLOG DE LA ITERACIÓN

## Épica 1: Completar Cobertura de Tests

### US-4.1: Aumentar Cobertura de Tests Unitarios a >80%
**Como** desarrollador backend
**Quiero** tests unitarios completos en todos los servicios
**Para** garantizar confiabilidad del código

**Story Points**: 5
**Asignado a**: Todos los devs
**Prioridad**: CRÍTICA

#### Criterios de Aceptación
- [ ] Cobertura global >80%
- [ ] Todos los servicios con >80% coverage
- [ ] Casos edge cubiertos
- [ ] Tests de error paths
- [ ] Mocks correctamente configurados

#### Tareas Técnicas

**T-4.1.1: Analizar cobertura actual** (0.5h)

```bash
# Generar reporte de cobertura
npm run test:cov

# Abrir reporte HTML
open coverage/lcov-report/index.html

# Identificar áreas con <80% coverage
# Priorizar servicios críticos:
# - AIService
# - ConversationService
# - SpiritSessionService
# - MultiplayerService
```

**T-4.1.2: Agregar tests faltantes para AIService** (1h)

```typescript
// src/modules/ouija/services/__tests__/ai.service.spec.ts
// Agregar estos tests adicionales

describe('AIService - Additional Tests', () => {
  // ... setup existente ...

  describe('edge cases', () => {
    it('should handle empty messages array', async () => {
      const options = {
        messages: [],
      };

      await expect(service.generate(options, 'ollama')).rejects.toThrow();
    });

    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(10000);
      const options = {
        messages: [
          { role: 'system' as const, content: 'Test' },
          { role: 'user' as const, content: longMessage },
        ],
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: { message: { content: 'Response' } },
      });

      const result = await service.generate(options, 'ollama');
      expect(result.content).toBeDefined();
    });

    it('should handle timeout errors gracefully', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Request timeout',
      });

      const result = await service.generate(
        { messages: [{ role: 'user' as const, content: 'Test' }] },
        'ollama',
      );

      expect(result.engine).toBe('fallback');
    });

    it('should handle network errors', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      const result = await service.generate(
        { messages: [{ role: 'user' as const, content: 'Test' }] },
        'ollama',
      );

      expect(result.engine).toBe('fallback');
    });
  });

  describe('configuration validation', () => {
    it('should throw if engine name is invalid', async () => {
      await expect(
        service.generate(
          { messages: [{ role: 'user' as const, content: 'Test' }] },
          'invalid-engine' as any,
        ),
      ).rejects.toThrow();
    });

    it('should use default engine if none specified', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { message: { content: 'Response' } },
      });

      const result = await service.generate({
        messages: [{ role: 'user' as const, content: 'Test' }],
      });

      expect(result.engine).toBe('ollama'); // Default engine
    });
  });

  describe('response formatting', () => {
    it('should include timestamp in response', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { message: { content: 'Response' } },
      });

      const result = await service.generate({
        messages: [{ role: 'user' as const, content: 'Test' }],
      });

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should include processing time', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { message: { content: 'Response' } },
      });

      const result = await service.generate({
        messages: [{ role: 'user' as const, content: 'Test' }],
      });

      expect(result.processingTime).toBeGreaterThan(0);
    });
  });
});
```

**T-4.1.3: Agregar tests de integración faltantes** (1.5h)

```typescript
// test/integration/conversation-flow.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AIService } from '../../src/modules/ouija/services/ai.service';

describe('Conversation Flow (Integration)', () => {
  let app: TestingModule;
  let prisma: PrismaService;
  let aiService: AIService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = app.get<PrismaService>(PrismaService);
    aiService = app.get<AIService>(AIService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should maintain conversation context across multiple messages', async () => {
    const spirit = await prisma.spirit.findFirst({
      where: { isActive: true },
    });

    // Crear sesión
    const session = await prisma.ouijaSession.create({
      data: {
        spiritId: spirit.id,
        sessionToken: 'test-token-integration',
        status: 'active',
      },
    });

    // Guardar múltiples mensajes
    const messages = [
      { role: 'user', content: '¿Cuál es mi nombre?' },
      { role: 'spirit', content: 'No conozco tu nombre, mortal' },
      { role: 'user', content: 'Me llamo Juan' },
    ];

    for (const msg of messages) {
      await prisma.sessionMessage.create({
        data: {
          sessionId: session.id,
          role: msg.role,
          content: msg.content,
        },
      });
    }

    // Verificar que el historial se mantiene
    const history = await prisma.sessionMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { timestamp: 'asc' },
    });

    expect(history).toHaveLength(3);
    expect(history[2].content).toContain('Juan');

    // Cleanup
    await prisma.sessionMessage.deleteMany({
      where: { sessionId: session.id },
    });
    await prisma.ouijaSession.delete({
      where: { id: session.id },
    });
  });

  it('should handle AI service failure gracefully', async () => {
    // Mock AI service to fail
    jest.spyOn(aiService, 'generate').mockRejectedValue(new Error('AI unavailable'));

    const spirit = await prisma.spirit.findFirst();
    const session = await prisma.ouijaSession.create({
      data: {
        spiritId: spirit.id,
        sessionToken: 'test-token-failure',
        status: 'active',
      },
    });

    // El sistema debe usar fallback
    // Este test verifica que el sistema no crashea

    await prisma.ouijaSession.delete({
      where: { id: session.id },
    });
  });
});
```

**T-4.1.4: Agregar tests de carga para Redis** (1h)

```typescript
// test/load/redis-performance.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../src/common/redis/redis.service';
import { ConfigModule } from '@nestjs/config';

describe('Redis Performance (Load Test)', () => {
  let redis: RedisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [RedisService],
    }).compile();

    redis = module.get<RedisService>(RedisService);
    await redis.onModuleInit();
  });

  afterAll(async () => {
    await redis.onModuleDestroy();
  });

  it('should handle 100 concurrent writes', async () => {
    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < 100; i++) {
      promises.push(
        redis.setJSON(`test:key:${i}`, {
          index: i,
          data: `test-data-${i}`,
          timestamp: new Date(),
        }),
      );
    }

    await Promise.all(promises);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // <5s para 100 writes

    // Cleanup
    for (let i = 0; i < 100; i++) {
      await redis.delete(`test:key:${i}`);
    }
  });

  it('should handle 100 concurrent reads', async () => {
    // Setup: Escribir 100 keys
    for (let i = 0; i < 100; i++) {
      await redis.setJSON(`test:read:${i}`, { index: i });
    }

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < 100; i++) {
      promises.push(redis.getJSON(`test:read:${i}`));
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();

    expect(results.every((r) => r !== null)).toBe(true);
    expect(endTime - startTime).toBeLessThan(2000); // <2s para 100 reads

    // Cleanup
    for (let i = 0; i < 100; i++) {
      await redis.delete(`test:read:${i}`);
    }
  });

  it('should handle TTL correctly', async () => {
    await redis.setJSON('test:ttl', { data: 'test' }, 1); // 1 segundo

    const exists1 = await redis.exists('test:ttl');
    expect(exists1).toBe(true);

    // Esperar 1.5 segundos
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const exists2 = await redis.exists('test:ttl');
    expect(exists2).toBe(false);
  });
});
```

**T-4.1.5: Ejecutar y verificar cobertura final** (0.5h)

```bash
# Ejecutar todos los tests con cobertura
npm run test:cov

# Verificar que la cobertura es >80%
# Si no, repetir T-4.1.2 a T-4.1.4 para áreas faltantes

# Generar reporte JSON para CI/CD
npm run test:cov -- --coverageReporters=json-summary

# Verificar umbrales
cat coverage/coverage-summary.json | jq '.total.lines.pct'
# Debe ser >= 80
```

---

## Épica 2: Error Handling Robusto

### US-4.2: Implementar Manejo de Errores Consistente
**Como** desarrollador backend
**Quiero** manejo de errores robusto en todo el sistema
**Para** proporcionar respuestas claras y evitar crashes

**Story Points**: 3
**Asignado a**: Backend Lead
**Prioridad**: ALTA

#### Criterios de Aceptación
- [ ] Errores HTTP consistentes
- [ ] Logging de todos los errores
- [ ] Stack traces solo en development
- [ ] Mensajes de error amigables
- [ ] Códigos de error documentados

#### Tareas Técnicas

**T-4.2.1: Crear exception filters personalizados** (1h)

```typescript
// src/common/filters/all-exceptions.filter.ts
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
    let errors: any = null;

    // HttpException (NestJS)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors || null;
        code = (exceptionResponse as any).code || this.getErrorCode(status);
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
    const errorResponse = {
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(errors && { errors }),
      ...(process.env.NODE_ENV === 'development' &&
        exception instanceof Error && {
          stack: exception.stack,
          details: exception,
        }),
    };

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
    const codeMap = {
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
```

**T-4.2.2: Crear custom exceptions** (0.5h)

```typescript
// src/common/exceptions/custom.exceptions.ts
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
  constructor(errors: any[]) {
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
```

**T-4.2.3: Aplicar exception filters globalmente** (0.25h)

```typescript
// src/main.ts
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // ... resto del código
}
```

**T-4.2.4: Documentar códigos de error** (0.5h)

```markdown
// docs/ERROR_CODES.md
# Error Codes - Ouija Virtual API

## HTTP Status Codes

La API utiliza códigos de estado HTTP estándar y códigos de error personalizados.

## Códigos de Error Personalizados

### Errores de Cliente (4xx)

#### BAD_REQUEST (400)
**Causas comunes:**
- Datos de entrada inválidos
- Parámetros faltantes
- Formato incorrecto

**Ejemplo:**
```json
{
  "statusCode": 400,
  "code": "BAD_REQUEST",
  "message": "Validation failed",
  "errors": [
    {
      "property": "message",
      "constraints": {
        "minLength": "message must be longer than 1 characters"
      }
    }
  ],
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/ask"
}
```

#### VALIDATION_ERROR (400)
Datos de entrada no cumplen con las reglas de validación.

#### NOT_FOUND (404)
**Causas comunes:**
- Sesión no encontrada
- Espíritu no encontrado
- Sala no encontrada

**Ejemplo:**
```json
{
  "statusCode": 404,
  "code": "NOT_FOUND",
  "message": "Session with token sess_abc123 not found",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/sess_abc123/history"
}
```

#### CONFLICT (409)
**Causas comunes:**
- Sala llena
- Usuario ya en sala
- Sesión ya finalizada

**Código específico:** `ROOM_FULL`
```json
{
  "statusCode": 409,
  "code": "ROOM_FULL",
  "message": "Room ABC123 is full",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/multiplayer/room/join"
}
```

#### SESSION_EXPIRED (410)
Sesión ha expirado o ha sido finalizada.

#### RATE_LIMIT_EXCEEDED (429)
Demasiadas peticiones en corto tiempo.

### Errores de Servidor (5xx)

#### INTERNAL_ERROR (500)
Error interno del servidor no especificado.

#### AI_SERVICE_UNAVAILABLE (503)
**Causa:** Servicios de IA (Ollama/DeepSeek) no disponibles.

**Nota:** La API intentará usar fallback templates antes de retornar este error.

```json
{
  "statusCode": 503,
  "code": "AI_SERVICE_UNAVAILABLE",
  "message": "AI service is currently unavailable",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/ask"
}
```

#### DATABASE_ERROR (500)
Error en operación de base de datos.

**Subcódigos:**
- `DUPLICATE_ENTRY`: Violación de constraint único
- `INVALID_REFERENCE`: Foreign key inválida

## Estructura de Respuesta de Error

Todas las respuestas de error siguen esta estructura:

```typescript
{
  statusCode: number;      // Código HTTP
  code: string;            // Código de error personalizado
  message: string;         // Mensaje descriptivo
  timestamp: string;       // ISO 8601
  path: string;            // Endpoint que falló
  method: string;          // Método HTTP
  errors?: any[];          // Detalles de validación (opcional)
  stack?: string;          // Stack trace (solo en development)
}
```

## Manejo de Errores en Cliente

### Ejemplo en JavaScript

```javascript
try {
  const response = await fetch('/api/ouija/session/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken, message }),
  });

  if (!response.ok) {
    const error = await response.json();

    switch (error.code) {
      case 'NOT_FOUND':
        console.error('Session not found');
        break;
      case 'VALIDATION_ERROR':
        console.error('Invalid input:', error.errors);
        break;
      case 'AI_SERVICE_UNAVAILABLE':
        console.error('AI temporarily unavailable, try again');
        break;
      default:
        console.error('Unexpected error:', error.message);
    }
  }
} catch (err) {
  console.error('Network error:', err);
}
```
```

---

## Épica 3: Logging Estructurado

### US-4.3: Implementar Logging con Winston
**Como** desarrollador de operaciones
**Quiero** logs estructurados y centralizados
**Para** facilitar debugging y monitoreo

**Story Points**: 2
**Asignado a**: Backend Dev
**Prioridad**: MEDIA

#### Criterios de Aceptación
- [ ] Winston configurado globalmente
- [ ] Logs estructurados (JSON)
- [ ] Niveles de log apropiados
- [ ] Rotación de logs
- [ ] Logs separados por nivel

#### Tareas Técnicas

**T-4.3.1: Instalar y configurar Winston** (0.5h)

```bash
npm install --save winston winston-daily-rotate-file
npm install --save-dev @types/winston
```

**T-4.3.2: Crear configuración de Winston** (1h)

```typescript
// src/common/logger/winston.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    let log = `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message}`;

    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    return log;
  }),
);

export const winstonConfig = {
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
      level: process.env.LOG_LEVEL || 'info',
    }),

    // Error logs
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),

    // Combined logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),

    // HTTP logs (access logs)
    new DailyRotateFile({
      filename: 'logs/http-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    }),
  ],
};

export const createWinstonLogger = () => {
  return WinstonModule.createLogger(winstonConfig);
};
```

**T-4.3.3: Crear interceptor de logging HTTP** (0.5h)

```typescript
// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url, body, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const ip = headers['x-forwarded-for'] || req.socket.remoteAddress;

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          const { statusCode } = res;

          this.logger.log({
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            userAgent,
            ip,
            ...(process.env.LOG_LEVEL === 'debug' && { body }),
          });
        },
        error: (error) => {
          const responseTime = Date.now() - now;

          this.logger.error({
            method,
            url,
            error: error.message,
            stack: error.stack,
            responseTime: `${responseTime}ms`,
            userAgent,
            ip,
          });
        },
      }),
    );
  }
}
```

**T-4.3.4: Aplicar Winston y logging interceptor** (0.25h)

```typescript
// src/main.ts
import { createWinstonLogger } from './common/logger/winston.config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createWinstonLogger(),
  });

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ... resto del código
}
```

**T-4.3.5: Agregar structured logging en servicios** (0.25h)

```typescript
// Ejemplo de uso en servicios
import { Logger } from '@nestjs/common';

export class AIService {
  private readonly logger = new Logger(AIService.name);

  async generate(options: AIGenerateOptions) {
    this.logger.log({
      message: 'Generating AI response',
      engine: this.defaultEngine,
      messageCount: options.messages.length,
      temperature: options.temperature,
    });

    try {
      const result = await this.generateWithEngine(options);

      this.logger.log({
        message: 'AI response generated successfully',
        engine: result.engine,
        processingTime: result.processingTime,
        contentLength: result.content.length,
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Failed to generate AI response',
        error: error.message,
        stack: error.stack,
        engine: this.defaultEngine,
      });

      throw error;
    }
  }
}
```

---

## Épica 4: Optimización de Performance

### US-4.4: Optimizar Performance del Sistema
**Como** usuario de la API
**Quiero** respuestas rápidas y eficientes
**Para** tener mejor experiencia

**Story Points**: 3
**Asignado a**: Backend Lead
**Prioridad**: ALTA

#### Criterios de Aceptación
- [ ] Queries optimizadas con índices
- [ ] Caché implementado donde corresponde
- [ ] Response times medidos
- [ ] Memory leaks detectados y corregidos
- [ ] Connection pooling configurado

#### Tareas Técnicas

**T-4.4.1: Optimizar queries de Prisma** (1h)

```typescript
// src/modules/ouija/services/spirit-session.service.ts
// Optimizaciones de queries

/**
 * ANTES: N+1 query problem
 */
async getSessionHistoryBad(sessionToken: string) {
  const session = await this.prisma.ouijaSession.findUnique({
    where: { sessionToken },
  });

  const spirit = await this.prisma.spirit.findUnique({
    where: { id: session.spiritId },
  });

  const messages = await this.prisma.sessionMessage.findMany({
    where: { sessionId: session.id },
  });

  return { session, spirit, messages };
}

/**
 * DESPUÉS: Single query with includes
 */
async getSessionHistoryOptimized(sessionToken: string) {
  const session = await this.prisma.ouijaSession.findUnique({
    where: { sessionToken },
    include: {
      spirit: {
        select: {
          id: true,
          name: true,
          personality: true,
        },
      },
      messages: {
        orderBy: { timestamp: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          timestamp: true,
        },
      },
    },
  });

  if (!session) {
    throw new NotFoundException(`Session with token ${sessionToken} not found`);
  }

  return {
    sessionToken: session.sessionToken,
    spirit: session.spirit,
    status: session.status,
    messages: session.messages,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
  };
}

/**
 * Paginación para mensajes largos
 */
async getSessionHistoryPaginated(
  sessionToken: string,
  page: number = 1,
  limit: number = 50,
) {
  const skip = (page - 1) * limit;

  const [session, totalMessages] = await Promise.all([
    this.prisma.ouijaSession.findUnique({
      where: { sessionToken },
      include: {
        spirit: {
          select: {
            id: true,
            name: true,
            personality: true,
          },
        },
        messages: {
          skip,
          take: limit,
          orderBy: { timestamp: 'asc' },
        },
      },
    }),
    this.prisma.sessionMessage.count({
      where: {
        session: { sessionToken },
      },
    }),
  ]);

  if (!session) {
    throw new NotFoundException(`Session with token ${sessionToken} not found`);
  }

  return {
    ...session,
    pagination: {
      page,
      limit,
      total: totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
    },
  };
}
```

**T-4.4.2: Implementar caché para espíritus** (0.75h)

```typescript
// src/modules/ouija/services/spirit-cache.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';

@Injectable()
export class SpiritCacheService implements OnModuleInit {
  private readonly logger = new Logger(SpiritCacheService.name);
  private readonly CACHE_KEY = 'spirits:all';
  private readonly CACHE_TTL = 3600; // 1 hora

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async onModuleInit() {
    // Pre-cargar espíritus en caché al iniciar
    await this.refreshCache();
    this.logger.log('Spirit cache initialized');
  }

  /**
   * Obtener todos los espíritus (con caché)
   */
  async getAllSpirits() {
    // Intentar obtener del caché
    const cached = await this.redis.getJSON<any[]>(this.CACHE_KEY);

    if (cached) {
      this.logger.debug('Spirits loaded from cache');
      return cached;
    }

    // Si no está en caché, obtener de BD
    this.logger.debug('Spirits cache miss, loading from database');
    return await this.refreshCache();
  }

  /**
   * Obtener espíritu por ID (con caché)
   */
  async getSpiritById(spiritId: string) {
    const spirits = await this.getAllSpirits();
    const spirit = spirits.find((s) => s.id === spiritId);

    if (!spirit) {
      throw new NotFoundException(`Spirit with ID ${spiritId} not found`);
    }

    return spirit;
  }

  /**
   * Refrescar caché de espíritus
   */
  async refreshCache() {
    const spirits = await this.prisma.spirit.findMany({
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

    await this.redis.setJSON(this.CACHE_KEY, spirits, this.CACHE_TTL);
    this.logger.log(`Spirit cache refreshed with ${spirits.length} spirits`);

    return spirits;
  }

  /**
   * Invalidar caché (cuando se actualizan espíritus)
   */
  async invalidateCache() {
    await this.redis.delete(this.CACHE_KEY);
    this.logger.log('Spirit cache invalidated');
  }
}
```

**T-4.4.3: Configurar connection pooling** (0.5h)

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pooling
  relationMode = "prisma"
}

generator client {
  provider = "prisma-client-js"
  // Optimizaciones
  binaryTargets = ["native"]
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}
```

```bash
# .env
# Connection pooling optimizado
DATABASE_URL="postgresql://user:pass@localhost:5432/ouija_db?connection_limit=20&pool_timeout=10"

# Para producción con PgBouncer
DATABASE_URL="postgresql://user:pass@localhost:6432/ouija_db?pgbouncer=true&connection_limit=20"
```

**T-4.4.4: Agregar compresión HTTP** (0.25h)

```bash
npm install --save compression
npm install --save-dev @types/compression
```

```typescript
// src/main.ts
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Compression
  app.use(compression({
    threshold: 1024, // Solo comprimir respuestas >1KB
    level: 6, // Nivel de compresión (0-9)
  }));

  // ... resto del código
}
```

**T-4.4.5: Implementar health check con métricas** (0.5h)

```typescript
// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.db.pingCheck('database', this.prisma),
    ]);
  }

  @Get('metrics')
  async metrics() {
    // Obtener métricas del sistema
    const [
      totalSessions,
      activeSessions,
      totalMessages,
      activeRooms,
    ] = await Promise.all([
      this.prisma.ouijaSession.count(),
      this.prisma.ouijaSession.count({ where: { status: 'active' } }),
      this.prisma.sessionMessage.count(),
      this.prisma.multiplayerRoom.count({ where: { status: 'active' } }),
    ]);

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
      database: {
        totalSessions,
        activeSessions,
        totalMessages,
        activeRooms,
      },
    };
  }
}
```

---

## Épica 5: Documentación y Code Quality

### US-4.5: Completar Documentación Técnica
**Como** desarrollador nuevo
**Quiero** documentación completa y actualizada
**Para** entender rápidamente el proyecto

**Story Points**: 2
**Asignado a**: Todos los devs
**Prioridad**: MEDIA

#### Criterios de Aceptación
- [ ] README completo
- [ ] JSDoc en funciones públicas
- [ ] API documentada en Swagger
- [ ] Guías de deployment
- [ ] Troubleshooting guide

#### Tareas Técnicas

**T-4.5.1: Actualizar README principal** (0.5h)

```markdown
# Ouija Virtual API

API REST y WebSocket para comunicación con espíritus virtuales impulsados por IA.

## 🚀 Quick Start

### Prerequisitos

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Ollama (opcional, para IA local)

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd ouija-virtual-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# 4. Levantar servicios
docker-compose up -d

# 5. Ejecutar migraciones
npx prisma migrate dev
npx prisma generate
npx prisma db seed

# 6. Iniciar servidor
npm run start:dev
```

### Verificar Instalación

```bash
# Health check
curl http://localhost:3000/api/health

# Swagger docs
open http://localhost:3000/api/docs
```

## 📚 Documentación

- [Plan de Desarrollo](./PLAN_BACKEND_COMPLETO.md)
- [Iteración 0 - Setup](./ITERACION_0_BACKEND.md)
- [Iteración 1 - Core Services](./ITERACION_1_BACKEND.md)
- [Iteración 2 - REST API](./ITERACION_2_BACKEND.md)
- [Iteración 3 - WebSockets](./ITERACION_3_BACKEND.md)
- [Iteración 4 - Testing & Polish](./ITERACION_4_BACKEND.md)
- [WebSocket API](./docs/WEBSOCKET_API.md)
- [Códigos de Error](./docs/ERROR_CODES.md)

## 🏗️ Arquitectura

```
Frontend → REST API / WebSocket → NestJS Backend
                                   ├─ AIService (Ollama/DeepSeek)
                                   ├─ ConversationService
                                   ├─ SpiritSessionService
                                   ├─ MultiplayerService
                                   └─ PrismaService → PostgreSQL
```

## 📦 Scripts Disponibles

```bash
npm run start:dev          # Desarrollo con hot-reload
npm run start:prod         # Producción
npm run build              # Compilar TypeScript
npm run test               # Tests unitarios
npm run test:e2e           # Tests E2E
npm run test:cov           # Tests con cobertura
npm run lint               # Linting
npm run format             # Formatear código
npm run prisma:studio      # Abrir Prisma Studio
```

## 🔧 Configuración

Ver archivo `.env.example` para todas las variables disponibles.

### Variables Críticas

```bash
DATABASE_URL="postgresql://..."
REDIS_HOST="localhost"
REDIS_PORT=6379
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:3b"
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Con cobertura
npm run test:cov

# Tests E2E
npm run test:e2e

# Watch mode
npm run test:watch
```

## 📊 Métricas de Calidad

- ✅ Cobertura de tests: >80%
- ✅ TypeScript strict mode
- ✅ ESLint sin errores
- ✅ Prettier configurado

## 🚢 Deployment

Ver [DEPLOYMENT.md](./docs/DEPLOYMENT.md) para guía completa.

## 📄 Licencia

MIT

## 👥 Equipo

- Backend Lead: [Nombre]
- API Dev: [Nombre]
- Real-time Dev: [Nombre]
- QA/DevOps: [Nombre]
```

**T-4.5.2: Ejecutar linting y formatting** (0.25h)

```bash
# Ejecutar linting
npm run lint

# Corregir automáticamente
npm run lint -- --fix

# Formatear código
npm run format

# Verificar TypeScript
npx tsc --noEmit
```

**T-4.5.3: Agregar JSDoc a funciones públicas** (0.5h)

```typescript
// Ejemplo de JSDoc completo

/**
 * Genera una respuesta del espíritu basada en el contexto de conversación
 *
 * @param sessionId - ID de la sesión activa
 * @param userMessage - Mensaje enviado por el usuario
 * @param spiritPersonality - Personalidad del espíritu (wise, cryptic, dark, playful)
 * @param spiritName - Nombre del espíritu
 * @param spiritBackstory - Historia del espíritu
 *
 * @returns Respuesta generada por el espíritu
 *
 * @throws {AIServiceUnavailableException} Si todos los motores de IA fallan
 * @throws {NotFoundException} Si la sesión no existe
 *
 * @example
 * ```typescript
 * const response = await conversationService.generateSpiritResponse(
 *   'session-123',
 *   '¿Cuál es mi destino?',
 *   'wise',
 *   'Morgana la Sabia',
 *   'Una curandera medieval...'
 * );
 * console.log(response); // "Tu destino está en tus manos, hijo mío..."
 * ```
 */
async generateSpiritResponse(
  sessionId: string,
  userMessage: string,
  spiritPersonality: SpiritPersonality,
  spiritName: string,
  spiritBackstory: string,
): Promise<string> {
  // ... implementación
}
```

**T-4.5.4: Crear guía de troubleshooting** (0.5h)

```markdown
// docs/TROUBLESHOOTING.md
# Troubleshooting Guide - Ouija Virtual API

## Problemas Comunes

### 1. La aplicación no inicia

**Síntoma:** Error al ejecutar `npm run start:dev`

**Posibles causas y soluciones:**

#### Error de conexión a PostgreSQL
```
Error: P1001: Can't reach database server at localhost:5432
```

**Solución:**
```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps

# Reiniciar PostgreSQL
docker-compose restart postgres

# Verificar logs
docker-compose logs postgres
```

#### Error de conexión a Redis
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solución:**
```bash
# Verificar que Redis está corriendo
docker-compose ps redis

# Reiniciar Redis
docker-compose restart redis

# Test de conexión
redis-cli ping
```

### 2. Tests fallando

**Síntoma:** `npm run test` muestra errores

**Soluciones:**

```bash
# Limpiar caché de Jest
npm run test -- --clearCache

# Ejecutar tests en serie (no paralelo)
npm run test -- --runInBand

# Ejecutar tests con logs detallados
npm run test -- --verbose

# Ejecutar un test específico
npm run test -- spirit-session.service.spec.ts
```

### 3. Ollama no responde

**Síntoma:** Timeout al generar respuestas de IA

**Soluciones:**

```bash
# Verificar que Ollama está corriendo
curl http://localhost:11434/api/tags

# Verificar que el modelo está descargado
ollama list

# Descargar modelo si es necesario
ollama pull qwen2.5:3b

# Reiniciar Ollama
ollama serve
```

### 4. WebSocket no conecta

**Síntoma:** Cliente no puede conectar al WebSocket

**Soluciones:**

1. Verificar CORS en `.env`:
```bash
CORS_ORIGINS=http://localhost:3001,http://localhost:5173
```

2. Verificar namespace:
```javascript
// Cliente debe conectar al namespace correcto
const socket = io('http://localhost:3000/multiplayer');
```

3. Verificar logs del servidor:
```bash
docker-compose logs -f backend
```

### 5. High Memory Usage

**Síntoma:** Proceso Node.js consume mucha memoria

**Diagnóstico:**
```bash
# Ver uso de memoria
node --expose-gc index.js

# Heap snapshot
npm install -g clinic
clinic doctor -- node dist/main.js
```

**Soluciones:**
- Verificar memory leaks con clinic
- Implementar limits en Prisma connection pool
- Configurar límites de Node.js:
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run start:prod
```

### 6. Migrations fallan

**Síntoma:** Error al ejecutar `prisma migrate dev`

**Soluciones:**

```bash
# Reset completo (⚠️ BORRA DATOS)
npx prisma migrate reset

# Verificar estado
npx prisma migrate status

# Aplicar migraciones pendientes
npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate
```

## Logs y Debugging

### Ver logs en tiempo real

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Últimas 100 líneas
docker-compose logs --tail=100 backend
```

### Debugging en VS Code

Crear `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeArgs": [
        "-r",
        "ts-node/register",
        "-r",
        "tsconfig-paths/register"
      ],
      "args": [
        "${workspaceFolder}/src/main.ts"
      ],
      "env": {
        "NODE_ENV": "development"
      },
      "sourceMaps": true,
      "cwd": "${workspaceFolder}",
      "protocol": "inspector"
    }
  ]
}
```

## Performance Issues

### Query lenta

```bash
# Habilitar query logging en Prisma
# En .env
DATABASE_URL="...&log_min_duration_statement=1000"
```

### WebSocket lento

```bash
# Verificar Redis
redis-cli --latency

# Verificar network
ping localhost
```

## Contacto

Si el problema persiste, crear un issue en GitHub con:
- Descripción del problema
- Logs relevantes
- Pasos para reproducir
- Variables de entorno (sin secrets)
```

**T-4.5.5: Crear CHANGELOG** (0.25h)

```markdown
# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [Unreleased]

## [1.0.0] - 2025-10-16

### Agregado
- API REST completa para sesiones individuales
- WebSocket Gateway para salas multiplayer
- Integración con Ollama (local) y DeepSeek (cloud)
- Sistema de fallback inteligente
- Redis para gestión de salas
- Logging estructurado con Winston
- Error handling robusto
- Tests unitarios y E2E (>80% coverage)
- Swagger documentation
- Health checks y métricas
- Rate limiting
- CORS configurado

### Servicios Implementados
- AIService: Gestión unificada de motores de IA
- ConversationService: Lógica de conversación centralizada
- SpiritSessionService: Gestión de sesiones individuales
- MultiplayerService: Gestión de salas multiplayer
- PrismaService: Acceso a base de datos

### Endpoints REST
- GET /api/health
- GET /api/ouija/spirits
- POST /api/ouija/session/create
- POST /api/ouija/session/ask
- POST /api/ouija/session/:token/end
- GET /api/ouija/session/:token/history
- POST /api/multiplayer/room/create
- GET /api/multiplayer/rooms/active
- GET /api/multiplayer/room/:code

### Eventos WebSocket
- create-room
- join-room
- leave-room
- send-message
- room-created
- room-joined
- user-joined
- user-left
- new-message
- room-ended

### Seguridad
- Helmet para headers de seguridad
- Rate limiting con @nestjs/throttler
- Validación de inputs con class-validator
- Exception filters globales

## [0.1.0] - 2025-10-01

### Agregado
- Setup inicial del proyecto
- Configuración de NestJS
- Configuración de Prisma
- Docker Compose
- Estructura base de módulos
```

---

## Checklist de Cierre de Iteración 4

### Testing
- [ ] Cobertura de tests >80%
- [ ] Todos los tests unitarios pasando
- [ ] Todos los tests E2E pasando
- [ ] Tests de carga para Redis
- [ ] Tests de integración completos

### Error Handling
- [ ] Exception filters implementados
- [ ] Custom exceptions creadas
- [ ] Códigos de error documentados
- [ ] Mensajes de error amigables
- [ ] Stack traces solo en development

### Logging
- [ ] Winston configurado
- [ ] Logs estructurados (JSON)
- [ ] Rotación de logs
- [ ] Niveles de log apropiados
- [ ] HTTP request logging

### Performance
- [ ] Queries optimizadas
- [ ] Caché implementado
- [ ] Connection pooling configurado
- [ ] Compresión HTTP habilitada
- [ ] Response times medidos (<200ms REST, <3s IA)

### Documentación
- [ ] README completo y actualizado
- [ ] JSDoc en funciones públicas
- [ ] Swagger completo
- [ ] Error codes documentados
- [ ] WebSocket API documentada
- [ ] Troubleshooting guide
- [ ] CHANGELOG creado

### Code Quality
- [ ] Linting sin errores
- [ ] TypeScript sin errores
- [ ] Prettier aplicado
- [ ] Code reviews completados
- [ ] No código comentado innecesario

---

## Testing Manual - Guía de Validación

### 1. Verificar Cobertura de Tests

```bash
# Ejecutar tests con cobertura
npm run test:cov

# Verificar reporte
open coverage/lcov-report/index.html

# Verificar que todas las áreas críticas tienen >80%
# - src/modules/ouija/services/
# - src/modules/multiplayer/services/
# - src/common/
```

### 2. Verificar Error Handling

```bash
# Test 1: Endpoint inexistente
curl http://localhost:3000/api/invalid
# Debe retornar 404 con estructura de error consistente

# Test 2: Datos inválidos
curl -X POST http://localhost:3000/api/ouija/session/create \
  -H "Content-Type: application/json" \
  -d '{"spiritId":"invalid"}'
# Debe retornar 400 con detalles de validación

# Test 3: Sesión no encontrada
curl http://localhost:3000/api/ouija/session/INVALID/history
# Debe retornar 404 con código de error claro
```

### 3. Verificar Logging

```bash
# Iniciar servidor y verificar logs
npm run start:dev

# Verificar que se crean archivos de log
ls -lh logs/

# Verificar formato de logs
tail -f logs/combined-$(date +%Y-%m-%d).log | jq

# Generar errores y verificar logs
curl http://localhost:3000/api/invalid
tail logs/error-$(date +%Y-%m-%d).log
```

### 4. Verificar Performance

```bash
# Test de carga simple con Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/health

# Verificar response times
# 50% < 50ms
# 95% < 100ms
# 99% < 200ms

# Test de query optimization
# Abrir Prisma Studio y verificar queries
npx prisma studio
```

### 5. Verificar Métricas

```bash
# Health check detallado
curl http://localhost:3000/api/health/detailed | jq

# Métricas del sistema
curl http://localhost:3000/api/health/metrics | jq

# Verificar que reporta:
# - Uptime
# - Memory usage
# - Database stats
# - Active sessions/rooms
```

---

## Siguientes Pasos

Una vez completada la iteración 4, proceder a:

📖 **Iteración 5** - Deploy & Monitoring (CI/CD, Docker, métricas)

**Estado**: 🚀 EN PROGRESO | Siguiente: ☁️ ITERACIÓN 5

---

## Recursos Adicionales

### Herramientas Recomendadas

**Testing:**
- Jest (unitarios)
- Supertest (E2E)
- Artillery (load testing)
- K6 (performance testing)

**Monitoring:**
- Winston (logging)
- Clinic.js (Node.js profiling)
- Chrome DevTools (memory profiling)

**Code Quality:**
- ESLint
- Prettier
- SonarQube (análisis estático)
- Husky (pre-commit hooks)

### Comandos Útiles

```bash
# Análisis de bundle size
npm run build
du -sh dist/

# Memory profiling
node --inspect dist/main.js
# Abrir chrome://inspect

# CPU profiling
node --prof dist/main.js
node --prof-process isolate-*.log > profile.txt

# Verificar dependencias obsoletas
npm outdated

# Audit de seguridad
npm audit
npm audit fix
```

### Métricas Objetivo

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Test Coverage | >80% | ___% |
| Response Time (REST) | <200ms | ___ms |
| Response Time (IA) | <3s | ___s |
| WebSocket Latency | <100ms | ___ms |
| Memory Usage | <500MB | ___MB |
| Uptime | >99.5% | ___% |
| Error Rate | <1% | ___% |

---

**¡Éxito en la implementación de la Iteración 4! 🚀✨**
