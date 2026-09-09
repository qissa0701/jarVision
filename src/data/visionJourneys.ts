// VISION Studio — pre-scripted seed journeys (Appendix A of the FRD).
//
// The demo ships with exactly three canned journeys, one per seed article.
// Each is a complete, deterministic walkthrough: source → adoption path
// (functions → use cases → evaluation) → multi-layer impact → human readiness
// → recommended candidate → example cascade → G0 & G3 Readiness Pack drafts.
// All figures are illustrative for demo purposes — there is no live LLM.

import type { ChangeDriver, Journey, TrendNotification, UseCase, VisionIdea } from "@/types/vision";
import formaNovaImage from "@/assets/formanova-hero.png";

// ─── Journey A — Agentic AI ──────────────────────────────────────────────────

const AGENTIC_AI: Journey = {
  id: "agentic-ai",
  techName: "Agentic AI",
  tagline:
    "AI systems that pursue a goal with limited supervision — agents that perceive, reason, decide, and act, coordinated via orchestration.",
  sourceTitle: "What is Agentic AI?",
  sourcePublisher: "IBM",
  sourceUrl: "https://www.ibm.com/think/topics/agentic-ai",
  matchKeywords: [
    "agentic",
    "agent",
    "agents",
    "orchestration",
    "autonomous ai",
    "goal-driven",
    "multi-agent",
  ],
  executiveSummary: {
    fit: "Agentic AI extends PMI's existing AI momentum from single-shot assistants to goal-driven agents that can perceive, reason and act across systems — directly reinforcing the Project Management Excellence and operational-efficiency pillars.",
    alreadyAdopted: [
      "Platypus orchestration platform (internal)",
      "Jarvis AI assistant for individual productivity",
      "Responsible-AI governance guild & PoC playbook",
    ],
    opportunity:
      "Collapse multi-tab, multi-step SaaS work into supervised natural-language workflows — freeing PMs and operators for higher-value judgement while keeping humans in the loop.",
    useCaseSummary:
      "5 candidate functions explored — from an ePPM gate-document agent to consumer-care resolvers, supply-chain planners, security monitors and SRC retail support.",
  },
  targetFunctions: [
    "Project Management Excellence (ePPM)",
    "Commercial / Consumer Care",
    "Supply Chain",
    "Cybersecurity",
    "SRC retail network",
  ],
  useCases: [
    {
      id: "uc-eppm",
      function: "Project Management Excellence (ePPM)",
      description:
        "Multi-agent assistant that drafts G-gate documents, checks portfolio conflicts, and monitors project health (extends Platypus).",
      opportunities: [
        "Collapses multi-tab SaaS work into natural-language commands",
        "Automates multistep, long-horizon tasks",
        "Frees PMs for higher-value work",
      ],
      risks: [
        "Autonomy off the rails — poorly designed reward/goal leads to unintended actions",
        "Cascading failures across multiple agents",
        "Transparency is hard to guarantee",
        "ROI is indirect and may not materialize short-term",
      ],
      benefitCost: "PoC ~$60–90K OPEX; benefit via PM hours saved + faster gate cycles.",
      timeline: "6-month PoC → G3.",
      projectClashes: [
        "Overlaps with Platypus and Jarvis — must be positioned as an extension, not a duplicate.",
      ],
      riskItems: [
        {
          id: "risk-eppm-autonomy",
          title: "Autonomy off the rails — a poorly designed goal leads to unintended actions",
          severity: "high",
          recommendedTechnique: "reduction",
          mitigations: [
            { technique: "avoidance", strategy: "Keep the agent read-only for gate documents in the PoC; no autonomous writes to systems of record.", residualSeverity: "low" },
            { technique: "reduction", strategy: "Human-in-the-loop approval on every action, bounded tool scopes, and a hard stop / kill-switch.", residualSeverity: "medium" },
            { technique: "transference", strategy: "Run on the vendor's guardrailed runtime with contractual safety SLAs.", residualSeverity: "medium" },
            { technique: "acceptance", strategy: "Accept residual risk for low-impact drafting tasks with monitoring only.", residualSeverity: "high" },
          ],
        },
        {
          id: "risk-eppm-cascade",
          title: "Cascading failures across multiple coordinated agents",
          severity: "high",
          recommendedTechnique: "reduction",
          mitigations: [
            { technique: "avoidance", strategy: "Start single-agent; defer multi-agent orchestration until stability is proven.", residualSeverity: "low" },
            { technique: "reduction", strategy: "Circuit-breakers, per-agent rate limits and blast-radius isolation between agents.", residualSeverity: "medium" },
            { technique: "transference", strategy: "Lean on the orchestration platform's fault-isolation guarantees.", residualSeverity: "medium" },
            { technique: "acceptance", strategy: "Accept in a sandboxed PoC where failures have no production impact.", residualSeverity: "medium" },
          ],
        },
        {
          id: "risk-eppm-transparency",
          title: "Transparency & explainability of agent decisions is hard to guarantee",
          severity: "medium",
          recommendedTechnique: "reduction",
          mitigations: [
            { technique: "avoidance", strategy: "Restrict to tasks where a full decision trace is producible.", residualSeverity: "low" },
            { technique: "reduction", strategy: "Full audit logging, step traces and rationale capture on every action.", residualSeverity: "low" },
            { technique: "transference", strategy: "Adopt vendor observability tooling with attestations.", residualSeverity: "medium" },
            { technique: "acceptance", strategy: "Accept limited explainability for non-material drafting outputs.", residualSeverity: "medium" },
          ],
        },
        {
          id: "risk-eppm-roi",
          title: "ROI is indirect and may not materialize short-term",
          severity: "medium",
          recommendedTechnique: "acceptance",
          mitigations: [
            { technique: "avoidance", strategy: "Only proceed if a measurable PM-hours-saved hypothesis is agreed up front.", residualSeverity: "low" },
            { technique: "reduction", strategy: "Instrument baseline metrics and track hours-saved from day one.", residualSeverity: "low" },
            { technique: "transference", strategy: "Structure a vendor deal with value-based / outcome pricing.", residualSeverity: "medium" },
            { technique: "acceptance", strategy: "Accept a longer payback given the reusable foundation it creates.", residualSeverity: "medium" },
          ],
        },
      ],
      similarProjects: [
        {
          name: "Platypus (orchestration platform)",
          status: "Live",
          similarityScore: 84,
          overlappingComponents: ["Agent orchestration runtime", "Tool/API connector layer", "Prompt/workflow registry"],
          reusableComponents: ["Orchestration runtime", "Connector framework", "Guardrail policy engine"],
        },
        {
          name: "Jarvis AI assistant",
          status: "Live",
          similarityScore: 61,
          overlappingComponents: ["Conversational UI", "Task execution surface"],
          reusableComponents: ["Chat UI components", "Auth & session layer"],
        },
        {
          name: "ePPM gate-document templates",
          status: "In use",
          similarityScore: 47,
          overlappingComponents: ["Gate document schemas"],
          reusableComponents: ["DISD G0/G3 templates", "Portfolio data APIs"],
        },
      ],
      costBasis: {
        annualBenefitUsd: 1_100_000,
        monthlyTokenUsd: 4_200,
        complexity: 1,
        defaults: {
          vendor: { internalPeople: 2, contractors: 2, timelineMonths: 5 },
          saas: { internalPeople: 2, contractors: 1, timelineMonths: 4 },
          "in-house": { internalPeople: 4, contractors: 2, timelineMonths: 7 },
        },
      },
    },
    {
      id: "uc-consumer-care",
      function: "Commercial / Consumer Care",
      description:
        "Agentic customer-service resolver that queries systems, takes actions (refunds, orders) and escalates with a human-in-the-loop.",
      opportunities: [
        "Faster first-contact resolution",
        "Actions taken directly against systems of record",
      ],
      risks: [
        "Incorrect autonomous actions on customer accounts",
        "Requires strong guardrails + human escalation",
      ],
      benefitCost: "PoC ~$70–90K OPEX; benefit via reduced handle time.",
      timeline: "6-month PoC.",
      projectClashes: ["Overlaps with existing consumer-care automation initiatives."],
    },
    {
      id: "uc-supply-chain",
      function: "Supply Chain",
      description:
        "Agents that autonomously adjust production schedules / place supplier orders to hold optimal inventory.",
      opportunities: ["Optimized inventory", "Reduced manual planning effort"],
      risks: ["Autonomous ordering errors", "Dependency on data quality"],
      benefitCost: "PoC ~$80K OPEX; benefit via inventory carrying-cost reduction.",
      timeline: "6–9 month PoC.",
      projectClashes: ["Capability overlap with planning systems."],
    },
    {
      id: "uc-cybersecurity",
      function: "Cybersecurity",
      description:
        "Agents continuously monitoring network traffic, logs, and user behavior for anomalies.",
      opportunities: ["Continuous monitoring", "Faster anomaly detection"],
      risks: ["False positives", "Requires 1LoD oversight"],
      benefitCost: "PoC ~$75K OPEX; benefit via faster detection.",
      timeline: "6-month PoC.",
      projectClashes: ["Overlaps with existing SOC tooling."],
    },
    {
      id: "uc-src",
      function: "SRC retail network",
      description:
        "Agent that helps toko kelontong owners auto-reorder stock and respond to customer queries in natural language.",
      opportunities: ["Hyper-local stock accuracy", "Natural-language storefront support"],
      risks: ["Connectivity constraints", "Data across 250K+ diverse stores"],
      benefitCost: "PoC ~$85K OPEX; benefit via reduced stockouts.",
      timeline: "6–9 month PoC.",
      projectClashes: ["Coordinate with existing SRC digitization programs."],
    },
  ],
  recommendedUseCaseId: "uc-eppm",
  recommendationRationale:
    "Agentic assistant for ePPM / Project Management Excellence — highest strategic fit (builds on existing Platypus momentum), clear productivity benefit, contained blast radius.",
  impactLayers: [
    {
      layer: "enterprise",
      restructuringFlag: true,
      content:
        "Needs an agent-governance model (goal definition, guardrails, measurable feedback loops, Agent Ops). Possible light restructuring — a new 'Agent Ops / orchestration' ownership function. Cost centers on the orchestration platform + oversight.",
      detail: {
        headline: "A new agent-governance operating model",
        magnitude: "high",
        effort: "high",
        timeframe: "6–18 mo",
        effects: [
          "Stand up an 'Agent Ops / orchestration' ownership function",
          "Define goals, guardrails and measurable feedback loops",
          "Portfolio-level policy for autonomous action",
          "Cost centres on the orchestration platform + oversight",
        ],
        watchouts: ["Light org restructuring likely", "Clear accountability for agent decisions"],
        metrics: [
          { label: "New function", value: "Agent Ops" },
          { label: "Governance", value: "Guardrails + audit" },
        ],
      },
    },
    {
      layer: "domain",
      content:
        "Agent identity & access control (per-agent identity), API/tool permissioning, audit logging. Solution patterns: conductor-and-workers vs. decentralized agents depending on workflow.",
      detail: {
        headline: "Agent identity, tooling & orchestration patterns",
        magnitude: "high",
        effort: "moderate",
        timeframe: "3–9 mo",
        effects: [
          "Per-agent identity & access control",
          "API / tool permissioning with least privilege",
          "End-to-end audit logging of every action",
          "Choose conductor-and-workers vs. decentralized agents",
        ],
        watchouts: ["1LoD security engagement is mandatory"],
        metrics: [
          { label: "Pattern", value: "Conductor / workers" },
          { label: "Security", value: "Per-agent identity" },
        ],
      },
    },
    {
      layer: "individual",
      content:
        "Shift from 'doing tasks' to 'supervising agents' — humans define goals and review outputs.",
      detail: {
        headline: "From doing tasks to supervising agents",
        magnitude: "moderate",
        effort: "moderate",
        timeframe: "Ongoing",
        effects: [
          "Humans define goals and review agent outputs",
          "New oversight and escalation habits",
          "'What to do when an agent gets stuck' playbooks",
        ],
        watchouts: ["Trust calibration & over-reliance on agents"],
        metrics: [{ label: "Role shift", value: "Operator → supervisor" }],
      },
    },
  ],
  readiness: [
    { id: "r-1", type: "skill", role: "Solution Architect", description: "Agent orchestration & guardrail design" },
    { id: "r-2", type: "skill", role: "Project Manager", description: "Human-in-the-loop review & reward/goal design" },
    { id: "r-3", type: "certification", role: "Innovation Lead", description: "Cloud/AI practitioner (e.g. AWS AI Practitioner)" },
    { id: "r-4", type: "certification", role: "Enterprise / Governance Architect", description: "Responsible-AI governance" },
    { id: "r-5", type: "training", role: "People & Culture / L&D", description: "Agent Ops, monitoring & failure recovery ('what to do when an agent gets stuck')" },
  ],
  cascade: [
    { targetRole: "Project Manager (PM)", actionText: "Draft PoC plan + success criteria for the ePPM agent", layerOrigin: "Adoption Path" },
    { targetRole: "Solution Architect", actionText: "Design orchestration architecture (conductor vs. decentralized), tool/API integration", layerOrigin: "Domain layer" },
    { targetRole: "Security / 1LoD", actionText: "Define agent identity, permissioning, audit approach", layerOrigin: "Domain layer" },
    { targetRole: "Data Privacy Manager", actionText: "Assess data the agent can read/act on; classification", layerOrigin: "Domain layer" },
    { targetRole: "Finance / IT Finance", actionText: "Model PoC cost + PM-hours-saved benefit", layerOrigin: "Enterprise layer" },
    { targetRole: "People & Culture / L&D", actionText: "Build Agent Ops / oversight upskilling plan", layerOrigin: "Individual layer" },
  ],
  seedFundingIndicative: "$60–90K OPEX",
  pocSuccessCriteria: [
    "Gate-document prep time reduced by target %",
    "Portfolio-conflict misses reduced by target %",
    "PM satisfaction with agent outputs above threshold",
  ],
  pocKpis: [
    { label: "Gate-doc prep time saved", target: "≥ 30%" },
    { label: "Conflict-detection accuracy", target: "≥ 85%" },
    { label: "Projects piloted", target: "N live projects" },
  ],
  g0Pack: [
    { id: "g0-value", title: "Benefit / Value Hypothesis", draft: "Agentic assistance reduces gate-document prep time by X% and portfolio-conflict misses by Y%." },
    { id: "g0-experiment", title: "Experiment Definition (PoC/MVP)", draft: "PoC on N live projects; measure hours saved & error reduction, staged over 6 months." },
    { id: "g0-objectives", title: "Objectives & Key Deliverables", draft: "Stand up orchestration sandbox; integrate ePPM read APIs; deliver agent that drafts 3 gate documents." },
    { id: "g0-financials", title: "Indicative Financials", draft: "Initiation + execution estimate ~$60–90K OPEX; benefit via PM hours saved + faster gate cycles." },
    { id: "g0-timeline", title: "Timeline & Milestones", draft: "6-month PoC → G3, with monthly checkpoints and a G1/G2 review midway." },
    { id: "g0-risk", title: "Risk Assessment", draft: "Medium — autonomy/guardrails and indirect ROI are the primary risks." },
    { id: "g0-tech", title: "Technology & Architecture", draft: "Orchestration platform; buy-vs-build (extend Platypus vs. new build); conductor-and-workers pattern." },
    { id: "g0-security", title: "Initial Cybersecurity Assessment", draft: "Engage 1LoD — per-agent identity, tool permissioning, audit logging required." },
    { id: "g0-privacy", title: "Data Privacy (high-level)", draft: "Classify ePPM data the agent reads/acts on; flag personal-data processing for DPIA consult." },
  ],
  g3Pack: [
    { id: "g3-outcome", title: "Outcome (why invest?)", draft: "Refined value statement validated by PoC: measured prep-time savings and conflict-detection accuracy justify a pilot." },
    { id: "g3-deliverables", title: "Key Deliverables", draft: "Production-ready ePPM agent, Agent Ops runbook, guardrail policy, rollout plan across portfolios." },
    { id: "g3-financials", title: "Advanced Financials", draft: "Indicative NPV positive over 3 years; Payback ~18 months; benefit split productivity (PM hours) + faster gate cycles." },
    { id: "g3-benefits", title: "Benefits", draft: "Productivity (PM hours saved), foundation (reusable orchestration capability), risk-reduction (fewer conflict misses)." },
    { id: "g3-tech", title: "Technology & Architecture", draft: "Matured Solution Outline, hosting decision, app-portfolio impact, ARB notes, final buy-vs-build." },
    { id: "g3-impact", title: "Impact Assessments", draft: "1LoD/2LoD security sign-off + DPIA status carried from the PoC." },
    { id: "g3-steerco", title: "SteerCo Stakeholder Agreement", draft: "Draft Project Stakeholder Agreement for signature by portfolio + eng leadership." },
    { id: "g3-decision", title: "DISD G3 Decision Sheet", draft: "Draft decision sheet to be linked in ePPM for the DISD funding decision." },
  ],
};

// ─── Journey B — Physical AI ─────────────────────────────────────────────────

const PHYSICAL_AI: Journey = {
  id: "physical-ai",
  techName: "Physical AI",
  tagline:
    "AI that perceives and acts on the physical world via sensors/actuators — robotics, smart factories, autonomous fleets — trained heavily in simulation and digital twins.",
  sourceTitle: "What is Physical AI?",
  sourcePublisher: "IBM",
  sourceUrl: "https://www.ibm.com/think/topics/physical-ai",
  matchKeywords: [
    "physical ai",
    "robot",
    "robotics",
    "digital twin",
    "sensors",
    "actuators",
    "smart factory",
    "autonomous fleet",
  ],
  executiveSummary: {
    fit: "Physical AI brings PMI's AI strategy into the physical operation — robotics, digital twins and sensor-driven autonomy — extending value beyond knowledge work into manufacturing, warehousing and facilities.",
    alreadyAdopted: [
      "Plant sensor mesh & telemetry pipelines",
      "Existing manufacturing automation / IoT programmes",
      "Line-level digital-twin PoC (Manufacturing Technology)",
    ],
    opportunity:
      "Simulation-first predictive maintenance and flexible automation that cut unplanned downtime and manual handling, with real-world risk contained by training in the digital twin before deployment.",
    useCaseSummary:
      "5 candidate functions explored — predictive-maintenance robotics, warehouse AMRs, vision QC, smart-shelf retail sensing and energy-optimised facilities.",
  },
  targetFunctions: [
    "Manufacturing / Operations",
    "Supply Chain / Warehousing",
    "Quality Control",
    "SRC retail network",
    "Facilities / Sustainability",
  ],
  useCases: [
    {
      id: "uc-manufacturing",
      function: "Manufacturing / Operations",
      description:
        "Robotic AI for predictive maintenance & flexible assembly; a digital twin of a factory line for simulation-first optimization.",
      opportunities: [
        "Reduced downtime",
        "Labor efficiency",
        "Safer operations",
        "Simulation-first lowers real-world risk before deployment",
      ],
      risks: [
        "High capex",
        "'Data is expensive' — real robot-interaction data, hardware wear",
        "'Physics is hard' — sim-to-real gap",
        "Real stakes (safety); latency-sensitive control; overfitting to synthetic data",
      ],
      benefitCost:
        "Higher than software-only — PoC likely near the top of the seed band (~$90–100K+); benefit via downtime & maintenance-cost reduction.",
      timeline: "Longer runway — sim build + real-world fine-tuning; 6-month PoC is tight, may need staging.",
      projectClashes: [
        "Overlaps with existing manufacturing automation / IoT initiatives — capability-overlap check required.",
      ],
      riskItems: [
        {
          id: "risk-mfg-safety",
          title: "Real-world safety stakes — autonomous physical action near people",
          severity: "critical",
          recommendedTechnique: "avoidance",
          mitigations: [
            { technique: "avoidance", strategy: "Simulation-first; constrain the real-world pilot to a fenced, human-free cell.", residualSeverity: "medium" },
            { technique: "reduction", strategy: "Hardware e-stops, safety-rated sensors, speed limits and 1LoD safety sign-off.", residualSeverity: "medium" },
            { technique: "transference", strategy: "Vendor safety certification + liability insurance for the robotics deployment.", residualSeverity: "high" },
            { technique: "acceptance", strategy: "Not acceptable un-mitigated — safety risk cannot simply be accepted.", residualSeverity: "critical" },
          ],
        },
        {
          id: "risk-mfg-sim2real",
          title: "Sim-to-real gap — models overfit to synthetic data",
          severity: "high",
          recommendedTechnique: "reduction",
          mitigations: [
            { technique: "avoidance", strategy: "Only automate tasks where the twin is high-fidelity; defer the rest.", residualSeverity: "medium" },
            { technique: "reduction", strategy: "Domain randomisation, real-world fine-tuning and staged validation gates.", residualSeverity: "medium" },
            { technique: "transference", strategy: "Use a vendor world-foundation-model with transfer guarantees.", residualSeverity: "medium" },
            { technique: "acceptance", strategy: "Accept lower accuracy on edge cases with human oversight.", residualSeverity: "high" },
          ],
        },
        {
          id: "risk-mfg-capex",
          title: "High capex and expensive real robot-interaction data",
          severity: "high",
          recommendedTechnique: "transference",
          mitigations: [
            { technique: "avoidance", strategy: "Rent/lease robotics for the PoC rather than purchasing.", residualSeverity: "medium" },
            { technique: "reduction", strategy: "Reuse the existing sensor mesh; stage capex against proven milestones.", residualSeverity: "medium" },
            { technique: "transference", strategy: "Vendor robotics-as-a-service shifts capex to opex.", residualSeverity: "low" },
            { technique: "acceptance", strategy: "Accept capex if downtime-savings business case clears the hurdle rate.", residualSeverity: "high" },
          ],
        },
      ],
      similarProjects: [
        {
          name: "Manufacturing automation / IoT programme",
          status: "Live",
          similarityScore: 71,
          overlappingComponents: ["PLC / line control", "Predictive-maintenance rules", "Sensor telemetry"],
          reusableComponents: ["Sensor mesh & telemetry pipelines", "Historian data", "Edge gateways"],
        },
        {
          name: "Line-level digital-twin PoC",
          status: "In PoC",
          similarityScore: 66,
          overlappingComponents: ["Digital-twin model of the line"],
          reusableComponents: ["Twin simulation environment", "Calibration dataset"],
        },
      ],
      costBasis: {
        annualBenefitUsd: 1_600_000,
        monthlyTokenUsd: 2_600,
        complexity: 1.6,
        defaults: {
          vendor: { internalPeople: 3, contractors: 3, timelineMonths: 8 },
          saas: { internalPeople: 3, contractors: 2, timelineMonths: 7 },
          "in-house": { internalPeople: 5, contractors: 3, timelineMonths: 11 },
        },
      },
    },
    {
      id: "uc-warehousing",
      function: "Supply Chain / Warehousing",
      description: "Fleets of autonomous mobile robots (AMRs) for picking and moving goods.",
      opportunities: ["Higher throughput", "Reduced manual handling"],
      risks: ["Capex", "Integration with WMS", "Safety around humans"],
      benefitCost: "PoC ~$90K+; benefit via throughput and labor efficiency.",
      timeline: "9-month staged PoC.",
      projectClashes: ["Overlaps with warehouse automation programs."],
    },
    {
      id: "uc-quality",
      function: "Quality Control",
      description: "Computer-vision inspection on the production line.",
      opportunities: ["Higher defect-detection rates", "Consistent inspection"],
      risks: ["Model drift", "Lighting/positioning sensitivity"],
      benefitCost: "PoC ~$80K; benefit via reduced escaped defects.",
      timeline: "6-month PoC.",
      projectClashes: ["May overlap with existing QC tooling."],
    },
    {
      id: "uc-src",
      function: "SRC retail network",
      description: "Vision-based smart-shelf / inventory sensing for toko kelontong stock accuracy.",
      opportunities: ["Real-time stock accuracy", "Reduced stockouts"],
      risks: ["Hardware cost per store", "Connectivity"],
      benefitCost: "PoC ~$90K across pilot stores.",
      timeline: "9-month PoC.",
      projectClashes: ["Coordinate with SRC digitization."],
    },
    {
      id: "uc-facilities",
      function: "Facilities / Sustainability",
      description: "AI-optimized, energy-efficient smart-grid / building systems.",
      opportunities: ["Energy savings", "Sustainability gains"],
      risks: ["Building-system integration", "Long payback"],
      benefitCost: "PoC ~$85K; benefit via energy reduction.",
      timeline: "9–12 month PoC.",
      projectClashes: ["Overlaps with facilities-management systems."],
    },
  ],
  recommendedUseCaseId: "uc-manufacturing",
  recommendationRationale:
    "Digital-twin-driven predictive maintenance in Manufacturing — strongest data availability, safety-contained via simulation-first, measurable downtime savings.",
  impactLayers: [
    {
      layer: "enterprise",
      restructuringFlag: true,
      content:
        "Significant capex governance; safety & compliance oversight; likely restructuring — new roles around robotics/automation ops and simulation engineering. Highest org footprint of the three journeys.",
      detail: {
        headline: "Capex governance + robotics / automation ops",
        magnitude: "transformational",
        effort: "high",
        timeframe: "12–24 mo",
        effects: [
          "New robotics / automation ops & simulation engineering roles",
          "Heavy capex governance and staged investment",
          "Safety & compliance oversight at the enterprise level",
          "Highest organizational footprint of the three journeys",
        ],
        watchouts: ["Significant restructuring", "OT + physical-safety accountability"],
        metrics: [
          { label: "Org footprint", value: "Highest" },
          { label: "Investment", value: "Capex-heavy" },
        ],
      },
    },
    {
      layer: "domain",
      content:
        "OT/physical safety, sensor/edge security, digital-twin data integrity. Solution patterns: hybrid control (simple algorithms for stability + learning models for perception/decision), world foundation models, domain randomization.",
      detail: {
        headline: "OT safety, edge security & digital-twin integrity",
        magnitude: "high",
        effort: "high",
        timeframe: "6–18 mo",
        effects: [
          "Hybrid control: stability algorithms + learning perception",
          "World foundation models & domain randomization",
          "Sensor / edge security hardening",
          "Digital-twin data integrity",
        ],
        watchouts: ["Sim-to-real gap", "Latency-sensitive control loops"],
        metrics: [
          { label: "Approach", value: "Simulation-first" },
          { label: "Security", value: "OT / edge" },
        ],
      },
    },
    {
      layer: "individual",
      content:
        "New operational + safety competencies; simulation/robotics literacy for engineers and floor staff.",
      detail: {
        headline: "Robotics & simulation literacy on the floor",
        magnitude: "moderate",
        effort: "moderate",
        timeframe: "6–12 mo",
        effects: [
          "New operational + safety competencies",
          "Simulation / robotics literacy for engineers & floor staff",
          "Human oversight of autonomous physical systems",
        ],
        watchouts: ["Change fatigue on the shop floor"],
        metrics: [{ label: "Upskilling", value: "Engineers + floor" }],
      },
    },
  ],
  readiness: [
    { id: "r-1", type: "skill", role: "Solution Architect", description: "Reinforcement learning & simulation/digital-twin engineering" },
    { id: "r-2", type: "skill", role: "Project Manager", description: "Sensor/edge integration & staged PoC management" },
    { id: "r-3", type: "certification", role: "Security / 1LoD", description: "Industrial safety & robotics/automation certification" },
    { id: "r-4", type: "certification", role: "Solution Architect", description: "Relevant cloud/edge-AI certification" },
    { id: "r-5", type: "training", role: "People & Culture / L&D", description: "Sim-to-real transfer; human oversight of autonomous physical systems" },
  ],
  cascade: [
    { targetRole: "Project Manager (PM)", actionText: "Draft staged PoC plan (sim → constrained real-world)", layerOrigin: "Adoption Path" },
    { targetRole: "Solution Architect", actionText: "Design digital-twin + hybrid control architecture; buy-vs-build (vendor robotics vs. custom)", layerOrigin: "Domain layer" },
    { targetRole: "Enterprise / Governance Architect", actionText: "Overlap check vs. existing automation/IoT programs", layerOrigin: "Enterprise layer" },
    { targetRole: "Security / 1LoD", actionText: "OT/edge security + physical-safety assessment", layerOrigin: "Domain layer" },
    { targetRole: "Finance / IT Finance", actionText: "Build capex-heavy cost model + downtime-savings benefit", layerOrigin: "Enterprise layer" },
    { targetRole: "People & Culture / L&D", actionText: "Plan robotics-ops & safety upskilling", layerOrigin: "Individual layer" },
  ],
  seedFundingIndicative: "$90–100K OPEX",
  pocSuccessCriteria: [
    "Unplanned downtime reduced by target % at pilot line",
    "Sim-to-real model transfers within accuracy threshold",
    "Zero safety incidents during constrained real-world pilot",
  ],
  pocKpis: [
    { label: "Unplanned downtime reduction", target: "≥ 20%" },
    { label: "Sim-to-real accuracy", target: "≥ 80%" },
    { label: "Safety incidents", target: "0" },
  ],
  g0Pack: [
    { id: "g0-value", title: "Benefit / Value Hypothesis", draft: "Predictive-maintenance robotics reduces unplanned downtime by X% at the pilot line." },
    { id: "g0-experiment", title: "Experiment Definition (PoC/MVP)", draft: "Simulation-first, then constrained real-world pilot; measure downtime & maintenance cost." },
    { id: "g0-objectives", title: "Objectives & Key Deliverables", draft: "Build digital twin of one line; train perception/decision models; run constrained real-world trial." },
    { id: "g0-financials", title: "Indicative Financials", draft: "Capex-heavy; ~$90–100K+ initiation; benefit via downtime & maintenance-cost reduction." },
    { id: "g0-timeline", title: "Timeline & Milestones", draft: "Staged: sim build (months 1–3) → constrained pilot (months 4–6+) → G3." },
    { id: "g0-risk", title: "Risk Assessment", draft: "High — capex, safety, and sim-to-real gap are the primary risks." },
    { id: "g0-tech", title: "Technology & Architecture", draft: "Digital twin + world foundation model, hybrid control; heavy buy-vs-build call." },
    { id: "g0-security", title: "Initial Cybersecurity Assessment", draft: "Mandatory 1LoD + physical-safety review; OT/edge security in scope." },
    { id: "g0-privacy", title: "Data Privacy (high-level)", draft: "Mostly operational/sensor data; flag any personal data captured on the floor for DPIA." },
  ],
  g3Pack: [
    { id: "g3-outcome", title: "Outcome (why invest?)", draft: "PoC validated downtime reduction and safe sim-to-real transfer, justifying a manufacturing pilot." },
    { id: "g3-deliverables", title: "Key Deliverables", draft: "Production digital-twin pipeline, robotics-ops runbook, safety certification, rollout plan." },
    { id: "g3-financials", title: "Advanced Financials", draft: "Indicative NPV positive over 4–5 years given capex; Payback ~30 months; benefit via downtime + maintenance savings." },
    { id: "g3-benefits", title: "Benefits", draft: "Opex reduction (maintenance), productivity (uptime), risk-reduction (safety), foundation (reusable twin)." },
    { id: "g3-tech", title: "Technology & Architecture", draft: "Matured Solution Outline, edge hosting, app-portfolio impact, ARB notes, final buy-vs-build." },
    { id: "g3-impact", title: "Impact Assessments", draft: "1LoD/2LoD OT-security + physical-safety + DPIA status carried from the PoC." },
    { id: "g3-steerco", title: "SteerCo Stakeholder Agreement", draft: "Draft Project Stakeholder Agreement for signature by ops + safety leadership." },
    { id: "g3-decision", title: "DISD G3 Decision Sheet", draft: "Draft decision sheet to be linked in ePPM for the DISD funding decision." },
  ],
};

// ─── Journey C — Wicked Intelligence ─────────────────────────────────────────

const WICKED_INTELLIGENCE: Journey = {
  id: "wicked-intelligence",
  techName: "Wicked Intelligence",
  tagline:
    "A framing/strategy, not a product — using AI on wicked (very hard) problems humans have struggled with, rather than automating what humans already do well. #unthink #unask #unlearn.",
  sourceTitle: "Wicked Intelligence Will Decide Who Wins the AGI Race",
  sourcePublisher: "Dave Aron / Gartner (LinkedIn)",
  sourceUrl:
    "https://www.linkedin.com/posts/davearon_unthink-unask-unlearn-share-7366203509345554432-QwPr/",
  matchKeywords: [
    "wicked",
    "wicked intelligence",
    "wicked problem",
    "unthink",
    "unask",
    "unlearn",
    "agi",
    "problem framing",
  ],
  executiveSummary: {
    fit: "Wicked Intelligence is a strategy lens, not a product — it points PMI's AI investment at the hard, previously-intractable problems where AI creates outsized value, rather than automating what humans already do well.",
    alreadyAdopted: [
      "Cross-portfolio prioritisation cadence",
      "Innovation Office reframing workshops",
      "Decision-science analytics community of practice",
    ],
    opportunity:
      "A lightweight, repeatable problem-framing capability (#unthink / #unask / #unlearn) that feeds a shortlist of high-value candidates into the deeper adoption journeys — maximising return on scarce AI investment.",
    useCaseSummary:
      "5 candidate functions explored — portfolio triage, regulatory navigation, R&D design-space search, sustainability trade-offs and hyper-local SRC demand modelling.",
  },
  targetFunctions: [
    "Portfolio / Strategy",
    "Regulatory / Scientific Affairs",
    "R&D",
    "Sustainability / Supply Chain",
    "SRC retail network",
  ],
  useCases: [
    {
      id: "uc-portfolio",
      function: "Portfolio / Strategy",
      description:
        "AI to untangle cross-portfolio interdependencies & resource conflicts humans can't fully hold in their heads.",
      opportunities: [
        "Focus AI investment on high-value, previously-intractable problems (higher payoff than automating known tasks)",
        "Differentiation",
        "Disciplined 'curiosity that acts'",
      ],
      risks: [
        "Ambiguity — wicked problems are hard to scope and measure",
        "Success criteria fuzzy",
        "Risk of over-promising toward 'AGI'",
        "Needs strong problem-framing discipline",
      ],
      benefitCost:
        "Low direct build cost (it's a method/capability); PoC ~$40–60K to run structured problem-framing sprints.",
      timeline: "Short — a framing/prioritization sprint feeding other journeys.",
      projectClashes: [
        "Complements rather than clashes — acts as an upstream lens that feeds candidates into Journeys A and B and the wider portfolio.",
      ],
      riskItems: [
        {
          id: "risk-portfolio-ambiguity",
          title: "Ambiguity — wicked problems are hard to scope and measure",
          severity: "medium",
          recommendedTechnique: "reduction",
          mitigations: [
            { technique: "avoidance", strategy: "Only admit problems that pass a minimum framability bar.", residualSeverity: "low" },
            { technique: "reduction", strategy: "Structured #unthink/#unask/#unlearn framing with explicit value hypotheses per problem.", residualSeverity: "low" },
            { technique: "transference", strategy: "Bring in external facilitation expertise for the hardest problems.", residualSeverity: "medium" },
            { technique: "acceptance", strategy: "Accept that some framed problems won't progress — treat as portfolio optioning.", residualSeverity: "medium" },
          ],
        },
        {
          id: "risk-portfolio-overpromise",
          title: "Risk of over-promising toward 'AGI'-level outcomes",
          severity: "medium",
          recommendedTechnique: "avoidance",
          mitigations: [
            { technique: "avoidance", strategy: "Ban AGI framing; anchor every problem to a concrete, testable value hypothesis.", residualSeverity: "low" },
            { technique: "reduction", strategy: "Leadership review gate on claims before candidates go downstream.", residualSeverity: "low" },
            { technique: "transference", strategy: "External advisory board pressure-tests the ambition level.", residualSeverity: "medium" },
            { technique: "acceptance", strategy: "Accept modest ambition where value is still clearly positive.", residualSeverity: "medium" },
          ],
        },
      ],
      similarProjects: [
        {
          name: "Cross-portfolio prioritisation cadence",
          status: "Live",
          similarityScore: 52,
          overlappingComponents: ["Prioritisation scoring", "Portfolio intake"],
          reusableComponents: ["Scoring rubric", "Portfolio backlog", "Governance cadence"],
        },
        {
          name: "Innovation reframing workshops",
          status: "Live",
          similarityScore: 44,
          overlappingComponents: ["Facilitation format"],
          reusableComponents: ["Workshop templates", "Facilitator pool"],
        },
      ],
      costBasis: {
        annualBenefitUsd: 520_000,
        monthlyTokenUsd: 1_100,
        complexity: 0.6,
        defaults: {
          vendor: { internalPeople: 1, contractors: 1, timelineMonths: 3 },
          saas: { internalPeople: 1, contractors: 0, timelineMonths: 2 },
          "in-house": { internalPeople: 2, contractors: 1, timelineMonths: 4 },
        },
      },
    },
    {
      id: "uc-regulatory",
      function: "Regulatory / Scientific Affairs",
      description:
        "AI to navigate the multi-market, ever-shifting regulatory maze for reduced-risk products.",
      opportunities: ["Faster regulatory navigation", "Fewer missed requirements"],
      risks: ["Regulatory accuracy stakes", "Explainability needs"],
      benefitCost: "PoC ~$50–60K framing + narrow pilot.",
      timeline: "Short framing sprint.",
      projectClashes: ["Feeds, rather than clashes with, regulatory programs."],
    },
    {
      id: "uc-rnd",
      function: "R&D",
      description: "AI to explore vast design/formulation spaces beyond human search capacity.",
      opportunities: ["Broader design-space exploration", "Novel candidates"],
      risks: ["Compute cost", "Validation burden"],
      benefitCost: "PoC ~$50K framing.",
      timeline: "Short.",
      projectClashes: ["Complements existing R&D tooling."],
    },
    {
      id: "uc-sustainability",
      function: "Sustainability / Supply Chain",
      description: "AI to optimize deeply interdependent, multi-objective sustainability trade-offs.",
      opportunities: ["Multi-objective optimization", "Better trade-off transparency"],
      risks: ["Data availability", "Conflicting objectives"],
      benefitCost: "PoC ~$50K framing.",
      timeline: "Short.",
      projectClashes: ["Feeds sustainability programs."],
    },
    {
      id: "uc-src",
      function: "SRC retail network",
      description: "AI to model complex, hyper-local demand across 250K+ diverse stores.",
      opportunities: ["Hyper-local demand insight", "Better allocation"],
      risks: ["Data heterogeneity", "Scale complexity"],
      benefitCost: "PoC ~$55K framing + narrow test.",
      timeline: "Short.",
      projectClashes: ["Feeds SRC analytics programs."],
    },
  ],
  recommendedUseCaseId: "uc-portfolio",
  recommendationRationale:
    "Wicked-problem triage capability for Portfolio/Strategy — a lightweight capability that helps leadership pick the right hard problems to point AI at, feeding a shortlist of high-value candidates.",
  impactLayers: [
    {
      layer: "enterprise",
      restructuringFlag: false,
      content:
        "Governance = how PMI chooses wicked problems and allocates AI investment; likely no structural change — more a decision-making/curiosity ritual than a new org unit.",
      detail: {
        headline: "A decision ritual, not a new org unit",
        magnitude: "low",
        effort: "low",
        timeframe: "1–3 mo",
        effects: [
          "Shapes how PMI chooses wicked problems & allocates AI investment",
          "A recurring curiosity / decision-making cadence",
          "No new structural unit required",
        ],
        watchouts: ["Avoid it becoming a talk-shop with no output"],
        metrics: [
          { label: "Structure", value: "No change" },
          { label: "Cadence", value: "Framing ritual" },
        ],
      },
    },
    {
      layer: "domain",
      content:
        "Depends on the chosen problem; solution = a repeatable problem-framing method (#unthink/#unask/#unlearn) rather than a fixed tech stack.",
      detail: {
        headline: "A repeatable problem-framing method",
        magnitude: "moderate",
        effort: "low",
        timeframe: "1–3 mo",
        effects: [
          "#unthink / #unask / #unlearn framing",
          "A method rather than a fixed tech stack",
          "Feeds scored candidates into deeper journeys",
        ],
        watchouts: ["Concrete tech stack depends on the chosen problem"],
        metrics: [{ label: "Output", value: "Scored shortlist" }],
      },
    },
    {
      layer: "individual",
      content:
        "Curiosity, critical thinking, problem reframing, 'unlearning' assumptions — the human capability Voegele highlights.",
      detail: {
        headline: "Curiosity, reframing & 'unlearning'",
        magnitude: "moderate",
        effort: "moderate",
        timeframe: "Ongoing",
        effects: [
          "Critical thinking & problem reframing",
          "'Unlearning' entrenched assumptions",
          "Hypothesis design & AI-literacy to know what's now solvable",
        ],
        watchouts: ["Requires senior facilitation to land"],
        metrics: [{ label: "Capability", value: "Reframing" }],
      },
    },
  ],
  readiness: [
    { id: "r-1", type: "skill", role: "Portfolio Manager", description: "Problem framing & systems thinking" },
    { id: "r-2", type: "skill", role: "Innovation Lead", description: "Hypothesis design & AI literacy to know what's now solvable" },
    { id: "r-3", type: "training", role: "Innovation Lead", description: "'unthink/unask/unlearn' workshops" },
    { id: "r-4", type: "training", role: "People & Culture / L&D", description: "Wicked-problem selection & scoping facilitation" },
    { id: "r-5", type: "certification", role: "Portfolio Manager", description: "Facilitation / design-thinking / strategy (less certification-driven)" },
  ],
  cascade: [
    { targetRole: "Portfolio Manager", actionText: "Run a wicked-problem shortlisting sprint; feed candidates to the G0 pipeline", layerOrigin: "Adoption Path" },
    { targetRole: "Innovation Lead / Explorer", actionText: "Facilitate #unthink/#unask/#unlearn framing sessions", layerOrigin: "Individual layer" },
    { targetRole: "Project Manager (PM)", actionText: "Capture shortlisted problems as candidate demands", layerOrigin: "Adoption Path" },
    { targetRole: "People & Culture / L&D", actionText: "Build curiosity / problem-reframing capability", layerOrigin: "Individual layer" },
  ],
  seedFundingIndicative: "$40–60K OPEX",
  pocSuccessCriteria: [
    "2–3 wicked problems framed with clear value hypotheses",
    "Shortlist feeds ≥1 candidate into a deeper journey",
    "Leadership endorses the framing method",
  ],
  pocKpis: [
    { label: "Wicked problems framed", target: "2–3" },
    { label: "Candidates fed downstream", target: "≥ 1" },
    { label: "Leadership endorsement", target: "Yes" },
  ],
  g0Pack: [
    { id: "g0-value", title: "Benefit / Value Hypothesis", draft: "Focusing AI on 2–3 wicked problems yields higher expected value than automating known tasks." },
    { id: "g0-experiment", title: "Experiment Definition (PoC/MVP)", draft: "Structured framing sprint → shortlist → feed 1–2 candidates into deeper journeys." },
    { id: "g0-objectives", title: "Objectives & Key Deliverables", draft: "Run framing workshops; produce a scored wicked-problem shortlist; hand off top candidates." },
    { id: "g0-financials", title: "Indicative Financials", draft: "Low direct build cost; ~$40–60K OPEX to run structured problem-framing sprints." },
    { id: "g0-timeline", title: "Timeline & Milestones", draft: "Short — a framing/prioritization sprint feeding other journeys." },
    { id: "g0-risk", title: "Risk Assessment", draft: "Medium — ambiguity/measurability; needs strong problem-framing discipline." },
    { id: "g0-tech", title: "Technology & Architecture", draft: "Method-first; minimal build; leverages existing AI tooling." },
    { id: "g0-security", title: "Initial Cybersecurity Assessment", draft: "Deferred until a concrete problem is chosen." },
    { id: "g0-privacy", title: "Data Privacy (high-level)", draft: "Deferred until a concrete problem is chosen." },
  ],
  g3Pack: [
    { id: "g3-outcome", title: "Outcome (why invest?)", draft: "Framing capability produced high-value candidates; institutionalize the method." },
    { id: "g3-deliverables", title: "Key Deliverables", draft: "Repeatable wicked-problem selection playbook, facilitation cadence, candidate pipeline." },
    { id: "g3-financials", title: "Advanced Financials", draft: "Low cost; indicative NPV positive via better AI-investment targeting; Payback short." },
    { id: "g3-benefits", title: "Benefits", draft: "Foundation (decision capability), risk-reduction (avoid low-value AI spend)." },
    { id: "g3-tech", title: "Technology & Architecture", draft: "Method + light tooling; no heavy platform build." },
    { id: "g3-impact", title: "Impact Assessments", draft: "Security/Privacy engaged per selected concrete problem." },
    { id: "g3-steerco", title: "SteerCo Stakeholder Agreement", draft: "Draft Project Stakeholder Agreement for portfolio/strategy leadership." },
    { id: "g3-decision", title: "DISD G3 Decision Sheet", draft: "Draft decision sheet to be linked in ePPM." },
  ],
};

// ─── Journey D — GPT-6 Astra ─────────────────────────────────────────────────

const GPT_6_ASTRA: Journey = {
  id: "gpt-6-astra",
  techName: "GPT-6 Astra",
  tagline:
    "A frontier multimodal foundation model with native agentic tool-use, real-time voice/vision, a very long context window and always-on memory — a general reasoning engine you can point at almost any knowledge task.",
  sourceTitle: "Introducing GPT-6 Astra: a real-time, agentic frontier model",
  sourcePublisher: "OpenAI (illustrative)",
  sourceUrl: "https://openai.com/index/gpt-6-astra",
  matchKeywords: [
    "gpt-6",
    "gpt 6",
    "gpt6",
    "astra",
    "frontier model",
    "foundation model",
    "multimodal",
    "long context",
    "real-time voice",
    "agentic reasoning",
  ],
  executiveSummary: {
    fit: "GPT-6 Astra moves PMI from task-specific AI assistants to a single frontier reasoning engine — real-time multimodal, long-context and agentic — that can be pointed at knowledge work across the whole portfolio, reinforcing the Project Management Excellence and enterprise-productivity pillars.",
    alreadyAdopted: [
      "Jarvis AI assistant for individual productivity",
      "Enterprise RAG / knowledge-base search PoC",
    ],
    opportunity:
      "Consolidate a sprawl of narrow AI tools onto one governed frontier model — real-time voice/vision copilots, long-context document reasoning and always-on memory — cutting per-tool licensing while keeping a human in the loop on every material action.",
    useCaseSummary:
      "5 candidate functions explored — an ePPM knowledge copilot, real-time consumer-care voice agent, regulatory long-context reviewer, R&D literature synthesiser and multimodal SRC field assistant.",
  },
  targetFunctions: [
    "Project Management Excellence (ePPM)",
    "Commercial / Consumer Care",
    "Regulatory / Scientific Affairs",
    "R&D",
    "Product Design & Engineering (FormaNova)",
    "SRC retail network",
  ],
  useCases: [
    {
      id: "uc-eppm-copilot",
      function: "Project Management Excellence (ePPM)",
      description:
        "A long-context reasoning copilot that ingests an entire portfolio's gate documents, status reports and meeting notes to answer questions, surface conflicts and draft G-gate paperwork — grounded in retrieval with citations.",
      opportunities: [
        "Reason over an entire portfolio in one long-context window",
        "Draft gate documents grounded in cited source material",
        "Real-time voice Q&A over project state in reviews",
        "Consolidate several narrow AI tools onto one governed model",
      ],
      risks: [
        "Hallucinated facts / fabricated citations in gate documents",
        "Sensitive portfolio data sent to a frontier model provider",
        "Over-reliance on model output without human verification",
        "Cost unpredictability — token spend scales with context size",
      ],
      benefitCost: "PoC ~$70–100K OPEX; benefit via PM hours saved + faster, better-grounded gate cycles.",
      timeline: "6-month PoC → G3.",
      projectClashes: [
        "Overlaps with the Jarvis assistant and the enterprise RAG PoC — must be positioned as the shared model layer beneath them, not a fourth silo.",
      ],
      riskItems: [
        {
          id: "risk-astra-hallucination",
          title: "Hallucinated facts or fabricated citations in gate documents",
          severity: "high",
          recommendedTechnique: "reduction",
          mitigations: [
            { technique: "avoidance", strategy: "Restrict the copilot to retrieval-grounded answers only; disable free-form generation for gate paperwork.", residualSeverity: "low" },
            { technique: "reduction", strategy: "Mandatory citation-to-source linking, confidence flags and human sign-off before any document is filed.", residualSeverity: "low" },
            { technique: "transference", strategy: "Use the vendor's grounded-generation / verified-answer feature with contractual accuracy SLAs.", residualSeverity: "medium" },
            { technique: "acceptance", strategy: "Accept residual risk for low-stakes internal summaries with a visible 'AI draft' watermark.", residualSeverity: "medium" },
          ],
        },
        {
          id: "risk-astra-data-residency",
          title: "Sensitive portfolio & personal data sent to a frontier model provider",
          severity: "high",
          recommendedTechnique: "transference",
          mitigations: [
            { technique: "avoidance", strategy: "Keep the PoC to non-confidential, already-public project data only.", residualSeverity: "low" },
            { technique: "reduction", strategy: "PII redaction, data-classification gating and per-request logging before calls leave the tenancy.", residualSeverity: "medium" },
            { technique: "transference", strategy: "Enterprise agreement with zero-retention, no-training-on-data terms and an in-region private deployment.", residualSeverity: "low" },
            { technique: "acceptance", strategy: "Not acceptable un-mitigated for confidential data — must be contained first.", residualSeverity: "high" },
          ],
        },
        {
          id: "risk-astra-overreliance",
          title: "Over-reliance on model output without human verification",
          severity: "medium",
          recommendedTechnique: "reduction",
          mitigations: [
            { technique: "avoidance", strategy: "Position the copilot as advisory only; never let it be the system of record.", residualSeverity: "low" },
            { technique: "reduction", strategy: "Human-in-the-loop review gates, spot-check audits and 'why did you say that?' trace views.", residualSeverity: "low" },
            { technique: "transference", strategy: "Adopt vendor observability + evaluation tooling with attestations.", residualSeverity: "medium" },
            { technique: "acceptance", strategy: "Accept for non-material drafting where a human always edits before use.", residualSeverity: "medium" },
          ],
        },
        {
          id: "risk-astra-cost",
          title: "Cost unpredictability — token spend scales with long-context usage",
          severity: "medium",
          recommendedTechnique: "reduction",
          mitigations: [
            { technique: "avoidance", strategy: "Cap context size and disable the most expensive real-time modes in the PoC.", residualSeverity: "low" },
            { technique: "reduction", strategy: "Prompt caching, retrieval instead of full-context stuffing, and per-team token budgets with alerts.", residualSeverity: "low" },
            { technique: "transference", strategy: "Committed-use / capacity pricing with the vendor to fix the unit cost.", residualSeverity: "medium" },
            { technique: "acceptance", strategy: "Accept variable spend during the PoC given the small pilot footprint.", residualSeverity: "medium" },
          ],
        },
      ],
      similarProjects: [
        {
          name: "Jarvis AI assistant",
          status: "Live",
          similarityScore: 74,
          overlappingComponents: ["Conversational UI", "Model gateway", "Prompt/workflow registry"],
          reusableComponents: ["Chat UI components", "Auth & session layer", "Model routing gateway"],
        },
        {
          name: "Enterprise RAG / knowledge-base search PoC",
          status: "In PoC",
          similarityScore: 69,
          overlappingComponents: ["Retrieval pipeline", "Document embeddings", "Citation rendering"],
          reusableComponents: ["Vector index", "Chunking pipeline", "Source-grounding UI"],
        },
        {
          name: "ePPM gate-document templates",
          status: "In use",
          similarityScore: 48,
          overlappingComponents: ["Gate document schemas"],
          reusableComponents: ["DISD G0/G3 templates", "Portfolio data APIs"],
        },
      ],
      costBasis: {
        annualBenefitUsd: 1_400_000,
        monthlyTokenUsd: 6_800,
        complexity: 1.2,
        defaults: {
          vendor: { internalPeople: 2, contractors: 2, timelineMonths: 5 },
          saas: { internalPeople: 2, contractors: 1, timelineMonths: 4 },
          "in-house": { internalPeople: 4, contractors: 2, timelineMonths: 8 },
        },
      },
    },
    {
      id: "uc-consumer-care-voice",
      function: "Commercial / Consumer Care",
      description:
        "Real-time multimodal voice agent that handles consumer calls end-to-end — understands speech, reasons over account context and escalates to a human with full transcript.",
      opportunities: ["Natural real-time voice resolution", "24/7 multilingual coverage", "Human escalation with full context"],
      risks: ["Real-time latency & interruption handling", "Incorrect advice on regulated products", "Voice data privacy"],
      benefitCost: "PoC ~$80–100K OPEX; benefit via reduced handle time and after-hours coverage.",
      timeline: "6-month PoC.",
      projectClashes: ["Overlaps with existing consumer-care automation and the agentic-AI resolver initiative."],
    },
    {
      id: "uc-regulatory-review",
      function: "Regulatory / Scientific Affairs",
      description:
        "Long-context reviewer that reads multi-market regulatory dossiers in one pass and flags gaps, inconsistencies and missing requirements with citations.",
      opportunities: ["Whole-dossier reasoning in one context", "Fewer missed requirements", "Cited, checkable outputs"],
      risks: ["Accuracy stakes are high", "Explainability & auditability requirements", "Model updates changing behaviour"],
      benefitCost: "PoC ~$75–90K OPEX; benefit via faster, more thorough regulatory navigation.",
      timeline: "6–9 month PoC.",
      projectClashes: ["Feeds, rather than clashes with, regulatory programmes."],
    },
    {
      id: "uc-rnd-synthesis",
      function: "R&D",
      description:
        "Literature and patent synthesiser that reads across thousands of documents to summarise the design space and surface novel directions.",
      opportunities: ["Broad literature synthesis beyond human search capacity", "Faster hypothesis generation"],
      risks: ["Fabricated references", "IP / confidentiality exposure", "Validation burden"],
      benefitCost: "PoC ~$70K OPEX; benefit via faster research cycles.",
      timeline: "6-month PoC.",
      projectClashes: ["Complements existing R&D tooling and the wicked-intelligence framing lens."],
    },
    {
      id: "uc-formanova",
      function: "Product Design & Engineering (FormaNova)",
      description:
        "FormaNova — a generative product-design copilot on GPT-6 Astra: describe a device in natural language (e.g. 'a repairable modular sensor hub with passive cooling') and it generates concept geometry, an exploded component view and a first-pass engineering spec. Describe it, generate it, engineer it.",
      opportunities: [
        "Text-to-concept: turn a natural-language brief into 3D concept geometry",
        "Explores many form-factor / layout variants in minutes",
        "Drafts a first-pass bill-of-materials and engineering spec",
        "Bakes in constraints early — repairability, passive cooling, DFM",
      ],
      risks: [
        "Generated geometry may be physically infeasible or non-manufacturable",
        "IP / confidentiality exposure of proprietary design data",
        "Over-trust in unvalidated concepts skipping proper engineering review",
        "Design-tool (CAD/PLM) integration and file-format fidelity",
      ],
      benefitCost: "PoC ~$85–100K OPEX; benefit via compressed concept-to-prototype cycle time.",
      timeline: "6–9 month PoC (concept generation first; CAD/PLM export later).",
      projectClashes: [
        "Overlaps with existing CAD/PLM and R&D tooling — must integrate as a concept front-end, not replace the engineering system of record.",
      ],
      image: formaNovaImage,
      imageAlt:
        "Generative product-design copilot turning the brief 'a repairable modular sensor hub with passive cooling' into an exploded 3D concept.",
      // Nothing like a generative product-design copilot exists at PMI yet — net-new.
      similarProjects: [],
      meaningForPmi:
        "For PMI, FormaNova compresses the fuzzy front-end of product design. An engineer or product manager describes a device in plain language and gets concept geometry, an exploded component view and a first-pass engineering spec in minutes — turning weeks of back-and-forth with CAD specialists into same-day exploration. PMI can test far more form-factor, repairability and cooling options before committing engineering effort, while humans stay the reviewers who validate and sign off every concept. It's a net-new capability: PMI has adopted AI for knowledge work, but nothing yet for generative product design.",
      impactLayers: [
        {
          layer: "enterprise",
          restructuringFlag: false,
          content:
            "No new org unit needed — FormaNova sits inside R&D / Product Engineering as a concept front-end to the existing CAD/PLM system of record. The real enterprise work is governance: IP ownership of AI-generated concepts and a data-classification policy for the proprietary design data that leaves the tenancy.",
          detail: {
            headline: "Design-data governance & CAD/PLM integration",
            magnitude: "moderate",
            effort: "moderate",
            timeframe: "3–9 mo",
            effects: [
              "Position FormaNova as a concept front-end, not a replacement for the CAD/PLM system of record",
              "IP-ownership & licensing policy for AI-generated geometry and specs",
              "Data-classification policy for proprietary design data sent to the model",
              "Tooling budget owned within R&D / Product Engineering",
            ],
            watchouts: ["Avoid duplicating existing CAD/PLM", "Clear IP ownership of generated concepts"],
            metrics: [
              { label: "Structure", value: "No major change" },
              { label: "Integration", value: "CAD / PLM" },
            ],
          },
        },
        {
          layer: "domain",
          content:
            "The core pattern is describe → generate → engineer: natural-language briefs become concept geometry and exploded views with manufacturability constraints (repairability, passive cooling, DFM) baked in early. The hard problems are physical feasibility of generated geometry, CAD/PLM export fidelity, and a mandatory engineering-review gate before any concept advances.",
          detail: {
            headline: "Concept generation grounded in manufacturability",
            magnitude: "high",
            effort: "moderate",
            timeframe: "3–9 mo",
            effects: [
              "Text-to-concept geometry with exploded component views",
              "Constraints baked in early — repairability, passive cooling, DFM",
              "Export path to CAD/PLM with file-format fidelity",
              "Engineering-review gate before a concept advances to development",
            ],
            watchouts: [
              "Generated geometry may be physically infeasible or non-manufacturable",
              "File-format fidelity on CAD/PLM export",
            ],
            metrics: [
              { label: "Pattern", value: "Describe → generate → engineer" },
              { label: "Guardrail", value: "Eng-review gate" },
            ],
          },
        },
        {
          layer: "individual",
          content:
            "Designers shift from hand-building geometry to briefing and curating generated concepts; engineers shift from drafting to validating feasibility. New habits: prompt-craft for design intent, and critically reviewing an AI concept before trusting it.",
          detail: {
            headline: "From CAD modelling to briefing & curating concepts",
            magnitude: "moderate",
            effort: "moderate",
            timeframe: "Ongoing",
            effects: [
              "Designers brief and curate rather than build geometry from scratch",
              "New prompt-craft for design intent and constraints",
              "Engineers validate feasibility instead of drafting first passes",
              "Habit of critically reviewing AI concepts before trusting them",
            ],
            watchouts: ["Over-trust in unvalidated concepts", "Hands-on CAD skill atrophy"],
            metrics: [{ label: "Role shift", value: "Modeller → curator" }],
          },
        },
      ],
      readiness: [
        { id: "r-fn-1", type: "skill", role: "Design Engineer", description: "Prompt-craft for design intent & interpreting generated concept geometry" },
        { id: "r-fn-2", type: "skill", role: "Mechanical Engineer", description: "Feasibility & design-for-manufacture review of AI-generated concepts" },
        { id: "r-fn-3", type: "certification", role: "Solution Architect", description: "CAD/PLM integration & generative-design tooling" },
        { id: "r-fn-4", type: "training", role: "Product Design Team", description: "The describe-generate-engineer workflow & when to trust (or reject) an AI concept" },
        { id: "r-fn-5", type: "certification", role: "Enterprise / Governance Architect", description: "IP & confidentiality governance for AI-generated design data" },
      ],
      changeDrivers: [
        {
          id: "cd-fn-1",
          name: "Elena Vasquez",
          role: "Lead Industrial Designer",
          team: "Product Design Studio",
          skills: ["Concept exploration", "Generative / parametric design", "Design for manufacture"],
          rationale: "Runs early concept exploration today — the natural owner to pilot describe-generate-engineer.",
          matchScore: 92,
        },
        {
          id: "cd-fn-2",
          name: "Hiroshi Tanaka",
          role: "Principal Mechanical Engineer",
          team: "Product Engineering",
          skills: ["DFM", "CAD/PLM", "Feasibility & tolerance review"],
          rationale: "Owns feasibility sign-off — essential to keep generated concepts manufacturable.",
          matchScore: 85,
        },
        {
          id: "cd-fn-3",
          name: "Digital Product Design Guild",
          role: "Design-tech community of practice",
          team: "Product Engineering",
          isTeam: true,
          members: [
            { name: "Sofia Marchetti", role: "Guild Lead / Senior Designer" },
            { name: "Raj Patel", role: "Generative-CAD SME" },
            { name: "Anna Kowalski", role: "PLM Integration Engineer" },
            { name: "Tom Becker", role: "Rapid-Prototyping Lead" },
          ],
          skills: ["Parametric / generative CAD", "PLM integration", "Prototyping"],
          rationale: "Already experimenting with generative-CAD plugins — a ready-made coalition to drive rollout.",
          matchScore: 80,
        },
        {
          id: "cd-fn-4",
          name: "Priya Nair",
          role: "Cybersecurity Lead (1LoD)",
          team: "Information Security",
          skills: ["Data classification", "IP protection", "Zero-retention / residency controls"],
          rationale: "Owns the controls needed to protect proprietary design data sent to a frontier model.",
          matchScore: 74,
        },
      ],
    },
    {
      id: "uc-src",
      function: "SRC retail network",
      description:
        "Multimodal field assistant for toko kelontong owners — point a phone camera at a shelf and ask, in local language, what to reorder and how to merchandise.",
      opportunities: ["Vision + voice storefront support in local languages", "Lower-literacy-friendly interface"],
      risks: ["Connectivity & on-device constraints", "Data across 250K+ diverse stores", "Per-interaction cost at scale"],
      benefitCost: "PoC ~$85–95K OPEX across pilot stores; benefit via reduced stockouts.",
      timeline: "6–9 month PoC.",
      projectClashes: ["Coordinate with existing SRC digitization programmes."],
    },
  ],
  recommendedUseCaseId: "uc-eppm-copilot",
  recommendationRationale:
    "A long-context, retrieval-grounded ePPM knowledge copilot — highest strategic fit (consolidates Jarvis + the RAG PoC onto one governed model), clear productivity benefit, and a contained blast radius when kept advisory and citation-grounded.",
  impactLayers: [
    {
      layer: "enterprise",
      restructuringFlag: true,
      content:
        "Needs a frontier-model governance model — a single model gateway, data-classification policy for what may leave the tenancy, evaluation/monitoring and FinOps for token spend. Light restructuring likely: a central 'AI Platform / Model Ops' function that owns the shared model layer.",
      detail: {
        headline: "A frontier-model governance & platform layer",
        magnitude: "high",
        effort: "high",
        timeframe: "6–18 mo",
        effects: [
          "Stand up a central AI Platform / Model Ops ownership function",
          "One governed model gateway rather than many point tools",
          "Data-classification policy for what may leave the tenancy",
          "FinOps for token spend + evaluation & drift monitoring",
        ],
        watchouts: ["Vendor lock-in to one frontier provider", "Model-version changes altering behaviour"],
        metrics: [
          { label: "New function", value: "Model Ops" },
          { label: "Governance", value: "Gateway + evals" },
        ],
      },
    },
    {
      layer: "domain",
      content:
        "Retrieval-grounding to control hallucination, PII redaction and data-residency controls, prompt/response logging and evaluation harnesses. Solution patterns: RAG over long context, private/in-region deployment, prompt caching for cost.",
      detail: {
        headline: "Grounding, data controls & evaluation harnesses",
        magnitude: "high",
        effort: "moderate",
        timeframe: "3–9 mo",
        effects: [
          "RAG grounding with citation-to-source linking",
          "PII redaction + data-residency / zero-retention controls",
          "Prompt/response logging and automated eval harnesses",
          "Prompt caching & retrieval to contain token cost",
        ],
        watchouts: ["1LoD security + DPIA engagement is mandatory", "Grounding quality drives trust"],
        metrics: [
          { label: "Pattern", value: "RAG + long context" },
          { label: "Hosting", value: "Private / in-region" },
        ],
      },
    },
    {
      layer: "individual",
      content:
        "Shift from searching and drafting from scratch to prompting, verifying and editing AI output — with new habits around checking citations and knowing when not to trust the model.",
      detail: {
        headline: "From drafting to prompting, verifying & editing",
        magnitude: "moderate",
        effort: "moderate",
        timeframe: "Ongoing",
        effects: [
          "Prompt-craft and grounded-question habits",
          "Verifying citations before relying on an answer",
          "Knowing the model's limits — when not to trust output",
        ],
        watchouts: ["Trust calibration & over-reliance", "Skill atrophy on core drafting"],
        metrics: [{ label: "Role shift", value: "Author → editor" }],
      },
    },
  ],
  readiness: [
    { id: "r-1", type: "skill", role: "Solution Architect", description: "RAG / long-context design, model gateway & grounding architecture" },
    { id: "r-2", type: "skill", role: "Project Manager", description: "Prompt-craft, human-in-the-loop review & output verification" },
    { id: "r-3", type: "certification", role: "Innovation Lead", description: "Cloud/AI practitioner (e.g. AWS AI Practitioner)" },
    { id: "r-4", type: "certification", role: "Enterprise / Governance Architect", description: "Responsible-AI governance & frontier-model risk" },
    { id: "r-5", type: "training", role: "People & Culture / L&D", description: "AI-literacy: prompting, verifying citations & knowing model limits" },
  ],
  cascade: [
    { targetRole: "Project Manager (PM)", actionText: "Draft PoC plan + success criteria for the ePPM knowledge copilot", layerOrigin: "Adoption Path" },
    { targetRole: "Solution Architect", actionText: "Design the model gateway + RAG grounding architecture and citation layer", layerOrigin: "Domain layer" },
    { targetRole: "Security / 1LoD", actionText: "Define data-classification gating, PII redaction and logging before calls leave the tenancy", layerOrigin: "Domain layer" },
    { targetRole: "Data Privacy Manager", actionText: "Run a DPIA; agree zero-retention / no-training terms and residency", layerOrigin: "Domain layer" },
    { targetRole: "Finance / IT Finance", actionText: "Model PoC token cost + PM-hours-saved benefit; set FinOps budgets", layerOrigin: "Enterprise layer" },
    { targetRole: "People & Culture / L&D", actionText: "Build AI-literacy upskilling (prompting, verifying, model limits)", layerOrigin: "Individual layer" },
  ],
  seedFundingIndicative: "$70–100K OPEX",
  pocSuccessCriteria: [
    "Gate-document drafting time reduced by target %",
    "Zero un-cited claims in filed gate documents",
    "PM satisfaction with grounded answers above threshold",
  ],
  pocKpis: [
    { label: "Gate-doc drafting time saved", target: "≥ 30%" },
    { label: "Answer grounding / citation rate", target: "≥ 95%" },
    { label: "Projects piloted", target: "N live projects" },
  ],
  g0Pack: [
    { id: "g0-value", title: "Benefit / Value Hypothesis", draft: "A grounded ePPM copilot reduces gate-document drafting time by X% while keeping every claim cited to a source." },
    { id: "g0-experiment", title: "Experiment Definition (PoC/MVP)", draft: "PoC on N live projects using retrieval-grounded answers only; measure hours saved and citation rate over 6 months." },
    { id: "g0-objectives", title: "Objectives & Key Deliverables", draft: "Stand up the model gateway + RAG grounding; integrate ePPM read APIs; deliver a copilot that drafts 3 gate documents with citations." },
    { id: "g0-financials", title: "Indicative Financials", draft: "Initiation + execution estimate ~$70–100K OPEX; benefit via PM hours saved + faster, better-grounded gate cycles." },
    { id: "g0-timeline", title: "Timeline & Milestones", draft: "6-month PoC → G3, with monthly checkpoints and a G1/G2 review midway." },
    { id: "g0-risk", title: "Risk Assessment", draft: "High-attention — hallucination and data-residency are the primary risks; both contained via grounding + private deployment." },
    { id: "g0-tech", title: "Technology & Architecture", draft: "Single governed model gateway; RAG over long context; buy-vs-build (extend Jarvis/RAG PoC vs. new build); prompt caching for cost." },
    { id: "g0-security", title: "Initial Cybersecurity Assessment", draft: "Engage 1LoD — data-classification gating, PII redaction and per-request logging before calls leave the tenancy." },
    { id: "g0-privacy", title: "Data Privacy (high-level)", draft: "Classify ePPM data the copilot reads; DPIA required; agree zero-retention / no-training-on-data terms and in-region residency." },
  ],
  g3Pack: [
    { id: "g3-outcome", title: "Outcome (why invest?)", draft: "PoC validated grounded drafting time savings with a ≥95% citation rate, justifying a portfolio-wide pilot on a governed model layer." },
    { id: "g3-deliverables", title: "Key Deliverables", draft: "Production ePPM copilot, shared model gateway, grounding/eval harness, Model Ops runbook and rollout plan." },
    { id: "g3-financials", title: "Advanced Financials", draft: "Indicative NPV positive over 3 years once tool-consolidation savings are counted; Payback ~18 months; benefit split productivity + licensing consolidation." },
    { id: "g3-benefits", title: "Benefits", draft: "Productivity (PM hours saved), foundation (reusable model layer), cost (consolidating narrow tools), risk-reduction (fewer un-grounded claims)." },
    { id: "g3-tech", title: "Technology & Architecture", draft: "Matured Solution Outline, hosting decision (private/in-region), app-portfolio impact, ARB notes, final buy-vs-build and provider strategy." },
    { id: "g3-impact", title: "Impact Assessments", draft: "1LoD/2LoD security sign-off + DPIA status (residency, retention) carried from the PoC." },
    { id: "g3-steerco", title: "SteerCo Stakeholder Agreement", draft: "Draft Project Stakeholder Agreement for signature by portfolio + platform/eng leadership." },
    { id: "g3-decision", title: "DISD G3 Decision Sheet", draft: "Draft decision sheet to be linked in ePPM for the DISD funding decision." },
  ],
};

// ─── Exports ─────────────────────────────────────────────────────────────────

/** The seeded journeys, in library display order (FR-2.2). */
export const VISION_JOURNEYS: Journey[] = [
  AGENTIC_AI,
  PHYSICAL_AI,
  WICKED_INTELLIGENCE,
  GPT_6_ASTRA,
];

/** Look up a journey by id. */
export function getJourney(id: string): Journey | undefined {
  return VISION_JOURNEYS.find((j) => j.id === id);
}

/**
 * The use case the downstream lifecycle is grounded in — the idea's primary
 * (top) candidate, falling back to the journey's recommended one. Used by the
 * Impact and Human Readiness steps so their content matches the chosen use case.
 */
export function primaryUseCase(journey: Journey, idea?: Pick<VisionIdea, "selectedUseCaseId">): UseCase | undefined {
  const id = idea?.selectedUseCaseId ?? journey.recommendedUseCaseId;
  return journey.useCases.find((u) => u.id === id) ?? journey.useCases.find((u) => u.id === journey.recommendedUseCaseId);
}

/**
 * Match free-text chatbot input against the seed library (FR-3.2). Returns the
 * best-matching journey, or null when nothing seeded is recognised (FR-3.4).
 */
export function matchJourney(input: string): Journey | null {
  const text = input.toLowerCase();
  let best: { journey: Journey; score: number } | null = null;
  for (const journey of VISION_JOURNEYS) {
    let score = 0;
    if (text.includes(journey.techName.toLowerCase())) score += 3;
    if (journey.sourceUrl && text.includes(journey.sourceUrl.toLowerCase())) score += 5;
    for (const kw of journey.matchKeywords) {
      if (text.includes(kw)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { journey, score };
  }
  return best ? best.journey : null;
}

/**
 * Pick a seeded journey by scanning the prompt for the three seed tech names
 * ("Agentic AI", "Physical AI", "Wicked Intelligence"), case-insensitively.
 * The *first* one that appears in the text (by position) wins — so the earliest
 * keyword in what the user pasted decides which pre-seeded article we use. Falls
 * back to the broader keyword scorer when none of the three names appear.
 */
export function matchJourneyByPrompt(input: string): Journey | null {
  const text = input.toLowerCase();
  let earliest: { journey: Journey; index: number } | null = null;
  for (const journey of VISION_JOURNEYS) {
    const index = text.indexOf(journey.techName.toLowerCase());
    if (index === -1) continue;
    if (!earliest || index < earliest.index) earliest = { journey, index };
  }
  if (earliest) return earliest.journey;
  // Nothing matched the three names directly — fall back to keyword scoring.
  return matchJourney(input);
}

/**
 * Recommended "change drivers" per journey — people/teams who already have the
 * relevant experience and could lead adoption. Surfaced by the Human Readiness
 * finder after a short (mock) org-wide scan. Illustrative demo data only.
 */
export const CHANGE_DRIVERS: Record<string, ChangeDriver[]> = {
  "agentic-ai": [
    {
      id: "cd-agentic-1",
      name: "Maya Rahardjo",
      role: "Principal Solution Architect",
      team: "Platform Engineering",
      skills: ["Agent orchestration", "LLM tooling", "Guardrail design", "Platypus platform"],
      rationale: "Led the Platypus orchestration layer — the natural owner for an agentic ePPM extension.",
      matchScore: 95,
    },
    {
      id: "cd-agentic-2",
      name: "Daniel Okafor",
      role: "Senior Project Manager",
      team: "Project Management Excellence (ePPM)",
      skills: ["Human-in-the-loop review", "Gate documentation", "Change management"],
      rationale: "Runs G-gate reviews today; strongest fit to shape reward/goal design and adoption.",
      matchScore: 88,
    },
    {
      id: "cd-agentic-3",
      name: "Innovation & AI Guild",
      role: "Cross-functional community of practice",
      team: "Enterprise Architecture",
      isTeam: true,
      members: [
        { name: "Lena Fischer", role: "Guild Lead / Enterprise Architect" },
        { name: "Arjun Desai", role: "Responsible-AI Governance Specialist" },
        { name: "Chloe Bernard", role: "Prompt & Agent Patterns SME" },
        { name: "Marcus Webb", role: "PoC Facilitation Coach" },
        { name: "Yuki Tanaka", role: "ML Engineer / Community Contributor" },
      ],
      skills: ["Responsible-AI governance", "Prompt/agent patterns", "PoC facilitation"],
      rationale: "Already piloting internal AI assistants — a ready-made coalition to drive rollout.",
      matchScore: 82,
    },
    {
      id: "cd-agentic-4",
      name: "Priya Nair",
      role: "Cybersecurity Lead (1LoD)",
      team: "Information Security",
      skills: ["Per-agent identity", "API permissioning", "Audit logging"],
      rationale: "Owns machine-identity standards needed to let agents act safely on systems of record.",
      matchScore: 76,
    },
  ],
  "physical-ai": [
    {
      id: "cd-physical-1",
      name: "Ökan Yilmaz",
      role: "Robotics & Simulation Lead",
      team: "Manufacturing Technology",
      skills: ["Digital twins", "Reinforcement learning", "Sim-to-real transfer"],
      rationale: "Built the first line-level digital twin PoC — the clearest driver for predictive maintenance.",
      matchScore: 93,
    },
    {
      id: "cd-physical-2",
      name: "Sofia Marchetti",
      role: "Operations Safety Manager",
      team: "Plant Operations",
      skills: ["Industrial safety", "OT security", "Constrained real-world piloting"],
      rationale: "Certifies floor-level automation; essential to run a safe constrained pilot.",
      matchScore: 84,
    },
    {
      id: "cd-physical-3",
      name: "Edge & IoT Platform Team",
      role: "Sensor / edge infrastructure",
      team: "Supply Chain Technology",
      isTeam: true,
      members: [
        { name: "Diego Ramos", role: "Edge Platform Lead" },
        { name: "Ingrid Larsen", role: "Sensor Integration Engineer" },
        { name: "Kwame Mensah", role: "Telemetry / Data Pipeline Engineer" },
        { name: "Sara Kim", role: "Edge Reliability Engineer" },
      ],
      skills: ["Edge compute", "Sensor integration", "Telemetry pipelines"],
      rationale: "Maintains the plant sensor mesh the twin would learn from.",
      matchScore: 79,
    },
    {
      id: "cd-physical-4",
      name: "Rahul Menon",
      role: "Capital Projects Finance Partner",
      team: "IT Finance",
      skills: ["Capex modelling", "Downtime-cost analysis", "Benefit realisation"],
      rationale: "Best placed to build the capex-heavy business case for the robotics PoC.",
      matchScore: 71,
    },
  ],
  "wicked-intelligence": [
    {
      id: "cd-wicked-1",
      name: "Amara Bright",
      role: "Head of Portfolio Strategy",
      team: "Strategy & Portfolio",
      skills: ["Systems thinking", "Problem framing", "Investment prioritisation"],
      rationale: "Owns cross-portfolio prioritisation — ideal to lead wicked-problem triage.",
      matchScore: 91,
    },
    {
      id: "cd-wicked-2",
      name: "Tomás Guerrero",
      role: "Innovation Lead / Explorer",
      team: "Innovation Office",
      skills: ["#unthink/#unask/#unlearn facilitation", "Design thinking", "Hypothesis design"],
      rationale: "Already facilitates reframing workshops — a ready driver for the framing method.",
      matchScore: 86,
    },
    {
      id: "cd-wicked-3",
      name: "Decision Science Guild",
      role: "Analytics community of practice",
      team: "Data & Analytics",
      isTeam: true,
      members: [
        { name: "Nadia Haddad", role: "Guild Lead / Decision Scientist" },
        { name: "Oliver Grant", role: "Optimisation Modeller" },
        { name: "Fatima Zahra", role: "Scenario & Simulation Analyst" },
        { name: "Ben Carter", role: "Value-Hypothesis Analyst" },
      ],
      skills: ["Multi-objective optimisation", "Scenario modelling", "Value hypotheses"],
      rationale: "Can pressure-test framed problems and estimate expected value.",
      matchScore: 78,
    },
  ],
  "gpt-6-astra": [
    {
      id: "cd-astra-1",
      name: "Maya Rahardjo",
      role: "Principal Solution Architect",
      team: "Platform Engineering",
      skills: ["Model gateway design", "RAG / long-context", "LLM tooling", "Grounding & evals"],
      rationale: "Owns the Jarvis model gateway and the RAG PoC — the natural owner for a shared frontier-model layer.",
      matchScore: 94,
    },
    {
      id: "cd-astra-2",
      name: "Daniel Okafor",
      role: "Senior Project Manager",
      team: "Project Management Excellence (ePPM)",
      skills: ["Gate documentation", "Human-in-the-loop review", "Prompt-craft"],
      rationale: "Runs G-gate reviews today; strongest fit to shape and validate a grounded ePPM copilot.",
      matchScore: 87,
    },
    {
      id: "cd-astra-3",
      name: "Innovation & AI Guild",
      role: "Cross-functional community of practice",
      team: "Enterprise Architecture",
      isTeam: true,
      members: [
        { name: "Lena Fischer", role: "Guild Lead / Enterprise Architect" },
        { name: "Arjun Desai", role: "Responsible-AI Governance Specialist" },
        { name: "Chloe Bernard", role: "Prompt & RAG Patterns SME" },
        { name: "Marcus Webb", role: "PoC Facilitation Coach" },
        { name: "Yuki Tanaka", role: "ML Engineer / Evaluation Contributor" },
      ],
      skills: ["Responsible-AI governance", "Prompt / RAG patterns", "Model evaluation"],
      rationale: "Already piloting internal AI assistants — a ready-made coalition to drive rollout and evals.",
      matchScore: 83,
    },
    {
      id: "cd-astra-4",
      name: "Priya Nair",
      role: "Cybersecurity Lead (1LoD)",
      team: "Information Security",
      skills: ["Data classification", "PII redaction", "Zero-retention / residency controls"],
      rationale: "Owns the data-handling standards needed to send portfolio data to a frontier model safely.",
      matchScore: 77,
    },
  ],
};

/** Look up recommended change drivers for a journey (mock org scan). */
export function getChangeDrivers(journeyId: string): ChangeDriver[] {
  return CHANGE_DRIVERS[journeyId] ?? [];
}

/**
 * Base URL for the (simulated) enterprise Project & Portfolio Management system
 * (ePPM). Per PMI ITPM guidance, a candidate that passes G0 is recorded in
 * ePPM by the Portfolio Manager — this is where the seed-fund release and gate
 * decision are logged. This link is illustrative for the prototype.
 */
export const EPPM_BASE_URL = "https://eppm.pmi.example/portfolio/new";

/** Build a pre-filled (simulated) ePPM new-entry link for a G0-approved candidate. */
export function eppmEntryUrl(techName: string, useCaseFunction: string): string {
  const params = new URLSearchParams({
    source: "JARVISION",
    tech: techName,
    function: useCaseFunction,
    gate: "G0",
  });
  return `${EPPM_BASE_URL}?${params.toString()}`;
}

/** Scripted proactive trend nudges surfaced in Jarvis (FR-13.1). */
export const VISION_TRENDS: TrendNotification[] = [
  {
    id: "trend-agentic",
    journeyId: "agentic-ai",
    techName: "Agentic AI",
    message: "There's a new technology — Agentic AI. Want to simulate its adoption?",
  },
  {
    id: "trend-physical",
    journeyId: "physical-ai",
    techName: "Physical AI",
    message: "Physical AI is trending — want to explore where it fits in PMI?",
  },
  {
    id: "trend-astra",
    journeyId: "gpt-6-astra",
    techName: "GPT-6 Astra",
    message: "GPT-6 Astra just dropped — want to simulate adopting a frontier model at PMI?",
  },
];
