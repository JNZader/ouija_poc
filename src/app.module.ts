import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { OuijaModule } from './modules/ouija/ouija.module';
import { MultiplayerModule } from './modules/multiplayer/multiplayer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    OuijaModule,
    MultiplayerModule,
  ],
})
export class AppModule {}
