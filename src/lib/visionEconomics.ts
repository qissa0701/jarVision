// VISION Studio — economics & evaluation model.
//
// Pure, deterministic helpers that power the Adoption Path's cost-benefit
// scenario explorer and provide graceful fallbacks for risk severity/mitigation
// and project-similarity data when a use case doesn't script them explicitly.
// Every figure here is indicative / simulated — there is no live model or feed.

import type {
  CostLineItem,
  ImplementationApproach,
  MitigationTechnique,
  RiskItem,
  RiskSeverity,
  SimilarProject,
  UseCase,
  UseCaseCostBasis,
} from "@/types/vision";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Blended fully-loaded monthly cost of one internal PMI person (USD). */
export const INTERNAL_MONTHLY_USD = 9_000;
/** Blended monthly cost of one external contractor (USD). */
export const CONTRACTOR_MONTHLY_USD = 20_000;

/** Human-readable labels for the three delivery approaches. */
export const APPROACH_META: Record<
  ImplementationApproach,
  { label: string; blurb: string }
> = {
  vendor: {
    label: "Vendor (buy)",
    blurb: "License a specialist vendor product and integrate it. Fastest capability, lowest build risk, highest recurring licence.",
  },
  saas: {
    label: "External SaaS",
    blurb: "Subscribe to a managed SaaS platform. Low upfront, quick to value, ongoing subscription and usage fees.",
  },
  "in-house": {
    label: "Build in-house",
    blurb: "Build on PMI's own stack. Highest control and IP ownership, heaviest labour and run-cost, slower ramp.",
  },
};

/** Ordered severity bands (ascending). */
export const SEVERITY_ORDER: RiskSeverity[] = ["low", "medium", "high", "critical"];

export const SEVERITY_LABEL: Record<RiskSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const TECHNIQUE_LABEL: Record<MitigationTechnique, string> = {
  avoidance: "Avoidance",
  reduction: "Reduction",
  transference: "Transference",
  acceptance: "Acceptance",
};

export const TECHNIQUE_BLURB: Record<MitigationTechnique, string> = {
  avoidance: "Stop or descope the risky activity entirely.",
  reduction: "Add controls to lower the likelihood or impact.",
  transference: "Shift the risk via insurance, contracts or vendor SLAs.",
  acceptance: "Acknowledge a low or costly-to-fix risk and monitor it.",
};

// ─── Formatting ────────────────────────────────────────────────────────────

/** Compact USD formatter, e.g. $1.2M, $85K, $900. */
export function formatUsd(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

// ─── Cost basis fallback ─────────────────────────────────────────────────────

function lower(step: RiskSeverity, by = 1): RiskSeverity {
  const i = SEVERITY_ORDER.indexOf(step);
  return SEVERITY_ORDER[Math.max(0, i - by)];
}

/**
 * Derive a believable cost basis for a use case that doesn't script one, so the
 * calculator works for every candidate. Uses light keyword heuristics on the
 * use-case text to nudge complexity and benefit.
 */
export function deriveCostBasis(uc: UseCase): UseCaseCostBasis {
  if (uc.costBasis) return uc.costBasis;

  const text = `${uc.description} ${uc.risks.join(" ")}`.toLowerCase();
  const capexHeavy = /(robot|physical|capex|hardware|sensor|factory|edge)/.test(text);
  const lightweight = /(framing|method|sprint|workshop|triage)/.test(text);

  const complexity = capexHeavy ? 1.6 : lightweight ? 0.6 : 1;
  const annualBenefitUsd = capexHeavy ? 1_400_000 : lightweight ? 520_000 : 900_000;
  const monthlyTokenUsd = lightweight ? 1_200 : capexHeavy ? 2_800 : 4_500;

  return {
    annualBenefitUsd,
    monthlyTokenUsd,
    complexity,
    defaults: {
      vendor: { internalPeople: 2, contractors: 2, timelineMonths: Math.round(5 * complexity) },
      saas: { internalPeople: 2, contractors: 1, timelineMonths: Math.round(4 * complexity) },
      "in-house": { internalPeople: 4, contractors: 2, timelineMonths: Math.round(7 * complexity) },
    },
  };
}

// ─── Cost-benefit calculator ─────────────────────────────────────────────────

export interface CostModelInputs {
  approach: ImplementationApproach;
  internalPeople: number;
  contractors: number;
  timelineMonths: number;
}

export interface CostModelResult {
  approach: ImplementationApproach;
  oneTime: CostLineItem[];
  recurringAnnual: CostLineItem[];
  totalOneTime: number;
  totalRecurringAnnual: number;
  totalFirstYear: number;
  annualBenefitUsd: number;
  /** Month (from kickoff) the initiative goes live. */
  goLiveMonth: number;
  /** Month full run-rate benefit is reached (after ramp). */
  fullBenefitMonth: number;
  /** First month cumulative net turns positive, or null if not within horizon. */
  breakEvenMonth: number | null;
  /** Cumulative net cash at month 36 (3-year). */
  threeYearNet: number;
}

/** Approach-specific benefit ramp (months from go-live to full run-rate). */
const RAMP_MONTHS: Record<ImplementationApproach, number> = {
  vendor: 3,
  saas: 2,
  "in-house": 5,
};

export function computeCostModel(
  basis: UseCaseCostBasis,
  inputs: CostModelInputs,
): CostModelResult {
  const { approach, internalPeople, contractors, timelineMonths } = inputs;
  const c = basis.complexity;

  const labourOneTime =
    (internalPeople * INTERNAL_MONTHLY_USD + contractors * CONTRACTOR_MONTHLY_USD) *
    timelineMonths;

  let oneTime: CostLineItem[] = [];
  let recurringAnnual: CostLineItem[] = [];

  const tokenAnnual = basis.monthlyTokenUsd * 12;

  if (approach === "vendor") {
    oneTime = [
      { label: "Licence & implementation fee", amountUsd: Math.round(220_000 * c) },
      { label: "Integration & configuration (labour)", amountUsd: Math.round(labourOneTime) },
      { label: "Onboarding & training", amountUsd: 30_000 },
    ];
    recurringAnnual = [
      { label: "Vendor licence & support", amountUsd: Math.round(180_000 * c) },
      { label: "Managed inference allotment", amountUsd: Math.round(tokenAnnual * 0.8), note: "tokens bundled at a discount" },
    ];
  } else if (approach === "saas") {
    oneTime = [
      { label: "Setup & data integration", amountUsd: Math.round(60_000 * c) },
      { label: "Configuration & build (labour)", amountUsd: Math.round(labourOneTime) },
      { label: "Change management", amountUsd: 20_000 },
    ];
    recurringAnnual = [
      { label: "SaaS subscription", amountUsd: Math.round(120_000 * c) },
      { label: "Usage / token overage", amountUsd: Math.round(tokenAnnual), note: "metered usage" },
    ];
  } else {
    oneTime = [
      { label: "Platform & infrastructure setup", amountUsd: Math.round(90_000 * c) },
      { label: "Engineering build (labour)", amountUsd: Math.round(labourOneTime) },
      { label: "Security & guardrail hardening", amountUsd: Math.round(40_000 * c) },
    ];
    recurringAnnual = [
      { label: "Cloud infra & hosting", amountUsd: Math.round(55_000 * c) },
      { label: "LLM token / inference costs", amountUsd: Math.round(tokenAnnual * 1.25), note: "self-managed, unbundled" },
      { label: "Model ops & maintenance", amountUsd: Math.round(45_000 * c) },
    ];
  }

  const totalOneTime = oneTime.reduce((s, l) => s + l.amountUsd, 0);
  const totalRecurringAnnual = recurringAnnual.reduce((s, l) => s + l.amountUsd, 0);
  const totalFirstYear = totalOneTime + totalRecurringAnnual;
  const annualBenefitUsd = basis.annualBenefitUsd;

  // Month-by-month simulation over a 36-month horizon.
  const ramp = RAMP_MONTHS[approach];
  const goLiveMonth = timelineMonths;
  const fullBenefitMonth = goLiveMonth + ramp;
  const monthlyRecurring = totalRecurringAnnual / 12;
  const monthlyOneTime = timelineMonths > 0 ? totalOneTime / timelineMonths : totalOneTime;
  const fullMonthlyBenefit = annualBenefitUsd / 12;

  let cumulative = 0;
  let breakEvenMonth: number | null = null;
  let threeYearNet = 0;

  for (let m = 1; m <= 36; m += 1) {
    let cost = 0;
    if (m <= timelineMonths) cost += monthlyOneTime;
    if (m > goLiveMonth) cost += monthlyRecurring;

    let benefit = 0;
    if (m > goLiveMonth) {
      const rampProgress = ramp > 0 ? Math.min(1, (m - goLiveMonth) / ramp) : 1;
      benefit = fullMonthlyBenefit * rampProgress;
    }

    cumulative += benefit - cost;
    if (breakEvenMonth === null && cumulative >= 0 && m > goLiveMonth) breakEvenMonth = m;
    if (m === 36) threeYearNet = cumulative;
  }

  return {
    approach,
    oneTime,
    recurringAnnual,
    totalOneTime,
    totalRecurringAnnual,
    totalFirstYear,
    annualBenefitUsd,
    goLiveMonth,
    fullBenefitMonth,
    breakEvenMonth,
    threeYearNet,
  };
}

// ─── Risk fallback ───────────────────────────────────────────────────────────

function severityForRisk(text: string): RiskSeverity {
  const t = text.toLowerCase();
  if (/(safety|off the rails|cascading|incorrect autonomous|capex|physics is hard)/.test(t)) return "high";
  if (/(false positive|drift|connectivity|data quality|explainab|ambiguity|over-promis|indirect)/.test(t)) return "medium";
  if (/(deferred|low|complement)/.test(t)) return "low";
  return "medium";
}

/**
 * Build explorable RiskItems from a use case. Uses scripted `riskItems` when
 * present; otherwise derives severity + the four mitigation techniques from the
 * plain `risks` strings so every candidate has a working risk explorer.
 */
export function deriveRiskItems(uc: UseCase): RiskItem[] {
  if (uc.riskItems && uc.riskItems.length > 0) return uc.riskItems;

  return uc.risks.map((title, i) => {
    const severity = severityForRisk(title);
    const recommendedTechnique: MitigationTechnique =
      severity === "critical" ? "avoidance" : severity === "low" ? "acceptance" : "reduction";
    return {
      id: `risk-${uc.id}-${i}`,
      title,
      severity,
      recommendedTechnique,
      mitigations: [
        {
          technique: "avoidance",
          strategy: `Descope or gate the activity behind "${shorten(title)}" until controls exist — avoid the highest-exposure paths.`,
          residualSeverity: lower(severity, 2),
        },
        {
          technique: "reduction",
          strategy: `Add monitoring, guardrails and human-in-the-loop review to lower the likelihood and impact of "${shorten(title)}".`,
          residualSeverity: lower(severity, 1),
        },
        {
          technique: "transference",
          strategy: `Shift exposure via vendor SLAs, contractual warranties or insurance covering "${shorten(title)}".`,
          residualSeverity: lower(severity, 1),
        },
        {
          technique: "acceptance",
          strategy: `Formally accept and monitor "${shorten(title)}" where the cost to fully fix outweighs the residual exposure.`,
          residualSeverity: severity,
        },
      ],
    };
  });
}

function shorten(s: string): string {
  const clean = s.split(/[—-]/)[0].trim();
  return clean.length > 48 ? `${clean.slice(0, 45)}…` : clean;
}

// ─── Similar-project fallback ────────────────────────────────────────────────

/**
 * Existing projects this candidate resembles. Uses scripted `similarProjects`
 * when present; otherwise derives lightweight entries from `projectClashes` so
 * the similarity / duplicate check always has something to show.
 */
export function deriveSimilarProjects(uc: UseCase): SimilarProject[] {
  // An explicitly-defined list is authoritative — even an empty one, which lets
  // a use case declare itself net-new (nothing like it adopted at PMI yet).
  if (uc.similarProjects) return uc.similarProjects;

  return uc.projectClashes.map((clash, i) => ({
    name: clashName(clash),
    status: "Existing initiative",
    similarityScore: 62 - i * 8,
    overlappingComponents: [clash],
    reusableComponents: [],
  }));
}

function clashName(clash: string): string {
  const m = clash.match(/(Platypus|Jarvis|WMS|SOC|SRC[^.,]*|planning systems|automation[^.,]*|facilities[^.,]*|regulatory[^.,]*|R&D[^.,]*|sustainability[^.,]*|consumer-care[^.,]*)/i);
  return m ? m[0].trim() : "Related existing programme";
}

/** Highest similarity among a candidate's similar projects (0 when none). */
export function topSimilarity(uc: UseCase): number {
  const sims = deriveSimilarProjects(uc);
  return sims.reduce((max, s) => Math.max(max, s.similarityScore), 0);
}
