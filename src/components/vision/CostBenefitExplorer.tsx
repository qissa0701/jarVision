// Cost-benefit explorer — adjustable delivery scenarios with a detailed
// breakdown and benefit-realization timeline.
//
// The user explores three implementation approaches (Vendor / External SaaS /
// Build in-house). Each drives an adjustable team (internal PMI people +
// contractors) and timeline, which recompute a detailed cost breakdown
// (implementation, licence/subscription, token/inference, run-cost) plus the
// annual benefit, break-even month and 3-year net. VISION marks a recommended
// scenario; the human tunes the levers. All figures indicative / simulated.

import { useMemo, useState } from "react";
import {
  Building2,
  Cloud,
  Coins,
  Minus,
  Plus,
  Server,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ImplementationApproach, UseCase } from "@/types/vision";
import {
  APPROACH_META,
  computeCostModel,
  deriveCostBasis,
  formatUsd,
  type CostModelInputs,
} from "@/lib/visionEconomics";

const APPROACH_ORDER: ImplementationApproach[] = ["vendor", "saas", "in-house"];

/** Best 3-year net across the three approaches at their default configs. */
function pickRecommended(basis: ReturnType<typeof deriveCostBasis>): ImplementationApproach {
  let best: ImplementationApproach = "in-house";
  let bestNet = -Infinity;
  for (const a of APPROACH_ORDER) {
    const r = computeCostModel(basis, { approach: a, ...basis.defaults[a] });
    if (r.threeYearNet > bestNet) {
      bestNet = r.threeYearNet;
      best = a;
    }
  }
  return best;
}

const APPROACH_ICON: Record<ImplementationApproach, typeof Cloud> = {
  vendor: Building2,
  saas: Cloud,
  "in-house": Server,
};

const PROS_CONS: Record<ImplementationApproach, { pros: string[]; cons: string[] }> = {
  vendor: {
    pros: ["Fastest proven capability", "Lowest build / delivery risk", "Vendor owns security patches & roadmap"],
    cons: ["Highest recurring licence", "Possible lock-in & less control", "Customisation limits"],
  },
  saas: {
    pros: ["Lowest upfront cost", "Quickest to value", "Scales elastically with usage"],
    cons: ["Ongoing subscription + usage fees", "Data leaves PMI's boundary", "Limited deep customisation"],
  },
  "in-house": {
    pros: ["Full control & IP ownership", "Tailored to PMI workflows", "No per-seat licence"],
    cons: ["Heaviest labour & run-cost", "Slowest ramp to value", "PMI owns all maintenance & risk"],
  },
};

export function CostBenefitExplorer({ useCase }: { useCase: UseCase }) {
  const basis = useMemo(() => deriveCostBasis(useCase), [useCase]);

  const recommended = useMemo(() => pickRecommended(basis), [basis]);
  const [approach, setApproach] = useState<ImplementationApproach>(() => pickRecommended(basis));
  const [inputs, setInputs] = useState<Record<ImplementationApproach, CostModelInputs>>(() => {
    const seed = {} as Record<ImplementationApproach, CostModelInputs>;
    for (const a of APPROACH_ORDER) {
      seed[a] = { approach: a, ...basis.defaults[a] };
    }
    return seed;
  });

  const current = inputs[approach];
  const result = useMemo(() => computeCostModel(basis, current), [basis, current]);

  const patch = (p: Partial<CostModelInputs>) =>
    setInputs((prev) => ({ ...prev, [approach]: { ...prev[approach], ...p } }));

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      <div className="flex items-center gap-1.5">
        <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
        <p className="text-[11px] font-semibold text-foreground">Cost-benefit · explore scenarios</p>
        <span className="text-[10px] text-muted-foreground">· indicative / simulated</span>
      </div>

      {/* Approach scenario tabs */}
      <div className="grid grid-cols-3 gap-1.5">
        {APPROACH_ORDER.map((a) => {
          const Icon = APPROACH_ICON[a];
          const isActive = approach === a;
          const isRec = recommended === a;
          return (
            <button
              key={a}
              type="button"
              onClick={() => setApproach(a)}
              aria-pressed={isActive}
              className={`relative flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors ${
                isActive
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-500/15 dark:border-blue-400/40"
                  : "border-border bg-muted/40 hover:bg-muted"
              }`}
            >
              {isRec && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
                  <Sparkles className="w-2.5 h-2.5" />
                  Rec
                </span>
              )}
              <Icon className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              <span className="text-[10px] font-bold text-foreground leading-tight">{APPROACH_META[a].label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">{APPROACH_META[approach].blurb}</p>

      {/* Adjustable levers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Stepper
          icon={Users}
          label="Internal PMI"
          value={current.internalPeople}
          min={0}
          max={20}
          suffix="ppl"
          onChange={(v) => patch({ internalPeople: v })}
        />
        <Stepper
          icon={Users}
          label="Contractors"
          value={current.contractors}
          min={0}
          max={20}
          suffix="ppl"
          onChange={(v) => patch({ contractors: v })}
        />
        <Stepper
          icon={TrendingUp}
          label="Timeline"
          value={current.timelineMonths}
          min={1}
          max={24}
          suffix="mo"
          onChange={(v) => patch({ timelineMonths: v })}
        />
      </div>

      {/* Cost breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <BreakdownCard title="One-time (build)" total={result.totalOneTime} items={result.oneTime} />
        <BreakdownCard title="Recurring (annual)" total={result.totalRecurringAnnual} items={result.recurringAnnual} />
      </div>

      {/* Benefit realization */}
      <div className="rounded-lg bg-muted/60 border border-border p-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
          Benefit realization
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Fact label="First-year cost" value={formatUsd(result.totalFirstYear)} />
          <Fact label="Annual benefit" value={formatUsd(result.annualBenefitUsd)} tone="green" />
          <Fact
            label="Break-even"
            value={result.breakEvenMonth ? `Month ${result.breakEvenMonth}` : "> 36 mo"}
          />
          <Fact
            label="3-year net"
            value={formatUsd(result.threeYearNet)}
            tone={result.threeYearNet >= 0 ? "green" : "red"}
          />
        </div>
        <RealizationTimeline
          goLive={result.goLiveMonth}
          fullBenefit={result.fullBenefitMonth}
          breakEven={result.breakEvenMonth}
        />
      </div>

      {/* Pros / cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ProsCons title="Pros" items={PROS_CONS[approach].pros} tone="green" />
        <ProsCons title="Cons" items={PROS_CONS[approach].cons} tone="amber" />
      </div>

      <div
        className={`rounded-lg p-2.5 text-[11px] leading-relaxed border ${
          approach === recommended
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-400/30 text-emerald-800 dark:text-emerald-200"
            : "bg-muted/60 border-border text-muted-foreground"
        }`}
      >
        {approach === recommended ? (
          <>
            <span className="font-semibold">Recommended approach.</span> Best modelled 3-year net for this
            candidate — {formatUsd(result.threeYearNet)} with break-even around{" "}
            {result.breakEvenMonth ? `month ${result.breakEvenMonth}` : "beyond 3 years"}.
          </>
        ) : (
          <>
            VISION recommends <span className="font-semibold">{APPROACH_META[recommended].label}</span> for
            this candidate. You're exploring an alternative — compare the 3-year net above.
          </>
        )}
      </div>
    </div>
  );
}

function Stepper({
  icon: Icon,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-2">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-6 h-6 rounded-md border border-border bg-card flex items-center justify-center disabled:opacity-40 hover:bg-muted"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-xs font-bold text-foreground tabular-nums">
          {value}
          <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{suffix}</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="w-6 h-6 rounded-md border border-border bg-card flex items-center justify-center disabled:opacity-40 hover:bg-muted"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  total,
  items,
}: {
  title: string;
  total: number;
  items: { label: string; amountUsd: number; note?: string }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
        <span className="text-xs font-bold text-foreground">{formatUsd(total)}</span>
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.label} className="flex items-start justify-between gap-2 text-[11px]">
            <span className="text-muted-foreground leading-tight">
              {it.label}
              {it.note && <span className="block text-[9px] text-muted-foreground/70">{it.note}</span>}
            </span>
            <span className="text-foreground font-medium tabular-nums flex-shrink-0">{formatUsd(it.amountUsd)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fact({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  const color =
    tone === "green"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "red"
        ? "text-red-600 dark:text-red-300"
        : "text-foreground";
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-xs font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

/** A tiny milestone timeline for kickoff → go-live → full benefit → break-even. */
function RealizationTimeline({
  goLive,
  fullBenefit,
  breakEven,
}: {
  goLive: number;
  fullBenefit: number;
  breakEven: number | null;
}) {
  const horizon = Math.max(36, (breakEven ?? 0) + 2, fullBenefit + 2);
  const pct = (m: number) => `${Math.min(100, (m / horizon) * 100)}%`;
  const marks: { m: number; label: string; tone: string }[] = [
    { m: goLive, label: `Go-live · mo ${goLive}`, tone: "bg-blue-500" },
    { m: fullBenefit, label: `Full benefit · mo ${fullBenefit}`, tone: "bg-emerald-500" },
  ];
  if (breakEven) marks.push({ m: breakEven, label: `Break-even · mo ${breakEven}`, tone: "bg-amber-500" });

  return (
    <div className="mt-2.5">
      <div className="relative h-1.5 rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500/30" style={{ width: pct(goLive) }} />
        {marks.map((mk) => (
          <span
            key={mk.label}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-card ${mk.tone}`}
            style={{ left: pct(mk.m) }}
            title={mk.label}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
        {marks
          .slice()
          .sort((a, b) => a.m - b.m)
          .map((mk) => (
            <span key={mk.label} className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${mk.tone}`} />
              {mk.label}
            </span>
          ))}
      </div>
    </div>
  );
}

function ProsCons({ title, items, tone }: { title: string; items: string[]; tone: "green" | "amber" }) {
  const dot = tone === "green" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{title}</p>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-1.5 text-[11px] text-foreground">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
