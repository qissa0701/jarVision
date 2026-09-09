// ExecutiveSummary — the leadership-facing framing shown atop the Adoption Path.
//
// Answers, in one glance: how the technology fits PMI, what PMI has already
// adopted, the opportunity, and a summary across the candidate use cases.

import { CheckCircle2, Lightbulb, Target, TrendingUp } from "lucide-react";
import type { Journey } from "@/types/vision";
import { VisionSection } from "./visionUi";

export function ExecutiveSummary({ journey }: { journey: Journey }) {
  const s = journey.execSummary;
  if (!s) return null;

  return (
    <VisionSection
      title="Executive summary"
      description={`How ${journey.techName} fits PMI — the opportunity at a glance.`}
      icon={<Target className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Block icon={<Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />} title="Fit with PMI">
          <p className="text-[11px] text-foreground leading-relaxed">{s.fit}</p>
        </Block>

        <Block
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />}
          title="Already adopted"
        >
          <ul className="space-y-1">
            {s.alreadyAdopted.map((a) => (
              <li key={a} className="flex items-start gap-1.5 text-[11px] text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                <span className="leading-relaxed">{a}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block
          icon={<TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />}
          title="The opportunity"
        >
          <p className="text-[11px] text-foreground leading-relaxed">{s.opportunity}</p>
        </Block>

        <Block
          icon={<Lightbulb className="w-3.5 h-3.5 text-amber-500" />}
          title="Use cases at a glance"
        >
          <p className="text-[11px] text-foreground leading-relaxed">{s.useCaseSummary}</p>
        </Block>
      </div>
    </VisionSection>
  );
}

function Block({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
      {children}
    </div>
  );
}
