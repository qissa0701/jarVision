// Multi-Layer Impact Simulation (FR-5) — Enterprise / Domain / Individual.
//
// A visual "impact stack" lets the user see how the technology ripples down
// from enterprise governance, through the technical domain, to individual ways
// of working. Selecting a layer reveals a rich detail card (magnitude, effort,
// timeframe, concrete effects, watch-outs and quick stats); "Compare all" lays
// the three side by side (FR-5.5). The Enterprise layer flags whether the tech
// implies organizational restructuring (FR-5.2).

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  Building2,
  ChevronRight,
  Clock,
  Cpu,
  Gauge,
  LayoutGrid,
  TriangleAlert,
  User,
  Zap,
} from "lucide-react";
import type {
  ImpactEffort,
  ImpactLayer,
  ImpactLayerDetail,
  ImpactLayerKind,
  ImpactMagnitude,
  Journey,
} from "@/types/vision";
import { VisionSection, VisionButton, StageBadge } from "./visionUi";

export interface ImpactLayersViewProps {
  journey: Journey;
  onContinue: () => void;
}

interface LayerVisual {
  label: string;
  icon: typeof Building2;
  scope: string;
  hint: string;
  accent: string;
  bar: string;
  ring: string;
  soft: string;
  iconWrap: string;
}

const LAYER_META: Record<ImpactLayerKind, LayerVisual> = {
  enterprise: {
    label: "Enterprise",
    icon: Building2,
    scope: "The organization",
    hint: "Governance, cost & restructuring",
    accent: "text-violet-600 dark:text-violet-300",
    bar: "from-violet-500 to-indigo-500",
    ring: "border-violet-300 dark:border-violet-400/50 ring-violet-200 dark:ring-violet-400/20",
    soft: "bg-violet-50 dark:bg-violet-500/10",
    iconWrap: "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300",
  },
  domain: {
    label: "Domain",
    icon: Cpu,
    scope: "The solution & tech",
    hint: "Security & solution options",
    accent: "text-blue-600 dark:text-blue-300",
    bar: "from-blue-500 to-cyan-500",
    ring: "border-blue-300 dark:border-blue-400/50 ring-blue-200 dark:ring-blue-400/20",
    soft: "bg-blue-50 dark:bg-blue-500/10",
    iconWrap: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300",
  },
  individual: {
    label: "Individual",
    icon: User,
    scope: "The people",
    hint: "Skills, roles & mindset",
    accent: "text-emerald-600 dark:text-emerald-300",
    bar: "from-emerald-500 to-teal-500",
    ring: "border-emerald-300 dark:border-emerald-400/50 ring-emerald-200 dark:ring-emerald-400/20",
    soft: "bg-emerald-50 dark:bg-emerald-500/10",
    iconWrap: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
  },
};

const LAYER_ORDER: ImpactLayerKind[] = ["enterprise", "domain", "individual"];

const MAGNITUDE_FILL: Record<ImpactMagnitude, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  transformational: 4,
};
const MAGNITUDE_LABEL: Record<ImpactMagnitude, string> = {
  low: "Low impact",
  moderate: "Moderate impact",
  high: "High impact",
  transformational: "Transformational",
};
const EFFORT_FILL: Record<ImpactEffort, number> = { low: 1, moderate: 2, high: 3 };
const EFFORT_LABEL: Record<ImpactEffort, string> = {
  low: "Low effort",
  moderate: "Moderate effort",
  high: "High effort",
};

/** Derive a reasonable detail when a layer doesn't script one. */
function detailFor(layer: ImpactLayer): ImpactLayerDetail {
  if (layer.detail) return layer.detail;
  const effects = layer.content
    .split(/[.;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 4);
  return {
    headline: LAYER_META[layer.layer].hint,
    magnitude: "moderate",
    effort: "moderate",
    timeframe: "6–12 mo",
    effects: effects.length > 0 ? effects : [layer.content],
  };
}

export function ImpactLayersView({ journey, onContinue }: ImpactLayersViewProps) {
  const [active, setActive] = useState<ImpactLayerKind | "compare">("enterprise");

  const layerByKind = (k: ImpactLayerKind) => journey.impactLayers.find((l) => l.layer === k);

  return (
    <div className="space-y-4">
      <VisionSection
        title="Multi-layer impact simulation"
        description={`How ${journey.techName} ripples through PMI — from enterprise governance down to individual ways of working.`}
        icon={<LayoutGrid className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
        right={
          <button
            type="button"
            onClick={() => setActive((a) => (a === "compare" ? "enterprise" : "compare"))}
            aria-pressed={active === "compare"}
            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold border transition-colors ${
              active === "compare"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-card text-foreground border-border hover:bg-muted"
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            Compare all
          </button>
        }
      >
        {/* Visual impact stack — also the layer selector */}
        <div className="space-y-0">
          {LAYER_ORDER.map((kind, i) => {
            const layer = layerByKind(kind);
            if (!layer) return null;
            const detail = detailFor(layer);
            const selected = active === kind;
            return (
              <div key={kind}>
                <StackBand
                  kind={kind}
                  detail={detail}
                  restructuring={layer.restructuringFlag}
                  selected={selected}
                  dimmed={active !== "compare" && !selected}
                  onSelect={() => setActive(kind)}
                />
                {i < LAYER_ORDER.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail region */}
        <div className="mt-4">
          {active === "compare" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {LAYER_ORDER.map((kind) => {
                const layer = layerByKind(kind);
                if (!layer) return null;
                return (
                  <DetailCard
                    key={kind}
                    kind={kind}
                    content={layer.content}
                    detail={detailFor(layer)}
                    restructuring={layer.restructuringFlag}
                    compact
                  />
                );
              })}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {(() => {
                const layer = layerByKind(active);
                if (!layer) return null;
                return (
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DetailCard
                      kind={active}
                      content={layer.content}
                      detail={detailFor(layer)}
                      restructuring={layer.restructuringFlag}
                    />
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          )}
        </div>
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

/* ── Impact stack band (selector) ──────────────────────────────── */

function StackBand({
  kind,
  detail,
  restructuring,
  selected,
  dimmed,
  onSelect,
}: {
  kind: ImpactLayerKind;
  detail: ImpactLayerDetail;
  restructuring?: boolean;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const meta = LAYER_META[kind];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
        selected
          ? `${meta.ring} ${meta.soft} ring-2 shadow-sm`
          : "border-border bg-gradient-to-br from-card to-muted/40 hover:border-blue-200 dark:hover:border-blue-400/30"
      } ${dimmed ? "opacity-70 hover:opacity-100" : ""}`}
    >
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.iconWrap}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-foreground">{meta.label}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">· {meta.scope}</span>
          {kind === "enterprise" && (
            <StageBadge
              label={restructuring ? "May restructure org" : "No structural change"}
              tone={restructuring ? "amber" : "green"}
            />
          )}
        </div>
        <p className="text-[11px] text-foreground/90 mt-0.5 leading-tight truncate">{detail.headline}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <MagnitudeMeter magnitude={detail.magnitude} bar={meta.bar} />
          <span className="text-[10px] font-semibold text-muted-foreground">
            {MAGNITUDE_LABEL[detail.magnitude]}
          </span>
        </div>
      </div>
      <ChevronRight
        className={`w-4 h-4 flex-shrink-0 transition-transform ${selected ? `rotate-90 ${meta.accent}` : "text-muted-foreground"}`}
      />
    </button>
  );
}

/* ── Rich detail card ──────────────────────────────────────────── */

function DetailCard({
  kind,
  content,
  detail,
  restructuring,
  compact,
}: {
  kind: ImpactLayerKind;
  content: string;
  detail: ImpactLayerDetail;
  restructuring?: boolean;
  compact?: boolean;
}) {
  const meta = LAYER_META[kind];
  const Icon = meta.icon;
  return (
    <div className={`rounded-2xl border ${meta.ring.split(" ")[0]} ${meta.soft} overflow-hidden`}>
      {/* Header */}
      <div className="p-3.5 border-b border-border/60">
        <div className="flex items-start gap-2.5">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.iconWrap}`}>
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-bold text-foreground">{meta.label} impact</p>
              {kind === "enterprise" && (
                <StageBadge
                  label={restructuring ? "May drive org restructuring" : "No structural change implied"}
                  tone={restructuring ? "amber" : "green"}
                />
              )}
            </div>
            <p className={`text-sm font-semibold mt-0.5 ${meta.accent}`}>{detail.headline}</p>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <StatChip icon={Gauge} label="Impact" value={MAGNITUDE_LABEL[detail.magnitude]} />
          <StatChip icon={Zap} label="Effort" value={EFFORT_LABEL[detail.effort]}>
            <EffortDots effort={detail.effort} bar={meta.bar} />
          </StatChip>
          <StatChip icon={Clock} label="Horizon" value={detail.timeframe} />
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 bg-card/60 space-y-3">
        {!compact && <p className="text-[11px] text-muted-foreground leading-relaxed">{content}</p>}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            Key effects
          </p>
          <ul className="space-y-1">
            {detail.effects.map((e) => (
              <li key={e} className="flex items-start gap-2 text-[11px] text-foreground">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gradient-to-r ${meta.bar}`} />
                <span className="leading-relaxed">{e}</span>
              </li>
            ))}
          </ul>
        </div>

        {detail.watchouts && detail.watchouts.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <TriangleAlert className="w-3 h-3 text-amber-500" />
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Watch-outs</p>
            </div>
            <ul className="space-y-1">
              {detail.watchouts.map((w) => (
                <li key={w} className="flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-200">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-500" />
                  <span className="leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {detail.metrics && detail.metrics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {detail.metrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-card px-2.5 py-1.5">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{m.label}</p>
                <p className="text-[11px] font-bold text-foreground">{m.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Small visuals ─────────────────────────────────────────────── */

function MagnitudeMeter({ magnitude, bar }: { magnitude: ImpactMagnitude; bar: string }) {
  const fill = MAGNITUDE_FILL[magnitude];
  return (
    <div className="flex items-center gap-0.5" aria-label={MAGNITUDE_LABEL[magnitude]}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-5 rounded-full ${i < fill ? `bg-gradient-to-r ${bar}` : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function EffortDots({ effort, bar }: { effort: ImpactEffort; bar: string }) {
  const fill = EFFORT_FILL[effort];
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < fill ? `bg-gradient-to-r ${bar}` : "bg-muted-foreground/25"}`}
        />
      ))}
    </span>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1">
      <Icon className="w-3 h-3 text-muted-foreground" />
      <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-[10px] font-bold text-foreground">{value}</span>
      {children}
    </div>
  );
}
