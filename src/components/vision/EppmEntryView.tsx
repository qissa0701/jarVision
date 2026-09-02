// EppmEntryView — the terminal step of JARVISION's orchestrated arc.
//
// JARVISION's orchestration stops at the G0 boundary. Instead of running its
// own decision gate, the prepared candidate is handed to ePPM — PMI's exclusive
// system for the project portfolio — where the Portfolio Manager picks it up and
// the human G0 decision is made. This step surfaces a pre-filled (simulated)
// ePPM new-entry link plus a short "orchestration complete" summary. JARVISION
// never approves or funds anything; it prepared and orchestrated, humans decide.

import { ArrowLeft, CheckCircle2, ExternalLink, Network } from "lucide-react";
import type { Journey, VisionIdea } from "@/types/vision";
import { eppmEntryUrl } from "@/data/visionJourneys";
import { CORE_AGENTS, agentLabel } from "@/data/agentNetwork";
import { VisionSection, VisionButton, StageBadge } from "./visionUi";

export interface EppmEntryViewProps {
  journey: Journey;
  idea: VisionIdea;
  onBackToHome: () => void;
}

export function EppmEntryView({ journey, idea, onBackToHome }: EppmEntryViewProps) {
  const selectedUseCase =
    journey.useCases.find(
      (u) => u.id === (idea.selectedUseCaseId ?? journey.recommendedUseCaseId),
    ) ?? journey.useCases[0];
  const url = eppmEntryUrl(journey.techName, selectedUseCase.function);

  return (
    <div className="space-y-4">
      <VisionSection
        title="Enter this project in ePPM"
        description="JARVISION's orchestrated arc ends here — the candidate becomes a governed ePPM portfolio entry."
        icon={<ExternalLink className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
        right={<StageBadge label="Final step" tone="blue" />}
      >
        <div className="rounded-xl bg-muted p-3 mb-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            ePPM is PMI's exclusive system for the project portfolio — the project's "front page". Seed the
            minimum record (Details, Schedule, Benefits &amp; Costs, Risks, and the drafted G0 submission in
            Documents) so the Portfolio Manager can pick it up and confirm the G0 gate. The orchestrated
            agents' outputs — adoption path, impact, readiness, cascade and the G0 pack — are bundled into
            this hand-off.
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

      <VisionSection
        title="Orchestration complete"
        description="JARVISION prepared this candidate by orchestrating specialized agents through NEXUS."
        icon={<Network className="w-4 h-4 text-emerald-500" />}
      >
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-400/20 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
            <p className="text-sm font-semibold text-foreground">{journey.techName}</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            JARVISION never approves or funds anything. It orchestrated an ecosystem of specialized agents
            to assemble the path, impact, readiness, cascade and G0 pack — then handed the candidate to
            ePPM for the Portfolio Manager and the human G0 decision.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {CORE_AGENTS.map((a) => (
              <span
                key={a.id}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
              >
                {agentLabel(a)}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <VisionButton variant="ghost" onClick={onBackToHome}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to JARVISION home
          </VisionButton>
        </div>
      </VisionSection>
    </div>
  );
}
