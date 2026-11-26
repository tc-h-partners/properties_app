# Interactive Future Outlook: Calculation Reference & Technical Specification

> **Module Overview**: The **Interactive Future Outlook** module projects client wealth accumulation, mortgage debt amortization, superannuation compound growth, property portfolio appreciation, downsizing liquidity events, and post-retirement net cash flows across a 5-to-35-year investment horizon.

This document outlines all underlying variables, baseline sources, interactive levers, mathematical formulas, and algorithms used in both the **Frontend Real-Time Interactive Engine** and the **Backend Discrete Simulation Engine**.

---

## 1. Architecture Overview

The system operates across two complementary layers:

1. **Frontend Real-Time Interactive Engine** ([`ReviewWorkspaceReport.tsx`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx#L870-L1020))
   - Reactive client-side model executed in a React `useMemo` hook.
   - Evaluates closed-form compound growth equations instantly as sliders are dragged.
   - Renders a multi-series Catmull-Rom cubic Bézier spline SVG chart with real-time hover inspection.
2. **Backend Discrete Simulation Engine** ([`future-outlook.service.ts`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts#L41-L173))
   - NestJS service utilizing arbitrary-precision decimal arithmetic (`Decimal.js`).
   - Simulates discrete year-by-year cash flows, operating expenses, debt servicing, home downsizing asset rebalancing, and post-retirement safe pension drawdowns.
   - Persists scenario levers in the `FutureOutlookScenario` database table.

---

## 2. Comprehensive Variable Inventory

### A. Baseline Variables (Year $t = 0$)

| Variable Name | Code Identifier | Data Source / Database Field | Default Fallback | Unit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Owner-Occupied Valuation** | `baseHomeVal` / `ooValuation` | Sum of `property.valuation` where `isOwnerOccupied === true` | \$2,563,126 | AUD (\$) | Baseline gross market value of primary residence |
| **Owner-Occupied Debt** | `baseHomeLoans` / `ooDebt` | Sum of `(loanBalance - offsetBalance)` for OO properties | \$933,126 | AUD (\$) | Total outstanding net mortgage debt on home |
| **Owner-Occupied Net Equity** | `baseHomeEquity` | $\max(0, \text{baseHomeVal} - \text{baseHomeLoans})$ | \$1,630,000 | AUD (\$) | Opening net equity in primary residence |
| **Investment Portfolio Value** | `baseInvVal` / `invValuation` | Sum of `property.valuation` where `isOwnerOccupied === false` | \$2,500,000 | AUD (\$) | Baseline gross value of investment portfolio |
| **Investment Portfolio Debt** | `baseInvLoans` / `invDebt` | Sum of `(loanBalance - offsetBalance)` for inv properties | \$870,000 | AUD (\$) | Total outstanding net debt across investment properties |
| **Investment Net Equity** | `baseInvEquity` | $\max(0, \text{baseInvVal} - \text{baseInvLoans})$ | \$1,630,000 | AUD (\$) | Opening net equity across investment properties |
| **Superannuation Balance** | `baseSuper` / `superBalance` | Sum of `member.currentSuperBalance` across household | \$650,000 | AUD (\$) | Total opening household superannuation balance |
| **Annual Super Contribution** | `annualContrib` / `annualSuperContrib` | Sum of `member.annualSuperContribution` | \$0 | AUD (\$/yr) | Opening recurring employer / concessional super contributions |
| **Gross Annual Rent** | `invGrossRent` | Sum of `annualGrossRent` across investment properties | Extracted from DB | AUD (\$/yr) | Total portfolio gross rental income |
| **Average Cost of Debt** | `avgInterestRate` | Baseline weighted mortgage interest rate | `5.95%` (`0.0595`) | Rate p.a. | Weighted average interest rate across investment loans |

---

### B. Interactive Levers & Sliders

| Lever Name | Variable Identifier | Math Symbol | UI Range | Step | Default | Unit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Retirement Horizon** | `forecastHorizon` / `forecastYears` | $T$ | $5 - 35$ | $1$ | $20$ (FE) / $15$ (BE) | Years | Years until retirement |
| **Home Growth Rate** | `homeGrowthRate` | $g_H$ | $1.0\% - 12.0\%$ | $0.1\%$ | $3.0\%$ | $\%$ p.a. | Compound annual growth rate for OO home |
| **Home Extra Repayment** | `homeExtraRepayment` | $E_H$ | \$0 – \$5,000 | \$50 | \$0 | \$/mo | Additional monthly principal reduction on home loan |
| **Downsizer Price Today** | `homeDownsizerPrice` | $D_P$ | \$0 – \$1,000k | \$25k | \$0 | \$ | Estimated cost of replacement downsized home today |
| **Investment Growth Rate** | `invGrowthRate` / `propGrowth` | $g_I$ | $1.0\% - 12.0\%$ | $0.1\%$ | $5.0\%$ | $\%$ p.a. | Compound annual growth rate for investment properties |
| **Investment Extra Repayment** | `invExtraRepayment` | $E_I$ | \$0 – \$5,000 | \$50 | \$0 | \$/mo | Additional monthly principal reduction on inv debt |
| **Additional Investment** | `invAddlInvestment` | $A_I$ | \$0 – \$300,000 | \$10,000 | \$0 | \$ | New investment capital committed over projection |
| **Super Return Rate** | `superReturnRate` / `superReturn` | $r_S$ | $1.0\% - 12.0\%$ | $0.1\%$ | $7.0\%$ | $\%$ p.a. | Expected annual net return inside superannuation |
| **Super Extra Contribution** | `superExtraContrib` | $C_S$ | \$0 – \$5,000 | \$50 | \$0 | \$/mo | Additional voluntary monthly super contributions |
| **Target Retirement Income** | `incomeGoal` / `targetIncome` | $Y_{target}$ | \$20k – \$200k | \$5k | \$140,000 | \$/yr | Desired post-tax annual retirement living income |
| **Rental Growth Rate** | `rentalGrowthRate` | $g_R$ | $0.0\% - 10.0\%$ | $0.5\%$ | $3.5\%$ | $\%$ p.a. | Annual growth rate of gross rental yields (backend) |
| **Downsizing Toggle** | `downsizeEnabled` | — | `true` / `false` | — | `false` | Boolean | Whether home downsizing event is scheduled |
| **Downsize Year Offset** | `downsizeYearOffset` | $T_{down}$ | $1 - 30$ | $1$ | $10$ | Year | Year offset at which downsizing occurs |
| **Downsize Proceeds to Super** | `downsizeNetProceedsToSuper` | $P_{down}$ | $\ge 0$ | — | \$0 | \$ | Net equity released from downsizing injected into super |

---

## 3. Frontend Real-Time Calculation Engine

Implemented inside `ReviewWorkspaceReport.tsx` under the `futureOutlookData` memoized calculation.

### 1. Owner-Occupied Home Trajectory ($t$)
$$g_H = \frac{\text{homeGrowthRate}}{100}$$

$$\text{hVal}(t) = \text{baseHomeVal} \times (1 + g_H)^t$$

$$\text{hDebt}(t) = \max\Big(0, \;\text{baseHomeLoans} - \big(\text{homeExtraRepayment} \times 12 \times t\big)\Big)$$

$$\text{hEquity}(t) = \max\Big(0, \;\text{hVal}(t) - \text{hDebt}(t)\Big)$$

---

### 2. Investment Portfolio Trajectory ($t$)
$$g_I = \frac{\text{invGrowthRate}}{100}$$

$$\text{iVal}(t) = \left(\text{baseInvVal} + \text{invAddlInvestment} \times \frac{t}{25}\right) \times (1 + g_I)^t$$

$$\text{iDebt}(t) = \max\Big(0, \;\text{baseInvLoans} - \big(\text{invExtraRepayment} \times 12 \times t\big)\Big)$$

$$\text{iEquity}(t) = \max\Big(0, \;\text{iVal}(t) - \text{iDebt}(t)\Big)$$

> **Note on Additional Investment**: The additional capital $A_I$ scales progressively into the portfolio valuation over a 25-year horizon ($\frac{t}{25}$) and participates in compounding at rate $g_I$.

---

### 3. Superannuation Trajectory ($t$)
$$r_S = \frac{\text{superReturnRate}}{100}$$

$$\text{annualContrib} = \text{superExtraContrib} \times 12$$

When $r_S > 0$:
$$\text{sBal}(t) = \text{baseSuper} \times (1 + r_S)^t + \text{annualContrib} \times \left[\frac{(1 + r_S)^t - 1}{r_S}\right]$$

When $r_S = 0$:
$$\text{sBal}(t) = \text{baseSuper} + (\text{annualContrib} \times t)$$

> **Mathematical Foundation**: Employs the **Future Value of an Ordinary Annuity** formula to calculate the accumulated value of ongoing contributions compounded annually at $r_S$, summed with the initial balance compounded at $r_S$.

---

### 4. Forecast Outputs at Selected Retirement Horizon ($t = \text{forecastHorizon}$)

The target calendar year is established as:
$$\text{Target Year} = 2026 + \text{forecastHorizon}$$

The values output to the forecast cards are:

#### Card 1: Home — Owner Occupied
$$\text{projectedHomeVal} = \text{round}\big(\text{hVal}(\text{forecastHorizon})\big)$$

#### Card 2: Investment Properties
$$\text{projectedInvEquity} = \text{round}\big(\text{iEquity}(\text{forecastHorizon})\big)$$

$$\text{projectedAfterTaxIncome} = \text{round}\big(\text{projectedInvEquity} \times 0.024888\big)$$

*(The $2.4888\%$ multiplier represents the modelled net after-tax cash yield distributed from net property equity).*

#### Card 3: Superannuation
$$\text{projectedSuperBal} = \text{round}\big(\text{sBal}(\text{forecastHorizon})\big)$$

#### Dark Navy Card: Total Projected Retirement Income
$$\text{projectIncomeTotal} = \text{round}\Big(\text{projectedInvEquity} \times 0.05 + \text{projectedSuperBal} \times 0.045 + \text{incomeGoal} \times 0.60\Big)$$

- **5.0%**: Income distribution rate from investment equity.
- **4.5%**: Safe pension distribution rate from superannuation assets.
- **60.0%**: Floor allocation relative to user's targeted retirement income goal.

---

### 5. Multi-Series SVG Spline Chart Geometry

The chart renders 3 continuous curves across 6 evaluation knots: $t \in [0, 5, 10, 15, 20, 25]$ within a $320 \times 150$ SVG coordinate space.

#### Scale Transformations
- **Horizontal Axis ($X$)**:
  $$x(t) = 15 + \left(\frac{\text{clamp}(t, 0, 25)}{25}\right) \times 290$$
  Maps $t \in [0, 25 \text{ yrs}]$ to pixel range $[15, 305]$.

- **Vertical Axis ($Y$)**:
  $$\text{maxVal} = \max\left(6,500,000, \;\max_{\forall t}\{\text{hEquity}(t), \text{iEquity}(t), \text{sBal}(t)\} \times 1.08\right)$$
  $$\text{minVal} = 0$$
  $$y(\text{val}) = 135 - \left(\frac{\text{clamp}(\text{val}, \text{minVal}, \text{maxVal}) - \text{minVal}}{\text{maxVal} - \text{minVal}}\right) \times 120$$
  Maps value to SVG pixel height between $y=135$ (baseline zero) and $y=15$ (top ceiling).

#### Catmull-Rom to Cubic Bézier Spline Form
For each adjacent pair of coordinates $P_1(x_1, y_1)$ and $P_2(x_2, y_2)$ bounded by previous point $P_0$ and subsequent point $P_3$, control points are derived as:
$$CP_1 = P_1 + \frac{P_2 - P_0}{6}$$
$$CP_2 = P_2 - \frac{P_3 - P_1}{6}$$

The resulting SVG path command for each segment is:
$$\text{path} += \text{" C } CP_{1x}\; CP_{1y}, \; CP_{2x}\; CP_{2y}, \; P_{2x}\; P_{2y}\text{"}$$

---

## 4. Backend Discrete Simulation Engine

Implemented in `future-outlook.service.ts` using `Decimal.js` for precise annual accounting over $yr = 1, 2, \dots, \text{forecastYears}$.

### 1. Annual Compounding Recurrence
For each year $yr$:

1. **Property Capital Appreciation**:
   $$V_{oo}(yr) = V_{oo}(yr - 1) \times (1 + \text{propGrowth})$$
   $$V_{inv}(yr) = V_{inv}(yr - 1) \times (1 + \text{propGrowth})$$

2. **Gross Rental Growth**:
   $$R_{inv}(yr) = R_{inv}(yr - 1) \times (1 + \text{rentGrowth})$$

3. **Home Loan Principal Reduction**:
   $$\Delta D = \text{extraMonthlyHomeLoanRepayment} \times 12$$
   $$D_{oo}(yr) = \max\Big(0, \; D_{oo}(yr - 1) - \Delta D\Big)$$

4. **Superannuation Compounding & Additions**:
   $$S(yr) = S(yr - 1) \times (1 + \text{superReturn}) + \text{annualSuperContrib}$$

---

### 2. Downsizing Transaction Logic
When $\text{downsizeEnabled} = \text{true}$ and $yr = \text{downsizeYearOffset}$:
1. **Replacement Home Value Adjustment**:
   $$V_{oo}(yr) = V_{oo}(yr) \times 0.60$$
   *(Models downsizing from primary residence into a replacement home worth 60% of the inflated market value).*
2. **Mortgage Elimination**:
   $$D_{oo}(yr) = 0$$
3. **Super Capital Influx**:
   $$S(yr) = S(yr) + \text{downsizeNetProceedsToSuper}$$

---

### 3. Net Operating Income (NOI) & Rental Cash Flow
For each year $yr$:

1. **Net Operating Income (NOI)**:
   $$\text{NOI}(yr) = R_{inv}(yr) \times 0.65$$
   *(Reflects a benchmark $35\%$ property expense ratio for agent management commissions, council/water rates, landlord insurance, strata levies, and ongoing maintenance).*

2. **Mortgage Interest Expense**:
   $$\text{Interest}(yr) = D_{inv}(yr) \times \text{avgInterestRate} \quad (\text{default: } 0.0595)$$

3. **Net Rental Cash Flow**:
   $$\text{NetRentalCashFlow}(yr) = \text{NOI}(yr) - \text{Interest}(yr)$$

4. **Portfolio Balance Sheet Totals**:
   $$\text{TotalPropertyValuation}(yr) = V_{oo}(yr) + V_{inv}(yr)$$
   $$\text{TotalDebt}(yr) = D_{oo}(yr) + D_{inv}(yr)$$
   $$\text{NetEquity}(yr) = \text{TotalPropertyValuation}(yr) - \text{TotalDebt}(yr)$$
   $$\text{TotalNetAssets}(yr) = \text{NetEquity}(yr) + S(yr)$$

---

### 4. Retirement Adequacy Analysis (`heroOutputs`)
At $yr = \text{forecastYears}$:

1. **Superannuation Safe Pension Drawdown (5% Rule)**:
   $$\text{SuperPensionIncome} = S(\text{forecastYears}) \times 0.05$$

2. **Total Projected After-Tax Retirement Income**:
   $$\text{TotalProjectedIncome} = \text{round}\Big(\text{SuperPensionIncome} + \max\big(0, \;\text{NetRentalCashFlow}(\text{forecastYears})\big)\Big)$$

3. **Retirement Income Surplus / Shortfall**:
   $$\text{IncomeSurplusOrShortfall} = \text{TotalProjectedIncome} - \text{targetRetirementIncomeAfterTax}$$

4. **Retirement Goal Feasibility Status**:
   $$\text{isTargetMet} = \big(\text{IncomeSurplusOrShortfall} \ge 0\big)$$

---

## 5. Technical Source Code Mapping

| Concept | Frontend Implementation File | Backend Implementation File |
| :--- | :--- | :--- |
| **Baseline Extraction** | [`ReviewWorkspaceReport.tsx#L872-L895`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx#L872-L895) | [`future-outlook.service.ts#L235-L283`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts#L235-L283) |
| **Compounding Equations** | [`ReviewWorkspaceReport.tsx#L897-L918`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx#L897-L918) | [`future-outlook.service.ts#L82-L132`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts#L82-L132) |
| **Horizon Projections** | [`ReviewWorkspaceReport.tsx#L920-L929`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx#L920-L929) | [`future-outlook.service.ts#L134-L172`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts#L134-L172) |
| **Spline Chart Geometry**| [`ReviewWorkspaceReport.tsx#L940-L986`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx#L940-L986) | — |
| **Downsizing Event** | Handled via slider baseline input | [`future-outlook.service.ts#L98-L104`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts#L98-L104) |
| **Retirement Income Metric**| Card projection: equity + super + goal | Safe super pension (5%) + positive net rental cash flow |
