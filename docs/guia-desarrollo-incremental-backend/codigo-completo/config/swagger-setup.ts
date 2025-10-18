import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configuración de Swagger/OpenAPI
 *
 * Este archivo configura Swagger para generar documentación automática
 * de la API REST del backend.
 *
 * Características:
 * - Documentación interactiva en /api
 * - JSON de OpenAPI en /api-json
 * - Soporte para múltiples tags
 * - Ejemplos de request/response
 * - Autenticación (si se implementa en el futuro)
 *
 * Instalación de dependencias necesarias:
 * ```bash
 * npm install @nestjs/swagger swagger-ui-express
 * ```
 *
 * Uso en main.ts:
 * ```typescript
 * import { setupSwagger } from './config/swagger-setup';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   setupSwagger(app);
 *   await app.listen(3001);
 * }
 * ```
 *
 * Acceso:
 * - UI: http://localhost:3001/api
 * - JSON: http://localhost:3001/api-json
 *
 * @see IT1-005 en guia-desarrollo-incremental-backend/iteracion-1/TAREAS.md
 * @see https://docs.nestjs.com/openapi/introduction
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    // Información básica de la API
    .setTitle('Ouija Virtual - Backend API')
    .setDescription(
      `
# Ouija Virtual - API Documentation

Bienvenido a la API de Ouija Virtual, un sistema de respuestas místicas con IA.

## Características

- **Triple Fallback System**: Groq → Ollama → Database
- **4 Personalidades**: Wise, Cryptic, Dark, Playful
- **9 Categorías**: Love, Career, Health, Family, Death, Future, Money, Spirituality, General
- **2 Idiomas**: Español (es), English (en)
- **Cache de Preguntas**: Respuestas consistentes para preguntas repetidas
- **Espíritu Molesto**: Respuestas especiales después de 3+ repeticiones

## Sistema de Fallback

1. **Groq** (Primario): IA en la nube, ultra-rápida (~500ms)
2. **Ollama** (Fallback 1): IA local en Docker (~5000ms)
3. **Database** (Fallback 2): Respuestas pre-definidas en SQLite

## Endpoints Principales

- \`POST /ouija/ask\` - Hacer una pregunta a la Ouija
- \`GET /health\` - Estado de salud del sistema
- \`GET /health/detailed\` - Estado detallado de todos los servicios

## Ejemplos de Uso

### Pregunta Básica
\`\`\`bash
curl -X POST http://localhost:3001/ouija/ask \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "¿Qué me depara el futuro?",
    "personality": "wise",
    "language": "es"
  }'
\`\`\`

### Respuesta
\`\`\`json
{
  "question": "¿Qué me depara el futuro?",
  "response": "Las estrellas indican un camino luminoso...",
  "personality": "wise",
  "language": "es",
  "category": "future",
  "source": "groq",
  "model": "llama-3.1-8b-instant"
}
\`\`\`

## Rate Limiting

- Desarrollo: Sin límites
- Producción: 10 requests/minuto por IP

## Soporte

- GitHub: https://github.com/tu-usuario/ouija-virtual
- Issues: https://github.com/tu-usuario/ouija-virtual/issues
    `.trim(),
    )
    .setVersion('1.0.0')
    .setContact(
      'Desarrollador',
      'https://github.com/tu-usuario',
      'tu-email@ejemplo.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')

    // Tags para organizar endpoints
    .addTag('ouija', 'Endpoints principales de la Ouija Virtual')
    .addTag('health', 'Endpoints de health checks y diagnóstico')
    .addTag('admin', 'Endpoints administrativos (futuro)')

    // Servidor (se puede configurar múltiples entornos)
    .addServer('http://localhost:3001', 'Desarrollo local')
    .addServer('https://ouija-backend.koyeb.app', 'Producción (Koyeb)')

    // Autenticación (comentado - para implementar en el futuro)
    // .addBearerAuth(
    //   {
    //     type: 'http',
    //     scheme: 'bearer',
    //     bearerFormat: 'JWT',
    //     name: 'JWT',
    //     description: 'Enter JWT token',
    //     in: 'header',
    //   },
    //   'JWT-auth',
    // )

    .build();

  // Crear documento de Swagger
  const document = SwaggerModule.createDocument(app, config, {
    // Opciones adicionales
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Setup de Swagger UI
  SwaggerModule.setup('api', app, document, {
    // Opciones de customización de la UI
    customSiteTitle: 'Ouija Virtual API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .info .title { color: #5c2d91 }
    `,
    swaggerOptions: {
      persistAuthorization: true, // Mantener auth al recargar
      displayRequestDuration: true, // Mostrar duración de requests
      filter: true, // Habilitar búsqueda
      tryItOutEnabled: true, // "Try it out" habilitado por defecto
    },
  });

  console.log('📚 Swagger documentation available at: http://localhost:3001/api');
  console.log('📄 OpenAPI JSON available at: http://localhost:3001/api-json');
}

/**
 * Decoradores útiles para documentar endpoints
 *
 * Ejemplo de uso en un controller:
 *
 * ```typescript
 * import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
 * import { OuijaQuestionDto } from './dto/ouija-question.dto';
 *
 * @ApiTags('ouija')
 * @Controller('ouija')
 * export class OuijaController {
 *   @Post('ask')
 *   @ApiOperation({
 *     summary: 'Hacer una pregunta a la Ouija',
 *     description: 'Envía una pregunta y recibe una respuesta mística generada por IA'
 *   })
 *   @ApiResponse({
 *     status: 200,
 *     description: 'Respuesta generada exitosamente',
 *     schema: {
 *       example: {
 *         question: "¿Qué me depara el futuro?",
 *         response: "Las estrellas indican un camino luminoso...",
 *         personality: "wise",
 *         language: "es",
 *         category: "future",
 *         source: "groq",
 *         model: "llama-3.1-8b-instant"
 *       }
 *     }
 *   })
 *   @ApiResponse({
 *     status: 400,
 *     description: 'Request inválido (pregunta vacía, personality incorrecta, etc.)'
 *   })
 *   @ApiResponse({
 *     status: 500,
 *     description: 'Error interno del servidor'
 *   })
 *   async ask(@Body() dto: OuijaQuestionDto) {
 *     return this.ouijaService.processQuestion(
 *       dto.question,
 *       dto.personality,
 *       dto.language
 *     );
 *   }
 * }
 * ```
 *
 * Decoradores en DTOs:
 *
 * ```typescript
 * import { ApiProperty } from '@nestjs/swagger';
 * import { IsNotEmpty, IsIn, IsOptional } from 'class-validator';
 *
 * export class OuijaQuestionDto {
 *   @ApiProperty({
 *     description: 'Pregunta para la Ouija',
 *     example: '¿Qué me depara el futuro?',
 *     minLength: 3,
 *     maxLength: 500,
 *   })
 *   @IsNotEmpty()
 *   question: string;
 *
 *   @ApiProperty({
 *     description: 'Personalidad de la respuesta',
 *     enum: ['wise', 'cryptic', 'dark', 'playful'],
 *     default: 'wise',
 *     example: 'wise',
 *   })
 *   @IsOptional()
 *   @IsIn(['wise', 'cryptic', 'dark', 'playful'])
 *   personality?: string;
 *
 *   @ApiProperty({
 *     description: 'Idioma de la respuesta',
 *     enum: ['es', 'en'],
 *     default: 'es',
 *     example: 'es',
 *   })
 *   @IsOptional()
 *   @IsIn(['es', 'en'])
 *   language?: string;
 * }
 * ```
 */
