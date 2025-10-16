import { Module } from '@nestjs/common';
import { OuijaController } from './controllers/ouija.controller';

@Module({
  controllers: [OuijaController],
  providers: [],
  exports: [],
})
export class OuijaModule {}
