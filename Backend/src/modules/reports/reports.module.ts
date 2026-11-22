import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { FutureOutlookModule } from '../future-outlook/future-outlook.module';

@Module({
  imports: [AnalyticsModule, FutureOutlookModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
