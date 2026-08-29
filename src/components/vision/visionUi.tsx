// Small shared presentational helpers for VISION Studio views. Kept together so
// the lifecycle views share one consistent card/badge/label vocabulary.

import type { ReactNode } from "react";

/** A titled card shell used across the VISION lifecycle views. */
export function VisionSection({
  title,
  description,
  icon,
  children,
  right,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** The "draft — requires review" badge required on every drafted pack item (FR-8.4/12.5). */
export function DraftBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300">
      Draft — requires review
    </span>
  );
}

/** An "indicative / simulated" money label (FR-10.4). */
export function IndicativeBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
      {children}
      <span className="text-[10px] font-normal text-muted-foreground">
        · indicative / simulated
      </span>
    </span>
  );
}

/** Primary VISION action button. */
export function VisionButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400/40";
  const styles: Record<string, string> = {
    primary:
      "bg-gradient-to-br from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400 text-white hover:from-indigo-700 hover:to-indigo-600 shadow-sm",
    ghost:
      "border border-border text-foreground hover:bg-muted",
    danger:
      "border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

/** Status pill for an idea's lifecycle stage. */
export function StageBadge({ label, tone }: { label: string; tone: "neutral" | "amber" | "green" | "red" | "indigo" }) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    amber: "bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300",
    green: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300",
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  };
  return (
    <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}
