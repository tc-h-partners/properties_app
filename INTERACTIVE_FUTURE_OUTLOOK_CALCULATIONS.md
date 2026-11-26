# Interactive Future Outlook: Calculation Reference & Technical Specification

> **Module Overview**: The **Interactive Future Outlook** module projects client wealth accumulation, mortgage debt amortization, superannuation compound growth, property portfolio appreciation, downsizing liquidity events, transitional & CPI-indexed Capital Gains Tax (CGT), and post-retirement net cash flows across a 5-to-35-year investment horizon.

This document outlines all underlying variables, baseline sources, interactive levers, global settings assumptions, mathematical formulas, and algorithms used in both the **Frontend Real-Time Interactive Engine** and the **Backend Discrete Simulation Engine**.

---

## 1. Architecture Overview

The system operates across two complementary layers:

1. **Frontend Real-Time Interactive Engine** ([`ReviewWorkspaceReport.tsx`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx))
   - Reactive client-side model executed in a React `useMemo` hook.
   - Evaluates closed-form compound growth equations instantly as sliders are dragged.
   - Renders a multi-series Catmull-Rom cubic Bézier spline SVG chart with real-time hover inspection.
   - Compares user scenario sliders directly against client portfolio actuals (e.g., Growth CAGR vs "Your portfolio: 3.8%").
2. **Backend Discrete Simulation Engine** ([`future-outlook.service.ts`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts))
   - NestJS service utilizing arbitrary-precision decimal arithmetic (`Decimal.js`).
   - Simulates discrete year-by-year cash flows, operating expenses, accelerated debt servicing via Net Yield improvements, home downsizing asset rebalancing with ATO downsizer contribution caps, pre/post-reform CGT deductions, and post-retirement after-tax safe drawdowns.
   - Persists scenario levers in the `FutureOutlookScenario` database table.
3. **Global System Settings Governance** ([`settings/page.tsx`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/app/settings/page.tsx), [`benchmarks.service.ts`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/benchmarks/benchmarks.service.ts))
   - Configures platform-wide assumptions (CPI, Tax Reform Date, CGT Tax Rate, Investment Return, and Income Tax Rate) centrally managed by institutional administrators.

---

## 2. Comprehensive Variable & Assumption Inventory

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
| **Client Portfolio CAGR** | `clientPortfolioCagr` | Weighted average 5-yr CAGR across client investment properties | `3.8%` | $\%$ p.a. | Actual performance displayed under Growth CAGR slider |
| **Client Portfolio Net Yield**| `clientPortfolioNetYield` | Portfolio actual Net Yield: $(\text{GrossRent} \times 0.65) / \text{InvVal}$ | `3.1%` | $\%$ p.a. | Actual net yield displayed under Net Yield slider |
| **Adult Member Count** | `adultCount` | Count of adult household members / entities | `2` | Count | Used for Downsizer Superannuation Cap (\$300,000/adult) |

---

### B. Global System Settings Assumptions

Managed in **System Settings > Future Outlook Assumptions**:

| Setting Name | Code Identifier | Default Value | Description |
| :--- | :--- | :--- | :--- |
| **Forecast CPI** | `forecastCpi` | `3.0%` p.a. | Inflation indexation rate applied to post-reform cost base |
| **Tax Reform Date** | `taxReformDate` | `1/7/2027` | Cut-off date transitioning from 50% CGT discount to CPI indexation |
| **CGT Tax Rate** | `cgtTaxRate` | `30.0%` | Capital Gains Tax rate applied to taxable capital gains |
| **Global Investment Return** | `investmentReturn` | `5.0%` p.a. | Pre-tax gross investment return on non-super Invested Capital |
| **Global Income Tax Rate** | `incomeTaxRate` | `30.0%` | Tax rate on investment returns, yielding $5\% \times (1 - 30\%) = \mathbf{3.5\%}$ net |

---

### C. Interactive Levers & Sliders

| Lever Name | Variable Identifier | Math Symbol | UI Range | Step | Default | Unit | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Retirement Horizon** | `forecastHorizon` / `forecastYears` | $T$ | $5 - 35$ | $1$ | $20$ (FE) / $15$ (BE) | Years | Years until retirement |
| **Home Growth Rate** | `homeGrowthRate` | $g_H$ | $1.0\% - 12.0\%$ | $0.1\%$ | $3.0\%$ | $\%$ p.a. | Compound annual growth rate for OO home |
| **Home Extra Repayment** | `homeExtraRepayment` | $E_H$ | \$0 – \$5,000 | \$50 | \$0 | \$/mo | Additional monthly principal reduction on home loan |
| **Downsizer Price Today** | `homeDownsizerPrice` | $D_P$ | \$0 – \$1,000k | \$25k | \$0 | \$ | Estimated cost of replacement downsized home today |
| **Investment Growth Rate** | `invGrowthRate` / `propGrowth` | $g_I$ | $1.0\% - 12.0\%$ | $0.1\%$ | $5.0\%$ | $\%$ p.a. | Compound annual growth rate for investment properties |
| **Net Yield** | `invNetYield` | $y_N$ | $1.0\% - 8.0\%$ | $0.1\%$ | $3.5\%$ | $\%$ p.a. | Investment property Net Yield slider |
| **Investment Extra Repayment** | `invExtraRepayment` | $E_I$ | \$0 – \$5,000 | \$50 | \$0 | \$/mo | Direct additional monthly principal reduction |
| **Additional Investment** | `invAddlInvestment` | $A_I$ | \$0 – \$300,000 | \$10,000 | \$0 | \$ | New investment capital committed over projection |
| **Super Return Rate** | `superReturnRate` / `superReturn` | $r_S$ | $1.0\% - 12.0\%$ | $0.1\%$ | $7.0\%$ | $\%$ p.a. | Expected annual net return inside superannuation |
| **Super Extra Contribution** | `superExtraContrib` | $C_S$ | \$0 – \$5,000 | \$50 | \$0 | \$/mo | Additional voluntary monthly super contributions |
| **Target Retirement Income** | `incomeGoal` / `targetIncome` | $Y_{target}$ | \$20k – \$200k | \$5k | \$140,000 | \$/yr | Desired post-tax annual retirement living income |

---

## 3. Mathematical Models & Calculation Formulas

### 1. Owner-Occupied Home Trajectory ($t$)
$$g_H = \frac{\text{homeGrowthRate}}{100}$$

$$\text{hVal}(t) = \text{baseHomeVal} \times (1 + g_H)^t$$

$$\text{hDebt}(t) = \max\Big(0, \;\text{baseHomeLoans} - \big(\text{homeExtraRepayment} \times 12 \times t\big)\Big)$$

$$\text{hEquity}(t) = \max\Big(0, \;\text{hVal}(t) - \text{hDebt}(t)\Big)$$

---

### 2. Investment Portfolio Trajectory & Net Yield Debt Reduction ($t$)

#### Net Yield Debt Reduction Mechanism:
Additional cash generated from improved Net Yield above the client's current baseline portfolio net yield flows directly into accelerated debt reduction:

$$\Delta\text{Yield} = \max\left(0, \;\frac{\text{invNetYield} - \text{clientPortfolioNetYield}}{100}\right)$$

$$\text{ExtraAnnualCashFromYield} = \text{baseInvVal} \times \Delta\text{Yield}$$

$$\text{TotalAnnualInvDebtReduction} = (\text{invExtraRepayment} \times 12) + \text{ExtraAnnualCashFromYield}$$

#### Valuation & Net Equity:
$$g_I = \frac{\text{invGrowthRate}}{100}$$

$$\text{iVal}(t) = \left(\text{baseInvVal} + \text{invAddlInvestment} \times \frac{t}{25}\right) \times (1 + g_I)^t$$

$$\text{iDebt}(t) = \max\Big(0, \;\text{baseInvLoans} - (\text{TotalAnnualInvDebtReduction} \times t)\Big)$$

$$\text{iEquity}(t) = \max\Big(0, \;\text{iVal}(t) - \text{iDebt}(t)\Big)$$

---

### 3. Superannuation Trajectory ($t$)
$$r_S = \frac{\text{superReturnRate}}{100}, \quad \text{annualContrib} = \text{superExtraContrib} \times 12$$

When $r_S > 0$:
$$\text{sBal}(t) = \text{baseSuper} \times (1 + r_S)^t + \text{annualContrib} \times \left[\frac{(1 + r_S)^t - 1}{r_S}\right]$$

When $r_S = 0$:
$$\text{sBal}(t) = \text{baseSuper} + (\text{annualContrib} \times t)$$

---

### 4. Downsizing at Retirement Horizon ($T = \text{forecastHorizon}$)

When a replacement home price today ($D_P$) is specified:
1. **Inflated Replacement Home Cost**:
   $$\text{ReplacementHomeCost} = D_P \times (1 + g_H)^T$$
   $$\text{finalProjectedHomeVal} = \text{round}(\text{ReplacementHomeCost})$$

2. **Released Capital**:
   $$\text{ReleasedCapital} = \max\Big(0, \;\text{hVal}(T) - \text{hDebt}(T) - \text{ReplacementHomeCost}\Big)$$
   *(Existing OO mortgage debt is completely extinguished from sale proceeds).*

3. **Allocation into Superannuation & Invested Capital**:
   Under ATO downsizer contribution provisions, eligible individuals may contribute up to \$300,000 into superannuation:
   $$\text{MaxDownsizeToSuper} = \$300,000 \times \text{adultCount}$$
   $$\text{downsizeToSuper} = \min\big(\text{ReleasedCapital}, \;\text{MaxDownsizeToSuper}\big)$$
   $$\text{downsizeToInvestedCapital} = \max\big(0, \;\text{ReleasedCapital} - \text{downsizeToSuper}\big)$$

---

### 5. Investment Property Capital Gains Tax (CGT) Treatment at Retirement

At retirement ($T$), CGT is evaluated across two statutory regimes:

#### Component 1: Pre-1 July 2027 Capital Gains (Transitional Treatment)
- Evaluation date: $t_{\text{reform}} = 1$ year from FY2026 baseline (1 July 2027).
- Property value at reform date:
  $$V_{\text{reform}} = \text{baseInvVal} \times (1 + g_I)^{t_{\text{reform}}}$$
- Original cost base: $V_0 = \text{totalPurchasePrice}$ (or $\text{baseInvVal}$ if historical purchase price unrecorded).
- Capital gain:
  $$\text{Gain}_{\text{pre}} = \max(0, \; V_{\text{reform}} - V_0)$$
- **Transitional Treatment**: $50\%$ of the pre-reform capital gain is taxable:
  $$\text{TaxableGain}_{\text{pre}} = \text{Gain}_{\text{pre}} \times 0.50$$
  $$\text{CGT}_{\text{pre}} = \text{round}\big(\text{TaxableGain}_{\text{pre}} \times \text{cgtTaxRate}\big)$$

#### Component 2: Post-1 July 2027 Capital Gains (CPI-Indexed Cost Base)
- Post-reform horizon: $t_{\text{post}} = \max(0, \; T - t_{\text{reform}})$.
- Cost base indexed for inflation:
  $$\text{CostBase}_{\text{post}} = V_{\text{reform}} \times (1 + \text{CPI})^{t_{\text{post}}}$$
- Real post-reform capital gain above indexed cost base:
  $$\text{Gain}_{\text{post}} = \max(0, \; \text{iVal}(T) - \text{CostBase}_{\text{post}})$$
- **CPI Indexation Treatment**: $100\%$ of the real gain is taxable at the CGT rate ($\ge 30\%$):
  $$\text{CGT}_{\text{post}} = \text{round}\big(\text{Gain}_{\text{post}} \times \text{cgtTaxRate}\big)$$

#### Total Capital Gains Tax:
$$\text{TotalCGT} = \text{CGT}_{\text{pre}} + \text{CGT}_{\text{post}}$$

---

### 6. Invested Capital & Post-Retirement Cash Flows

#### Total Invested Capital:
CGT is deducted directly from invested capital upon realization at retirement:
$$\text{InvestedCapital} = \max\Big(0, \;\text{iEquity}(T) + \text{downsizeToInvestedCapital} - \text{TotalCGT}\Big)$$

#### Projected After-Tax Income from Invested Capital:
Using global assumptions ($5.0\%$ p.a. return less $30\%$ income tax):
$$\text{NetReturnRate} = 5.0\% \times (1 - 0.30) = \mathbf{3.5\% \text{ net p.a.}}$$
$$\text{projectedAfterTaxIncome} = \text{round}\big(\text{InvestedCapital} \times 0.035\big)$$

#### Total Superannuation Balance & Pension Drawdown:
$$\text{projectedSuperBal} = \text{round}\big(\text{sBal}(T) + \text{downsizeToSuper}\big)$$
$$\text{projectedSuperPensionIncome} = \text{round}\big(\text{projectedSuperBal} \times 0.05\big)$$
*(Assumes safe $5.0\%$ annual tax-free pension drawdown in retirement phase).*

#### Total Projected Retirement Income:
$$\text{projectIncomeTotal} = \text{round}\big(\text{projectedAfterTaxIncome} + \text{projectedSuperPensionIncome} + \text{incomeGoal} \times 0.60\big)$$

---

## 4. UI Metric Display & Client Portfolio Comparison

Each interactive lever displays actual client portfolio metrics where relevant to provide immediate context:

- **Capital Growth CAGR**: Displays `"Your portfolio: 3.8%"` (dynamically calculated from client investment holdings).
- **Net Yield**: Displays `"Your portfolio: 3.1%"` (actual net yield after operating costs).
- **Home Growth CAGR**: Displays `"Your home: 3.0%"`.
- **Downsizing Card**: Informs adviser of available capital released and highlights the \$300,000/adult super cap.
- **Outcome Cards**:
  - **Card 1 (Home)**: Displays projected replacement home value if downsized, notes original home valuation, and confirms mortgage clearance.
  - **Card 2 (Invested Capital)**: Displays After-Tax Income at $3.5\%$ net yield, total Invested Capital, and an explicit breakdown of Pre-2027 (50% disc) and Post-2027 (CPI-indexed) CGT deductions.
  - **Card 3 (Superannuation)**: Displays accumulated super balance, downsizer contribution influx, and safe 5% tax-free pension drawdown.

---

## 5. Technical Source Code Mapping

| Concept | Frontend Implementation File | Backend Implementation File |
| :--- | :--- | :--- |
| **System Settings Assumptions** | [`api.ts`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/lib/api.ts), [`settings/page.tsx`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/app/settings/page.tsx) | [`benchmarks.service.ts`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/benchmarks/benchmarks.service.ts) |
| **Baseline Extraction** | [`ReviewWorkspaceReport.tsx#L1624-L1676`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx) | [`future-outlook.service.ts#L270-L325`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts) |
| **Net Yield Debt Reduction** | [`ReviewWorkspaceReport.tsx#L1685-L1691`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx) | [`future-outlook.service.ts#L98-L102`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts) |
| **Downsizing & Super Split** | [`ReviewWorkspaceReport.tsx#L1730-L1757`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx) | [`future-outlook.service.ts#L107-L125`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts) |
| **Transitional & CPI CGT** | [`ReviewWorkspaceReport.tsx#L1760-L1786`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx) | [`future-outlook.service.ts#L159-L180`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts) |
| **Invested Capital & 3.5% Net Yield**| [`ReviewWorkspaceReport.tsx#L1789-L1814`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx) | [`future-outlook.service.ts#L182-L203`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts) |
| **Spline Chart Geometry**| [`ReviewWorkspaceReport.tsx#L1815-L1872`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx) | — |
| **Scenario Persistence** | [`ReviewWorkspaceReport.tsx`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Frontend/src/components/household/ReviewWorkspaceReport.tsx) | [`future-outlook.service.ts#L240-L280`](file:///Users/ritika/Desktop/Work/Binny/properties_app/Backend/src/modules/future-outlook/future-outlook.service.ts) |
