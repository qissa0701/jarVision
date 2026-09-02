// Human decision gate (FR-9 for G0, FR-12 for G3).
//
// The hard human checkpoint: after the Readiness Pack is submitted, VISION
// presents a decision brief and STOPS. Nothing advances — and, at G0, no
// funding is released — until a human with authority records an explicit
// Go / No-go / Rework (G0) or Go / No-go / Pivot (G3) decision WITH a rationale.
// VISION never auto-approves; the recorded decision is written to the Decision
// Log with the decision-maker and timestamp.

import { useState } from "react";
import { ExternalLink, Gavel, Lock, ShieldAlert } from "lucide-react";
import type { Gate, GateDecision, GateDecisionKind, Journey, VisionIdea } from "@/types/vision";
import { eppmEntryUrl } from "@/data/visionJourneys";
import { VisionSection, VisionButton, StageBadge } from "./visionUi";

export interface DecisionGateViewProps {
  gate: Gate;
  journey: Journey;
  idea: VisionIdea;
  decision: GateDecision | undefined;
  onRecordDecision: (
    decision: GateDecisionKind,
    decisionMaker: string,
    rationale: string,
  ) => void;
}

const G0_OPTIONS: { kind: GateDecisionKind; label: string }[] = [
  { kind: "go", label: "Go" },
  { kind: "nogo", label: "No-go" },
  { kind: "rework", label: "Rework" },
];
const G3_OPTIONS: { kind: GateDecisionKind; label: string }[] = [
  { kind: "go", label: "Go" },
  { kind: "nogo", label: "No-go" },
  { kind: "pivot", label: "Pivot" },
];

const DECISION_TONE: Record<GateDecisionKind, "green" | "red" | "amber"> = {
  go: "green",
  nogo: "red",
  rework: "amber",
  pivot: "amber",
};

export function DecisionGateView({
  gate,
  journey,
  idea,
  decision,
  onRecordDecision,
}: DecisionGateViewProps) {
  const options = gate === "G0" ? G0_OPTIONS : G3_OPTIONS;
  const decider =
    gate === "G0" ? "DISD / AI Steering Committee" : "DISD (funding decision)";

  const [choice, setChoice] = useState<GateDecisionKind | null>(null);
  const [maker, setMaker] = useState("");
  const [rationale, setRationale] = useState("");

  const selectedUseCase =
    journey.useCases.find((u) => u.id === (idea.selectedUseCaseId ?? journey.recommendedUseCaseId)) ??
    journey.useCases[0];

  const canSubmit = choice !== null && maker.trim().length > 0 && rationale.trim().length > 0;

  if (decision) {
    return (
      <div className="space-y-4">
        <VisionSection
          title={`${gate} decision recorded`}
          description="This decision is logged to the auditable Decision Log."
          icon={<Gavel className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
          right={<StageBadge label={decision.decision.toUpperCase()} tone={DECISION_TONE[decision.decision]} />}
        >
          <dl className="space-y-2 text-xs">
            <Row label="Gate">{gate} — {gate === "G0" ? "Opportunity Definition" : "Business Case Approval"}</Row>
            <Row label="Decision">{decision.decision.toUpperCase()}</Row>
            <Row label="Decision-maker">{decision.decisionMaker}</Row>
            <Row label="Rationale">{decision.rationale}</Row>
            <Row label="Recorded">{new Date(decision.timestamp).toLocaleString()}</Row>
          </dl>
        </VisionSection>

        {gate === "G0" && decision.decision === "go" && (
          <EppmEntryCard journey={journey} useCaseFunction={selectedUseCase.function} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <VisionSection
        title={`${gate} decision — awaiting human Go / No-go`}
        description={`Decision authority: ${decider}. JARVISION prepares and presents; the human decides.`}
        icon={<ShieldAlert className="w-4 h-4 text-amber-500" />}
        right={<StageBadge label={`Awaiting ${gate} decision`} tone="amber" />}
      >
        {/* Decision brief summary */}
        <div className="rounded-xl bg-muted p-3 mb-4 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Decision brief</p>
          <p className="text-sm font-semibold text-foreground">
            {journey.techName} — {selectedUseCase.function}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {gate === "G0"
              ? `Value hypothesis, experiment, indicative financials (${journey.seedFundingIndicative}), risk, and tech approach are drafted in the G0 Readiness Pack.`
              : `PoC outcome: ${idea.pocOutcome ?? "n/a"}. Advanced financials (NPV/Payback), benefits, matured architecture, and the two mandatory artefacts are drafted in the G3 pack.`}
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-400/20 mb-4">
          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-300 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed">
            <span className="font-semibold">Hard gate.</span>{" "}
            {gate === "G0"
              ? "No seed funding is released and no PoC starts until a human records an explicit Go."
              : "Nothing enters execution until a human records an explicit Go."}{" "}
            JARVISION never auto-approves.
          </p>
        </div>

        {/* Decision form */}
        <fieldset className="space-y-3">
          <legend className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Record the {gate} decision
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <button
                key={o.kind}
                type="button"
                onClick={() => setChoice(o.kind)}
                aria-pressed={choice === o.kind}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                  choice === o.kind
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Decision-maker</span>
            <input
              type="text"
              value={maker}
              onChange={(e) => setMaker(e.target.value)}
              placeholder={decider}
              className="px-3 py-2 rounded-xl border border-border text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Rationale (required)</span>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              placeholder="Why this decision? Recorded to the Decision Log for auditability."
              className="px-3 py-2 rounded-xl border border-border text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30 resize-none"
            />
          </label>
          <div>
            <VisionButton
              disabled={!canSubmit}
              onClick={() => choice && onRecordDecision(choice, maker.trim(), rationale.trim())}
            >
              <Gavel className="w-3.5 h-3.5" />
              Record {gate} decision
            </VisionButton>
          </div>
        </fieldset>
      </VisionSection>
    </div>
  );
}

/**
 * Post-G0 ePPM entry (per PMI ITPM guidance). A candidate that passes G0 must
 * be recorded in ePPM — the exclusive system for the project portfolio — where
 * the Portfolio Manager confirms the G0 gate, the seed-fund release is logged,
 * and the G0 DISD Submission is uploaded to the Documents tab. This button
 * links to a pre-filled (simulated) ePPM new-entry.
 */
function EppmEntryCard({
  journey,
  useCaseFunction,
}: {
  journey: Journey;
  useCaseFunction: string;
}) {
  const url = eppmEntryUrl(journey.techName, useCaseFunction);
  return (
    <VisionSection
      title="Enter this project in ePPM"
      description="G0 passed — the candidate now needs an ePPM record. The Portfolio Manager confirms G0 there."
      icon={<ExternalLink className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
    >
      <div className="rounded-xl bg-muted p-3 mb-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          ePPM is PMI's exclusive system for the project portfolio — the project's "front page". Seed the
          minimum record (Details, Schedule, Benefits &amp; Costs, Risks, and the G0 DISD Submission in
          Documents) so the Portfolio Manager can confirm the G0 gate. Keeping ePPM updated is a
          prerequisite for every later mandatory gate.
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 text-white hover:from-blue-700 hover:to-blue-600 shadow-sm hover:shadow-md hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-400/40"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Create ePPM entry
      </a>
      <p className="text-[10px] text-muted-foreground mt-2">
        Simulated link · opens a pre-filled ePPM new-entry form in a new tab.
      </p>
    </VisionSection>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground flex-shrink-0">{label}</dt>
      <dd className="font-medium text-foreground text-right">{children}</dd>
    </div>
  );
}
