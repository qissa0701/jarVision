// Pure status-derivation logic for the Tasks widget.
//
// A task's displayed status is never stored directly — it's derived from the
// existing overnight-run record (if any) plus whether the Task_Panel is
// currently executing that exact task. Keeping this derivation pure (no
// React, no storage) means the four-state model (`not_started`, `scheduled`,
// `in_progress`, `completed`) can be unit-tested in isolation and can never
// drift out of sync with the overnight run it's derived from.

import type { OvernightRun, Task } from "@/types";

/** The five task states surfaced as filter chips in the Tasks widget. */
export type TaskStatus =
  | "not_started"
  | "scheduled"
  | "in_progress"
  | "needs_review"
  | "completed";

/** Every task status, in the display order used by the filter chips. */
export const TASK_STATUSES: readonly TaskStatus[] = [
  "not_started",
  "scheduled",
  "in_progress",
  "needs_review",
  "completed",
];

/**
 * Derive a task's widget status from its overnight run (if any) and whether
 * it's currently executing via the Task_Panel.
 *
 * Precedence (matches the product spec exactly):
 *   1. No run and not executing            → "not_started"
 *   2. Run is scheduled/changes_requested  → "scheduled"
 *   3. Run is running, OR currently executing → "in_progress"
 *   4. Run is ready (automated/overnight run finished, awaiting a human look) → "needs_review"
 *   5. Run is approved                     → "completed"
 */
export function deriveTaskStatus(
  run: OvernightRun | undefined,
  isExecuting: boolean,
): TaskStatus {
  if (!run && !isExecuting) return "not_started";
  if (run?.status === "scheduled" || run?.status === "changes_requested") {
    return "scheduled";
  }
  if (run?.status === "running" || isExecuting) return "in_progress";
  if (run?.status === "ready") return "needs_review";
  if (run?.status === "approved") return "completed";
  return "not_started";
}

/** Per-status counts across a list of tasks, plus a running "all" total. */
export type TaskStatusCounts = Record<TaskStatus, number> & { all: number };

/**
 * Count how many tasks fall into each status, given a function that resolves
 * a task's current status. Used to render the count badge on each filter chip.
 */
export function countTasksByStatus(
  tasks: readonly Task[],
  statusFor: (task: Task) => TaskStatus,
): TaskStatusCounts {
  const counts: TaskStatusCounts = {
    all: tasks.length,
    not_started: 0,
    scheduled: 0,
    in_progress: 0,
    needs_review: 0,
    completed: 0,
  };
  for (const task of tasks) {
    counts[statusFor(task)] += 1;
  }
  return counts;
}
