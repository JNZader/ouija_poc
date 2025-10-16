import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { MetricsService } from '../metrics/metrics.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with dependencies' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health status of all services',
  })
  async detailedCheck() {
    return this.healthService.getDetailedHealth();
  }

  @Get('live')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  async liveness() {
    return { status: 'alive' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  async readiness() {
    const isReady = await this.healthService.isReady();
    if (!isReady) {
      return { status: 'not_ready', ready: false };
    }
    return { status: 'ready', ready: true };
  }
}

@ApiTags('monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Metrics in Prometheus format' })
  getPrometheusMetrics() {
    return this.metricsService.getPrometheusMetrics();
  }

  @Get('json')
  @ApiOperation({ summary: 'Metrics in JSON format' })
  @ApiResponse({ status: 200, description: 'Metrics in JSON format' })
  getJsonMetrics() {
    return this.metricsService.getAllMetrics();
  }
}
