// Agent network / orchestration model for JARVISION.
//
// Repositions JARVISION as the ORCHESTRATOR of an ecosystem of specialized
// agents rather than a standalone tool. JARVISION sits above NEXUS — the common
// access & orchestration layer — and reaches specialized agents published in an
// agent registry *through* NEXUS. Every journey step is produced by calling one
// or more of these agents and aggregating their responses.
//
// This is a frontend prototype: the "agents", their data sources and the
// orchestration scripts below are illustrative — no live calls are made. They
// drive the "thinking" chain shown on entry to each step and the Agent Network
// tab's summary of how the network produces the paths and use cases.

import type { Journey } from "@/types/vision";
import type { ThoughtStep } from "@/components/vision/ChainOfThought";

/** The journey steps JARVISION orchestrates (the trimmed pre-G0 arc). */
export type JourneySection =
  | "adoption"
  | "impact"
  | "readiness"
  | "cascade"
  | "g0pack"
  | "eppm";

/** A specialized agent published in the enterprise agent registry. */
export interface RegistryAgent {
  id: string;
  /** Role name shown in the registry, e.g. "PM Agent". */
  name: string;
  /** Optional friendly codename, e.g. "Clara". */
  codename?: string;
  /** The system / data domain the agent is grounded in, e.g. "PM Data". */
  dataSource: string;
  /** One-line description of what the agent does. */
  description: string;
  /** Which journey outputs this agent contributes to. */
  produces: string[];
  /** Whether this is one of the three core agents drawn in the network diagram. */
  core?: boolean;
}

/**
 * NEXUS — the common access & orchestration layer JARVISION calls through.
 * Kept intentionally generic in the UI (it's PMI's shared "front door" that
 * routes a request to the right specialized agent).
 */
export const NEXUS = {
  name: "NEXUS",
  role: "Common access & orchestration layer",
  blurb:
    "NEXUS is the shared access layer that routes JARVISION's requests to the right specialized agent in the registry. JARVISION sits above NEXUS and leverages its agents through it.",
} as const;

/** The specialized agents JARVISION orchestrates through NEXUS. */
export const AGENT_REGISTRY: RegistryAgent[] = [
  {
    id: "pm",
    name: "PM Agent",
    codename: "Clara",
    dataSource: "PM Data",
    description: "Retrieves project delivery patterns and estimates implementation effort.",
    produces: ["Adoption path", "G0 readiness pack", "Cascade plan"],
    core: true,
  },
  {
    id: "architecture",
    name: "Architecture Agent",
    dataSource: "Solution Data",
    description: "Maps solution architecture, integration surface and reuse opportunities.",
    produces: ["Multi-layer impact", "G0 readiness pack"],
    core: true,
  },
  {
    id: "hr",
    name: "HR Agent",
    dataSource: "Talent Data",
    description: "Assesses organizational readiness, affected roles and change drivers.",
    produces: ["Human readiness", "Cascade plan"],
    core: true,
  },
  {
    id: "capability",
    name: "Capability Agent",
    dataSource: "Talent Data",
    description: "Maps the capabilities a technology requires and the current skill gaps.",
    produces: ["Human readiness"],
  },
  {
    id: "learning",
    name: "Learning Agent",
    dataSource: "Learning Data",
    description: "Recommends certifications, trainings and learning paths to close gaps.",
    produces: ["Human readiness"],
  },
  {
    id: "performance",
    name: "PMI Performance Agent",
    dataSource: "Performance Data",
    description: "Benchmarks readiness and impact against PMI performance and delivery data.",
    produces: ["Human readiness", "Multi-layer impact"],
  },
];

/** The three agents drawn under NEXUS in the network diagram. */
export const CORE_AGENTS = AGENT_REGISTRY.filter((a) => a.core);

/** Display label for an agent, e.g. "PM Agent · Clara". */
export function agentLabel(a: RegistryAgent): string {
  return a.codename ? `${a.name} · ${a.codename}` : a.name;
}

const AGENT = Object.fromEntries(AGENT_REGISTRY.map((a) => [a.id, a])) as Record<
  string,
  RegistryAgent
>;

/**
 * The scripted orchestration for a journey step: which agents JARVISION calls
 * (through NEXUS), how their responses are aggregated, and the produced output.
 * Rendered as the "thinking" chain shown on entry to each step — so the loading
 * process itself tells the agent-orchestration story.
 */
export function orchestrationFor(section: JourneySection, journey: Journey): ThoughtStep[] {
  const t = journey.techName;
  switch (section) {
    case "adoption":
      // PM scenario — Clara (PM Agent) drives the adoption recommendations.
      return [
        { kind: "call", agent: agentLabel(AGENT.pm), label: "Calling Clara (PM Agent)…", detail: `Requesting the ${t} adoption model through NEXUS…` },
        { kind: "call", agent: agentLabel(AGENT.pm), label: "Retrieving project delivery patterns…", detail: "Pulling comparable delivery patterns from PM Data…" },
        { kind: "call", agent: agentLabel(AGENT.pm), label: "Evaluating implementation effort…", detail: "Sizing candidate functions and use cases…" },
        { kind: "result", label: "Returning adoption recommendations…", detail: "Adoption path assembled." },
      ];
    case "impact":
      return [
        { kind: "call", agent: agentLabel(AGENT.architecture), label: "Calling Architecture Agent…", detail: "Reading architecture, integration and reuse from Solution Data…" },
        { kind: "call", agent: agentLabel(AGENT.performance), label: "Calling PMI Performance Agent…", detail: "Pulling enterprise performance and cost signals…" },
        { kind: "aggregate", label: "Aggregating responses…", detail: "Projecting enterprise, domain and individual layers…" },
        { kind: "result", label: "Impact model generated", detail: "Multi-layer impact ready." },
      ];
    case "readiness":
      // The Human Readiness orchestration story.
      return [
        { kind: "call", agent: agentLabel(AGENT.capability), label: "Calling Capability Agent…", detail: "Mapping required capabilities and skill gaps…" },
        { kind: "call", agent: agentLabel(AGENT.learning), label: "Calling Learning Agent…", detail: "Recommending certifications, trainings and paths…" },
        { kind: "call", agent: agentLabel(AGENT.performance), label: "Calling PMI Performance Agent…", detail: "Benchmarking readiness against PMI performance data…" },
        { kind: "aggregate", label: "Aggregating responses…", detail: "Reconciling agent findings into one view…" },
        { kind: "result", label: "Human Readiness Report generated", detail: "Readiness mapped to affected roles." },
      ];
    case "cascade":
      return [
        { kind: "call", agent: agentLabel(AGENT.hr), label: "Calling HR Agent…", detail: "Resolving role-scoped owners from Talent Data…" },
        { kind: "call", agent: agentLabel(AGENT.pm), label: "Calling Clara (PM Agent)…", detail: "Deriving delivery action items…" },
        { kind: "aggregate", label: "Aggregating responses…", detail: "Wiring each item back to this simulation…" },
        { kind: "result", label: "Cascade plan generated", detail: "Role-scoped actions ready to approve." },
      ];
    case "g0pack":
      return [
        { kind: "call", agent: agentLabel(AGENT.architecture), label: "Calling Architecture Agent…", detail: "Drafting the technical approach against the DISD G0 template…" },
        { kind: "call", agent: agentLabel(AGENT.pm), label: "Calling Clara (PM Agent)…", detail: "Drafting indicative financials, plan and risk inputs…" },
        { kind: "aggregate", label: "Aggregating responses…", detail: "Routing each draft to its owning team…" },
        { kind: "result", label: "G0 Readiness Pack assembled", detail: "Draft inputs ready for human review." },
      ];
    case "eppm":
      return [
        { kind: "aggregate", label: "Preparing ePPM entry…", detail: "Packaging the orchestrated outputs and G0 submission for the portfolio…" },
        { kind: "result", label: "ePPM entry ready", detail: "Candidate ready to record in ePPM." },
      ];
    default:
      return [{ label: "Orchestrating…", detail: "Preparing this step…" }];
  }
}

/** Ordered journey steps JARVISION walks an idea through (the trimmed arc). */
export const SECTION_ORDER: JourneySection[] = [
  "adoption",
  "impact",
  "readiness",
  "cascade",
  "g0pack",
  "eppm",
];

/** Rail / log labels for each step. */
export const SECTION_LABELS: Record<JourneySection, string> = {
  adoption: "1 · Adoption Path",
  impact: "2 · Multi-layer Impact",
  readiness: "3 · Human Readiness",
  cascade: "4 · Approve & Cascade",
  g0pack: "5 · G0 Readiness Pack",
  eppm: "6 · ePPM Entry",
};

/** Which registry agents each step calls through NEXUS (ids into AGENT_REGISTRY). */
export const SECTION_AGENT_IDS: Record<JourneySection, string[]> = {
  adoption: ["pm"],
  impact: ["architecture", "performance"],
  readiness: ["capability", "learning", "performance"],
  cascade: ["hr", "pm"],
  g0pack: ["architecture", "pm"],
  eppm: [],
};

/** The distinct specialized agents a step calls through NEXUS. */
export function agentsForSection(section: JourneySection): RegistryAgent[] {
  return (SECTION_AGENT_IDS[section] ?? [])
    .map((id) => AGENT[id])
    .filter((a): a is RegistryAgent => Boolean(a));
}

/** The distinct agents engaged across a set of explored steps (dedup, in registry order). */
export function agentsForSections(sections: JourneySection[]): RegistryAgent[] {
  const ids = new Set(sections.flatMap((s) => SECTION_AGENT_IDS[s] ?? []));
  return AGENT_REGISTRY.filter((a) => ids.has(a.id));
}
