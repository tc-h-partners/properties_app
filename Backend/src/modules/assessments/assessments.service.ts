import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { CriterionPriority, CriterionRating, WorkflowStatus } from '@prisma/client';

function normalizePriority(raw?: CriterionPriority | string): CriterionPriority {
  if (!raw) return CriterionPriority.MEDIUM;
  const u = String(raw).toUpperCase().trim();
  if (u === 'HIGH') return CriterionPriority.HIGH;
  if (u === 'LOW') return CriterionPriority.LOW;
  if (u === 'MONITOR') return CriterionPriority.MONITOR;
  return CriterionPriority.MEDIUM;
}

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCriteria(adviserId: string, reviewId: string) {
    const review = await this.prisma.annualReview.findUnique({
      where: { id: reviewId },
      include: { household: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this client household');
    }

    return this.prisma.assessmentCriterion.findMany({
      where: { annualReviewId: reviewId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCriterion(
    adviserId: string,
    reviewId: string,
    dto: UpdateCriterionDto,
  ) {
    const review = await this.prisma.annualReview.findUnique({
      where: { id: reviewId },
      include: { household: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this client household');
    }

    const count = await this.prisma.assessmentCriterion.count({
      where: { annualReviewId: reviewId },
    });

    return this.prisma.assessmentCriterion.create({
      data: {
        annualReviewId: reviewId,
        category: dto.screen ? dto.screen.toUpperCase().replace(/\s+/g, '_') : 'PROPERTY_ANALYSIS',
        criterionCode: `INSIGHT_${Date.now()}`,
        criterionTitle: dto.criterionTitle || 'Adviser Review Insight',
        screen: dto.screen || 'Property Analysis',
        propertyName: dto.propertyName || 'Portfolio-Wide',
        maintenanceInsight: dto.maintenanceInsight || (dto.insight ? dto.insight.slice(0, 36) : '-'),
        metric: dto.metric || 'Rental Income',
        owner: dto.owner || 'Adviser',
        action: dto.action || 'Review',
        rating: dto.rating || CriterionRating.SATISFACTORY,
        insight: dto.insight || '',
        recommendation: dto.recommendation || '',
        potentialOpportunity: dto.potentialOpportunity || '',
        priority: normalizePriority(dto.priority),
        adviserNotes: dto.adviserNotes || '',
        sortOrder: count + 1,
      },
    });
  }

  async updateCriterion(
    adviserId: string,
    reviewId: string,
    criterionId: string,
    dto: UpdateCriterionDto,
  ) {
    const review = await this.prisma.annualReview.findUnique({
      where: { id: reviewId },
      include: { household: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this client household');
    }

    // LOCKED RULE: Adviser fields (★) are strictly locked unless tchReviewStatus === IN_PROGRESS
    if (review.tchReviewStatus !== WorkflowStatus.IN_PROGRESS) {
      if (review.tchReviewStatus === WorkflowStatus.NOT_STARTED) {
        // Auto-start TC&H review if adviser begins editing assessment criteria
        await this.prisma.annualReview.update({
          where: { id: reviewId },
          data: { tchReviewStatus: WorkflowStatus.IN_PROGRESS },
        });
      } else {
        throw new ForbiddenException(
          `Assessment criteria cannot be modified when TC&H review status is '${review.tchReviewStatus}'. It must be 'IN_PROGRESS'.`,
        );
      }
    }

    const criterion = await this.prisma.assessmentCriterion.findUnique({
      where: { id: criterionId },
      include: { annualReview: true },
    });

    if (!criterion) {
      throw new NotFoundException('Assessment criterion record not found');
    }

    if (criterion.annualReviewId !== reviewId) {
      if (criterion.annualReview?.householdId === review.householdId) {
        await this.prisma.assessmentCriterion.update({
          where: { id: criterionId },
          data: { annualReviewId: reviewId },
        });
      } else {
        throw new NotFoundException('Assessment criterion record not found for this review');
      }
    }

    return this.prisma.assessmentCriterion.update({
      where: { id: criterionId },
      data: {
        criterionTitle: dto.criterionTitle !== undefined ? dto.criterionTitle : undefined,
        screen: dto.screen !== undefined ? dto.screen : undefined,
        propertyName: dto.propertyName !== undefined ? dto.propertyName : undefined,
        maintenanceInsight: dto.maintenanceInsight !== undefined ? dto.maintenanceInsight : undefined,
        metric: dto.metric !== undefined ? dto.metric : undefined,
        owner: dto.owner !== undefined ? dto.owner : undefined,
        action: dto.action !== undefined ? dto.action : undefined,
        rating: dto.rating !== undefined ? dto.rating : undefined,
        insight: dto.insight !== undefined ? dto.insight : undefined,
        recommendation: dto.recommendation !== undefined ? dto.recommendation : undefined,
        potentialOpportunity: dto.potentialOpportunity !== undefined ? dto.potentialOpportunity : undefined,
        priority: dto.priority !== undefined ? normalizePriority(dto.priority) : undefined,
        adviserNotes: dto.adviserNotes !== undefined ? dto.adviserNotes : undefined,
      },
    });
  }

  async deleteCriterion(adviserId: string, reviewId: string, criterionId: string) {
    const review = await this.prisma.annualReview.findUnique({
      where: { id: reviewId },
      include: { household: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this client household');
    }

    return this.prisma.assessmentCriterion.delete({
      where: { id: criterionId },
    });
  }
}
