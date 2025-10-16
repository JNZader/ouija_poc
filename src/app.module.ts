import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { OuijaModule } from './modules/ouija/ouija.module';
import { MultiplayerModule } from './modules/multiplayer/multiplayer.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    OuijaModule,
    MultiplayerModule,
    HealthModule,
  ],
})
export class AppModule {}
