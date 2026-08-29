// Approve & Cascade to Jarvis (FR-7).
//
// The human-in-the-loop conversion point: nothing is cascaded until the user
// explicitly approves the recommended use case (FR-7.4). On approve, VISION
// creates role-scoped action items, each carrying the tech / use-case / layer
// context (FR-7.3) and a link back to the source journey (FR-7.5).
//
// Design note: the Jarvis personas are re-mapped to VISION's org-level roles
// (see constants/visionRoleMap.ts), so each cascaded item lands in the mapped
// account's Jarvis task list — the user still logs in as one fixed account
// (no role switcher). Items are also listed here for in-context traceability.

import { ArrowUpRight, CheckCircle2, GitBranch, ShieldCheck } from "lucide-react";
import type { CascadeItem, Journey, VisionIdea } from "@/types/vision";
import { jarvisRoleForCascadeTarget, JARVIS_ROLE_LABEL } from "@/constants/visionRoleMap";
import { VisionSection, VisionButton, StageBadge } from "./visionUi";

export interface CascadeViewProps {
  journey: Journey;
  idea: VisionIdea;
  cascadeItems: CascadeItem[];
  onApproveAndCascade: () => void;
  onContinue: () => void;
}

export function CascadeView({
  journey,
  idea,
  cascadeItems,
  onApproveAndCascade,
  onContinue,
}: CascadeViewProps) {
  const approved = idea.cascadeItemIds.length > 0;
  const selectedUseCase =
    journey.useCases.find((u) => u.id === (idea.selectedUseCaseId ?? journey.recommendedUseCaseId)) ??
    journey.useCases[0];

  return (
    <div className="space-y-4">
      <VisionSection
        title="Approve & cascade"
        description="Endorse the recommended use case as a G0 candidate, then push role-specific action items into the org."
        icon={<GitBranch className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />}
        right={approved ? <StageBadge label="Approved & cascaded" tone="green" /> : undefined}
      >
        <div className="rounded-xl bg-muted p-3 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Candidate to endorse
          </p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {journey.techName} — {selectedUseCase.function}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {selectedUseCase.description}
          </p>
        </div>

        {!approved ? (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-400/20">
            <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[12px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                <span className="font-semibold">Human-in-the-loop.</span> Nothing is cascaded until you
                approve. Approving creates {journey.cascade.length} role-scoped action items with full
                context and traceability back to this simulation.
              </p>
              <div className="mt-2.5">
                <VisionButton onClick={onApproveAndCascade}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve &amp; cascade action items
                </VisionButton>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Cascaded action items ({cascadeItems.length})
            </p>
            <ul className="space-y-2">
              {cascadeItems.map((c) => (
                <li key={c.id} className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {c.targetRole}
                    </span>
                    <StageBadge label={`from ${c.layerOrigin}`} tone="neutral" />
                  </div>
                  <p className="text-xs text-foreground mt-1 leading-relaxed">{c.actionText}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Context: {journey.techName} · {selectedUseCase.function} · traceable to journey{" "}
                    <span className="font-mono">{c.sourceJourneyId}</span>
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-300 mt-1 font-semibold">
                    → Lands in {JARVIS_ROLE_LABEL[jarvisRoleForCascadeTarget(c.targetRole)]}'s Jarvis tasks
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </VisionSection>

      {approved && (
        <div className="flex justify-end">
          <VisionButton onClick={onContinue}>
            Continue to G0 Readiness Pack
            <ArrowUpRight className="w-3.5 h-3.5" />
          </VisionButton>
        </div>
      )}
    </div>
  );
}
