import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AssessmentsService } from '../assessments/assessments.service';
import { ReportsService } from '../reports/reports.service';
import { WorkflowStatus } from '@prisma/client';

describe('Workflow State Machine & Product Locks Spec', () => {
  let reviewsService: ReviewsService;
  let assessmentsService: AssessmentsService;
  let reportsService: ReportsService;

  let mockPrisma: any;
  let mockCalcEngine: any;
  let mockBenchmarkResolver: any;
  let mockAnalytics: any;
  let mockFutureOutlook: any;

  beforeEach(() => {
    mockPrisma = {
      annualReview: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      clientHousehold: {
        findUnique: jest.fn(),
      },
      property: {
        findMany: jest.fn(),
      },
      propertyFinancialSnapshot: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      loanFinancialSnapshot: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      assessmentCriterion: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      reportSnapshot: {
        upsert: jest.fn(),
      },
    };

    mockCalcEngine = {
      calculatePropertyMetrics: jest.fn().mockReturnValue({}),
      calculatePortfolioMetrics: jest.fn().mockReturnValue({}),
    };

    mockBenchmarkResolver = {
      resolveBenchmark: jest.fn().mockResolvedValue({ tierMatched: 1, benchmark: {} }),
    };

    mockAnalytics = {
      getPortfolioOverview: jest.fn().mockResolvedValue({ portfolioSummary: {} }),
      getPropertyAnalysis: jest.fn().mockResolvedValue({ properties: [] }),
      getCashManagement: jest.fn().mockResolvedValue({}),
      getCapitalManagement: jest.fn().mockResolvedValue({}),
    };

    mockFutureOutlook = {
      getScenario: jest.fn().mockResolvedValue({ heroOutputs: {}, levers: {}, yearByYearProjections: [] }),
    };

    reviewsService = new ReviewsService(mockPrisma, mockCalcEngine, mockBenchmarkResolver);
    assessmentsService = new AssessmentsService(mockPrisma);
    reportsService = new ReportsService(mockPrisma, mockAnalytics, mockFutureOutlook);
  });

  describe('1. Review Initiation & State Machine Transitions', () => {
    it('creates review with finDataStatus = IN_PROGRESS and tchReviewStatus = NOT_STARTED', async () => {
      mockPrisma.clientHousehold.findUnique.mockResolvedValue({ id: 'h1', adviserId: 'adv-1' });
      mockPrisma.annualReview.findUnique.mockResolvedValue(null);
      mockPrisma.annualReview.create.mockImplementation((args: any) => ({
        id: 'rev-1',
        ...args.data,
      }));

      const review = await reviewsService.createReview('adv-1', 'h1', { financialYear: 2026 });

      expect(review.finDataStatus).toBe(WorkflowStatus.IN_PROGRESS);
      expect(review.tchReviewStatus).toBe(WorkflowStatus.NOT_STARTED);
    });

    it('startReview FAILS if finDataStatus is NOT COMPLETED', async () => {
      mockPrisma.annualReview.findUnique.mockResolvedValue({
        id: 'rev-1',
        finDataStatus: WorkflowStatus.IN_PROGRESS, // not completed
        tchReviewStatus: WorkflowStatus.NOT_STARTED,
        household: { adviserId: 'adv-1' },
      });

      await expect(reviewsService.startReview('adv-1', 'rev-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('2. Financial Snapshots Lock on Completed Review', () => {
    it('blocks saving property snapshots if tchReviewStatus === COMPLETED', async () => {
      mockPrisma.annualReview.findUnique.mockResolvedValue({
        id: 'rev-1',
        tchReviewStatus: WorkflowStatus.COMPLETED,
        household: { adviserId: 'adv-1' },
      });

      await expect(
        reviewsService.savePropertySnapshots('adv-1', 'rev-1', {
          snapshots: [
            {
              propertyId: 'p1',
              snapshotPoint: 'REVIEW_DATE' as any,
              valuation: 1000000,
            },
          ],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Adviser ★ Fields Lock', () => {
    it('blocks editing AssessmentCriterion ★ fields if tchReviewStatus is NOT IN_PROGRESS', async () => {
      mockPrisma.annualReview.findUnique.mockResolvedValue({
        id: 'rev-1',
        tchReviewStatus: WorkflowStatus.COMPLETED, // locked
        household: { adviserId: 'adv-1' },
      });

      await expect(
        assessmentsService.updateCriterion('adv-1', 'rev-1', 'crit-1', {
          insight: 'New insight',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4. Report Access Lock', () => {
    it('MANDATORY LOCK: GET /report MUST throw 403 Forbidden with exact message if tchReviewStatus !== COMPLETED', async () => {
      mockPrisma.annualReview.findUnique.mockResolvedValue({
        id: 'rev-1',
        tchReviewStatus: WorkflowStatus.IN_PROGRESS, // not completed yet
        household: { adviserId: 'adv-1' },
      });

      await expect(reportsService.generateReport('adv-1', 'rev-1')).rejects.toThrow(
        'Report cannot be viewed until TC&H Review is completed.',
      );
    });

    it('allows GET /report when tchReviewStatus === COMPLETED', async () => {
      mockPrisma.annualReview.findUnique.mockResolvedValue({
        id: 'rev-1',
        tchReviewStatus: WorkflowStatus.COMPLETED,
        household: { adviserId: 'adv-1', adviser: { id: 'adv-1' }, members: [] },
        criteria: [],
      });

      const report = await reportsService.generateReport('adv-1', 'rev-1');
      expect(report).toBeDefined();
      expect(report.reportMetadata.isCompleted).toBe(true);
    });
  });
});
