# Iteración 2: REST API Completa - Ouija Virtual API

## Duración: 1 semana
## Objetivo: Implementar API REST completa con todos los endpoints
## Story Points: 20-25
## Equipo: Backend Devs

---

# 🎯 OBJETIVOS DE LA ITERACIÓN

Al finalizar esta iteración, el equipo tendrá:

✅ Todos los endpoints REST funcionando
✅ Swagger/OpenAPI completamente documentado
✅ Validación robusta con class-validator
✅ Manejo de errores centralizado
✅ Postman collection para testing manual
✅ Tests E2E para todos los endpoints
✅ Rate limiting y seguridad básica implementada

---

# 📋 BACKLOG DE LA ITERACIÓN

## Épica 1: Implementar Controllers REST

### US-2.1: Crear OuijaController con Endpoints de Sesión
**Como** cliente frontend
**Quiero** endpoints REST para gestionar sesiones con espíritus
**Para** permitir a los usuarios comunicarse con la ouija

**Story Points**: 5
**Asignado a**: API Dev
**Prioridad**: CRÍTICA

#### Criterios de Aceptación
- [ ] POST /api/ouija/session/create - Crear nueva sesión
- [ ] POST /api/ouija/session/ask - Enviar mensaje en sesión
- [ ] POST /api/ouija/session/:token/end - Finalizar sesión
- [ ] GET /api/ouija/session/:token/history - Obtener historial
- [ ] GET /api/ouija/spirits - Listar espíritus disponibles
- [ ] GET /api/ouija/spirits/:id - Obtener espíritu específico
- [ ] Todos los endpoints documentados en Swagger
- [ ] Validación de DTOs funcionando
- [ ] Respuestas consistentes con status codes correctos

#### Tareas Técnicas

**T-2.1.1: Actualizar OuijaController completo** (2h)

```typescript
// src/modules/ouija/controllers/ouija.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
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
    description: 'Retorna todos los espíritus activos que pueden ser invocados para una sesión',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de espíritus disponibles',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
          name: { type: 'string', example: 'Morgana la Sabia' },
          personality: { type: 'string', example: 'wise' },
          backstory: { type: 'string', example: 'Una curandera medieval del siglo XII...' },
          language: { type: 'string', example: 'es' },
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
    description: 'UUID del espíritu',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del espíritu',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        personality: { type: 'string' },
        backstory: { type: 'string' },
        language: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Espíritu no encontrado' })
  async getSpiritById(@Param('id') id: string) {
    return this.sessionService.getSpiritById(id);
  }

  // ==========================================
  // ENDPOINTS DE SESIÓN
  // ==========================================

  @Post('session/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva sesión con un espíritu',
    description: 'Inicia una nueva sesión de conversación con el espíritu seleccionado. Retorna un token único para la sesión.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sesión creada exitosamente',
    type: SessionResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Espíritu no disponible o datos inválidos' })
  @ApiNotFoundResponse({ description: 'Espíritu no encontrado' })
  async createSession(@Body() dto: CreateSessionDto): Promise<SessionResponseDto> {
    return this.sessionService.createSession(dto);
  }

  @Post('session/ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar mensaje a un espíritu en sesión activa',
    description: 'Envía una pregunta o mensaje al espíritu y recibe su respuesta mística. La sesión debe estar activa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensaje enviado y respuesta recibida',
    type: ConversationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Sesión no activa o mensaje inválido' })
  @ApiNotFoundResponse({ description: 'Sesión no encontrada' })
  async sendMessage(@Body() dto: SendMessageDto): Promise<ConversationResponseDto> {
    return this.sessionService.sendMessage(dto);
  }

  @Post('session/:token/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finalizar sesión activa',
    description: 'Termina la sesión de conversación con el espíritu. El espíritu enviará un mensaje de despedida.',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único de la sesión',
    example: 'sess_1a2b3c4d_a1b2c3d4e5f6g7h8',
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
    description: 'Retorna todos los mensajes intercambiados en la sesión, incluyendo mensajes del usuario y del espíritu.',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único de la sesión',
    example: 'sess_1a2b3c4d_a1b2c3d4e5f6g7h8',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de la sesión',
    type: SessionHistoryDto,
  })
  @ApiNotFoundResponse({ description: 'Sesión no encontrada' })
  async getSessionHistory(@Param('token') token: string): Promise<SessionHistoryDto> {
    return this.sessionService.getSessionHistory(token);
  }

  @Get('session/:token/status')
  @ApiOperation({
    summary: 'Verificar estado de una sesión',
    description: 'Retorna información básica sobre el estado actual de la sesión (activa, finalizada, etc.)',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único de la sesión',
    example: 'sess_1a2b3c4d_a1b2c3d4e5f6g7h8',
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
```

**T-2.1.2: Crear HealthController para monitoring** (1h)

```typescript
// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AIService } from '../ouija/services/ai.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Health check básico',
    description: 'Verifica que la API esté funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'API funcionando correctamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string', example: 'ouija-virtual-api' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ouija-virtual-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('detailed')
  @ApiOperation({
    summary: 'Health check detallado',
    description: 'Verifica el estado de todos los componentes del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado detallado de los componentes',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        components: {
          type: 'object',
          properties: {
            database: { type: 'object' },
            aiEngines: { type: 'object' },
          },
        },
      },
    },
  })
  async detailedHealthCheck() {
    // Verificar base de datos
    let databaseStatus = 'ok';
    let databaseMessage = 'Connected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      databaseStatus = 'error';
      databaseMessage = error.message;
    }

    // Verificar motores de IA
    const aiEnginesHealth = await this.aiService.healthCheck();
    const aiEnginesInfo = this.aiService.getEnginesInfo();

    return {
      status: databaseStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'ouija-virtual-api',
      version: '1.0.0',
      components: {
        database: {
          status: databaseStatus,
          message: databaseMessage,
        },
        aiEngines: {
          configured: aiEnginesInfo,
          health: aiEnginesHealth,
        },
      },
    };
  }
}
```

**T-2.1.3: Crear HealthModule** (0.25h)

```typescript
// src/modules/health/health.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { OuijaModule } from '../ouija/ouija.module';

@Module({
  imports: [OuijaModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

**T-2.1.4: Actualizar AppModule** (0.25h)

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { OuijaModule } from './modules/ouija/ouija.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    OuijaModule,
    HealthModule,
  ],
})
export class AppModule {}
```

---

## Épica 2: Exception Filters y Validación

### US-2.2: Implementar Manejo de Errores Centralizado
**Como** desarrollador backend
**Quiero** un sistema de manejo de errores consistente
**Para** retornar respuestas de error claras y útiles

**Story Points**: 3
**Asignado a**: API Dev
**Prioridad**: ALTA

#### Criterios de Aceptación
- [ ] Exception filter global configurado
- [ ] Respuestas de error consistentes
- [ ] Logging de errores estructurado
- [ ] Stack traces ocultos en producción
- [ ] Status codes HTTP correctos

#### Tareas Técnicas

**T-2.2.1: Crear exception filters personalizados** (1.5h)

```typescript
// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
      ...(process.env.NODE_ENV === 'development' && exception instanceof Error && {
        stack: exception.stack,
      }),
    };

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Message: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }
}
```

**T-2.2.2: Crear validation pipe personalizado** (1h)

```typescript
// src/common/pipes/validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const formattedErrors = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
        value: error.value,
      }));

      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

**T-2.2.3: Aplicar filters y pipes globalmente en main.ts** (0.5h)

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api');

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
          value: error.value,
        }));
        return new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Ouija Virtual API')
    .setDescription(
      'API REST y WebSocket para comunicarse con espíritus virtuales impulsados por IA. ' +
      'Permite crear sesiones individuales o multiplayer con 4 personalidades de espíritus diferentes.',
    )
    .setVersion('1.0.0')
    .addTag('health', 'Endpoints de salud y monitoreo del sistema')
    .addTag('ouija', 'Endpoints de sesiones individuales con espíritus')
    .addTag('multiplayer', 'Endpoints de salas multiplayer (WebSocket)')
    .addServer('http://localhost:3000', 'Desarrollo local')
    .addServer('https://api.ouija-virtual.com', 'Producción')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Ouija Virtual API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
  logger.log(`🔍 Health check at http://localhost:${port}/api/health`);
}

bootstrap();
```

---

## Épica 3: Postman Collection y Testing

### US-2.3: Crear Postman Collection para Testing Manual
**Como** desarrollador o QA
**Quiero** una colección de Postman completa
**Para** probar manualmente todos los endpoints

**Story Points**: 2
**Asignado a**: API Dev
**Prioridad**: MEDIA

#### Tareas Técnicas

**T-2.3.1: Crear Postman Collection** (1.5h)

```json
// postman/Ouija-Virtual-API.postman_collection.json
{
  "info": {
    "name": "Ouija Virtual API",
    "description": "Colección completa de endpoints para la API de Ouija Virtual",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "version": "1.0.0"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api",
      "type": "string"
    },
    {
      "key": "sessionToken",
      "value": "",
      "type": "string"
    },
    {
      "key": "spiritId",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Health",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/health",
              "host": ["{{baseUrl}}"],
              "path": ["health"]
            }
          }
        },
        {
          "name": "Detailed Health Check",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/health/detailed",
              "host": ["{{baseUrl}}"],
              "path": ["health", "detailed"]
            }
          }
        }
      ]
    },
    {
      "name": "Spirits",
      "item": [
        {
          "name": "Get Available Spirits",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 200', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test('Response is an array', function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.be.an('array');",
                  "});",
                  "",
                  "// Save first spirit ID for later use",
                  "const spirits = pm.response.json();",
                  "if (spirits.length > 0) {",
                  "    pm.collectionVariables.set('spiritId', spirits[0].id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/ouija/spirits",
              "host": ["{{baseUrl}}"],
              "path": ["ouija", "spirits"]
            }
          }
        },
        {
          "name": "Get Spirit By ID",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/ouija/spirits/{{spiritId}}",
              "host": ["{{baseUrl}}"],
              "path": ["ouija", "spirits", "{{spiritId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "Session",
      "item": [
        {
          "name": "Create Session",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 201', function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "",
                  "pm.test('Response has sessionToken', function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('sessionToken');",
                  "    pm.collectionVariables.set('sessionToken', jsonData.sessionToken);",
                  "});",
                  "",
                  "pm.test('Response has welcomeMessage', function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('welcomeMessage');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"spiritId\": \"{{spiritId}}\",\n  \"userId\": \"user_test_123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/ouija/session/create",
              "host": ["{{baseUrl}}"],
              "path": ["ouija", "session", "create"]
            }
          }
        },
        {
          "name": "Send Message",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 200', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test('Response has userMessage', function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('userMessage');",
                  "});",
                  "",
                  "pm.test('Response has spiritResponse', function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('spiritResponse');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"sessionToken\": \"{{sessionToken}}\",\n  \"message\": \"¿Cuál es mi destino?\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/ouija/session/ask",
              "host": ["{{baseUrl}}"],
              "path": ["ouija", "session", "ask"]
            }
          }
        },
        {
          "name": "Get Session History",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/ouija/session/{{sessionToken}}/history",
              "host": ["{{baseUrl}}"],
              "path": ["ouija", "session", "{{sessionToken}}", "history"]
            }
          }
        },
        {
          "name": "Get Session Status",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/ouija/session/{{sessionToken}}/status",
              "host": ["{{baseUrl}}"],
              "path": ["ouija", "session", "{{sessionToken}}", "status"]
            }
          }
        },
        {
          "name": "End Session",
          "request": {
            "method": "POST",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/ouija/session/{{sessionToken}}/end",
              "host": ["{{baseUrl}}"],
              "path": ["ouija", "session", "{{sessionToken}}", "end"]
            }
          }
        }
      ]
    }
  ]
}
```

**T-2.3.2: Crear Postman Environment** (0.25h)

```json
// postman/Ouija-Virtual-API.postman_environment.json
{
  "name": "Ouija Virtual - Local",
  "values": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api",
      "type": "default",
      "enabled": true
    },
    {
      "key": "sessionToken",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "spiritId",
      "value": "",
      "type": "default",
      "enabled": true
    }
  ]
}
```

**T-2.3.3: Crear README de Postman** (0.25h)

```markdown
// postman/README.md
# Postman Collection - Ouija Virtual API

## Instalación

1. Abre Postman
2. Click en "Import"
3. Arrastra los archivos:
   - `Ouija-Virtual-API.postman_collection.json`
   - `Ouija-Virtual-API.postman_environment.json`

## Uso

### 1. Configurar Environment
- Selecciona el environment "Ouija Virtual - Local"
- Verifica que `baseUrl` apunte a `http://localhost:3000/api`

### 2. Flujo de Prueba Completo

**Paso 1: Health Check**
```
GET /health
```
Verifica que la API esté funcionando.

**Paso 2: Obtener Espíritus**
```
GET /ouija/spirits
```
Obtiene la lista de espíritus disponibles. Guarda automáticamente el ID del primer espíritu.

**Paso 3: Crear Sesión**
```
POST /ouija/session/create
Body: { "spiritId": "{{spiritId}}" }
```
Crea una nueva sesión. Guarda automáticamente el `sessionToken`.

**Paso 4: Enviar Mensajes**
```
POST /ouija/session/ask
Body: { "sessionToken": "{{sessionToken}}", "message": "Tu pregunta" }
```
Envía mensajes al espíritu y recibe respuestas.

**Paso 5: Ver Historial**
```
GET /ouija/session/{{sessionToken}}/history
```
Obtiene todo el historial de conversación.

**Paso 6: Finalizar Sesión**
```
POST /ouija/session/{{sessionToken}}/end
```
Termina la sesión con un mensaje de despedida del espíritu.

## Tests Automáticos

La colección incluye tests automáticos que:
- Verifican status codes
- Validan estructura de respuestas
- Guardan variables automáticamente
- Verifican propiedades requeridas

## Variables de Colección

- `baseUrl`: URL base de la API
- `sessionToken`: Token de sesión actual (se guarda automáticamente)
- `spiritId`: ID del espíritu seleccionado (se guarda automáticamente)

## Ejemplos de Mensajes

### Para Morgana (Wise)
- "¿Cuál es mi propósito en la vida?"
- "¿Cómo puedo encontrar la paz interior?"
- "¿Qué me depara el futuro?"

### Para Azazel (Cryptic)
- "¿Qué secretos oculta el universo?"
- "¿Cuál es el significado del número 7?"
- "Descifra mi destino"

### Para Lilith (Dark)
- "¿Qué oscuridad me espera?"
- "¿Cuál es mi mayor miedo?"
- "Háblame de las sombras"

### Para Puck (Playful)
- "Cuéntame un chiste del más allá"
- "¿Qué travesura recomiendas?"
- "Sorpréndeme con algo divertido"
```

---

## Épica 4: Tests E2E

### US-2.4: Crear Tests E2E para Todos los Endpoints
**Como** desarrollador backend
**Quiero** tests end-to-end automatizados
**Para** verificar que toda la API funciona correctamente

**Story Points**: 5
**Asignado a**: Backend Dev / QA
**Prioridad**: ALTA

#### Tareas Técnicas

**T-2.4.1: Configurar testing E2E** (0.5h)

```typescript
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": [
    "**/*.(t|j)s"
  ],
  "coverageDirectory": "../coverage-e2e",
  "testTimeout": 30000
}
```

**T-2.4.2: Crear tests E2E para Ouija endpoints** (3h)

```typescript
// test/ouija.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Ouija API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let spiritId: string;
  let sessionToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Asegurar que hay al menos un espíritu activo
    const spirits = await prisma.spirit.findMany({
      where: { isActive: true },
      take: 1,
    });

    if (spirits.length === 0) {
      throw new Error('No spirits found in database. Run seed first.');
    }

    spiritId = spirits[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('/api/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('service');
        });
    });

    it('/api/health/detailed (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('components');
          expect(res.body.components).toHaveProperty('database');
          expect(res.body.components).toHaveProperty('aiEngines');
        });
    });
  });

  describe('Spirit Endpoints', () => {
    it('/api/ouija/spirits (GET) - should return list of spirits', () => {
      return request(app.getHttpServer())
        .get('/api/ouija/spirits')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('personality');
        });
    });

    it('/api/ouija/spirits/:id (GET) - should return specific spirit', () => {
      return request(app.getHttpServer())
        .get(`/api/ouija/spirits/${spiritId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', spiritId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('personality');
          expect(res.body).toHaveProperty('backstory');
        });
    });

    it('/api/ouija/spirits/:id (GET) - should return 404 for invalid spirit', () => {
      return request(app.getHttpServer())
        .get('/api/ouija/spirits/invalid-uuid-12345')
        .expect(404);
    });
  });

  describe('Session Endpoints', () => {
    it('/api/ouija/session/create (POST) - should create new session', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/create')
        .send({ spiritId })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionToken');
          expect(res.body).toHaveProperty('welcomeMessage');
          expect(res.body).toHaveProperty('spirit');
          expect(res.body.spirit).toHaveProperty('id', spiritId);

          // Save token for next tests
          sessionToken = res.body.sessionToken;
        });
    });

    it('/api/ouija/session/create (POST) - should validate spiritId', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/create')
        .send({ spiritId: 'invalid' })
        .expect(400);
    });

    it('/api/ouija/session/create (POST) - should return 404 for non-existent spirit', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/create')
        .send({ spiritId: '123e4567-e89b-12d3-a456-426614174999' })
        .expect(404);
    });

    it('/api/ouija/session/:token/status (GET) - should return session status', () => {
      return request(app.getHttpServer())
        .get(`/api/ouija/session/${sessionToken}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionToken', sessionToken);
          expect(res.body).toHaveProperty('status', 'active');
          expect(res.body).toHaveProperty('spiritName');
          expect(res.body).toHaveProperty('messageCount');
        });
    });

    it('/api/ouija/session/ask (POST) - should send message and get response', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({
          sessionToken,
          message: '¿Cuál es mi destino?',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userMessage');
          expect(res.body).toHaveProperty('spiritResponse');
          expect(res.body.userMessage).toHaveProperty('content', '¿Cuál es mi destino?');
          expect(res.body.spiritResponse).toHaveProperty('content');
          expect(res.body.spiritResponse.content).toBeTruthy();
        });
    }, 30000); // Timeout de 30s para esperar respuesta de IA

    it('/api/ouija/session/ask (POST) - should validate message length', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({
          sessionToken,
          message: '', // Empty message
        })
        .expect(400);
    });

    it('/api/ouija/session/ask (POST) - should reject message too long', () => {
      const longMessage = 'a'.repeat(501);
      return request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({
          sessionToken,
          message: longMessage,
        })
        .expect(400);
    });

    it('/api/ouija/session/:token/history (GET) - should return session history', () => {
      return request(app.getHttpServer())
        .get(`/api/ouija/session/${sessionToken}/history`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionToken', sessionToken);
          expect(res.body).toHaveProperty('messages');
          expect(res.body.messages).toBeInstanceOf(Array);
          expect(res.body.messages.length).toBeGreaterThan(1);

          // Should have welcome message and user message
          const welcomeMsg = res.body.messages.find((m) => m.role === 'spirit');
          const userMsg = res.body.messages.find((m) => m.role === 'user');
          expect(welcomeMsg).toBeDefined();
          expect(userMsg).toBeDefined();
        });
    });

    it('/api/ouija/session/:token/end (POST) - should end session', () => {
      return request(app.getHttpServer())
        .post(`/api/ouija/session/${sessionToken}/end`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('endedAt');
        });
    });

    it('/api/ouija/session/:token/end (POST) - should not end already ended session', () => {
      return request(app.getHttpServer())
        .post(`/api/ouija/session/${sessionToken}/end`)
        .expect(400);
    });

    it('/api/ouija/session/ask (POST) - should not send message to ended session', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({
          sessionToken,
          message: 'Test message',
        })
        .expect(400);
    });
  });

  describe('Complete Session Flow', () => {
    it('should handle complete session lifecycle', async () => {
      // 1. Create session
      const createRes = await request(app.getHttpServer())
        .post('/api/ouija/session/create')
        .send({ spiritId })
        .expect(201);

      const token = createRes.body.sessionToken;

      // 2. Send multiple messages
      await request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({ sessionToken: token, message: '¿Quién eres?' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({ sessionToken: token, message: '¿Puedes ayudarme?' })
        .expect(200);

      // 3. Check history
      const historyRes = await request(app.getHttpServer())
        .get(`/api/ouija/session/${token}/history`)
        .expect(200);

      expect(historyRes.body.messages.length).toBeGreaterThanOrEqual(5);
      // welcome + user1 + spirit1 + user2 + spirit2

      // 4. End session
      await request(app.getHttpServer())
        .post(`/api/ouija/session/${token}/end`)
        .expect(200);

      // 5. Verify session is ended
      const statusRes = await request(app.getHttpServer())
        .get(`/api/ouija/session/${token}/status`)
        .expect(200);

      expect(statusRes.body.status).toBe('ended');
    }, 60000);
  });
});
```

**T-2.4.3: Agregar scripts de testing al package.json** (0.25h)

```json
// package.json (agregar estos scripts)
{
  "scripts": {
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:e2e:watch": "jest --config ./test/jest-e2e.json --watch",
    "test:e2e:cov": "jest --config ./test/jest-e2e.json --coverage"
  }
}
```

**T-2.4.4: Ejecutar tests E2E** (0.25h)

```bash
# Asegurar que el servidor está corriendo y la DB está lista
docker-compose up -d postgres redis
npm run prisma:migrate:dev
npm run prisma:seed

# Ejecutar tests E2E
npm run test:e2e

# Con cobertura
npm run test:e2e:cov
```

---

## Épica 5: Rate Limiting y Seguridad

### US-2.5: Implementar Rate Limiting y Medidas de Seguridad
**Como** administrador del sistema
**Quiero** protección contra abuso de la API
**Para** mantener el servicio estable y seguro

**Story Points**: 3
**Asignado a**: Backend Dev
**Prioridad**: MEDIA

#### Tareas Técnicas

**T-2.5.1: Instalar dependencias de seguridad** (0.25h)

```bash
npm install --save @nestjs/throttler helmet
```

**T-2.5.2: Configurar rate limiting** (1h)

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { OuijaModule } from './modules/ouija/ouija.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 segundo
        limit: 3, // 3 requests por segundo
      },
      {
        name: 'medium',
        ttl: 10000, // 10 segundos
        limit: 20, // 20 requests por 10 segundos
      },
      {
        name: 'long',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),
    PrismaModule,
    OuijaModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

**T-2.5.3: Aplicar helmet para seguridad de headers** (0.5h)

```typescript
// src/main.ts (agregar después de crear la app)
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));

  // ... resto del código
}
```

**T-2.5.4: Crear decorador para skip rate limiting en health checks** (0.5h)

```typescript
// src/common/decorators/skip-throttle.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const SKIP_THROTTLE_KEY = 'skipThrottle';
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
```

```typescript
// src/modules/health/health.controller.ts (actualizar)
import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @SkipThrottle()
  @Get()
  healthCheck() {
    // ... código existente
  }

  @SkipThrottle()
  @Get('detailed')
  async detailedHealthCheck() {
    // ... código existente
  }
}
```

**T-2.5.5: Actualizar .env con configuración de rate limiting** (0.25h)

```bash
# .env (agregar)
# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Security
CORS_ORIGINS="http://localhost:3001,http://localhost:5173"
```

---

## Checklist de Cierre de Iteración 2

### Validación Técnica
- [ ] Todos los endpoints REST funcionando correctamente
- [ ] Swagger documentation completa y accesible
- [ ] Validación de DTOs funcionando en todos los endpoints
- [ ] Exception filters aplicados globalmente
- [ ] Postman collection funcionando
- [ ] Tests E2E pasando al 100%
- [ ] Rate limiting configurado y funcionando
- [ ] Headers de seguridad aplicados

### Pruebas Manuales
- [ ] Probar flujo completo con Postman
- [ ] Verificar respuestas de error correctas
- [ ] Probar rate limiting (enviar muchas requests)
- [ ] Verificar Swagger UI
- [ ] Probar con datos inválidos
- [ ] Verificar CORS desde navegador

### Documentación
- [ ] Swagger completo con ejemplos
- [ ] Postman collection documentada
- [ ] README actualizado con endpoints
- [ ] Ejemplos de request/response documentados

### Code Quality
- [ ] Linting sin errores
- [ ] TypeScript sin errores
- [ ] Code review completado
- [ ] Coverage de tests >80%

### Performance
- [ ] Response times < 200ms (sin IA)
- [ ] Response times < 3s (con IA)
- [ ] No memory leaks
- [ ] Database queries optimizadas

---

## Testing Manual - Guía Rápida

### 1. Verificar que todo está corriendo

```bash
# Verificar contenedores
docker-compose ps

# Verificar health
curl http://localhost:3000/api/health

# Verificar Swagger
open http://localhost:3000/api/docs
```

### 2. Flujo de Prueba con cURL

```bash
# 1. Obtener espíritus
curl http://localhost:3000/api/ouija/spirits | jq

# 2. Crear sesión (copiar un spiritId del paso anterior)
curl -X POST http://localhost:3000/api/ouija/session/create \
  -H "Content-Type: application/json" \
  -d '{"spiritId":"SPIRIT_ID_AQUI"}' | jq

# Guardar el sessionToken de la respuesta

# 3. Enviar mensaje
curl -X POST http://localhost:3000/api/ouija/session/ask \
  -H "Content-Type: application/json" \
  -d '{"sessionToken":"SESSION_TOKEN_AQUI","message":"¿Cuál es mi destino?"}' | jq

# 4. Ver historial
curl http://localhost:3000/api/ouija/session/SESSION_TOKEN_AQUI/history | jq

# 5. Finalizar sesión
curl -X POST http://localhost:3000/api/ouija/session/SESSION_TOKEN_AQUI/end | jq
```

### 3. Verificar Rate Limiting

```bash
# Enviar 50 requests rápidas (debería empezar a rechazar)
for i in {1..50}; do
  curl -X GET http://localhost:3000/api/ouija/spirits -w "\n%{http_code}\n"
  sleep 0.1
done
```

---

## Siguientes Pasos

Una vez completada la iteración 2, proceder a:

📖 **Iteración 3** - Implementar WebSocket Gateway y Multiplayer

**Estado**: ✅ COMPLETADO | Siguiente: 🚀 ITERACIÓN 3

---

## Recursos Adicionales

### Comandos Útiles

```bash
# Desarrollo
npm run start:dev

# Ver logs en tiempo real
docker-compose logs -f

# Prisma Studio
npx prisma studio

# Tests
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage

# Linting
npm run lint
npm run format

# Health check detallado
curl http://localhost:3000/api/health/detailed | jq
```

### Troubleshooting

**Problema: Validation no funciona**
- Verificar que ValidationPipe esté configurado globalmente en main.ts
- Verificar que los DTOs tengan decoradores de class-validator
- Revisar que class-transformer esté instalado

**Problema: Swagger no muestra endpoints**
- Verificar que los controllers tengan @ApiTags
- Verificar que main.ts tenga SwaggerModule.setup
- Limpiar caché del navegador

**Problema: CORS errors**
- Verificar ALLOWED_ORIGINS en .env
- Verificar configuración de CORS en main.ts
- Verificar que el frontend esté usando la URL correcta

**Problema: Rate limiting muy estricto**
- Ajustar valores en ThrottlerModule
- Usar @SkipThrottle() en endpoints que no necesitan limiting
- Verificar que no haya múltiples guards aplicados

---

**¡Éxito en la implementación de la Iteración 2! 🚀**
