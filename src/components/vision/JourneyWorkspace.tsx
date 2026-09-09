// JourneyWorkspace — the per-idea lifecycle workspace (the "exploring" page).
//
// Walks a single idea through JARVISION's orchestrated pre-G0 arc:
// Adoption Path → Multi-layer Impact → Human Readiness → Approve & Cascade →
// G0 Readiness Pack → ePPM Entry. JARVISION orchestrates specialized agents
// (through NEXUS) to produce each step — the "thinking" gate shown on entry to
// a step narrates which agents are being called and aggregated. A left rail
// lets the user move between steps; later steps stay locked until their
// preconditions are met. The rail also has an "Agent Network" view: a session
// log of which agents were used to explore *this* tech, plus the network.

import { useState } from "react";
import { ArrowLeft, Lock, Network } from "lucide-react";
import type { Journey, VisionIdea } from "@/types/vision";
import type { VisionStudio } from "@/hooks/useVisionStudio";
import {
  orchestrationFor,
  SECTION_LABELS,
  SECTION_ORDER,
  type JourneySection,
} from "@/data/agentNetwork";
import { AdoptionPathView } from "./AdoptionPathView";
import { ImpactLayersView } from "./ImpactLayersView";
import { HumanReadinessView } from "./HumanReadinessView";
import { CascadeView } from "./CascadeView";
import { ReadinessPackView } from "./ReadinessPackView";
import { EppmEntryView } from "./EppmEntryView";
import { AgentNetworkPanel } from "./AgentNetworkPanel";
import { StepThinking } from "./StepThinking";

type SectionKey = JourneySection;
/** Rail targets: a journey step, or the meta "Agent Network" view. */
type RailKey = SectionKey | "network";

export interface JourneyWorkspaceProps {
  journey: Journey;
  idea: VisionIdea;
  vision: VisionStudio;
  onBackToHome: () => void;
}

export function JourneyWorkspace({ journey, idea, vision, onBackToHome }: JourneyWorkspaceProps) {
  const [view, setView] = useState<RailKey>("adoption");
  // Steps explored this session (order of first open) — drives the agent log.
  const [visited, setVisited] = useState<SectionKey[]>(["adoption"]);

  // Which steps are reachable given the idea's progress. The arc now ends at
  // the ePPM entry (unlocked once the G0 pack has been assembled).
  const unlocked: Record<SectionKey, boolean> = {
    adoption: true,
    impact: true,
    readiness: true,
    cascade: true,
    g0pack: idea.cascadeItemIds.length > 0,
    eppm: idea.g0PackGenerated,
  };

  const openSection = (s: SectionKey) => {
    setView(s);
    setVisited((prev) => (prev.includes(s) ? prev : [...prev, s]));
  };
  const go = openSection;

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
            const active = view === s;
            return (
              <button
                key={s}
                type="button"
                disabled={!isUnlocked}
                onClick={() => isUnlocked && openSection(s)}
                aria-current={active ? "true" : undefined}
                className={`w-full flex items-center justify-between gap-2 text-left text-[12px] px-2.5 py-2 rounded-lg font-medium transition-colors ${
                  active
                    ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold"
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

        {/* Agent Network — session log of agents used to explore this tech. */}
        <div className="rounded-2xl border border-border bg-card p-2 mt-2">
          <button
            type="button"
            onClick={() => setView("network")}
            aria-current={view === "network" ? "true" : undefined}
            className={`w-full flex items-center gap-2 text-left text-[12px] px-2.5 py-2 rounded-lg font-medium transition-colors ${
              view === "network"
                ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Network className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Agent Network</span>
          </button>
        </div>
      </nav>

      {/* Section content */}
      <div className="flex-1 min-w-0">
        {view === "network" ? (
          <AgentNetworkPanel journey={journey} visited={visited} />
        ) : (
          <StepThinking
            key={view}
            steps={orchestrationFor(view, journey)}
            title="JARVISION · orchestrating agents"
          >
            {view === "adoption" && (
              <AdoptionPathView
                journey={journey}
                idea={idea}
                onPositionFunction={(fn) => vision.positionFunction(idea.id, fn)}
                onToggleUseCase={(uc) => vision.toggleUseCase(idea.id, uc)}
                onSetPrimaryUseCase={(uc) => vision.setPrimaryUseCase(idea.id, uc)}
                onContinue={() => go("impact")}
              />
            )}
            {view === "impact" && (
              <ImpactLayersView journey={journey} idea={idea} onContinue={() => go("readiness")} />
            )}
            {view === "readiness" && (
              <HumanReadinessView journey={journey} idea={idea} onContinue={() => go("cascade")} />
            )}
            {view === "cascade" && (
              <CascadeView
                journey={journey}
                idea={idea}
                cascadeItems={vision.cascadeForIdea(idea.id)}
                onApproveAndCascade={() => vision.approveAndCascade(idea.id)}
                onContinue={() => go("g0pack")}
              />
            )}
            {view === "g0pack" && (
              <ReadinessPackView
                gate="G0"
                journey={journey}
                idea={idea}
                generated={idea.g0PackGenerated}
                onGenerate={() => vision.submitForG0(idea.id)}
                onSubmitForDecision={() => go("eppm")}
                submitLabel="Continue to ePPM entry"
              />
            )}
            {view === "eppm" && (
              <EppmEntryView journey={journey} idea={idea} onBackToHome={onBackToHome} />
            )}
          </StepThinking>
        )}
      </div>
    </div>
  );
}
