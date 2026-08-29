// Adoption Path (FR-4) — Technology → candidate Functions → Use Cases → Evaluation.
//
// Renders the pre-scripted adoption path for a journey. The user can expand any
// use case to see its scripted evaluation (opportunities/risks, benefit–cost,
// timeline, project clashes), deliberately position the tech into a function
// (FR-4.4), and carry a recommended use case forward into the impact view and
// Readiness Pack (FR-4.5).

import { useState } from "react";
import { ChevronDown, ChevronRight, Sparkles, TriangleAlert, Target } from "lucide-react";
import type { Journey, VisionIdea } from "@/types/vision";
import { VisionSection, VisionButton, StageBadge } from "./visionUi";

export interface AdoptionPathViewProps {
  journey: Journey;
  idea: VisionIdea;
  onPositionFunction: (fn: string) => void;
  onSelectUseCase: (useCaseId: string) => void;
  onContinue: () => void;
}

export function AdoptionPathView({
  journey,
  idea,
  onPositionFunction,
  onSelectUseCase,
  onContinue,
}: AdoptionPathViewProps) {
  const [expanded, setExpanded] = useState<string | null>(journey.recommendedUseCaseId);

  return (
    <div className="space-y-4">
      <VisionSection
        title="Adoption Path"
        description="Technology → candidate functions → use cases → evaluation."
        icon={<Target className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />}
      >
        {/* Technology header */}
        <div className="rounded-xl bg-muted p-3 mb-4">
          <p className="text-sm font-semibold text-foreground">{journey.techName}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{journey.tagline}</p>
          <a
            href={journey.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-indigo-600 dark:text-indigo-300 mt-1.5 inline-block hover:underline"
          >
            Source: {journey.sourceTitle} — {journey.sourcePublisher}
          </a>
        </div>

        {/* Candidate functions (FR-4.2) — positionable (FR-4.4). */}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Candidate functions
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {journey.targetFunctions.map((fn) => {
            const active = idea.positionedFunction === fn;
            return (
              <button
                key={fn}
                type="button"
                onClick={() => onPositionFunction(fn)}
                aria-pressed={active}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {fn}
              </button>
            );
          })}
        </div>
        {idea.positionedFunction && (
          <p className="text-[11px] text-muted-foreground mb-2">
            Positioned into <span className="font-semibold text-foreground">{idea.positionedFunction}</span>.
          </p>
        )}

        {/* Use cases + evaluation (FR-4.1, FR-4.3). */}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Use cases &amp; evaluation
        </p>
        <ul className="space-y-2">
          {journey.useCases.map((uc) => {
            const isOpen = expanded === uc.id;
            const isRecommended = uc.id === journey.recommendedUseCaseId;
            const isSelected = idea.selectedUseCaseId === uc.id;
            return (
              <li key={uc.id} className="rounded-xl border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : uc.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-start gap-2 p-3 text-left hover:bg-muted transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">{uc.function}</span>
                      {isRecommended && (
                        <StageBadge label="Recommended" tone="indigo" />
                      )}
                      {isSelected && <StageBadge label="Carried forward" tone="green" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {uc.description}
                    </p>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border bg-muted/40">
                    <EvalList title="Opportunities" items={uc.opportunities} tone="green" />
                    <EvalList title="Risks" items={uc.risks} tone="amber" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <MiniFact label="Benefit–cost (indicative)" value={uc.benefitCost} />
                      <MiniFact label="Timeline (indicative)" value={uc.timeline} />
                    </div>
                    <EvalList title="Potential project clashes" items={uc.projectClashes} tone="amber" />
                    <div className="pt-1">
                      <VisionButton onClick={() => onSelectUseCase(uc.id)} variant={isSelected ? "ghost" : "primary"}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {isSelected ? "Selected as candidate" : "Carry this use case forward"}
                      </VisionButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </VisionSection>

      {/* Recommended candidate summary (FR-4.5). */}
      <VisionSection
        title="Recommended candidate"
        icon={<Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />}
      >
        <p className="text-xs text-foreground leading-relaxed">{journey.recommendationRationale}</p>
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-muted-foreground">
            {idea.selectedUseCaseId
              ? "A candidate is carried forward. Continue to the multi-layer impact simulation."
              : "Select a use case above (or use the recommended one) to continue."}
          </p>
          <VisionButton onClick={onContinue}>
            Continue to impact simulation
            <ChevronRight className="w-3.5 h-3.5" />
          </VisionButton>
        </div>
      </VisionSection>
    </div>
  );
}

function EvalList({ title, items, tone }: { title: string; items: string[]; tone: "green" | "amber" }) {
  if (items.length === 0) return null;
  const dot = tone === "green" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {tone === "amber" && <TriangleAlert className="w-3 h-3 text-amber-500" />}
        <p className="text-[11px] font-semibold text-foreground">{title}</p>
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-[11px] text-foreground mt-0.5 leading-relaxed">{value}</p>
    </div>
  );
}
