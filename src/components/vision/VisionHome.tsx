// VISION Studio Home (FR-2) — current ideas + emerging-tech library + new simulation.

import { ArrowRight, Lightbulb, MessageSquarePlus, Trash2 } from "lucide-react";
import type { JourneyStage, VisionIdea } from "@/types/vision";
import { VISION_JOURNEYS, getJourney } from "@/data/visionJourneys";
import type { VisionStudio } from "@/hooks/useVisionStudio";
import { VisionSection, VisionButton, StageBadge } from "./visionUi";

export interface VisionHomeProps {
  vision: VisionStudio;
  onOpenIdea: (ideaId: string) => void;
  onStartJourney: (journeyId: string) => void;
  onNewSimulation: () => void;
}

const STAGE_LABEL: Record<JourneyStage, { label: string; tone: "neutral" | "amber" | "green" | "red" | "blue" }> = {
  exploring: { label: "Exploring", tone: "neutral" },
  approved: { label: "Approved & cascaded", tone: "blue" },
  awaiting_g0: { label: "Awaiting G0 decision", tone: "amber" },
  poc: { label: "PoC in progress", tone: "blue" },
  awaiting_g3: { label: "Awaiting G3 decision", tone: "amber" },
  complete: { label: "Business case approved", tone: "green" },
  rejected: { label: "No-go", tone: "red" },
};

export function VisionHome({ vision, onOpenIdea, onStartJourney, onNewSimulation }: VisionHomeProps) {
  const ideas = vision.ideas;

  return (
    <div className="space-y-4">
      {/* Intro / new simulation */}
      <VisionSection
        title="Emerging Tech Adoption Simulator"
        description="Curiosity that takes the right action — explore, simulate, and shepherd a technology through PMI's human-gated pre-G0 → G3 lifecycle."
        icon={<Lightbulb className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
        right={
          <VisionButton onClick={onNewSimulation}>
            <MessageSquarePlus className="w-3.5 h-3.5" />
            New simulation
          </VisionButton>
        }
      >
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          JARVISION never approves or funds anything — every gate (G0 and G3) is a human decision.
          JARVISION prepares, simulates, and tracks; humans decide.
        </p>
      </VisionSection>

      {/* Current ideas (FR-2.1) */}
      <VisionSection title="Current ideas" description="Simulations you've started or saved.">
        {ideas.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No ideas yet. Pick an emerging technology below or start a new simulation.
          </p>
        ) : (
          <ul className="space-y-2">
            {ideas.map((idea) => (
              <IdeaRow
                key={idea.id}
                idea={idea}
                onOpen={() => onOpenIdea(idea.id)}
                onDelete={() => vision.deleteIdea(idea.id)}
              />
            ))}
          </ul>
        )}
      </VisionSection>

      {/* Emerging tech library (FR-2.2) */}
      <VisionSection title="Emerging technologies" description="Seeded articles — pick one to run its pre-scripted journey.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VISION_JOURNEYS.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => onStartJourney(j.id)}
              className="text-left rounded-xl border border-border bg-muted/40 p-3.5 hover:border-blue-200 dark:hover:border-blue-400/30 hover:bg-muted transition-colors group"
            >
              <p className="text-sm font-semibold text-foreground">{j.techName}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-4">{j.tagline}</p>
              <div className="flex items-center gap-1 mt-2.5 text-[11px] font-semibold text-blue-600 dark:text-blue-300">
                Run journey
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{j.sourcePublisher}</p>
            </button>
          ))}
        </div>
      </VisionSection>
    </div>
  );
}

function IdeaRow({ idea, onOpen, onDelete }: { idea: VisionIdea; onOpen: () => void; onDelete: () => void }) {
  const journey = getJourney(idea.journeyId);
  const stage = STAGE_LABEL[idea.stage];
  const fn = idea.positionedFunction ?? journey?.targetFunctions[0] ?? "—";
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
      <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{idea.techName}</span>
          <StageBadge label={stage.label} tone={stage.tone} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {fn} · updated {new Date(idea.updatedAt).toLocaleDateString()}
        </p>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${idea.techName} idea`}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${idea.techName} idea`}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </li>
  );
}
