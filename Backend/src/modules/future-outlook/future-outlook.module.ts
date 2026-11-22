import { Module } from '@nestjs/common';
import { FutureOutlookService } from './future-outlook.service';
import { FutureOutlookController } from './future-outlook.controller';

@Module({
  controllers: [FutureOutlookController],
  providers: [FutureOutlookService],
  exports: [FutureOutlookService],
})
export class FutureOutlookModule {}
