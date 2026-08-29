// VISION Studio — pre-scripted seed journeys (Appendix A of the FRD).
//
// The demo ships with exactly three canned journeys, one per seed article.
// Each is a complete, deterministic walkthrough: source → adoption path
// (functions → use cases → evaluation) → multi-layer impact → human readiness
// → recommended candidate → example cascade → G0 & G3 Readiness Pack drafts.
// All figures are illustrative for demo purposes — there is no live LLM.

import type { Journey, TrendNotification } from "@/types/vision";

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
    },
    {
      layer: "domain",
      content:
        "Agent identity & access control (per-agent identity), API/tool permissioning, audit logging. Solution patterns: conductor-and-workers vs. decentralized agents depending on workflow.",
    },
    {
      layer: "individual",
      content:
        "Shift from 'doing tasks' to 'supervising agents' — humans define goals and review outputs.",
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
    },
    {
      layer: "domain",
      content:
        "OT/physical safety, sensor/edge security, digital-twin data integrity. Solution patterns: hybrid control (simple algorithms for stability + learning models for perception/decision), world foundation models, domain randomization.",
    },
    {
      layer: "individual",
      content:
        "New operational + safety competencies; simulation/robotics literacy for engineers and floor staff.",
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
    },
    {
      layer: "domain",
      content:
        "Depends on the chosen problem; solution = a repeatable problem-framing method (#unthink/#unask/#unlearn) rather than a fixed tech stack.",
    },
    {
      layer: "individual",
      content:
        "Curiosity, critical thinking, problem reframing, 'unlearning' assumptions — the human capability Voegele highlights.",
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

// ─── Exports ─────────────────────────────────────────────────────────────────

/** The three seeded journeys, in library display order (FR-2.2). */
export const VISION_JOURNEYS: Journey[] = [
  AGENTIC_AI,
  PHYSICAL_AI,
  WICKED_INTELLIGENCE,
];

/** Look up a journey by id. */
export function getJourney(id: string): Journey | undefined {
  return VISION_JOURNEYS.find((j) => j.id === id);
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
];
