// VISION Studio — type definitions for the Emerging Tech Adoption Simulator.
//
// VISION Studio is a module layered on top of the Jarvis AI Dashboard. Where
// Jarvis = AI adoption for humans, VISION = tech adoption for the organization:
// it explores emerging-tech use cases, simulates their impact, and shepherds a
// candidate through PMI's human-gated pre-G0 → G3 lifecycle. Everything here is
// a frontend prototype: journeys are pre-scripted (see src/data/visionJourneys)
// and every gate decision is made by a human — VISION never approves or funds.
//
// Shapes mirror § 5 "Data Entities" of the VISION Studio FRD v1.2.

// ─── Enumerations ────────────────────────────────────────────────────────────

/** Which shell the app is currently showing. */
export type VisionMode = "jarvis" | "vision";

/** The three simulation lenses (FR-5). */
export type ImpactLayerKind = "enterprise" | "domain" | "individual";

/** Human-readiness item kind (FR-6). */
export type ReadinessType = "certification" | "skill" | "training";

/** The two human decision gates VISION models. */
export type Gate = "G0" | "G3";

/** A recorded gate decision outcome (FR-9 / FR-12). */
export type GateDecisionKind = "go" | "nogo" | "rework" | "pivot";

/** PoC stage-gate position (G1/G2 are optional, PM-managed). */
export type PoCStage = "G0" | "G1" | "G2" | "G3";

/** PoC evidence outcome fed into the G3 business case (FR-11.5). */
export type PoCOutcome = "proven" | "partial" | "rejected";

/**
 * Where an idea sits along VISION's lifecycle arc. Drives which actions are
 * unlocked and how the idea is labelled on the Home screen.
 */
export type JourneyStage =
  | "exploring" // adoption path → impact → readiness (pre-approval)
  | "approved" // recommendation approved & cascaded
  | "awaiting_g0" // G0 Readiness Pack submitted, waiting on human Go/No-go
  | "poc" // G0 "Go" recorded → seed funded → PoC tracking (incl. G1/G2)
  | "awaiting_g3" // G3 Business Case submitted, waiting on human Go/No-go
  | "complete" // G3 "Go" recorded → handed to delivery (VISION stops here)
  | "rejected"; // No-go recorded at G0 or G3

/** Qualitative severity band for a risk. */
export type RiskSeverity = "low" | "medium" | "high" | "critical";

/**
 * The four canonical risk-response techniques VISION lets a user explore per
 * risk: avoidance (stop the risky activity), reduction (add controls to lessen
 * likelihood/impact), transference (shift the risk via insurance/contract), and
 * acceptance (acknowledge a low or costly-to-fix risk and monitor it).
 */
export type MitigationTechnique = "avoidance" | "reduction" | "transference" | "acceptance";

/** One explorable mitigation option for a risk, tied to a technique. */
export interface RiskMitigation {
  technique: MitigationTechnique;
  /** What the strategy concretely does. */
  strategy: string;
  /** Residual severity once this strategy is applied. */
  residualSeverity: RiskSeverity;
}

/** A single evaluated risk with severity and explorable mitigations (FR-4). */
export interface RiskItem {
  id: string;
  title: string;
  /** Likelihood × impact rolled into one severity band. */
  severity: RiskSeverity;
  /** The mitigation strategies a user can explore, one per technique family. */
  mitigations: RiskMitigation[];
  /** Which technique VISION recommends first. */
  recommendedTechnique: MitigationTechnique;
}

/**
 * A pre-existing PMI project this use case resembles — used for the candidate
 * similarity score, overlap detection, and reuse opportunities (duplicate
 * check). Illustrative demo data.
 */
export interface SimilarProject {
  name: string;
  /** Short status descriptor, e.g. "Live", "In PoC", "Sunset". */
  status: string;
  /** 0–100 similarity to this use case. */
  similarityScore: number;
  /** Capabilities that overlap / risk duplication. */
  overlappingComponents: string[];
  /** Components/assets that could be reused rather than rebuilt. */
  reusableComponents: string[];
}

/** How a candidate could be delivered — drives the cost-benefit scenarios. */
export type ImplementationApproach = "vendor" | "saas" | "in-house";

/** One priced line in a cost breakdown (one-time or recurring). */
export interface CostLineItem {
  label: string;
  amountUsd: number;
  note?: string;
}

/**
 * Per-use-case economic basis the cost-benefit calculator builds scenarios
 * from. All figures indicative / simulated.
 */
export interface UseCaseCostBasis {
  /** Indicative annual gross benefit once fully realized (USD). */
  annualBenefitUsd: number;
  /** Production monthly LLM/inference (token) spend at baseline (USD). */
  monthlyTokenUsd: number;
  /** Relative build complexity (1 = baseline). Scales labour + integration. */
  complexity: number;
  /** Default team + timeline per approach (the calculator's starting point). */
  defaults: Record<
    ImplementationApproach,
    { internalPeople: number; contractors: number; timelineMonths: number }
  >;
}

// ─── Journey (pre-scripted seed data) ────────────────────────────────────────

/** A candidate use case for a technology, with its scripted evaluation (FR-4). */
export interface UseCase {
  id: string;
  /** Candidate business function this use case serves (e.g. "Manufacturing"). */
  function: string;
  description: string;
  opportunities: string[];
  risks: string[];
  /** Indicative benefit–cost note. */
  benefitCost: string;
  /** Indicative timeline note. */
  timeline: string;
  /** Potential clashes with existing projects. */
  projectClashes: string[];
  /** Rich, explorable risks (severity + mitigations). Falls back to `risks`. */
  riskItems?: RiskItem[];
  /** Existing PMI projects this candidate resembles (duplicate/reuse check). */
  similarProjects?: SimilarProject[];
  /** Economic basis for the cost-benefit scenario explorer. */
  costBasis?: UseCaseCostBasis;
}

/**
 * A high-level executive summary shown atop the Adoption Path — how the tech
 * fits PMI, what PMI already has, the opportunity, and a use-case digest.
 */
export interface ExecutiveSummary {
  /** How the technology fits PMI's strategy / operating model. */
  fit: string;
  /** What PMI has already adopted / is already running that's relevant. */
  alreadyAdopted: string[];
  /** The headline opportunity. */
  opportunity: string;
  /** One-line digest of the candidate use cases. */
  useCaseSummary: string;
}

/** How large the impact of a layer is. */
export type ImpactMagnitude = "low" | "moderate" | "high" | "transformational";

/** How much effort/change the layer demands. */
export type ImpactEffort = "low" | "moderate" | "high";

/** A small quick-stat shown on an impact layer card. */
export interface ImpactMetric {
  label: string;
  value: string;
}

/** Richer, structured detail for an impact layer (drives the visual cards). */
export interface ImpactLayerDetail {
  /** One-line headline for the layer's impact. */
  headline: string;
  magnitude: ImpactMagnitude;
  effort: ImpactEffort;
  /** Indicative time horizon, e.g. "6–18 mo", "Ongoing". */
  timeframe: string;
  /** Key concrete effects / changes. */
  effects: string[];
  /** Dependencies or things to watch. */
  watchouts?: string[];
  /** Quick-stat chips. */
  metrics?: ImpactMetric[];
}

/** One impact lens for a journey (FR-5). */
export interface ImpactLayer {
  layer: ImpactLayerKind;
  content: string;
  /** Enterprise layer only: does the tech imply org restructuring? */
  restructuringFlag?: boolean;
  /** Richer structured detail; falls back to a derivation from `content`. */
  detail?: ImpactLayerDetail;
}

/** A human-readiness recommendation mapped to an affected role (FR-6). */
export interface ReadinessItem {
  id: string;
  type: ReadinessType;
  role: string;
  description: string;
}

/**
 * A person or team VISION surfaces as a potential *driver of the change* for a
 * technology — someone who already has the relevant experience/skills and could
 * lead adoption. Used by the Human Readiness "recommended change drivers"
 * finder. Illustrative demo data.
 */
export interface ChangeDriver {
  id: string;
  /** Person name, or a team name when `isTeam` is true. */
  name: string;
  /** Role / title (person) or a short descriptor (team). */
  role: string;
  /** Org unit / department the person or team sits in. */
  team: string;
  /** Whether this entry represents a whole team rather than an individual. */
  isTeam?: boolean;
  /** When `isTeam`, the members of the team and their roles (shown in a dropdown). */
  members?: TeamMember[];
  /** Skills/experience that make them a fit — the "already has experience" signal. */
  skills: string[];
  /** One-line rationale for why VISION recommends them. */
  rationale: string;
  /** Rough fit score (0–100) shown as a match strength. */
  matchScore: number;
}

/** A member of a change-driver team, shown in the team's members dropdown. */
export interface TeamMember {
  name: string;
  role: string;
}

/** A scripted cascade action item template pushed to an org role on approve (FR-7). */
export interface CascadeTemplate {
  targetRole: string;
  actionText: string;
  /** Which part of the simulation this item originated from (context). */
  layerOrigin: string;
}

/** A single drafted section of a G0 or G3 Readiness Pack (FR-8 / FR-12). */
export interface PackSection {
  id: string;
  /** The PMI-required input name (e.g. "Benefit / Value Hypothesis"). */
  title: string;
  /** What VISION drafts for that input. Always "draft — requires review". */
  draft: string;
}

/** A KPI tracked during PoC execution (FR-11). */
export interface PoCKpi {
  label: string;
  target: string;
}

/**
 * A fully pre-scripted end-to-end journey seeded by one emerging-tech article.
 * The single source of truth the VISION UI renders (FR-2.2, Appendix A).
 */
export interface Journey {
  id: string;
  techName: string;
  /** "Tech in one line" summary. */
  tagline: string;
  sourceTitle: string;
  sourceUrl: string;
  sourcePublisher: string;
  /** Keywords used by the chatbot to recognise a pasted article (FR-3.2). */
  matchKeywords: string[];
  /** Executive summary shown atop the Adoption Path (opportunity framing). */
  executiveSummary?: ExecutiveSummary;
  targetFunctions: string[];
  useCases: UseCase[];
  impactLayers: ImpactLayer[];
  readiness: ReadinessItem[];
  /** Id of the scripted recommended use case (FR-4.5). */
  recommendedUseCaseId: string;
  recommendationRationale: string;
  cascade: CascadeTemplate[];
  g0Pack: PackSection[];
  g3Pack: PackSection[];
  /** Indicative seed-funding envelope, e.g. "$60–90K OPEX" (FR-10). */
  seedFundingIndicative: string;
  pocSuccessCriteria: string[];
  pocKpis: PoCKpi[];
}

// ─── Runtime / persisted entities ────────────────────────────────────────────

/** A recorded human gate decision — the auditable Decision Log (FR-9.3 / FR-12.3). */
export interface GateDecision {
  id: string;
  ideaId: string;
  gate: Gate;
  decision: GateDecisionKind;
  decisionMaker: string;
  rationale: string;
  timestamp: number;
}

/** An action item cascaded into the org on approval, with traceability (FR-7). */
export interface CascadeItem {
  id: string;
  ideaId: string;
  targetRole: string;
  actionText: string;
  layerOrigin: string;
  sourceJourneyId: string;
  sourceUseCaseId: string | null;
  createdAt: number;
}

/** Simulated seed-funding release, always labelled indicative (FR-10). */
export interface SeedFunding {
  amountIndicative: string;
  releasedAfterDecisionId: string;
  releasedAt: number;
}

/**
 * A started/saved exploration — a Journey plus the user's progress through the
 * lifecycle. Persisted to localStorage so ideas survive reloads (FR-2.1).
 */
export interface VisionIdea {
  id: string;
  journeyId: string;
  techName: string;
  stage: JourneyStage;
  /** Function the user positioned the tech into (FR-4.4). */
  positionedFunction: string | null;
  /**
   * Primary use case carried forward (FR-4.5) — the "top" candidate the
   * downstream lifecycle uses. Kept in sync with the first of selectedUseCaseIds.
   */
  selectedUseCaseId: string | null;
  /**
   * All candidate use cases the user has picked (multi-select checkout). Humans
   * can explore several; for the next steps only the top one is carried forward.
   */
  selectedUseCaseIds: string[];
  /** Cascade items created for this idea (FR-7.5 traceability). */
  cascadeItemIds: string[];
  g0PackGenerated: boolean;
  g0DecisionId: string | null;
  seedFunding: SeedFunding | null;
  pocStage: PoCStage;
  completedG1: boolean;
  completedG2: boolean;
  pocOutcome: PoCOutcome | null;
  g3PackGenerated: boolean;
  g3DecisionId: string | null;
  createdAt: number;
  updatedAt: number;
}

/** A proactive "new tech — want to simulate this?" nudge shown in Jarvis (FR-13). */
export interface TrendNotification {
  id: string;
  journeyId: string;
  techName: string;
  message: string;
}
