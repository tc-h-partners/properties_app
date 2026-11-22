import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { CalculationEngineModule } from '../calculation-engine/calculation-engine.module';
import { BenchmarksModule } from '../benchmarks/benchmarks.module';

@Module({
  imports: [CalculationEngineModule, BenchmarksModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
