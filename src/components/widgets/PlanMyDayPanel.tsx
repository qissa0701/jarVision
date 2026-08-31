// PlanMyDayPanel — the expandable "Plan My Day" panel inside the Calendar
// widget.
//
// Presents `buildDayPlan`'s time-blocked schedule as a step-by-step,
// chronological list (same spirit as Task_Panel's plan view, but scoped to a
// day's schedule rather than a single task): fixed meetings interleaved with
// focus blocks carved out of free time for the role's top priorities.
//
// Human-in-the-loop actions (draft → review → approve → act, same pattern as
// `MeetingPrepCard`'s prep flow and `ArtifactCard`'s approve flow):
//   • "Approve plan" — marks the plan as approved for this session (local
//     state only; it does not need to persist across remounts).
//   • "Sync to Calendar" — gated behind approval; once clicked, bubbles the
//     plan's focus blocks up to the caller (`onSync`) to be merged into the
//     Calendar widget's real displayed schedule, and shows an inline
//     confirmation.
// An explicit icon-only close control replaces the old text-toggle as the way
// to just dismiss the panel without approving anything. Approval/sync state
// is intentionally local to this component: closing and reopening the panel
// (which unmounts/remounts it) is the simplest way to reset stale state for
// an unrelated day/role, per the product spec.

import { useState } from "react";
import { Calendar as CalendarIcon, Check, Sparkles, Target, X } from "lucide-react";
import type { PlanBlock } from "@/lib/planMyDay";

const PLAN_PANEL_ID = "plan-my-day-panel";
const SYNC_HINT_ID = "plan-my-day-sync-hint";

export interface PlanMyDayPanelProps {
  /** The generated day plan, in chronological order. */
  plan: PlanBlock[];
  /** Dismiss the panel without approving (the explicit close control). */
  onClose: () => void;
  /**
   * Sync the plan's focus blocks into the Calendar widget's real schedule.
   * Returns the number of focus blocks actually synced, so the panel can
   * show an accurate inline confirmation.
   */
  onSync: (plan: PlanBlock[]) => number;
}

/** The step-by-step plan body, rendered only while the panel is expanded. */
export function PlanMyDayPanel({ plan, onClose, onSync }: PlanMyDayPanelProps) {
  const [approved, setApproved] = useState(false);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);

  const isSynced = syncedCount !== null;

  const handleSync = () => {
    if (!approved || isSynced) return;
    setSyncedCount(onSync(plan));
  };

  return (
    <div
      id={PLAN_PANEL_ID}
      className="mt-3 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-400/20"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs text-muted-foreground flex-1">
          {"Here's today's plan: your fixed meetings, with focus time for your top priorities slotted into the gaps."}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close plan"
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {plan.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No time blocks to show for today.
        </p>
      ) : (
        <ol className="space-y-2">
          {plan.map((block, i) => (
            <li
              key={`${block.kind}-${block.startMinutes}-${i}`}
              className={`flex items-start gap-3 p-2.5 rounded-lg ${
                block.kind === "meeting"
                  ? "bg-blue-100/70 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-400/25"
                  : "bg-card border border-border"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {block.kind === "meeting" ? (
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                ) : (
                  <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {block.startLabel}–{block.endLabel}
                  </span>
                  {block.kind === "focus" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                      Focus time
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground leading-snug mt-0.5">
                  {block.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {block.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Approve / Sync actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-100 dark:border-blue-400/20 flex-wrap">
        <button
          type="button"
          onClick={() => setApproved(true)}
          disabled={approved}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          {approved ? "Plan approved" : "Approve plan"}
        </button>

        <button
          type="button"
          onClick={handleSync}
          disabled={!approved || isSynced}
          title={!approved ? "Approve the plan before syncing it to your calendar" : undefined}
          aria-describedby={!approved ? SYNC_HINT_ID : undefined}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/25 bg-white dark:bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          {isSynced ? "Synced ✓" : "Sync to Calendar"}
        </button>

        {approved && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <Check className="w-3 h-3" />
            Plan approved
          </span>
        )}
      </div>

      {!approved && (
        <p id={SYNC_HINT_ID} className="text-[11px] text-muted-foreground mt-1.5">
          Approve the plan before syncing it to your calendar.
        </p>
      )}

      {isSynced && (
        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1.5">
          {syncedCount} focus block{syncedCount === 1 ? "" : "s"} added to your calendar.
        </p>
      )}
    </div>
  );
}

export { PLAN_PANEL_ID };

export interface PlanMyDayButtonProps {
  expanded: boolean;
  onToggle: () => void;
}

/** The prominent CTA that toggles the plan panel open/closed. */
export function PlanMyDayButton({ expanded, onToggle }: PlanMyDayButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={PLAN_PANEL_ID}
      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200 dark:shadow-none"
    >
      <Sparkles className="w-4 h-4" />
      Plan My Day
    </button>
  );
}
