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

  // Clean existing seed records so re-running seed is idempotent and clean
  await prisma.reportSnapshot.deleteMany();
  await prisma.futureOutlookScenario.deleteMany();
  await prisma.assessmentCriterion.deleteMany();
  await prisma.loanFinancialSnapshot.deleteMany();
  await prisma.propertyFinancialSnapshot.deleteMany();
  await prisma.annualReview.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.property.deleteMany();
  await prisma.ownershipEntity.deleteMany();
  await prisma.person.deleteMany();
  await prisma.clientHousehold.deleteMany();
  await prisma.marketBenchmark.deleteMany();

  // 1. Primary Requested Login User: testuser@test.com / 123Test!
  const testUserPasswordHash = await bcrypt.hash('123Test!', 10);
  const testAdviser = await prisma.adviser.upsert({
    where: { email: 'testuser@test.com' },
    update: {
      passwordHash: testUserPasswordHash,
      fullName: 'Sarah Jenkins',
      firmName: 'TC&H Partners',
    },
    create: {
      email: 'testuser@test.com',
      passwordHash: testUserPasswordHash,
      fullName: 'Sarah Jenkins',
      firmName: 'TC&H Partners',
    },
  });
  console.log(`✅ Primary Adviser seeded: ${testAdviser.email} (Password: 123Test!)`);

  // Also keep demo adviser for Postman compatibility
  const demoPasswordHash = await bcrypt.hash('Password123!', 10);
  await prisma.adviser.upsert({
    where: { email: 'adviser@propertycfo.com.au' },
    update: {
      passwordHash: demoPasswordHash,
      fullName: 'Sarah Jenkins',
      firmName: 'Prestige Wealth & Property Advisory',
    },
    create: {
      email: 'adviser@propertycfo.com.au',
      passwordHash: demoPasswordHash,
      fullName: 'Sarah Jenkins',
      firmName: 'Prestige Wealth & Property Advisory',
    },
  });

  // 2. Market Benchmarks (National, NSW, VIC, QLD + ASX 200 Historical Series)
  const benchmarksData = [
    {
      effectiveDate: new Date('2026-06-30'),
      state: null,
      suburb: null,
      propertyCategory: null,
      benchmarkInterestRate: 0.0595,
      benchmarkGrossYield: 0.041,
      benchmarkWeeklyRent: 840,
      benchmarkRentalGrowth: 0.038,
      benchmarkCapitalGrowth: 0.062,
      asxIndexValue: 21450,
      sourceNotes: 'FY2026',
    },
    {
      effectiveDate: new Date('2025-06-30'),
      state: 'NSW',
      suburb: 'Paddington',
      propertyCategory: 'House',
      benchmarkInterestRate: 0.059,
      benchmarkGrossYield: 0.038,
      benchmarkWeeklyRent: 840,
      benchmarkRentalGrowth: 0.042,
      benchmarkCapitalGrowth: 0.068,
      asxIndexValue: 20890,
      sourceNotes: 'FY2025',
    },
    {
      effectiveDate: new Date('2024-06-30'),
      state: 'QLD',
      suburb: 'Mooloolaba',
      propertyCategory: 'House',
      benchmarkInterestRate: 0.0585,
      benchmarkGrossYield: 0.042,
      benchmarkWeeklyRent: 850,
      benchmarkRentalGrowth: 0.051,
      benchmarkCapitalGrowth: 0.074,
      asxIndexValue: 20160,
      sourceNotes: 'FY2024',
    },
    {
      effectiveDate: new Date('2023-06-30'),
      state: 'QLD',
      suburb: 'Buddina',
      propertyCategory: 'House',
      benchmarkInterestRate: 0.0595,
      benchmarkGrossYield: 0.042,
      benchmarkWeeklyRent: 780,
      benchmarkRentalGrowth: 0.035,
      benchmarkCapitalGrowth: 0.055,
      asxIndexValue: 18720,
      sourceNotes: 'FY2023',
    },
    {
      effectiveDate: new Date('2022-06-30'),
      state: 'VIC',
      suburb: 'South Yarra',
      propertyCategory: 'Unit',
      benchmarkInterestRate: 0.0595,
      benchmarkGrossYield: 0.038,
      benchmarkWeeklyRent: 950,
      benchmarkRentalGrowth: 0.039,
      benchmarkCapitalGrowth: 0.064,
      asxIndexValue: 16910,
      sourceNotes: 'FY2022',
    },
    {
      effectiveDate: new Date('2021-06-30'),
      state: 'QLD',
      suburb: null,
      propertyCategory: 'Unit',
      benchmarkInterestRate: 0.059,
      benchmarkGrossYield: 0.048,
      benchmarkWeeklyRent: 650,
      benchmarkRentalGrowth: 0.058,
      benchmarkCapitalGrowth: 0.082,
      asxIndexValue: 17240,
      sourceNotes: 'FY2021',
    },
  ];

  for (const b of benchmarksData) {
    await prisma.marketBenchmark.create({ data: b });
  }
  console.log(`✅ Seeded ${benchmarksData.length} market benchmark records.`);

  // 3. Primary Household: "The Harrison Family"
  const harrisonHousehold = await prisma.clientHousehold.create({
    data: {
      adviserId: testAdviser.id,
      householdName: 'THE HARRISON FAMILY',
      adviserAssigned: 'Sarah Jenkins (Senior Property CFO)',
      primaryContactEmail: 'ethan.h@student.edu.au',
      primaryContactPhone: '+61 412 890 231',
      notes:
        'Achieve $120,000 p.a. in net passive cash flow from unencumbered residential property assets by FY2035, while maintaining loan-to-value ratios below 50%.',
      executiveReport: 'Acknowledged',
      householdExpenditure: 85000,
      creditCardLimit: 25000,
      otherLiabilities: 0,
      monthlyPayments: 4200,
      borrowingCapacity: 800000,
      cashSavings: 47000,
    },
  });

  // Household Members (People)
  await prisma.person.createMany({
    data: [
      {
        householdId: harrisonHousehold.id,
        firstName: 'Victoria',
        lastName: 'Harrison',
        dob: new Date('1994-04-12'),
        age: '32',
        phone: '+61 412 890 231',
        email: 'ethan.h@student.edu.au',
        annualSalary: 210000,
        expectedRetirementAge: 60,
        currentSuperBalance: 385000,
        annualSuperContribution: 25000,
        marginalTaxRate: 0.45,
      },
      {
        householdId: harrisonHousehold.id,
        firstName: 'Oliver',
        lastName: 'Harrison',
        dob: new Date('1991-08-23'),
        age: '35',
        phone: '+61 412 890 231',
        email: 'ethan.h@student.edu.au',
        annualSalary: 165000,
        expectedRetirementAge: 60,
        currentSuperBalance: 265000,
        annualSuperContribution: 22000,
        marginalTaxRate: 0.32,
      },
    ],
  });

  // Client & Ownership Entities (Tab 1: Client & Entity Setup + FinDataInput Tab 1)
  const entityVictoria = await prisma.ownershipEntity.create({
    data: {
      householdId: harrisonHousehold.id,
      name: 'Victoria Harrison (Primary)',
      type: EntityType.INDIVIDUAL,
      displayType: 'Individual',
      abnOrTfnMasked: '64 901 823 441',
      ageOrDob: '32',
      phone: '+61 412 890 231',
      email: 'ethan.h@student.edu.au',
      annualSalary: 210000,
      marginalTaxRate: 0.45,
      superBalance: 385000,
    },
  });

  const entityOliver = await prisma.ownershipEntity.create({
    data: {
      householdId: harrisonHousehold.id,
      name: 'Oliver Harrison',
      type: EntityType.INDIVIDUAL,
      displayType: 'Individual',
      abnOrTfnMasked: '64 901 823 442',
      ageOrDob: '35',
      phone: '+61 412 890 231',
      email: 'ethan.h@student.edu.au',
      annualSalary: 165000,
      marginalTaxRate: 0.32,
      superBalance: 265000,
    },
  });

  await prisma.ownershipEntity.create({
    data: {
      householdId: harrisonHousehold.id,
      name: 'Harrison pvt',
      type: EntityType.COMPANY,
      displayType: 'Company',
      abnOrTfnMasked: '81 234 567 890',
      ageOrDob: '---',
      phone: '+61 412 890 231',
      email: 'ethan.h@student.edu.au',
      annualSalary: 0,
      marginalTaxRate: 0.25,
      superBalance: 0,
    },
  });

  const entityTrust = await prisma.ownershipEntity.create({
    data: {
      householdId: harrisonHousehold.id,
      name: 'Harrison Family Trust',
      type: EntityType.FAMILY_TRUST,
      displayType: 'Trust',
      abnOrTfnMasked: '45 991 203 891',
      ageOrDob: '---',
      phone: '+61 412 890 231',
      email: 'ethan.h@student.edu.au',
      annualSalary: 0,
      marginalTaxRate: 0.4,
      superBalance: 0,
    },
  });

  await prisma.ownershipEntity.create({
    data: {
      householdId: harrisonHousehold.id,
      name: 'Jack Harrison',
      type: EntityType.INDIVIDUAL,
      displayType: 'Individual',
      abnOrTfnMasked: '64 901 823 449',
      ageOrDob: '47',
      phone: '+61 412 890 231',
      email: 'ethan.h@student.edu.au',
      annualSalary: 0,
      marginalTaxRate: 0.37,
      superBalance: 0,
    },
  });

  // Properties for The Harrison Family
  const prop1 = await prisma.property.create({
    data: {
      householdId: harrisonHousehold.id,
      entityId: entityVictoria.id,
      name: '48 Underwood Street, Paddington NSW 2021',
      address: '48 Underwood Street, Paddington NSW 2021',
      suburb: 'Paddington',
      state: 'NSW',
      postcode: '2021',
      propertyCategory: 'House',
      type: PropertyType.INVESTMENT,
      purposeDisplay: 'Investment',
      purchaseDate: new Date('2019-10-12'),
      purchaseDateStr: '24/10/2026',
      purchasePrice: 800000,
      acquisitionCosts: 45936,
      currentValuation: 1150000,
      weeklyRent: 880,
      landSize: '600',
      beds: 6,
      baths: 6,
      cars: 2,
      owner1: 'Smith john',
      owner1Pct: '100%',
      owner2: '----',
      owner2Pct: '---',
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      householdId: harrisonHousehold.id,
      entityId: entityTrust.id,
      name: '7 Kawana Way, Buddina QLD 4575',
      address: '7 Kawana Way, Buddina QLD 4575',
      suburb: 'Buddina',
      state: 'QLD',
      postcode: '4575',
      propertyCategory: 'Unit',
      type: PropertyType.INVESTMENT,
      purposeDisplay: 'Investment',
      purchaseDate: new Date('2020-03-15'),
      purchaseDateStr: '24/10/2026',
      purchasePrice: 800000,
      acquisitionCosts: 45936,
      currentValuation: 1170000,
      weeklyRent: 780,
      landSize: '480',
      beds: 5,
      baths: 5,
      cars: 3,
      owner1: 'David miller',
      owner1Pct: '50%',
      owner2: 'Michal',
      owner2Pct: '50%',
    },
  });

  const prop3 = await prisma.property.create({
    data: {
      householdId: harrisonHousehold.id,
      entityId: entityOliver.id,
      name: '22 Oak Avenue, Mooloolaba QLD 4557',
      address: '22 Oak Avenue, Mooloolaba QLD 4557',
      suburb: 'Mooloolaba',
      state: 'QLD',
      postcode: '4557',
      propertyCategory: 'House',
      type: PropertyType.OWNER_OCCUPIED,
      purposeDisplay: 'Owner-Occupied',
      purchaseDate: new Date('2018-06-20'),
      purchaseDateStr: '24/10/2026',
      purchasePrice: 1650000,
      acquisitionCosts: 78500,
      currentValuation: 2350000,
      weeklyRent: 0,
      landSize: '650',
      beds: 4,
      baths: 2,
      cars: 2,
      owner1: 'Victoria Harrison',
      owner1Pct: '50%',
      owner2: 'Oliver Harrison',
      owner2Pct: '50%',
    },
  });

  // Loans for The Harrison Family
  const loan1 = await prisma.loan.create({
    data: {
      propertyId: prop1.id,
      lender: 'ANZ',
      accountName: 'ANZ1477642 — ANZ Banking Group (Investment)',
      loanReference: 'ANZ1477642',
      isTchLoan: true,
      purpose: 'Investment',
      repaymentType: 'Interest only',
      rateType: 'Variable',
      loanType: 'IO',
      ioExpiry: '24/10/2026',
      fixedExpiry: '----',
      maturityDate: '24/10/2026',
      security1: '48 Underwood Street, Paddington NSW 2021',
      security2: '----',
      security3: '----',
      isOffsetAvailable: true,
    },
  });

  const loan2 = await prisma.loan.create({
    data: {
      propertyId: prop2.id,
      lender: 'CBA',
      accountName: 'CBA124523 — Commonwealth Bank (Investment)',
      loanReference: 'CBA124523',
      isTchLoan: false,
      purpose: 'Investment',
      repaymentType: 'Principal Interest',
      rateType: 'Variable',
      loanType: 'P&I',
      ioExpiry: '----',
      fixedExpiry: '24/10/2026',
      maturityDate: '24/10/2026',
      security1: '7 Kawana Way, Buddina QLD 4575',
      security2: '----',
      security3: '----',
      isOffsetAvailable: true,
    },
  });

  const loan3 = await prisma.loan.create({
    data: {
      propertyId: prop3.id,
      lender: 'NAB',
      accountName: 'NAB-4421-02 — National Australia Bank (Home Loan)',
      loanReference: 'NAB-4421-02',
      isTchLoan: false,
      purpose: 'Home Loan',
      repaymentType: 'Principal & Interest',
      rateType: 'Variable',
      loanType: 'P&I',
      ioExpiry: '----',
      fixedExpiry: '24/10/2026',
      maturityDate: '15/06/2047',
      security1: '22 Oak Avenue, Mooloolaba QLD 4557',
      security2: '----',
      security3: '----',
      isOffsetAvailable: true,
    },
  });

  // Reviews for The Harrison Family (FY2023, FY2024, FY2025)
  const review2023 = await prisma.annualReview.create({
    data: {
      householdId: harrisonHousehold.id,
      financialYear: 2023,
      reviewDate: new Date('2023-10-24'),
      reviewDateStr: '24/10/2026',
      completedAt: new Date('2023-10-24'),
      finDataStatus: WorkflowStatus.COMPLETED,
      tchReviewStatus: WorkflowStatus.COMPLETED,
      shareChannel: 'Launch',
      complianceAcknowledged: 'Acknowledged',
      executiveSummary: 'FY23 Annual Review completed.',
    },
  });

  const review2024 = await prisma.annualReview.create({
    data: {
      householdId: harrisonHousehold.id,
      financialYear: 2024,
      reviewDate: new Date('2024-08-18'),
      reviewDateStr: '18/08/2025',
      finDataStatus: WorkflowStatus.COMPLETED,
      tchReviewStatus: WorkflowStatus.IN_PROGRESS,
      shareChannel: 'Launch',
      complianceAcknowledged: '-',
      executiveSummary: 'FY24 Annual Review in progress.',
    },
  });

  const review2025 = await prisma.annualReview.create({
    data: {
      householdId: harrisonHousehold.id,
      financialYear: 2025,
      reviewDate: new Date('2025-10-06'),
      reviewDateStr: '2026-10-06',
      completedAt: new Date('2025-10-06'),
      finDataStatus: WorkflowStatus.COMPLETED,
      tchReviewStatus: WorkflowStatus.COMPLETED,
      shareChannel: 'Launch',
      complianceAcknowledged: 'Acknowledged',
      executiveSummary:
        'The Harrison property portfolio continues to demonstrate outstanding capital resilience with aggregate equity expanding to $2.55M.',
      verdictText:
        'The Harrison property portfolio continues to demonstrate outstanding capital resilience with aggregate equity expanding to $2.55M. However, debt servicing headwinds and rising holding outgoings require immediate mortgage refinancing and rental yield optimization to restore cash flow neutrality.',
      objectiveText:
        'Achieve $120,000 p.a. in net passive cash flow from unencumbered residential property assets by FY2035, while maintaining loan-to-value ratios below 50%.',
      bottomLineText:
        'Your portfolio is performing well, and with three focused actions, can deliver your retirement income goal....',
    },
  });

  // Snapshots for FY2025
  for (const point of [SnapshotPoint.EOFY, SnapshotPoint.REVIEW_DATE]) {
    await prisma.propertyFinancialSnapshot.createMany({
      data: [
        {
          annualReviewId: review2025.id,
          propertyId: prop1.id,
          snapshotPoint: point,
          valuation: point === SnapshotPoint.EOFY ? 1050000 : 1150000,
          weeklyRent: point === SnapshotPoint.EOFY ? 820 : 880,
          marketWeeklyRent: 920,
          annualGrossRent: (point === SnapshotPoint.EOFY ? 820 : 880) * 52,
          vacancyWeeks: 1,
          councilRates: 1680,
          waterRates: 840,
          insurance: 1450,
          propertyManagementFees: 2745,
          repairsMaintenance: 900,
          landTax: 780,
          strataFees: 780,
          otherExpenses: 840,
          depreciationNonCash: 6800,
          status: 'Completed',
        },
        {
          annualReviewId: review2025.id,
          propertyId: prop2.id,
          snapshotPoint: point,
          valuation: point === SnapshotPoint.EOFY ? 1080000 : 1170000,
          weeklyRent: point === SnapshotPoint.EOFY ? 740 : 780,
          marketWeeklyRent: 860,
          annualGrossRent: (point === SnapshotPoint.EOFY ? 740 : 780) * 52,
          vacancyWeeks: 1,
          councilRates: 2100,
          waterRates: 920,
          insurance: 1650,
          propertyManagementFees: 2964,
          repairsMaintenance: 1200,
          landTax: 1200,
          strataFees: 2400,
          otherExpenses: 840,
          depreciationNonCash: 7500,
          status: 'Completed',
        },
        {
          annualReviewId: review2025.id,
          propertyId: prop3.id,
          snapshotPoint: point,
          valuation: point === SnapshotPoint.EOFY ? 2150000 : 2350000,
          weeklyRent: 0,
          marketWeeklyRent: 0,
          annualGrossRent: 0,
          vacancyWeeks: 0,
          councilRates: 2400,
          waterRates: 1100,
          insurance: 2200,
          propertyManagementFees: 0,
          repairsMaintenance: 840,
          landTax: 0,
          strataFees: 0,
          otherExpenses: 0,
          depreciationNonCash: 0,
          status: 'Completed',
        },
      ],
    });

    await prisma.loanFinancialSnapshot.createMany({
      data: [
        {
          annualReviewId: review2025.id,
          loanId: loan1.id,
          snapshotPoint: point,
          loanBalance: point === SnapshotPoint.EOFY ? 680000 : 650000,
          offsetBalance: point === SnapshotPoint.EOFY ? 20000 : 24000,
          interestRate: point === SnapshotPoint.EOFY ? 0.0624 : 0.0614,
          marketRate: 0.0605,
          annualRepayments: 38436,
          interestPaid: 38436,
          loanLimit: 700000,
          status: 'Completed',
        },
        {
          annualReviewId: review2025.id,
          loanId: loan2.id,
          snapshotPoint: point,
          loanBalance: point === SnapshotPoint.EOFY ? 500000 : 480000,
          offsetBalance: point === SnapshotPoint.EOFY ? 10000 : 15000,
          interestRate: point === SnapshotPoint.EOFY ? 0.0595 : 0.0585,
          marketRate: 0.0605,
          annualRepayments: 32500,
          interestPaid: 27202,
          loanLimit: 520000,
          status: 'Completed',
        },
        {
          annualReviewId: review2025.id,
          loanId: loan3.id,
          snapshotPoint: point,
          loanBalance: point === SnapshotPoint.EOFY ? 742000 : 720000,
          offsetBalance: point === SnapshotPoint.EOFY ? 24000 : 32000,
          interestRate: point === SnapshotPoint.EOFY ? 0.0614 : 0.0594,
          marketRate: 0.0605,
          annualRepayments: 48600,
          interestPaid: 40867,
          loanLimit: 750000,
          status: 'Completed',
        },
      ],
    });
  }

  // Assessment Criteria / Insights & Recommendations for Harrison Family
  await prisma.assessmentCriterion.createMany({
    data: [
      {
        annualReviewId: review2025.id,
        category: 'PROPERTY_ANALYSIS',
        criterionCode: 'CM_RENT_REVIEW',
        criterionTitle: 'Rental Income Review',
        screen: 'Property Analysis',
        propertyName: '7 Kawana Way, Buddina',
        maintenanceInsight: 'Rent 11% below benchmark',
        metric: 'Rental Income',
        owner: 'Adviser',
        action: 'Reset rent Q3',
        rating: CriterionRating.ATTENTION_REQUIRED,
        insight: 'Current rental income is $80/wk below the local market rent benchmark.',
        recommendation: 'Review the current rent against the relevant market benchmark at next opportunity.',
        potentialOpportunity: 'Additional $4,160 annual gross rental income.',
        priority: CriterionPriority.HIGH,
        adviserNotes: '26 months since last review',
        sortOrder: 1,
      },
      {
        annualReviewId: review2025.id,
        category: 'PROPERTY_ANALYSIS',
        criterionCode: 'CAP_VALUATION_REVIEW',
        criterionTitle: 'Property Valuation Review',
        screen: 'Property Analysis',
        propertyName: '22 Oak Avenue, Mooloolaba',
        maintenanceInsight: 'Valuation check due',
        metric: 'Valuation',
        owner: 'Adviser',
        action: 'Order valuation',
        rating: CriterionRating.STRONG,
        insight: "The property's current valuation has appreciated strongly against its previous valuation.",
        recommendation: 'Verify the latest valuation and record the review date and source.',
        potentialOpportunity: 'Usable equity uplift of $200,000.',
        priority: CriterionPriority.HIGH,
        adviserNotes: 'Desktop valuation available',
        sortOrder: 2,
      },
      {
        annualReviewId: review2025.id,
        category: 'CASH_MANAGEMENT',
        criterionCode: 'CM_OPEX_REDUCTION',
        criterionTitle: 'Reduce Operating Expenses',
        screen: 'Cash Management',
        propertyName: '48 Underwood Street, Paddington',
        maintenanceInsight: 'Expenses 28% above benchmark',
        metric: 'Operating Expenses',
        owner: 'Client',
        action: 'Renegotiate PM fee',
        rating: CriterionRating.SATISFACTORY,
        insight: 'Property operating expenses are elevated compared to peer benchmarks.',
        recommendation: 'Review insurance premiums, property management fees and maintenance costs for potential savings.',
        potentialOpportunity: 'Potential $2,400 p.a. saving',
        priority: CriterionPriority.MEDIUM,
        adviserNotes: 'Potential $2,400 p.a. saving',
        sortOrder: 3,
      },
      {
        annualReviewId: review2023.id,
        category: 'PROPERTY_OVERVIEW',
        criterionCode: 'IR_2023_1',
        criterionTitle: 'Increase Rent',
        screen: 'Property Overview',
        propertyName: '7 Kawana Way',
        maintenanceInsight: '-',
        metric: 'Total property return',
        owner: 'Sahil',
        action: 'Review rental income',
        rating: CriterionRating.SATISFACTORY,
        insight: 'Rent is $80 below market',
        recommendation: 'Review rent at next opportunity',
        priority: CriterionPriority.MEDIUM,
        adviserNotes: 'Check benchmark',
        sortOrder: 1,
      },
      {
        annualReviewId: review2024.id,
        category: 'PROPERTY_OVERVIEW',
        criterionCode: 'IR_2024_1',
        criterionTitle: 'Increase Rent',
        screen: 'Property Overview',
        propertyName: '7 Kawana Way',
        maintenanceInsight: '-',
        metric: 'Total property return',
        owner: 'Sahil',
        action: 'No action required',
        rating: CriterionRating.STRONG,
        insight: 'Rent is $80 below market',
        recommendation: 'Continue monitoring market yield',
        priority: CriterionPriority.MEDIUM,
        adviserNotes: 'Continue monitor',
        sortOrder: 1,
      },
    ],
  });

  await prisma.futureOutlookScenario.create({
    data: {
      annualReviewId: review2025.id,
      forecastYears: 20,
      propertyGrowthRate: 0.04,
      rentalGrowthRate: 0.035,
      inflationRate: 0.025,
      superReturnRate: 0.07,
      extraMonthlyHomeLoanRepayment: 200,
      downsizeEnabled: true,
      downsizeYearOffset: 12,
      downsizeNetProceedsToSuper: 800000,
      targetRetirementIncomeAfterTax: 120000,
    },
  });

  // 4. Additional Households in DB for testuser@test.com
  const additionalHouseholds = [
    {
      householdName: 'THOMPSON FAMILY',
      primaryContactEmail: 'mark.thompson@example.com',
      primaryContactPhone: '+61 411 222 333',
      executiveReport: 'Acknowledged',
      fy: 2026,
      finStatus: WorkflowStatus.COMPLETED,
      tchStatus: WorkflowStatus.COMPLETED,
      reviewDateStr: '2026-10-06',
    },
    {
      householdName: 'JOHN DOE',
      primaryContactEmail: 'john.doe@example.com',
      primaryContactPhone: '+61 422 333 444',
      executiveReport: 'Locked (Pending Review)',
      fy: 2026,
      finStatus: WorkflowStatus.IN_PROGRESS,
      tchStatus: WorkflowStatus.NOT_STARTED,
      reviewDateStr: '2026-10-06',
    },
    {
      householdName: 'KAISER BROWN',
      primaryContactEmail: 'kaiser.brown@example.com',
      primaryContactPhone: '+61 433 444 555',
      executiveReport: 'Locked (Pending Review)',
      fy: 2026,
      finStatus: WorkflowStatus.IN_PROGRESS,
      tchStatus: WorkflowStatus.NOT_STARTED,
      reviewDateStr: '2026-10-06',
    },
  ];

  for (const item of additionalHouseholds) {
    const h = await prisma.clientHousehold.create({
      data: {
        adviserId: testAdviser.id,
        householdName: item.householdName,
        adviserAssigned: 'Sarah Jenkins (Senior Property CFO)',
        primaryContactEmail: item.primaryContactEmail,
        primaryContactPhone: item.primaryContactPhone,
        executiveReport: item.executiveReport,
        notes: `Advisory portfolio for ${item.householdName}`,
      },
    });

    await prisma.ownershipEntity.create({
      data: {
        householdId: h.id,
        name: `${item.householdName} (Primary)`,
        type: EntityType.INDIVIDUAL,
        displayType: 'Individual',
        ageOrDob: '38',
        phone: item.primaryContactPhone,
        email: item.primaryContactEmail,
        annualSalary: 180000,
        marginalTaxRate: 0.37,
        superBalance: 240000,
      },
    });

    const rev = await prisma.annualReview.create({
      data: {
        householdId: h.id,
        financialYear: item.fy,
        reviewDate: new Date('2026-10-06'),
        reviewDateStr: item.reviewDateStr,
        finDataStatus: item.finStatus,
        tchReviewStatus: item.tchStatus,
        completedAt: item.tchStatus === WorkflowStatus.COMPLETED ? new Date('2026-10-06') : null,
      },
    });

    await prisma.futureOutlookScenario.create({
      data: {
        annualReviewId: rev.id,
        forecastYears: 20,
      },
    });
  }

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
