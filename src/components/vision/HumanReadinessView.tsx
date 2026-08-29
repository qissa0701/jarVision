// Human Readiness (FR-6) — certifications, skills, and trainings mapped to the
// roles they affect, so adoption accounts for people, not just tech.

import { Award, BookOpen, ChevronRight, GraduationCap, Users } from "lucide-react";
import type { Journey, ReadinessType } from "@/types/vision";
import { VisionSection, VisionButton } from "./visionUi";

export interface HumanReadinessViewProps {
  journey: Journey;
  onContinue: () => void;
}

const TYPE_META: Record<ReadinessType, { label: string; icon: typeof Award; tone: string }> = {
  certification: { label: "Certification", icon: Award, tone: "text-indigo-500 dark:text-indigo-300" },
  skill: { label: "Skill", icon: GraduationCap, tone: "text-emerald-500 dark:text-emerald-300" },
  training: { label: "Training", icon: BookOpen, tone: "text-amber-500 dark:text-amber-300" },
};

export function HumanReadinessView({ journey, onContinue }: HumanReadinessViewProps) {
  return (
    <div className="space-y-4">
      <VisionSection
        title="Human readiness"
        description="How people become ready — certifications, skills, and trainings, mapped to affected roles."
        icon={<Users className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />}
      >
        <ul className="space-y-2">
          {journey.readiness.map((r) => {
            const meta = TYPE_META[r.type];
            const Icon = meta.icon;
            return (
              <li key={r.id} className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${meta.tone}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {meta.label}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {r.role}
                    </span>
                  </div>
                  <p className="text-xs text-foreground mt-1 leading-relaxed">{r.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-muted-foreground mt-3">
          On approval, these readiness items are cascaded to People &amp; Culture / L&amp;D as tracked
          action items (see Approve &amp; Cascade).
        </p>
      </VisionSection>

      <div className="flex justify-end">
        <VisionButton onClick={onContinue}>
          Continue to approve &amp; cascade
          <ChevronRight className="w-3.5 h-3.5" />
        </VisionButton>
      </div>
    </div>
  );
}
