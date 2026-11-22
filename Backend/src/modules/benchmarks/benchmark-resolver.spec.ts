import { BenchmarkResolverService } from './benchmark-resolver.service';

describe('BenchmarkResolverService (4-Tier Fallback Hierarchy)', () => {
  let resolver: BenchmarkResolverService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      marketBenchmark: {
        findFirst: jest.fn(),
      },
    };
    resolver = new BenchmarkResolverService(mockPrisma);
  });

  it('Tier 1: should match exact suburb + state + propertyCategory when available', async () => {
    mockPrisma.marketBenchmark.findFirst.mockResolvedValueOnce({
      id: 'bm-tier-1',
      suburb: 'Bondi',
      state: 'NSW',
      propertyCategory: 'Unit',
      benchmarkGrossYield: 0.042,
    });

    const result = await resolver.resolveBenchmark({
      suburb: 'Bondi',
      state: 'NSW',
      propertyCategory: 'Unit',
    });

    expect(result.tierMatched).toBe(1);
    expect(result.benchmark?.id).toBe('bm-tier-1');
    expect(result.tierDescription).toContain('Tier 1');
  });

  it('Tier 2: should fallback to state + propertyCategory when suburb has no direct match', async () => {
    // 1st call (tier 1 suburb) returns null
    mockPrisma.marketBenchmark.findFirst
      .mockResolvedValueOnce(null)
      // 2nd call (tier 2 state + category) returns match
      .mockResolvedValueOnce({
        id: 'bm-tier-2',
        state: 'NSW',
        propertyCategory: 'Unit',
        benchmarkGrossYield: 0.044,
      });

    const result = await resolver.resolveBenchmark({
      suburb: 'UnknownSuburb',
      state: 'NSW',
      propertyCategory: 'Unit',
    });

    expect(result.tierMatched).toBe(2);
    expect(result.benchmark?.id).toBe('bm-tier-2');
    expect(result.tierDescription).toContain('Tier 2');
  });

  it('Tier 3: should fallback to state general benchmark when category not matched', async () => {
    // Tier 1 and 2 return null
    mockPrisma.marketBenchmark.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      // Tier 3 match
      .mockResolvedValueOnce({
        id: 'bm-tier-3',
        state: 'NSW',
        benchmarkGrossYield: 0.039,
      });

    const result = await resolver.resolveBenchmark({
      suburb: 'UnknownSuburb',
      state: 'NSW',
      propertyCategory: 'SpecialCommercial',
    });

    expect(result.tierMatched).toBe(3);
    expect(result.benchmark?.id).toBe('bm-tier-3');
    expect(result.tierDescription).toContain('Tier 3');
  });

  it('Tier 4: should fallback to National default when state has no match', async () => {
    // Tier 1, 2, 3 return null
    mockPrisma.marketBenchmark.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      // Tier 4 National match
      .mockResolvedValueOnce({
        id: 'bm-tier-4',
        state: null,
        benchmarkGrossYield: 0.041,
      });

    const result = await resolver.resolveBenchmark({
      suburb: 'UnknownSuburb',
      state: 'TAS',
      propertyCategory: 'Rural',
    });

    expect(result.tierMatched).toBe(4);
    expect(result.benchmark?.id).toBe('bm-tier-4');
    expect(result.tierDescription).toContain('Tier 4');
  });
});
