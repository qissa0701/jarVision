// Seed-Funding Release, PoC Kickoff & Execution Tracking (FR-10, FR-11).
//
// Only reachable once a human "Go" was recorded at G0 (enforced by the hook:
// stage === "poc" and seedFunding !== null). Shows the simulated seed-funding
// release (always labelled indicative), the auto-populated PoC charter, success
// criteria / KPIs, the optional PM-managed G1/G2 checkpoints, a G3-readiness
// meter, and the PoC outcome capture that feeds the G3 business case.

import { Banknote, ChevronRight, FlaskConical, Gauge, Rocket, Target } from "lucide-react";
import type { Journey, PoCOutcome, VisionIdea } from "@/types/vision";
import { computeG3Readiness } from "@/hooks/useVisionStudio";
import { VisionSection, VisionButton, IndicativeBadge, StageBadge } from "./visionUi";

export interface PoCTrackingViewProps {
  journey: Journey;
  idea: VisionIdea;
  onAdvanceStage: (stage: "G1" | "G2") => void;
  onRecordOutcome: (outcome: PoCOutcome) => void;
  onContinueToG3: () => void;
}

const OUTCOME_META: Record<PoCOutcome, { label: string; tone: "green" | "amber" | "red" }> = {
  proven: { label: "Hypothesis proven", tone: "green" },
  partial: { label: "Partially proven", tone: "amber" },
  rejected: { label: "Hypothesis rejected", tone: "red" },
};

export function PoCTrackingView({
  journey,
  idea,
  onAdvanceStage,
  onRecordOutcome,
  onContinueToG3,
}: PoCTrackingViewProps) {
  const readiness = computeG3Readiness(idea);
  const selectedUseCase =
    journey.useCases.find((u) => u.id === (idea.selectedUseCaseId ?? journey.recommendedUseCaseId)) ??
    journey.useCases[0];

  return (
    <div className="space-y-4">
      {/* Seed funding + kickoff (FR-10) */}
      <VisionSection
        title="Seed funding & PoC kickoff"
        description="Recorded only after the human G0 'Go'. Now tracked as a project, not just an idea."
        icon={<Rocket className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />}
        right={<StageBadge label={`Active PoC · ${idea.pocStage}`} tone="indigo" />}
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Banknote className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold text-foreground">Seed-funding release</span>
          <IndicativeBadge>{idea.seedFunding?.amountIndicative ?? journey.seedFundingIndicative}</IndicativeBadge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
          PMI allows up to ~$100K OPEX seed funding for a PoC/MVP, released by DISD before G3. This
          figure is simulated — not a financial commitment.
        </p>

        {/* PoC charter (FR-10.3) */}
        <div className="rounded-xl bg-muted p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            PoC charter (auto-populated from the Readiness Pack)
          </p>
          <p className="text-sm font-semibold text-foreground">{journey.techName} — {selectedUseCase.function}</p>
          <ul className="mt-2 space-y-1">
            {journey.pocSuccessCriteria.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <Target className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </VisionSection>

      {/* KPI tracking (FR-11.1) */}
      <VisionSection
        title="Track against success criteria"
        description="Is the experiment proving or rejecting the benefit hypothesis?"
        icon={<Gauge className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />}
      >
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {journey.pocKpis.map((k, i) => (
            <li key={i} className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="text-sm font-bold text-foreground mt-1">{k.target}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">target</p>
            </li>
          ))}
        </ul>
      </VisionSection>

      {/* Optional G1/G2 checkpoints (FR-11.2) + G3-readiness meter (FR-11.4) */}
      <VisionSection
        title="Stage-gate progress"
        description="G1 (Experience Design) and G2 (Market Alignment) are optional, PM-managed checkpoints."
        icon={<FlaskConical className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          <CheckpointButton
            label="Advance to G1 (Experience Design)"
            done={idea.completedG1}
            onClick={() => onAdvanceStage("G1")}
          />
          <CheckpointButton
            label="Advance to G2 (Market Alignment)"
            done={idea.completedG2}
            disabled={!idea.completedG1}
            onClick={() => onAdvanceStage("G2")}
          />
        </div>

        {/* G3-readiness meter */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-muted-foreground">G3-readiness</span>
            <span className="text-[11px] font-bold text-foreground">{readiness}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
              style={{ width: `${readiness}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Interim outputs (architecture, 1LoD/2LoD & DPIA impact, sourcing notes) are captured as G3
            inputs during execution.
          </p>
        </div>

        {/* PoC outcome (FR-11.5) */}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Record PoC outcome
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(OUTCOME_META) as PoCOutcome[]).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onRecordOutcome(o)}
              aria-pressed={idea.pocOutcome === o}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                idea.pocOutcome === o
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {OUTCOME_META[o].label}
            </button>
          ))}
        </div>
        {idea.pocOutcome && (
          <div className="mt-2">
            <StageBadge label={`Outcome: ${OUTCOME_META[idea.pocOutcome].label}`} tone={OUTCOME_META[idea.pocOutcome].tone} />
          </div>
        )}
      </VisionSection>

      {idea.pocOutcome && (
        <div className="flex justify-end">
          <VisionButton onClick={onContinueToG3}>
            Assemble G3 Business Case
            <ChevronRight className="w-3.5 h-3.5" />
          </VisionButton>
        </div>
      )}
    </div>
  );
}

function CheckpointButton({
  label,
  done,
  disabled,
  onClick,
}: {
  label: string;
  done: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || done}
      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors disabled:cursor-not-allowed ${
        done
          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/25"
          : disabled
          ? "bg-muted text-muted-foreground border-border opacity-60"
          : "bg-card text-foreground border-border hover:bg-muted"
      }`}
    >
      {done ? "✓ " : ""}
      {label}
    </button>
  );
}
