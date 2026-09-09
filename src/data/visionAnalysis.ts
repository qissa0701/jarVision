// VISION analysis helpers — deterministic, illustrative models that power the
// Adoption Path's cost–benefit explorer, risk-mitigation explorer, and pre-G0
// duplicate/reuse check. All figures are simulated for the prototype; the goal
// is a detailed, responsive "what-if" feel, not a real financial model.

import type {
  DuplicateCheck,
  ImplementationApproach,
  Journey,
  MitigationTechnique,
  RiskItem,
  RiskSeverity,
  UseCase,
} from "@/types/vision";

/* ── Cost–benefit model ────────────────────────────────────────────────────*/

/** Loaded monthly cost of one internal PMI FTE (USD). */
export const INTERNAL_MONTHLY = 14_000;
/** Loaded monthly cost of one external contractor (USD). */
export const CONTRACTOR_MONTHLY = 22_000;

export interface CostInputs {
  approach: ImplementationApproach;
  internalPeople: number;
  contractors: number;
  timelineMonths: number;
}

export interface ApproachPreset {
  key: ImplementationApproach;
  label: string;
  blurb: string;
  defaults: { internalPeople: number; contractors: number; timelineMonths: number };
  /** One-off setup / licence (in $K, scaled). */
  setupBaseK: number;
  /** Recurring platform / licence per year (in $K, scaled). */
  platformAnnualK: number;
  /** Multiplier on token / inference run cost. */
  tokenFactor: number;
  /** Recurring infra / run per year (in $K, scaled). */
  infraAnnualK: number;
  pros: string[];
  cons: string[];
}

export const APPROACH_PRESETS: Record<ImplementationApproach, ApproachPreset> = {
  vendor: {
    key: "vendor",
    label: "Vendor build",
    blurb: "A specialist vendor builds and delivers the solution to PMI.",
    defaults: { internalPeople: 2, contractors: 4, timelineMonths: 5 },
    setupBaseK: 55,
    platformAnnualK: 28,
    tokenFactor: 0.7,
    infraAnnualK: 6,
    pros: ["Fast delivery with proven expertise", "Lower internal staffing load", "Vendor owns delivery risk"],
    cons: ["Vendor lock-in / switching cost", "Recurring licence fees", "Less in-house IP & knowledge"],
  },
  saas: {
    key: "saas",
    label: "External SaaS",
    blurb: "Adopt a managed SaaS product and configure it to PMI's needs.",
    defaults: { internalPeople: 2, contractors: 1, timelineMonths: 3 },
    setupBaseK: 12,
    platformAnnualK: 52,
    tokenFactor: 0.9,
    infraAnnualK: 3,
    pros: ["Quickest time-to-value", "Minimal infra to run", "Predictable subscription"],
    cons: ["Data residency / limits", "Per-seat cost scales with usage", "Limited deep customization"],
  },
  inhouse: {
    key: "inhouse",
    label: "Build in-house",
    blurb: "PMI teams build, own, and operate the solution end-to-end.",
    defaults: { internalPeople: 5, contractors: 2, timelineMonths: 9 },
    setupBaseK: 0,
    platformAnnualK: 6,
    tokenFactor: 1.0,
    infraAnnualK: 14,
    pros: ["Full control & IP ownership", "No licence lock-in", "Tailored to PMI workflows"],
    cons: ["Highest build cost & time", "Needs scarce specialist skills", "Ongoing maintenance burden"],
  },
};

export const APPROACH_ORDER: ImplementationApproach[] = ["vendor", "saas", "inhouse"];

/** Parse the PoC $K midpoint from a use case's benefit–cost note (fallback 75). */
export function pocScaleK(useCase: UseCase): number {
  const m = useCase.benefitCost.match(/\$\s?(\d+)(?:\s*[–\-]\s*(\d+))?\s*K/i);
  if (!m) return 75;
  const lo = Number(m[1]);
  const hi = m[2] ? Number(m[2]) : lo;
  return (lo + hi) / 2;
}

export interface CostBreakdown {
  internalLabor: number;
  contractorLabor: number;
  implementationLabor: number;
  platformSetup: number;
  contingency: number;
  totalUpfront: number;
  platformAnnual: number;
  tokenAnnual: number;
  infraAnnual: number;
  annualRun: number;
  annualBenefit: number;
  netAnnual: number;
  /** Months from project start to break-even (build time + payback), or null. */
  paybackMonths: number | null;
  threeYearNet: number;
}

/** Compute a full cost/benefit breakdown for a use case + inputs. */
export function computeCostBenefit(useCase: UseCase, inputs: CostInputs): CostBreakdown {
  const scale = pocScaleK(useCase) / 75;
  const preset = APPROACH_PRESETS[inputs.approach];

  const internalLabor = inputs.internalPeople * INTERNAL_MONTHLY * inputs.timelineMonths;
  const contractorLabor = inputs.contractors * CONTRACTOR_MONTHLY * inputs.timelineMonths;
  const implementationLabor = internalLabor + contractorLabor;

  const platformSetup = preset.setupBaseK * 1000 * scale;
  const contingency = 0.12 * (implementationLabor + platformSetup);
  const totalUpfront = implementationLabor + platformSetup + contingency;

  const platformAnnual = preset.platformAnnualK * 1000 * scale;
  const tokenAnnual = preset.tokenFactor * 30_000 * scale;
  const infraAnnual = preset.infraAnnualK * 1000 * scale;
  const annualRun = platformAnnual + tokenAnnual + infraAnnual;

  const annualBenefit = 340_000 * scale;
  const netAnnual = annualBenefit - annualRun;

  const paybackMonths =
    netAnnual > 0 ? inputs.timelineMonths + totalUpfront / (netAnnual / 12) : null;

  const threeYearNet = annualBenefit * 3 - totalUpfront - annualRun * 3;

  return {
    internalLabor,
    contractorLabor,
    implementationLabor,
    platformSetup,
    contingency,
    totalUpfront,
    platformAnnual,
    tokenAnnual,
    infraAnnual,
    annualRun,
    annualBenefit,
    netAnnual,
    paybackMonths,
    threeYearNet,
  };
}

/** Which approach VISION recommends (best 3-year net at each approach's defaults). */
export function recommendedApproach(useCase: UseCase): ImplementationApproach {
  let best: { approach: ImplementationApproach; net: number } | null = null;
  for (const key of APPROACH_ORDER) {
    const p = APPROACH_PRESETS[key];
    const b = computeCostBenefit(useCase, { approach: key, ...p.defaults });
    if (!best || b.threeYearNet > best.net) best = { approach: key, net: b.threeYearNet };
  }
  return best!.approach;
}

/* ── Risk-mitigation model ─────────────────────────────────────────────────*/

const HIGH_RE = /(safety|autonom|capex|security|breach|privacy|incorrect|cascad|off the rails|stakes|hardware)/i;
const MED_RE = /(overlap|data quality|dependency|integration|drift|connectivity|false positive|latency|explainab|accuracy|scale|ambiguity|measur)/i;

function severityFor(text: string): RiskSeverity {
  if (HIGH_RE.test(text)) return "high";
  if (MED_RE.test(text)) return "medium";
  return "low";
}

function recommendedTechnique(text: string, severity: RiskSeverity): MitigationTechnique {
  if (/(vendor|contract|dependency|third-party|supplier|insur)/i.test(text)) return "transference";
  if (severity === "high") return "reduction";
  if (severity === "medium") return "reduction";
  return "acceptance";
}

function shorten(text: string, n = 52): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > n ? `${clean.slice(0, n - 1)}…` : clean;
}

/** Build explorable risk items (severity + all four mitigation techniques). */
export function buildRiskItems(useCase: UseCase): RiskItem[] {
  return useCase.risks.map((text) => {
    const severity = severityFor(text);
    const s = shorten(text);
    return {
      text,
      severity,
      recommended: recommendedTechnique(text, severity),
      mitigations: {
        avoidance: `Re-scope the PoC to remove "${s}" — e.g. keep a human in the loop or defer that capability until later gates.`,
        reduction: `Add controls & guardrails (staged rollout, monitoring, approval checkpoints, tests) to lower the likelihood and impact of "${s}".`,
        transference: `Shift exposure through vendor SLAs, contractual warranties, or insurance so a third party carries "${s}".`,
        acceptance: `Log "${s}" on the risk register with an owner and a trigger threshold; monitor and accept if impact is low or too costly to fix now.`,
      },
    };
  });
}

export const SEVERITY_META: Record<RiskSeverity, { label: string; tone: string; dot: string }> = {
  low: { label: "Low", tone: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10", dot: "bg-emerald-500" },
  medium: { label: "Medium", tone: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10", dot: "bg-amber-500" },
  high: { label: "High", tone: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10", dot: "bg-red-500" },
};

export const TECHNIQUE_META: Record<MitigationTechnique, { label: string; hint: string }> = {
  avoidance: { label: "Avoidance", hint: "Stop the risky activity" },
  reduction: { label: "Reduction", hint: "Add controls to lessen impact" },
  transference: { label: "Transference", hint: "Shift via insurance / contracts" },
  acceptance: { label: "Acceptance", hint: "Acknowledge & monitor" },
};

/* ── Duplicate / reuse check ───────────────────────────────────────────────*/

const COMPONENT_POOL = [
  "Identity & access (SSO)",
  "Data ingestion pipeline",
  "Event & audit logging",
  "Model orchestration layer",
  "Vector store / knowledge base",
  "Monitoring & observability",
  "UI shell & design system",
  "Notification service",
  "API gateway",
  "Feature store",
];

const STATUSES = ["Live", "In delivery", "Piloting", "Backlog"];

/** Simple deterministic string hash → non-negative int. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Extract candidate project names from a project-clash sentence. */
function projectNamesFrom(clash: string): string[] {
  // Prefer proper-noun system names (e.g. "Platypus", "Jarvis").
  const proper = clash.match(/\b([A-Z][a-zA-Z]{3,})\b/g)?.filter(
    (w) => !["Overlaps", "Overlap", "Coordinate", "Must", "Capability", "May", "Feeds", "Complements"].includes(w),
  );
  if (proper && proper.length) return Array.from(new Set(proper)).slice(0, 2);
  return [];
}

/** Derive a pre-G0 duplicate / reuse check for a candidate use case. */
export function deriveDuplicateCheck(useCase: UseCase): DuplicateCheck {
  const projects: DuplicateCheck["projects"] = [];
  useCase.projectClashes.forEach((clash, ci) => {
    const names = projectNamesFrom(clash);
    const list = names.length ? names : [`Existing ${useCase.function.split("/")[0].trim()} initiative`];
    list.forEach((name) => {
      const h = hash(useCase.id + name);
      projects.push({
        name,
        similarity: 34 + (h % 45), // 34–78
        status: STATUSES[(h + ci) % STATUSES.length],
      });
    });
  });

  // De-dupe by name, keep highest similarity.
  const byName = new Map<string, DuplicateCheck["projects"][number]>();
  for (const p of projects) {
    const prev = byName.get(p.name);
    if (!prev || p.similarity > prev.similarity) byName.set(p.name, p);
  }
  const uniqueProjects = Array.from(byName.values()).sort((a, b) => b.similarity - a.similarity);

  const h = hash(useCase.id);
  const overlappingComponents = [0, 1, 2].map((i) => COMPONENT_POOL[(h + i) % COMPONENT_POOL.length]);
  const reusableComponents = [3, 4, 5].map((i) => COMPONENT_POOL[(h + i) % COMPONENT_POOL.length]);

  return {
    topSimilarity: uniqueProjects.length ? uniqueProjects[0].similarity : 0,
    projects: uniqueProjects,
    overlappingComponents: Array.from(new Set(overlappingComponents)),
    reusableComponents: Array.from(new Set(reusableComponents)),
  };
}

/* ── Formatting ────────────────────────────────────────────────────────────*/

export function fmtUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}
