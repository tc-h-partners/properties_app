import {
  PrismaClient,
  PropertyType,
  EntityType,
  SnapshotPoint,
  WorkflowStatus,
  CriterionPriority,
  CriterionRating,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Property Investor CFO Platform...');

  // 1. Demo Adviser
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adviser = await prisma.adviser.upsert({
    where: { email: 'adviser@propertycfo.com.au' },
    update: {
      passwordHash,
      fullName: 'Sarah Jenkins',
      firmName: 'Prestige Wealth & Property Advisory',
    },
    create: {
      email: 'adviser@propertycfo.com.au',
      passwordHash,
      fullName: 'Sarah Jenkins',
      firmName: 'Prestige Wealth & Property Advisory',
    },
  });
  console.log(`✅ Adviser seeded: ${adviser.email} (ID: ${adviser.id})`);

  // 2. Dated Market Benchmarks
  const benchmarksData = [
    // National default
    {
      effectiveDate: new Date('2025-06-30'),
      state: null,
      suburb: null,
      propertyCategory: null,
      benchmarkInterestRate: 0.0595,
      benchmarkGrossYield: 0.041,
      benchmarkWeeklyRent: 680,
      benchmarkRentalGrowth: 0.038,
      benchmarkCapitalGrowth: 0.062,
      sourceNotes: 'National Composite Benchmark FY25',
    },
    // NSW State
    {
      effectiveDate: new Date('2025-06-30'),
      state: 'NSW',
      suburb: null,
      propertyCategory: null,
      benchmarkInterestRate: 0.059,
      benchmarkGrossYield: 0.039,
      benchmarkWeeklyRent: 760,
      benchmarkRentalGrowth: 0.042,
      benchmarkCapitalGrowth: 0.068,
      sourceNotes: 'NSW General Benchmark FY25',
    },
    // NSW Unit
    {
      effectiveDate: new Date('2025-06-30'),
      state: 'NSW',
      suburb: null,
      propertyCategory: 'Unit',
      benchmarkInterestRate: 0.059,
      benchmarkGrossYield: 0.044,
      benchmarkWeeklyRent: 720,
      benchmarkRentalGrowth: 0.045,
      benchmarkCapitalGrowth: 0.058,
      sourceNotes: 'NSW Unit Benchmark FY25',
    },
    // NSW Suburb: Bondi
    {
      effectiveDate: new Date('2025-06-30'),
      state: 'NSW',
      suburb: 'Bondi',
      propertyCategory: 'Unit',
      benchmarkInterestRate: 0.0585,
      benchmarkGrossYield: 0.042,
      benchmarkWeeklyRent: 850,
      benchmarkRentalGrowth: 0.051,
      benchmarkCapitalGrowth: 0.074,
      sourceNotes: 'Bondi High-Density Unit Benchmark FY25',
    },
    // VIC State
    {
      effectiveDate: new Date('2025-06-30'),
      state: 'VIC',
      suburb: null,
      propertyCategory: null,
      benchmarkInterestRate: 0.0595,
      benchmarkGrossYield: 0.042,
      benchmarkWeeklyRent: 620,
      benchmarkRentalGrowth: 0.035,
      benchmarkCapitalGrowth: 0.055,
      sourceNotes: 'VIC General Benchmark FY25',
    },
    // VIC Suburb: South Yarra
    {
      effectiveDate: new Date('2025-06-30'),
      state: 'VIC',
      suburb: 'South Yarra',
      propertyCategory: 'House',
      benchmarkInterestRate: 0.0595,
      benchmarkGrossYield: 0.038,
      benchmarkWeeklyRent: 950,
      benchmarkRentalGrowth: 0.039,
      benchmarkCapitalGrowth: 0.064,
      sourceNotes: 'South Yarra Residential House Benchmark FY25',
    },
    // QLD State
    {
      effectiveDate: new Date('2025-06-30'),
      state: 'QLD',
      suburb: null,
      propertyCategory: null,
      benchmarkInterestRate: 0.059,
      benchmarkGrossYield: 0.048,
      benchmarkWeeklyRent: 650,
      benchmarkRentalGrowth: 0.058,
      benchmarkCapitalGrowth: 0.082,
      sourceNotes: 'QLD High-Growth Benchmark FY25',
    },
  ];

  for (const b of benchmarksData) {
    await prisma.marketBenchmark.create({ data: b });
  }
  console.log(`✅ Seeded ${benchmarksData.length} market benchmark records.`);

  // 3. Sample Household: "Thompson Family"
  let household = await prisma.clientHousehold.findFirst({
    where: { adviserId: adviser.id, householdName: 'Thompson Family' },
  });

  if (!household) {
    household = await prisma.clientHousehold.create({
      data: {
        adviserId: adviser.id,
        householdName: 'Thompson Family',
        primaryContactEmail: 'mark.thompson@example.com',
        primaryContactPhone: '+61 411 222 333',
        notes:
          'Long-term clients targeting financial independence at age 60, holding an owner-occupied residence and high-growth investment portfolio.',
      },
    });
  }
  console.log(`✅ Household seeded: ${household.householdName} (ID: ${household.id})`);

  // 4. Household Members (2 People)
  const person1 = await prisma.person.create({
    data: {
      householdId: household.id,
      firstName: 'Mark',
      lastName: 'Thompson',
      dob: new Date('1980-04-12'),
      expectedRetirementAge: 60,
      currentSuperBalance: 420000,
      annualSuperContribution: 27500,
      marginalTaxRate: 0.45,
    },
  });

  const person2 = await prisma.person.create({
    data: {
      householdId: household.id,
      firstName: 'Sarah',
      lastName: 'Thompson',
      dob: new Date('1982-08-23'),
      expectedRetirementAge: 60,
      currentSuperBalance: 310000,
      annualSuperContribution: 25000,
      marginalTaxRate: 0.37,
    },
  });
  console.log(`✅ Seeded 2 Household Members: ${person1.firstName} & ${person2.firstName}`);

  // 5. Ownership Entity
  const trustEntity = await prisma.ownershipEntity.create({
    data: {
      householdId: household.id,
      name: 'Thompson Family Trust',
      type: EntityType.FAMILY_TRUST,
      abnOrTfnMasked: 'ABN 45 XXX XXX 891',
    },
  });

  // 6. Properties
  // Property A: Owner-Occupied Home
  const propHome = await prisma.property.create({
    data: {
      householdId: household.id,
      name: 'Primary Residence - Bellevue Hill',
      address: '12 Bellevue Hill Road',
      suburb: 'Bellevue Hill',
      state: 'NSW',
      postcode: '2023',
      propertyCategory: 'House',
      type: PropertyType.OWNER_OCCUPIED,
      purchaseDate: new Date('2018-09-10'),
      purchasePrice: 2200000,
      acquisitionCosts: 110000,
    },
  });

  const homeLoan = await prisma.loan.create({
    data: {
      propertyId: propHome.id,
      lender: 'ANZ Private',
      accountName: 'Home Loan Variable P&I',
      loanType: 'P&I',
      isOffsetAvailable: true,
    },
  });

  // Property B: Investment Property 1 (Bondi Unit)
  const propBondi = await prisma.property.create({
    data: {
      householdId: household.id,
      entityId: trustEntity.id,
      name: 'Bondi Beachfront Unit',
      address: 'Unit 4, 18 Campbell Parade',
      suburb: 'Bondi',
      state: 'NSW',
      postcode: '2026',
      propertyCategory: 'Unit',
      type: PropertyType.INVESTMENT,
      purchaseDate: new Date('2020-02-14'),
      purchasePrice: 920000,
      acquisitionCosts: 42000,
    },
  });

  const bondiLoan = await prisma.loan.create({
    data: {
      propertyId: propBondi.id,
      lender: 'Macquarie Bank',
      accountName: 'Investment Loan IO Facility',
      loanType: 'IO',
      isOffsetAvailable: true,
    },
  });

  // Property C: Investment Property 2 (South Yarra House)
  const propSouthYarra = await prisma.property.create({
    data: {
      householdId: household.id,
      name: 'South Yarra Townhouse',
      address: '72 Toorak Road',
      suburb: 'South Yarra',
      state: 'VIC',
      postcode: '3141',
      propertyCategory: 'House',
      type: PropertyType.INVESTMENT,
      purchaseDate: new Date('2021-07-20'),
      purchasePrice: 1250000,
      acquisitionCosts: 68000,
    },
  });

  const southYarraLoan = await prisma.loan.create({
    data: {
      propertyId: propSouthYarra.id,
      lender: 'NAB Commercial',
      accountName: 'South Yarra Facility P&I',
      loanType: 'P&I',
      isOffsetAvailable: false,
    },
  });
  console.log('✅ Seeded 1 Owner-Occupied + 2 Investment Properties with Loans');

  // 7. FY 2025 Review (COMPLETED Review State)
  const review2025 = await prisma.annualReview.create({
    data: {
      householdId: household.id,
      financialYear: 2025,
      reviewDate: new Date('2025-07-15'),
      completedAt: new Date('2025-07-15'),
      finDataStatus: WorkflowStatus.COMPLETED,
      tchReviewStatus: WorkflowStatus.COMPLETED,
      executiveSummary:
        'FY25 Annual Review successfully completed. Portfolio demonstrated solid capital growth in NSW and steady cash yield in VIC. Equity buffer expanded by $210k.',
    },
  });

  // FY 2025 Snapshots (EOFY)
  await prisma.propertyFinancialSnapshot.createMany({
    data: [
      {
        annualReviewId: review2025.id,
        propertyId: propHome.id,
        snapshotPoint: SnapshotPoint.EOFY,
        valuation: 2850000,
        weeklyRent: 0,
        annualGrossRent: 0,
        vacancyWeeks: 0,
        councilRates: 2400,
        waterRates: 1100,
        insurance: 2200,
      },
      {
        annualReviewId: review2025.id,
        propertyId: propBondi.id,
        snapshotPoint: SnapshotPoint.EOFY,
        valuation: 1180000,
        weeklyRent: 820,
        annualGrossRent: 42640,
        vacancyWeeks: 1,
        councilRates: 1600,
        waterRates: 850,
        insurance: 1350,
        propertyManagementFees: 2558,
        repairsMaintenance: 850,
        strataFees: 3400,
        depreciationNonCash: 7200,
      },
      {
        annualReviewId: review2025.id,
        propertyId: propSouthYarra.id,
        snapshotPoint: SnapshotPoint.EOFY,
        valuation: 1420000,
        weeklyRent: 950,
        annualGrossRent: 49400,
        vacancyWeeks: 2,
        councilRates: 2100,
        waterRates: 920,
        insurance: 1650,
        propertyManagementFees: 2964,
        repairsMaintenance: 1400,
        landTax: 1200,
        depreciationNonCash: 8500,
      },
    ],
  });

  await prisma.loanFinancialSnapshot.createMany({
    data: [
      {
        annualReviewId: review2025.id,
        loanId: homeLoan.id,
        snapshotPoint: SnapshotPoint.EOFY,
        loanBalance: 1250000,
        offsetBalance: 180000,
        interestRate: 0.0585,
        annualRepayments: 88000,
        interestPaid: 62595,
      },
      {
        annualReviewId: review2025.id,
        loanId: bondiLoan.id,
        snapshotPoint: SnapshotPoint.EOFY,
        loanBalance: 650000,
        offsetBalance: 60000,
        interestRate: 0.0595,
        annualRepayments: 35105,
        interestPaid: 35105,
      },
      {
        annualReviewId: review2025.id,
        loanId: southYarraLoan.id,
        snapshotPoint: SnapshotPoint.EOFY,
        loanBalance: 820000,
        offsetBalance: 0,
        interestRate: 0.061,
        annualRepayments: 59800,
        interestPaid: 50020,
      },
    ],
  });

  // FY 2025 Completed Assessment Criteria
  await prisma.assessmentCriterion.createMany({
    data: [
      {
        annualReviewId: review2025.id,
        category: 'CASH_MANAGEMENT',
        criterionCode: 'CM_GROSS_YIELD',
        criterionTitle: 'Gross Rental Yield Performance vs Market Benchmark',
        rating: CriterionRating.STRONG,
        insight: 'Combined gross yield of 3.54% is competitive given prime metro asset locations.',
        recommendation: 'Target 4% rent increase at next lease renewal on Bondi apartment.',
        potentialOpportunity: 'Additional $2,200 annual gross revenue.',
        priority: CriterionPriority.MEDIUM,
        adviserNotes: 'Tenants are high-calibre professionals.',
        sortOrder: 1,
      },
      {
        annualReviewId: review2025.id,
        category: 'CAPITAL_MANAGEMENT',
        criterionCode: 'CAP_EQUITY_LVR',
        criterionTitle: 'Portfolio LVR & Usable Equity Buffer',
        rating: CriterionRating.STRONG,
        insight: 'Investment LVR sits comfortably at 54.2%, well below our 70% risk threshold.',
        recommendation: 'Preserve liquidity in offset; review potential third property acquisition in Q3.',
        potentialOpportunity: 'Usable equity buffer exceeds $380,000.',
        priority: CriterionPriority.HIGH,
        adviserNotes: 'Client comfortable with current borrowing capacity.',
        sortOrder: 2,
      },
    ],
  });

  // FY 2025 Report Snapshot
  await prisma.reportSnapshot.create({
    data: {
      annualReviewId: review2025.id,
      snapshotData: {
        financialYear: 2025,
        householdName: 'Thompson Family',
        status: 'COMPLETED',
        executiveSummary: review2025.executiveSummary,
      },
    },
  });
  console.log('✅ FY 2025 Review seeded (COMPLETED state with frozen report snapshot)');

  // 8. FY 2026 Review (IN_PROGRESS Financial Data, NOT_STARTED TC&H Review)
  const review2026 = await prisma.annualReview.create({
    data: {
      householdId: household.id,
      financialYear: 2026,
      finDataStatus: WorkflowStatus.IN_PROGRESS,
      tchReviewStatus: WorkflowStatus.NOT_STARTED,
      executiveSummary:
        'FY26 Mid-Year Review in preparation. Review date valuations reflect ongoing property appreciation.',
    },
  });

  // Seed FY 2026 Financial Snapshots (REVIEW_DATE)
  await prisma.propertyFinancialSnapshot.createMany({
    data: [
      {
        annualReviewId: review2026.id,
        propertyId: propHome.id,
        snapshotPoint: SnapshotPoint.REVIEW_DATE,
        valuation: 3050000,
        weeklyRent: 0,
        annualGrossRent: 0,
        vacancyWeeks: 0,
        councilRates: 2550,
        waterRates: 1150,
        insurance: 2400,
      },
      {
        annualReviewId: review2026.id,
        propertyId: propBondi.id,
        snapshotPoint: SnapshotPoint.REVIEW_DATE,
        valuation: 1250000,
        weeklyRent: 880,
        annualGrossRent: 45760,
        vacancyWeeks: 1,
        councilRates: 1680,
        waterRates: 900,
        insurance: 1450,
        propertyManagementFees: 2745,
        repairsMaintenance: 900,
        strataFees: 3600,
        depreciationNonCash: 6800,
      },
      {
        annualReviewId: review2026.id,
        propertyId: propSouthYarra.id,
        snapshotPoint: SnapshotPoint.REVIEW_DATE,
        valuation: 1510000,
        weeklyRent: 1000,
        annualGrossRent: 52000,
        vacancyWeeks: 1,
        councilRates: 2200,
        waterRates: 980,
        insurance: 1750,
        propertyManagementFees: 3120,
        repairsMaintenance: 1200,
        landTax: 1350,
        depreciationNonCash: 8000,
      },
    ],
  });

  await prisma.loanFinancialSnapshot.createMany({
    data: [
      {
        annualReviewId: review2026.id,
        loanId: homeLoan.id,
        snapshotPoint: SnapshotPoint.REVIEW_DATE,
        loanBalance: 1180000,
        offsetBalance: 210000,
        interestRate: 0.0575,
        annualRepayments: 88000,
        interestPaid: 55775,
      },
      {
        annualReviewId: review2026.id,
        loanId: bondiLoan.id,
        snapshotPoint: SnapshotPoint.REVIEW_DATE,
        loanBalance: 650000,
        offsetBalance: 85000,
        interestRate: 0.0585,
        annualRepayments: 33052,
        interestPaid: 33052,
      },
      {
        annualReviewId: review2026.id,
        loanId: southYarraLoan.id,
        snapshotPoint: SnapshotPoint.REVIEW_DATE,
        loanBalance: 790000,
        offsetBalance: 15000,
        interestRate: 0.0595,
        annualRepayments: 59800,
        interestPaid: 46112,
      },
    ],
  });

  // Future Outlook Scenario for FY 2026
  await prisma.futureOutlookScenario.create({
    data: {
      annualReviewId: review2026.id,
      forecastYears: 15,
      propertyGrowthRate: 0.05,
      rentalGrowthRate: 0.035,
      inflationRate: 0.025,
      superReturnRate: 0.07,
      extraMonthlyHomeLoanRepayment: 1500,
      downsizeEnabled: true,
      downsizeYearOffset: 12,
      downsizeNetProceedsToSuper: 500000,
      targetRetirementIncomeAfterTax: 150000,
    },
  });

  console.log('✅ FY 2026 Review seeded (IN_PROGRESS financial data, NOT_STARTED TC&H review)');
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
