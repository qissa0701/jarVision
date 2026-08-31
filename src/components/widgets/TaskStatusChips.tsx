// TaskStatusChips — the filter chip row for the Tasks widget.
//
// Renders an "All" chip plus one chip per `TaskStatus`, each labeled with a
// count. Clicking a chip filters the visible task list; the active chip is
// visually distinguished (blue fill vs. a neutral outline).

import type { TaskStatus, TaskStatusCounts } from "@/lib/taskStatus";

export type TaskFilter = TaskStatus | "all";

const CHIP_LABELS: Record<TaskFilter, string> = {
  all: "All",
  not_started: "Not Started",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  needs_review: "Need Review",
  completed: "Completed",
};

const CHIP_ORDER: TaskFilter[] = [
  "all",
  "not_started",
  "scheduled",
  "in_progress",
  "needs_review",
  "completed",
];

export interface TaskStatusChipsProps {
  counts: TaskStatusCounts;
  active: TaskFilter;
  onSelect: (filter: TaskFilter) => void;
}

export function TaskStatusChips({ counts, active, onSelect }: TaskStatusChipsProps) {
  return (
    <div role="group" aria-label="Filter tasks by status" className="flex items-center gap-1.5 flex-wrap">
      {CHIP_ORDER.map((filter) => {
        const isActive = active === filter;
        // "Need Review" surfaces automated/overnight runs waiting on a human
        // look — give it an amber accent (even when inactive, as long as
        // there's something pending) so it stands out from the neutral chips.
        const needsAttention = filter === "needs_review" && counts[filter] > 0;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onSelect(filter)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              isActive
                ? needsAttention
                  ? "bg-amber-500 dark:bg-amber-500 text-white border-amber-500"
                  : "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500"
                : needsAttention
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/30 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                  : "bg-muted text-muted-foreground border-border hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-100 dark:hover:border-blue-400/20"
            }`}
          >
            {CHIP_LABELS[filter]}
            <span
              className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold ${
                isActive
                  ? "bg-white/20 text-white"
                  : needsAttention
                    ? "bg-amber-500 text-white"
                    : "bg-card text-muted-foreground"
              }`}
            >
              {counts[filter]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
