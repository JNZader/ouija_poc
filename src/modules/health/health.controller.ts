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
