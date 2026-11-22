import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { WorkflowStatus } from '@prisma/client';

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
      throw new ForbiddenException(
        `Assessment criteria cannot be modified when TC&H review status is '${review.tchReviewStatus}'. It must be 'IN_PROGRESS'.`,
      );
    }

    const criterion = await this.prisma.assessmentCriterion.findUnique({
      where: { id: criterionId },
    });

    if (!criterion || criterion.annualReviewId !== reviewId) {
      throw new NotFoundException('Assessment criterion record not found for this review');
    }

    return this.prisma.assessmentCriterion.update({
      where: { id: criterionId },
      data: {
        rating: dto.rating !== undefined ? dto.rating : undefined,
        insight: dto.insight !== undefined ? dto.insight : undefined,
        recommendation: dto.recommendation !== undefined ? dto.recommendation : undefined,
        potentialOpportunity: dto.potentialOpportunity !== undefined ? dto.potentialOpportunity : undefined,
        priority: dto.priority !== undefined ? dto.priority : undefined,
        adviserNotes: dto.adviserNotes !== undefined ? dto.adviserNotes : undefined,
      },
    });
  }
}
