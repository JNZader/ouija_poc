import { Module } from '@nestjs/common';
import { MultiplayerGateway } from './gateways/multiplayer.gateway';
import { MultiplayerRoomService } from './services/multiplayer-room.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { OuijaModule } from '../ouija/ouija.module';

@Module({
  imports: [PrismaModule, OuijaModule],
  providers: [MultiplayerGateway, MultiplayerRoomService],
  exports: [MultiplayerRoomService],
})
export class MultiplayerModule {}
