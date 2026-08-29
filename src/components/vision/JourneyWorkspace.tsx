// JourneyWorkspace — the per-idea lifecycle workspace.
//
// Walks a single idea through VISION's arc: Adoption Path → Impact → Human
// Readiness → Approve & Cascade → G0 Readiness Pack → G0 Decision → PoC
// tracking → G3 Business Case → G3 Decision → Complete. A left rail lets the
// user move between sections; later sections stay locked until their
// preconditions are met (e.g. PoC tracking is locked until a human G0 "Go").

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Lock, PartyPopper } from "lucide-react";
import type { Journey, GateDecisionKind, PoCOutcome, VisionIdea } from "@/types/vision";
import type { VisionStudio } from "@/hooks/useVisionStudio";
import { AdoptionPathView } from "./AdoptionPathView";
import { ImpactLayersView } from "./ImpactLayersView";
import { HumanReadinessView } from "./HumanReadinessView";
import { CascadeView } from "./CascadeView";
import { ReadinessPackView } from "./ReadinessPackView";
import { DecisionGateView } from "./DecisionGateView";
import { PoCTrackingView } from "./PoCTrackingView";
import { VisionSection, VisionButton, StageBadge } from "./visionUi";

type SectionKey =
  | "adoption"
  | "impact"
  | "readiness"
  | "cascade"
  | "g0pack"
  | "g0decision"
  | "poc"
  | "g3pack"
  | "g3decision"
  | "complete";

const SECTION_LABELS: Record<SectionKey, string> = {
  adoption: "1 · Adoption Path",
  impact: "2 · Multi-layer Impact",
  readiness: "3 · Human Readiness",
  cascade: "4 · Approve & Cascade",
  g0pack: "5 · G0 Readiness Pack",
  g0decision: "6 · G0 Decision",
  poc: "7 · Seed Funding & PoC",
  g3pack: "8 · G3 Business Case",
  g3decision: "9 · G3 Decision",
  complete: "10 · Complete",
};

const SECTION_ORDER: SectionKey[] = [
  "adoption", "impact", "readiness", "cascade", "g0pack",
  "g0decision", "poc", "g3pack", "g3decision", "complete",
];

export interface JourneyWorkspaceProps {
  journey: Journey;
  idea: VisionIdea;
  vision: VisionStudio;
  onBackToHome: () => void;
}

export function JourneyWorkspace({ journey, idea, vision, onBackToHome }: JourneyWorkspaceProps) {
  const [section, setSection] = useState<SectionKey>("adoption");

  const g0Decision = idea.g0DecisionId
    ? vision.decisions.find((d) => d.id === idea.g0DecisionId)
    : undefined;
  const g3Decision = idea.g3DecisionId
    ? vision.decisions.find((d) => d.id === idea.g3DecisionId)
    : undefined;

  // Which sections are reachable given the idea's progress.
  const unlocked: Record<SectionKey, boolean> = {
    adoption: true,
    impact: true,
    readiness: true,
    cascade: true,
    g0pack: idea.cascadeItemIds.length > 0,
    g0decision: idea.g0PackGenerated,
    poc: idea.seedFunding !== null,
    g3pack: idea.pocOutcome !== null,
    g3decision: idea.g3PackGenerated,
    complete: idea.stage === "complete",
  };

  const go = (s: SectionKey) => setSection(s);

  const recordDecision = (
    gate: "G0" | "G3",
    d: GateDecisionKind,
    maker: string,
    rationale: string,
  ) => {
    vision.recordGateDecision(idea.id, gate, d, maker, rationale);
    // Route the user to the sensible next place based on the decision.
    if (gate === "G0" && d === "go") go("poc");
    else if (gate === "G0" && d === "rework") go("cascade");
    else if (gate === "G3" && d === "go") go("complete");
    else if (gate === "G3" && d === "pivot") go("poc");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Section rail */}
      <nav aria-label="Journey sections" className="lg:w-56 flex-shrink-0">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All ideas
        </button>
        <div className="rounded-2xl border border-border bg-card p-2 space-y-0.5">
          {SECTION_ORDER.map((s) => {
            const isUnlocked = unlocked[s];
            const active = section === s;
            return (
              <button
                key={s}
                type="button"
                disabled={!isUnlocked}
                onClick={() => isUnlocked && setSection(s)}
                aria-current={active ? "true" : undefined}
                className={`w-full flex items-center justify-between gap-2 text-left text-[12px] px-2.5 py-2 rounded-lg font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : isUnlocked
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground/50 cursor-not-allowed"
                }`}
              >
                <span className="truncate">{SECTION_LABELS[s]}</span>
                {!isUnlocked && <Lock className="w-3 h-3 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Section content */}
      <div className="flex-1 min-w-0">
        {section === "adoption" && (
          <AdoptionPathView
            journey={journey}
            idea={idea}
            onPositionFunction={(fn) => vision.positionFunction(idea.id, fn)}
            onSelectUseCase={(uc) => vision.selectUseCase(idea.id, uc)}
            onContinue={() => go("impact")}
          />
        )}
        {section === "impact" && (
          <ImpactLayersView journey={journey} onContinue={() => go("readiness")} />
        )}
        {section === "readiness" && (
          <HumanReadinessView journey={journey} onContinue={() => go("cascade")} />
        )}
        {section === "cascade" && (
          <CascadeView
            journey={journey}
            idea={idea}
            cascadeItems={vision.cascadeForIdea(idea.id)}
            onApproveAndCascade={() => vision.approveAndCascade(idea.id)}
            onContinue={() => go("g0pack")}
          />
        )}
        {section === "g0pack" && (
          <ReadinessPackView
            gate="G0"
            journey={journey}
            generated={idea.g0PackGenerated}
            onGenerate={() => vision.submitForG0(idea.id)}
            onSubmitForDecision={() => go("g0decision")}
          />
        )}
        {section === "g0decision" && (
          <DecisionGateView
            gate="G0"
            journey={journey}
            idea={idea}
            decision={g0Decision}
            onRecordDecision={(d, maker, rationale) => recordDecision("G0", d, maker, rationale)}
          />
        )}
        {section === "poc" && (
          <PoCTrackingView
            journey={journey}
            idea={idea}
            onAdvanceStage={(stage) => vision.advancePoCStage(idea.id, stage)}
            onRecordOutcome={(o: PoCOutcome) => vision.recordPoCOutcome(idea.id, o)}
            onContinueToG3={() => go("g3pack")}
          />
        )}
        {section === "g3pack" && (
          <ReadinessPackView
            gate="G3"
            journey={journey}
            generated={idea.g3PackGenerated}
            onGenerate={() => vision.submitForG3(idea.id)}
            onSubmitForDecision={() => go("g3decision")}
          />
        )}
        {section === "g3decision" && (
          <DecisionGateView
            gate="G3"
            journey={journey}
            idea={idea}
            decision={g3Decision}
            onRecordDecision={(d, maker, rationale) => recordDecision("G3", d, maker, rationale)}
          />
        )}
        {section === "complete" && <CompletionView journey={journey} onBackToHome={onBackToHome} />}
      </div>
    </div>
  );
}

function CompletionView({ journey, onBackToHome }: { journey: Journey; onBackToHome: () => void }) {
  return (
    <VisionSection
      title="Business case approved — handed to delivery"
      description="VISION's arc stops at the G3 boundary. Everything from G4 onward (Build, Go-Live, Deployment) is owned by the delivery team / DISD."
      icon={<PartyPopper className="w-4 h-4 text-emerald-500" />}
      right={<StageBadge label="Complete" tone="green" />}
    >
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-400/20 p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
          <p className="text-sm font-semibold text-foreground">{journey.techName}</p>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Both human decision gates (G0 and G3) were recorded by a human. The seed-funded PoC produced
          the evidence for a G3 business case, and DISD approved the pilot. VISION never approved or
          funded anything — it prepared, simulated, and tracked; the humans decided.
        </p>
      </div>
      <div className="mt-4">
        <VisionButton variant="ghost" onClick={onBackToHome}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to VISION home
        </VisionButton>
      </div>
    </VisionSection>
  );
}
