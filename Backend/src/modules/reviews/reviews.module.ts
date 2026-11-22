import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { CalculationEngineModule } from '../calculation-engine/calculation-engine.module';
import { BenchmarksModule } from '../benchmarks/benchmarks.module';

@Module({
  imports: [CalculationEngineModule, BenchmarksModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
