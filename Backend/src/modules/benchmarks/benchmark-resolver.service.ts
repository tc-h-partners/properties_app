import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketBenchmark } from '@prisma/client';

export interface PropertyBenchmarkTarget {
  state?: string | null;
  suburb?: string | null;
  propertyCategory?: string | null;
  asAtDate?: Date | string | null;
}

export interface ResolvedBenchmarkResult {
  tierMatched: 1 | 2 | 3 | 4 | null;
  tierDescription: string;
  benchmark: MarketBenchmark | null;
}

@Injectable()
export class BenchmarkResolverService {
  private readonly logger = new Logger(BenchmarkResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves market benchmark using 4-tier fallback:
   * 1. Exact suburb + state + propertyCategory (latest effectiveDate <= reviewDate)
   * 2. state + propertyCategory
   * 3. state (all categories)
   * 4. National default benchmark (state is null or 'AU' / 'NATIONAL')
   */
  async resolveBenchmark(target: PropertyBenchmarkTarget): Promise<ResolvedBenchmarkResult> {
    const targetDate = target.asAtDate ? new Date(target.asAtDate) : new Date();
    const state = target.state?.trim().toUpperCase() || null;
    const suburb = target.suburb?.trim() || null;
    const category = target.propertyCategory?.trim() || null;

    // Tier 1: Suburb + State + Category
    if (suburb && state && category) {
      const match = await this.prisma.marketBenchmark.findFirst({
        where: {
          effectiveDate: { lte: targetDate },
          suburb: { equals: suburb, mode: 'insensitive' },
          state: { equals: state, mode: 'insensitive' },
          propertyCategory: { equals: category, mode: 'insensitive' },
        },
        orderBy: { effectiveDate: 'desc' },
      });
      if (match) {
        return {
          tierMatched: 1,
          tierDescription: `Tier 1: Suburb (${suburb}), State (${state}), Category (${category})`,
          benchmark: match,
        };
      }
    }

    // Tier 2: State + Category
    if (state && category) {
      const match = await this.prisma.marketBenchmark.findFirst({
        where: {
          effectiveDate: { lte: targetDate },
          state: { equals: state, mode: 'insensitive' },
          propertyCategory: { equals: category, mode: 'insensitive' },
          suburb: null,
        },
        orderBy: { effectiveDate: 'desc' },
      });
      if (match) {
        return {
          tierMatched: 2,
          tierDescription: `Tier 2: State (${state}), Category (${category})`,
          benchmark: match,
        };
      }
    }

    // Tier 3: State only (all categories)
    if (state) {
      const match = await this.prisma.marketBenchmark.findFirst({
        where: {
          effectiveDate: { lte: targetDate },
          state: { equals: state, mode: 'insensitive' },
          suburb: null,
          propertyCategory: null,
        },
        orderBy: { effectiveDate: 'desc' },
      });
      if (match) {
        return {
          tierMatched: 3,
          tierDescription: `Tier 3: State (${state}) General`,
          benchmark: match,
        };
      }
    }

    // Tier 4: National Default
    const nationalMatch = await this.prisma.marketBenchmark.findFirst({
      where: {
        effectiveDate: { lte: targetDate },
        OR: [
          { state: null },
          { state: 'AU' },
          { state: 'NATIONAL' },
        ],
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (nationalMatch) {
      return {
        tierMatched: 4,
        tierDescription: 'Tier 4: National Benchmark Default',
        benchmark: nationalMatch,
      };
    }

    // Absolute fallback: any most recent benchmark in system
    const anyFallback = await this.prisma.marketBenchmark.findFirst({
      orderBy: { effectiveDate: 'desc' },
    });

    return {
      tierMatched: anyFallback ? 4 : null,
      tierDescription: anyFallback ? 'Tier 4: Global Benchmark Fallback' : 'No Benchmark Available',
      benchmark: anyFallback || null,
    };
  }
}
