import { Module } from '@nestjs/common';
import { OuijaController } from './controllers/ouija.controller';
import { AIService } from './services/ai.service';
import { ConversationService } from './services/conversation.service';
import { SpiritSessionService } from './services/spirit-session.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OuijaController],
  providers: [AIService, ConversationService, SpiritSessionService],
  exports: [AIService, ConversationService, SpiritSessionService],
})
export class OuijaModule {}
