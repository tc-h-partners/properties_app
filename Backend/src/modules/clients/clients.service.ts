import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityType, PropertyType, SnapshotPoint, WorkflowStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { CreateEntityDto, UpdateEntityDto } from './dto/entity.dto';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { CreateLoanDto, UpdateLoanDto } from './dto/loan.dto';

function normalizeEntityType(raw?: string): EntityType {
  if (!raw) return EntityType.INDIVIDUAL;
  const u = raw.toUpperCase().trim();
  if (u === 'INDIVIDUAL') return EntityType.INDIVIDUAL;
  if (u === 'JOINT') return EntityType.JOINT;
  if (u.includes('UNIT')) return EntityType.UNIT_TRUST;
  if (u.includes('TRUST')) return EntityType.FAMILY_TRUST;
  if (u.includes('COMP') || u.includes('CORP') || u.includes('PVT') || u.includes('PTY')) {
    return EntityType.COMPANY;
  }
  if (u.includes('SMSF') || u.includes('SUPER')) return EntityType.SMSF;
  return EntityType.INDIVIDUAL;
}

function normalizePropertyType(raw?: string): PropertyType {
  if (!raw) return PropertyType.INVESTMENT;
  const u = raw.toUpperCase().trim();
  if (u.includes('OWNER') || u === 'OO' || u.includes('HOME') || u.includes('RESIDENCE')) {
    return PropertyType.OWNER_OCCUPIED;
  }
  return PropertyType.INVESTMENT;
}

function parseFlexibleDate(raw?: string): Date {
  if (!raw) return new Date();
  const trimmed = raw.trim();
  // Match DD/MM/YYYY or DD-MM-YYYY or DD-MM-YY
  const dmy = trimmed.match(/^(\d{1,2})[\/\-\s]+(\d{1,2})[\/\-\s]+(\d{2,4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    const parsed = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const iso = new Date(trimmed);
  if (!isNaN(iso.getTime())) return iso;
  return new Date();
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------- DASHBOARD SUMMARY ----------------

  async getDashboardSummary(adviserId: string) {
    const households = await this.prisma.clientHousehold.findMany({
      where: { adviserId, isArchived: false },
      include: {
        properties: {
          where: { isActive: true },
          include: {
            loans: {
              where: { isActive: true },
              include: { snapshots: true },
            },
          },
        },
        reviews: {
          orderBy: { financialYear: 'desc' },
          include: {
            loanSnapshots: true,
          },
        },
      },
    });

    const totalHouseholds = households.length;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    let totalLoan = 0;
    let tchLoans = 0;
    let nonTchLoans = 0;
    let fixedExpiryAmount = 0;
    let fixedExpiryLender = 'None in window';
    let ioExpiryAmount = 0;
    let ioExpiryCount = 0;

    for (const h of households) {
      const latestReview = h.reviews[0];
      if (!latestReview) {
        notStarted++;
      } else if (latestReview.tchReviewStatus === WorkflowStatus.COMPLETED) {
        completed++;
      } else if (latestReview.tchReviewStatus === WorkflowStatus.IN_PROGRESS) {
        inProgress++;
      } else {
        notStarted++;
      }

      for (const prop of h.properties) {
        for (const loan of prop.loans) {
          // Find latest REVIEW_DATE or EOFY snapshot balance
          const snap =
            loan.snapshots.find((s) => s.snapshotPoint === SnapshotPoint.REVIEW_DATE) ||
            loan.snapshots.find((s) => s.snapshotPoint === SnapshotPoint.EOFY) ||
            loan.snapshots[0];
          const balance = snap ? Number(snap.loanBalance) : 0;
          totalLoan += balance;
          if (loan.isTchLoan) {
            tchLoans += balance;
          } else {
            nonTchLoans += balance;
          }
          if (
            loan.fixedExpiry &&
            loan.fixedExpiry !== '----' &&
            loan.fixedExpiry !== 'N/A' &&
            loan.fixedExpiry !== '-'
          ) {
            fixedExpiryAmount += balance;
            if (fixedExpiryLender === 'None in window') {
              fixedExpiryLender = loan.lender;
            }
          }
          if (
            loan.ioExpiry &&
            loan.ioExpiry !== '----' &&
            loan.ioExpiry !== 'N/A' &&
            loan.ioExpiry !== '-'
          ) {
            ioExpiryAmount += balance;
            ioExpiryCount++;
          }
        }
      }
    }

    const tchPortfolioPct =
      totalLoan > 0 ? Number(((tchLoans / totalLoan) * 100).toFixed(1)) : 0;
    const nonTchPortfolioPct =
      totalLoan > 0 ? Number(((nonTchLoans / totalLoan) * 100).toFixed(1)) : 0;

    return {
      totalHouseholds,
      reviewStatusCounts: {
        totalHouseholds,
        completed,
        inProgress,
        notStarted,
      },
      loanMetrics: {
        totalLoan,
        tchLoans,
        tchPortfolioPct,
        nonTchLoans,
        nonTchPortfolioPct,
        fixedExpiryAmount,
        fixedExpiryLender,
        ioExpiryAmount,
        ioExpiryCount,
      },
    };
  }

  // ---------------- HOUSEHOLD CRUD ----------------

  async createHousehold(adviserId: string, dto: CreateHouseholdDto) {
    const rawYear = String(dto.initialReviewYear || '2026').replace(/[^0-9]/g, '');
    const financialYear = Number(rawYear) || 2026;
    const todayStr = new Date().toISOString().split('T')[0];

    const household = await this.prisma.clientHousehold.create({
      data: {
        adviserId,
        householdName: dto.householdName.trim(),
        adviserAssigned: dto.adviserAssigned || 'Sarah Jenkins (Senior Property CFO)',
        primaryContactEmail: (dto.primaryContactEmail || '').toLowerCase().trim(),
        primaryContactPhone: dto.primaryContactPhone,
        notes: dto.objectives || dto.notes || '',
        executiveReport: dto.executiveReport || 'Locked (Pending Review)',
        householdExpenditure: dto.householdExpenditure ?? 0,
        creditCardLimit: dto.creditCardLimit ?? 0,
        otherLiabilities: dto.otherLiabilities ?? 0,
        monthlyPayments: dto.monthlyPayments ?? 0,
        borrowingCapacity: dto.borrowingCapacity ?? 800000,
        cashSavings: dto.cashSavings ?? 47000,
      },
    });

    // Automatically create the initial AnnualReview and FutureOutlookScenario in DB
    const review = await this.prisma.annualReview.create({
      data: {
        householdId: household.id,
        financialYear,
        reviewDate: new Date(),
        reviewDateStr: todayStr,
        finDataStatus: WorkflowStatus.IN_PROGRESS,
        tchReviewStatus: WorkflowStatus.NOT_STARTED,
        executiveSummary:
          dto.objectives ||
          dto.notes ||
          `Annual financial and strategic review for FY${financialYear}.`,
        verdictText: `The ${household.householdName} property portfolio review for FY${financialYear} is currently in setup.`,
        objectiveText:
          dto.objectives ||
          dto.notes ||
          'Achieve $120,000 p.a. in net passive cash flow from unencumbered residential property assets while maintaining LVR below 50%.',
        bottomLineText:
          'Complete entity, property, and loan setup to generate portfolio performance insights.',
      },
    });

    await this.prisma.futureOutlookScenario.create({
      data: {
        annualReviewId: review.id,
        forecastYears: 20,
        propertyGrowthRate: 0.04,
        rentalGrowthRate: 0.035,
        inflationRate: 0.025,
        superReturnRate: 0.07,
        extraMonthlyHomeLoanRepayment: 0,
        downsizeEnabled: false,
        downsizeYearOffset: 10,
        downsizeNetProceedsToSuper: 800000,
        targetRetirementIncomeAfterTax: 120000,
      },
    });

    return this.getHouseholdById(adviserId, household.id);
  }

  async listHouseholds(adviserId: string) {
    return this.prisma.clientHousehold.findMany({
      where: { adviserId, isArchived: false },
      include: {
        members: true,
        entities: true,
        properties: {
          where: { isActive: true },
          include: {
            loans: {
              where: { isActive: true },
              include: { snapshots: true },
            },
            snapshots: true,
          },
        },
        reviews: {
          orderBy: { financialYear: 'desc' },
          include: {
            criteria: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHouseholdById(adviserId: string, householdId: string) {
    // Support lookup by UUID or by slugified householdName
    let household = await this.prisma.clientHousehold.findUnique({
      where: { id: householdId },
      include: {
        members: true,
        entities: { orderBy: { createdAt: 'asc' } },
        properties: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          include: {
            entity: true,
            snapshots: true,
            loans: {
              where: { isActive: true },
              orderBy: { createdAt: 'asc' },
              include: { snapshots: true },
            },
          },
        },
        reviews: {
          orderBy: { financialYear: 'desc' },
          include: {
            propertySnapshots: { include: { property: true } },
            loanSnapshots: { include: { loan: true } },
            criteria: { orderBy: { sortOrder: 'asc' } },
            futureOutlook: true,
            reportSnapshot: true,
          },
        },
      },
    });

    if (!household) {
      // Fallback: match by slugified name or first household for this adviser
      const all = await this.prisma.clientHousehold.findMany({
        where: { adviserId, isArchived: false },
        include: {
          members: true,
          entities: { orderBy: { createdAt: 'asc' } },
          properties: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            include: {
              entity: true,
              snapshots: true,
              loans: {
                where: { isActive: true },
                orderBy: { createdAt: 'asc' },
                include: { snapshots: true },
              },
            },
          },
          reviews: {
            orderBy: { financialYear: 'desc' },
            include: {
              propertySnapshots: { include: { property: true } },
              loanSnapshots: { include: { loan: true } },
              criteria: { orderBy: { sortOrder: 'asc' } },
              futureOutlook: true,
              reportSnapshot: true,
            },
          },
        },
      });
      const slugTarget = householdId.toLowerCase().replace(/^the-/, '');
      household =
        all.find((h) => {
          const s = h.householdName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          return s === householdId.toLowerCase() || s.includes(slugTarget);
        }) || null;
    }

    if (!household) throw new NotFoundException('Household not found');
    if (household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this household');
    }

    return household;
  }

  async updateHousehold(adviserId: string, householdId: string, dto: UpdateHouseholdDto) {
    const h = await this.getHouseholdById(adviserId, householdId);
    return this.prisma.clientHousehold.update({
      where: { id: h.id },
      data: {
        householdName: dto.householdName,
        adviserAssigned: dto.adviserAssigned,
        primaryContactEmail: dto.primaryContactEmail?.toLowerCase().trim(),
        primaryContactPhone: dto.primaryContactPhone,
        notes: dto.notes ?? dto.objectives,
        executiveReport: dto.executiveReport,
        householdExpenditure: dto.householdExpenditure,
        creditCardLimit: dto.creditCardLimit,
        otherLiabilities: dto.otherLiabilities,
        monthlyPayments: dto.monthlyPayments,
        borrowingCapacity: dto.borrowingCapacity,
        cashSavings: dto.cashSavings,
      },
    });
  }

  async archiveHousehold(adviserId: string, householdId: string) {
    const h = await this.getHouseholdById(adviserId, householdId);
    return this.prisma.clientHousehold.update({
      where: { id: h.id },
      data: { isArchived: true },
    });
  }

  // ---------------- PERSON CRUD ----------------

  async addPerson(adviserId: string, householdId: string, dto: CreatePersonDto) {
    const h = await this.getHouseholdById(adviserId, householdId);
    return this.prisma.person.create({
      data: {
        householdId: h.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dob: dto.dob ? new Date(dto.dob) : null,
        expectedRetirementAge: dto.expectedRetirementAge,
        currentSuperBalance: dto.currentSuperBalance ?? 0,
        annualSuperContribution: dto.annualSuperContribution ?? 0,
        marginalTaxRate: dto.marginalTaxRate ?? 0.37,
      },
    });
  }

  async updatePerson(adviserId: string, householdId: string, personId: string, dto: UpdatePersonDto) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.person.update({
      where: { id: personId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        expectedRetirementAge: dto.expectedRetirementAge,
        currentSuperBalance: dto.currentSuperBalance,
        annualSuperContribution: dto.annualSuperContribution,
        marginalTaxRate: dto.marginalTaxRate,
      },
    });
  }

  async deletePerson(adviserId: string, householdId: string, personId: string) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.person.delete({ where: { id: personId } });
  }

  // ---------------- ENTITY CRUD ----------------

  async addEntity(adviserId: string, householdId: string, dto: CreateEntityDto) {
    const h = await this.getHouseholdById(adviserId, householdId);
    const enumType = normalizeEntityType(dto.type || dto.displayType);
    const displayType =
      dto.displayType ||
      (enumType === EntityType.INDIVIDUAL
        ? 'Individual'
        : enumType === EntityType.COMPANY
        ? 'Company'
        : enumType === EntityType.SMSF
        ? 'SMSF'
        : enumType === EntityType.UNIT_TRUST
        ? 'Unit Trust'
        : 'Trust');

    return this.prisma.ownershipEntity.create({
      data: {
        householdId: h.id,
        name: dto.name,
        type: enumType,
        displayType,
        abnOrTfnMasked: dto.abnOrTfnMasked || '-',
        ageOrDob: dto.ageOrDob || '---',
        phone: dto.phone || '+61 412 890 231',
        email: dto.email || 'info@entity.com.au',
        annualSalary: dto.annualSalary ?? 0,
        marginalTaxRate: dto.marginalTaxRate ?? 0.37,
        superBalance: dto.superBalance ?? 0,
      },
    });
  }

  async updateEntity(adviserId: string, householdId: string, entityId: string, dto: UpdateEntityDto) {
    await this.getHouseholdById(adviserId, householdId);
    const enumType =
      dto.type || dto.displayType ? normalizeEntityType(dto.type || dto.displayType) : undefined;
    return this.prisma.ownershipEntity.update({
      where: { id: entityId },
      data: {
        name: dto.name,
        type: enumType,
        displayType: dto.displayType || dto.type,
        abnOrTfnMasked: dto.abnOrTfnMasked,
        ageOrDob: dto.ageOrDob,
        phone: dto.phone,
        email: dto.email,
        annualSalary: dto.annualSalary,
        marginalTaxRate: dto.marginalTaxRate,
        superBalance: dto.superBalance,
      },
    });
  }

  async deleteEntity(adviserId: string, householdId: string, entityId: string) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.ownershipEntity.delete({ where: { id: entityId } });
  }

  // ---------------- PROPERTY CRUD ----------------

  async addProperty(adviserId: string, householdId: string, dto: CreatePropertyDto) {
    const h = await this.getHouseholdById(adviserId, householdId);
    const propType = normalizePropertyType(dto.type || dto.purposeDisplay);
    const purposeDisplay =
      dto.purposeDisplay ||
      (propType === PropertyType.OWNER_OCCUPIED ? 'Owner-Occupied' : 'Investment');
    const purchasePrice = Number(dto.purchasePrice || 800000);
    const currentValuation = Number(dto.currentValuation || purchasePrice || 1150000);
    const weeklyRent =
      propType === PropertyType.OWNER_OCCUPIED ? 0 : Number(dto.weeklyRent || 850);

    // Derive suburb from address if not provided
    const addressParts = dto.address.split(',').map((s) => s.trim());
    const derivedSuburb =
      dto.suburb ||
      (addressParts.length > 1
        ? addressParts[addressParts.length - 1].replace(/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT|\d{4})\b/gi, '').trim()
        : 'Sydney') ||
      'Sydney';

    const property = await this.prisma.property.create({
      data: {
        householdId: h.id,
        entityId: dto.entityId || null,
        name: dto.name || dto.address,
        address: dto.address,
        suburb: derivedSuburb,
        state: (dto.state || 'NSW').toUpperCase(),
        postcode: dto.postcode || '2021',
        propertyCategory: dto.propertyCategory || 'House',
        type: propType,
        purposeDisplay,
        purchaseDate: parseFlexibleDate(dto.purchaseDate || dto.purchaseDateStr),
        purchaseDateStr: dto.purchaseDateStr || dto.purchaseDate || '24/10/2026',
        purchasePrice,
        acquisitionCosts: dto.acquisitionCosts ?? 45936,
        currentValuation,
        weeklyRent,
        landSize: dto.landSize || '600',
        beds: dto.beds ?? 4,
        baths: dto.baths ?? 2,
        cars: dto.cars ?? 2,
        owner1: dto.owner1 || 'Primary Owner',
        owner1Pct: dto.owner1Pct || '100%',
        owner2: dto.owner2 || '----',
        owner2Pct: dto.owner2Pct || '---',
        ownersJson: dto.ownersJson || undefined,
        soldDate: dto.soldDate || null,
      },
    });

    // Automatically seed initial EOFY and REVIEW_DATE snapshots in the latest AnnualReview
    const latestReview = h.reviews[0];
    if (latestReview) {
      for (const point of [SnapshotPoint.EOFY, SnapshotPoint.REVIEW_DATE]) {
        await this.prisma.propertyFinancialSnapshot.upsert({
          where: {
            annualReviewId_propertyId_snapshotPoint: {
              annualReviewId: latestReview.id,
              propertyId: property.id,
              snapshotPoint: point,
            },
          },
          create: {
            annualReviewId: latestReview.id,
            propertyId: property.id,
            snapshotPoint: point,
            valuation: point === SnapshotPoint.EOFY ? purchasePrice : currentValuation,
            weeklyRent,
            marketWeeklyRent: weeklyRent,
            annualGrossRent: weeklyRent * 52,
            vacancyWeeks: 0,
            councilRates: 1800,
            waterRates: 840,
            insurance: 1400,
            propertyManagementFees: propType === PropertyType.OWNER_OCCUPIED ? 0 : 2400,
            repairsMaintenance: 840,
            landTax: 780,
            strataFees: 780,
            otherExpenses: 840,
            depreciationNonCash: 6500,
            status: 'Completed',
          },
          update: {
            valuation: point === SnapshotPoint.EOFY ? purchasePrice : currentValuation,
            weeklyRent,
          },
        });
      }
    }

    return this.prisma.property.findUnique({
      where: { id: property.id },
      include: {
        snapshots: true,
        loans: { include: { snapshots: true } },
      },
    });
  }

  async updateProperty(adviserId: string, householdId: string, propertyId: string, dto: UpdatePropertyDto) {
    await this.getHouseholdById(adviserId, householdId);
    const propType =
      dto.type || dto.purposeDisplay
        ? normalizePropertyType(dto.type || dto.purposeDisplay)
        : undefined;
    return this.prisma.property.update({
      where: { id: propertyId },
      data: {
        entityId: dto.entityId !== undefined ? dto.entityId || null : undefined,
        name: dto.name,
        address: dto.address,
        suburb: dto.suburb,
        state: dto.state ? dto.state.toUpperCase() : undefined,
        postcode: dto.postcode,
        propertyCategory: dto.propertyCategory,
        type: propType,
        purposeDisplay: dto.purposeDisplay,
        purchaseDate: dto.purchaseDate ? parseFlexibleDate(dto.purchaseDate) : undefined,
        purchaseDateStr: dto.purchaseDateStr,
        purchasePrice: dto.purchasePrice,
        acquisitionCosts: dto.acquisitionCosts,
        currentValuation: dto.currentValuation,
        weeklyRent: dto.weeklyRent,
        landSize: dto.landSize,
        beds: dto.beds,
        baths: dto.baths,
        cars: dto.cars,
        owner1: dto.owner1,
        owner1Pct: dto.owner1Pct,
        owner2: dto.owner2,
        owner2Pct: dto.owner2Pct,
        ownersJson: dto.ownersJson,
        soldDate: dto.soldDate,
      },
      include: {
        snapshots: true,
        loans: { include: { snapshots: true } },
      },
    });
  }

  async deleteProperty(adviserId: string, householdId: string, propertyId: string) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.property.update({
      where: { id: propertyId },
      data: { isActive: false },
    });
  }

  // ---------------- LOAN CRUD ----------------

  async addHouseholdLoan(adviserId: string, householdId: string, dto: CreateLoanDto) {
    const h = await this.getHouseholdById(adviserId, householdId);
    let targetPropertyId = dto.propertyId;

    if (!targetPropertyId && dto.security1) {
      const matched = h.properties.find(
        (p) =>
          p.address.toLowerCase().includes(dto.security1!.toLowerCase()) ||
          dto.security1!.toLowerCase().includes(p.address.toLowerCase()),
      );
      if (matched) targetPropertyId = matched.id;
    }

    if (!targetPropertyId && h.properties.length > 0) {
      targetPropertyId = h.properties[0].id;
    }

    // If household has no properties yet, create an associated property from security1
    if (!targetPropertyId) {
      const createdProp = await this.addProperty(adviserId, h.id, {
        address: dto.security1 || 'Primary Security Property',
        state: 'NSW',
        postcode: '2021',
        propertyCategory: 'House',
        purposeDisplay: dto.purpose || 'Investment',
        purchasePrice: 850000,
        currentValuation: 1150000,
      });
      targetPropertyId = createdProp!.id;
    }

    return this.addLoan(adviserId, h.id, targetPropertyId, dto);
  }

  async addLoan(adviserId: string, householdId: string, propertyId: string, dto: CreateLoanDto) {
    const h = await this.getHouseholdById(adviserId, householdId);
    const prop = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!prop || prop.householdId !== h.id) {
      throw new NotFoundException('Property not found in this household');
    }

    const loanRef =
      dto.loanReference ||
      `${dto.lender.slice(0, 3).toUpperCase()}${Math.floor(100000 + Math.random() * 900000)}`;
    const repaymentType = dto.repaymentType || 'Interest only';
    const loanType =
      dto.loanType ||
      (repaymentType.toLowerCase().includes('principal') ? 'P&I' : 'IO');

    const loan = await this.prisma.loan.create({
      data: {
        propertyId,
        lender: dto.lender,
        accountName: dto.accountName || `${loanRef} — ${dto.lender}`,
        loanReference: loanRef,
        isTchLoan: dto.isTchLoan !== undefined ? dto.isTchLoan : true,
        purpose: dto.purpose || 'Investment',
        repaymentType,
        rateType: dto.rateType || 'Variable',
        loanType,
        ioExpiry: dto.ioExpiry || '24/10/2026',
        fixedExpiry: dto.fixedExpiry || '----',
        maturityDate: dto.maturityDate || '24/10/2026',
        security1: dto.security1 || prop.address,
        security2: dto.security2 || '----',
        security3: dto.security3 || '----',
        isClosed: dto.isClosed || false,
        closedDate: dto.closedDate || null,
        isOffsetAvailable: dto.isOffsetAvailable !== undefined ? dto.isOffsetAvailable : true,
      },
    });

    const latestReview = h.reviews[0];
    if (latestReview) {
      const balance = Number(dto.loanBalance ?? 650000);
      const offset = Number(dto.offsetBalance ?? 24000);
      const rawRate = Number(dto.interestRate ?? 0.0594);
      const rateDecimal = rawRate > 1 ? rawRate / 100 : rawRate;

      for (const point of [SnapshotPoint.EOFY, SnapshotPoint.REVIEW_DATE]) {
        await this.prisma.loanFinancialSnapshot.upsert({
          where: {
            annualReviewId_loanId_snapshotPoint: {
              annualReviewId: latestReview.id,
              loanId: loan.id,
              snapshotPoint: point,
            },
          },
          create: {
            annualReviewId: latestReview.id,
            loanId: loan.id,
            snapshotPoint: point,
            loanBalance: balance,
            offsetBalance: offset,
            interestRate: rateDecimal,
            marketRate: 0.0605,
            annualRepayments: Math.round(balance * rateDecimal),
            interestPaid: Math.round(Math.max(0, balance - offset) * rateDecimal),
            loanLimit: balance,
            status: 'Completed',
          },
          update: {
            loanBalance: balance,
            offsetBalance: offset,
            interestRate: rateDecimal,
          },
        });
      }
    }

    return this.prisma.loan.findUnique({
      where: { id: loan.id },
      include: { snapshots: true },
    });
  }

  async updateLoan(adviserId: string, householdId: string, loanId: string, dto: UpdateLoanDto) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.loan.update({
      where: { id: loanId },
      data: {
        lender: dto.lender,
        accountName: dto.accountName,
        loanReference: dto.loanReference,
        isTchLoan: dto.isTchLoan,
        purpose: dto.purpose,
        repaymentType: dto.repaymentType,
        rateType: dto.rateType,
        loanType: dto.loanType,
        ioExpiry: dto.ioExpiry,
        fixedExpiry: dto.fixedExpiry,
        maturityDate: dto.maturityDate,
        security1: dto.security1,
        security2: dto.security2,
        security3: dto.security3,
        isClosed: dto.isClosed,
        closedDate: dto.closedDate,
        isOffsetAvailable: dto.isOffsetAvailable,
      },
      include: { snapshots: true },
    });
  }

  async deleteLoan(adviserId: string, householdId: string, loanId: string) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.loan.update({
      where: { id: loanId },
      data: { isActive: false },
    });
  }
}
