import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBenchmarkDto } from './dto/create-benchmark.dto';
import { UpdateBenchmarkDto } from './dto/update-benchmark.dto';

@Injectable()
export class BenchmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.marketBenchmark.findMany({
      orderBy: [{ state: 'asc' }, { effectiveDate: 'desc' }],
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.marketBenchmark.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Market benchmark ${id} not found`);
    return item;
  }

  async create(dto: CreateBenchmarkDto) {
    return this.prisma.marketBenchmark.create({
      data: {
        effectiveDate: new Date(dto.effectiveDate),
        state: dto.state?.toUpperCase() || null,
        suburb: dto.suburb || null,
        propertyCategory: dto.propertyCategory || null,
        benchmarkInterestRate: dto.benchmarkInterestRate,
        benchmarkGrossYield: dto.benchmarkGrossYield,
        benchmarkWeeklyRent: dto.benchmarkWeeklyRent,
        benchmarkRentalGrowth: dto.benchmarkRentalGrowth,
        benchmarkCapitalGrowth: dto.benchmarkCapitalGrowth,
        sourceNotes: dto.sourceNotes,
      },
    });
  }

  async update(id: string, dto: UpdateBenchmarkDto) {
    await this.findOne(id);
    return this.prisma.marketBenchmark.update({
      where: { id },
      data: {
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        state: dto.state !== undefined ? dto.state?.toUpperCase() || null : undefined,
        suburb: dto.suburb !== undefined ? dto.suburb || null : undefined,
        propertyCategory: dto.propertyCategory !== undefined ? dto.propertyCategory || null : undefined,
        benchmarkInterestRate: dto.benchmarkInterestRate,
        benchmarkGrossYield: dto.benchmarkGrossYield,
        benchmarkWeeklyRent: dto.benchmarkWeeklyRent,
        benchmarkRentalGrowth: dto.benchmarkRentalGrowth,
        benchmarkCapitalGrowth: dto.benchmarkCapitalGrowth,
        sourceNotes: dto.sourceNotes,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.marketBenchmark.delete({ where: { id } });
  }
}
