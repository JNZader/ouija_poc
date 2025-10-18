import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger-setup';

/**
 * main.ts - Punto de entrada de la aplicación con Swagger
 *
 * Este es el archivo main.ts completo con todas las configuraciones
 * necesarias, incluyendo Swagger/OpenAPI.
 *
 * Configuraciones incluidas:
 * - CORS (Cross-Origin Resource Sharing)
 * - Validación automática de DTOs
 * - Swagger/OpenAPI documentation
 * - Logging personalizado
 * - Variables de entorno
 *
 * @see IT1-005 en guia-desarrollo-incremental-backend/iteracion-1/TAREAS.md
 */
async function bootstrap() {
  // Crear aplicación NestJS
  const app = await NestFactory.create(AppModule, {
    // Configuración de logging
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // ==============================================
  // CORS Configuration
  // ==============================================
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost',
    'http://localhost:80',
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  console.log('✅ CORS enabled for origins:', corsOrigins);

  // ==============================================
  // Global Validation Pipe
  // ==============================================
  app.useGlobalPipes(
    new ValidationPipe({
      // Eliminar propiedades no definidas en el DTO
      whitelist: true,

      // Transformar tipos automáticamente (strings a numbers, etc.)
      transform: true,

      // Lanzar error si hay propiedades no definidas
      forbidNonWhitelisted: true,

      // Transformar payloads a instancias de DTO
      transformOptions: {
        enableImplicitConversion: true,
      },

      // Mensajes de error detallados
      disableErrorMessages: false,
    }),
  );

  console.log('✅ Global validation pipe configured');

  // ==============================================
  // Swagger/OpenAPI Documentation
  // ==============================================
  setupSwagger(app);

  // ==============================================
  // Start Server
  // ==============================================
  const port = process.env.PORT || 3001;
  await app.listen(port);

  // ==============================================
  // Startup Messages
  // ==============================================
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║       🔮  OUIJA VIRTUAL - BACKEND RUNNING  🔮         ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server:        http://localhost:${port}`);
  console.log(`📚 API Docs:      http://localhost:${port}/api`);
  console.log(`📄 OpenAPI JSON:  http://localhost:${port}/api-json`);
  console.log(`💚 Health Check:  http://localhost:${port}/health`);
  console.log('');
  console.log(`🌍 Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Database:      SQLite (${process.env.DATABASE_URL || 'file:./prisma/dev.db'})`);
  console.log(`🤖 Ollama:        ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
  console.log(`🚀 Groq:          ${process.env.GROQ_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log('');
  console.log('Press CTRL+C to stop');
  console.log('');
}

// Iniciar aplicación
bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});

/**
 * Manejo de señales de terminación
 */
process.on('SIGTERM', () => {
  console.log('\n⚠️ SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️ SIGINT signal received: closing HTTP server');
  process.exit(0);
});
