import { Module } from '@nestjs/common';
import { BenchmarksService } from './benchmarks.service';
import { BenchmarksController } from './benchmarks.controller';
import { BenchmarkResolverService } from './benchmark-resolver.service';

@Module({
  controllers: [BenchmarksController],
  providers: [BenchmarksService, BenchmarkResolverService],
  exports: [BenchmarksService, BenchmarkResolverService],
})
export class BenchmarksModule {}
