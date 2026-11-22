import { PartialType } from '@nestjs/swagger';
import { CreateBenchmarkDto } from './create-benchmark.dto';

export class UpdateBenchmarkDto extends PartialType(CreateBenchmarkDto) {}
