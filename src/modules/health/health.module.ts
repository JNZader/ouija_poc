import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { OuijaModule } from '../ouija/ouija.module';

@Module({
  imports: [OuijaModule],
  controllers: [HealthController],
})
export class HealthModule {}
