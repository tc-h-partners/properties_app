import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BenchmarksService } from './benchmarks.service';
import { CreateBenchmarkDto } from './dto/create-benchmark.dto';
import { UpdateBenchmarkDto } from './dto/update-benchmark.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Market Benchmarks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('benchmarks')
export class BenchmarksController {
  constructor(private readonly benchmarksService: BenchmarksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new market benchmark record' })
  create(@Body() dto: CreateBenchmarkDto) {
    return this.benchmarksService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all market benchmark records' })
  findAll() {
    return this.benchmarksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get market benchmark by ID' })
  findOne(@Param('id') id: string) {
    return this.benchmarksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a market benchmark record' })
  update(@Param('id') id: string, @Body() dto: UpdateBenchmarkDto) {
    return this.benchmarksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a market benchmark record' })
  remove(@Param('id') id: string) {
    return this.benchmarksService.remove(id);
  }
}
