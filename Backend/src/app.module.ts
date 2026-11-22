import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PublicModule } from './modules/public/public.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CalculationEngineModule } from './modules/calculation-engine/calculation-engine.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BenchmarksModule } from './modules/benchmarks/benchmarks.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { FutureOutlookModule } from './modules/future-outlook/future-outlook.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AuthModule,
    PublicModule,
    ClientsModule,
    ReviewsModule,
    CalculationEngineModule,
    AnalyticsModule,
    BenchmarksModule,
    AssessmentsModule,
    FutureOutlookModule,
    ReportsModule,
  ],
})
export class AppModule { }
