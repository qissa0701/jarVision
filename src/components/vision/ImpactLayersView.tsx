// Multi-Layer Impact Simulation (FR-5) — Enterprise / Domain / Individual.
//
// Lets the user toggle between the three impact lenses or compare them side by
// side (FR-5.5). The Enterprise layer flags whether the technology implies
// organizational restructuring (FR-5.2).

import { useState } from "react";
import { Building2, ChevronRight, Cpu, LayoutGrid, User } from "lucide-react";
import type { ImpactLayerKind, Journey } from "@/types/vision";
import { VisionSection, VisionButton, StageBadge } from "./visionUi";

export interface ImpactLayersViewProps {
  journey: Journey;
  onContinue: () => void;
}

const LAYER_META: Record<ImpactLayerKind, { label: string; icon: typeof Building2; hint: string }> = {
  enterprise: { label: "Enterprise", icon: Building2, hint: "Governance, cost & restructuring" },
  domain: { label: "Domain", icon: Cpu, hint: "Security & solution options" },
  individual: { label: "Individual", icon: User, hint: "Skills & training" },
};

export function ImpactLayersView({ journey, onContinue }: ImpactLayersViewProps) {
  const [active, setActive] = useState<ImpactLayerKind | "compare">("enterprise");

  return (
    <div className="space-y-4">
      <VisionSection
        title="Multi-layer impact simulation"
        description="Understand the technology's effect beyond the use case itself."
        icon={<LayoutGrid className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />}
        right={
          <div className="flex flex-wrap gap-1.5">
            {(["enterprise", "domain", "individual"] as ImpactLayerKind[]).map((k) => {
              const Icon = LAYER_META[k].icon;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setActive(k)}
                  aria-pressed={active === k}
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-semibold border transition-colors ${
                    active === k
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {LAYER_META[k].label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setActive("compare")}
              aria-pressed={active === "compare"}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-semibold border transition-colors ${
                active === "compare"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              Compare all
            </button>
          </div>
        }
      >
        {active === "compare" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {journey.impactLayers.map((l) => (
              <LayerCard key={l.layer} layer={l.layer} content={l.content} restructuring={l.restructuringFlag} />
            ))}
          </div>
        ) : (
          (() => {
            const layer = journey.impactLayers.find((l) => l.layer === active);
            if (!layer) return null;
            return <LayerCard layer={layer.layer} content={layer.content} restructuring={layer.restructuringFlag} expanded />;
          })()
        )}
      </VisionSection>

      <div className="flex justify-end">
        <VisionButton onClick={onContinue}>
          Continue to human readiness
          <ChevronRight className="w-3.5 h-3.5" />
        </VisionButton>
      </div>
    </div>
  );
}

function LayerCard({
  layer,
  content,
  restructuring,
  expanded,
}: {
  layer: ImpactLayerKind;
  content: string;
  restructuring?: boolean;
  expanded?: boolean;
}) {
  const Icon = LAYER_META[layer].icon;
  return (
    <div className={`rounded-xl border border-border bg-muted/40 p-3.5 ${expanded ? "" : "h-full"}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
        <p className="text-xs font-semibold text-foreground">{LAYER_META[layer].label}</p>
      </div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">{LAYER_META[layer].hint}</p>
      <p className="text-[11px] text-foreground leading-relaxed">{content}</p>
      {layer === "enterprise" && (
        <div className="mt-2.5">
          {restructuring ? (
            <StageBadge label="May drive org restructuring" tone="amber" />
          ) : (
            <StageBadge label="No structural change implied" tone="green" />
          )}
        </div>
      )}
    </div>
  );
}
