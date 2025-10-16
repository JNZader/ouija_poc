import { Module } from '@nestjs/common';
import { HealthController, MetricsController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [PrismaModule, MetricsModule],
  controllers: [HealthController, MetricsController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
