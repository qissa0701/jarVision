// Pure logic for the overnight automation queue.
//
// Everything here is side-effect free (except the explicit storage load/save,
// which inject `Storage`) so the scheduling math and result generation are
// unit-testable without a DOM. The stateful React adapter lives in
// `useOvernightQueue`; this module owns the "what", not the "when".

import type {
  OvernightRun,
  OvernightStatus,
  OvernightWindow,
  Role,
  Task,
} from "@/types";
import { ROLE_IDS } from "@/constants/roles";
import {
  DEFAULT_OVERNIGHT_WINDOW,
  FIRST_RUN_OFFSET_MIN,
  OVERNIGHT_STORAGE_KEY,
  RUN_STAGGER_MIN,
} from "@/constants/overnight";

/** The persisted shape: the current window plus every run keyed by run key. */
export interface OvernightState {
  window: OvernightWindow;
  runs: Record<string, OvernightRun>;
}

/** Statuses that still occupy a slot in tonight's queue. */
const QUEUE_STATUSES: ReadonlySet<OvernightStatus> = new Set<OvernightStatus>([
  "scheduled",
  "running",
  "ready",
  "changes_requested",
]);

/** Composite key so the same task id across roles never collides. */
export function runKey(role: Role, taskId: string): string {
  return `${role}:${taskId}`;
}

/** Parse "HH:mm" (24h) into minutes since midnight; 0 on malformed input. */
export function parseHHMM(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return 0;
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return hours * 60 + minutes;
}

/** Format minutes-since-midnight as a 12-hour clock string, e.g. "1:30 AM". */
export function formatClock(totalMinutes: number): string {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  const period = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** Convenience: format an "HH:mm" window bound for display. */
export function formatWindowBound(hhmm: string): string {
  return formatClock(parseHHMM(hhmm));
}

/**
 * Display run time for the `index`-th task scheduled tonight, staggered from
 * the window start so runs don't all claim the same minute.
 */
export function slotTimeFor(window: OvernightWindow, index: number): string {
  const start = parseHHMM(window.start);
  return formatClock(start + FIRST_RUN_OFFSET_MIN + index * RUN_STAGGER_MIN);
}

/** Small deterministic hash so a task's confidence is stable across renders. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Prepare the AI result Jarvis will present after the overnight run. Built from
 * the task's own steps so the summary reads specifically, with a stable
 * pseudo-confidence in the 80–98 range.
 */
export function buildResult(task: Task): { result: string; confidence: number } {
  const n = task.steps.length;
  const highlights = task.steps
    .slice(0, 3)
    .map((step) => step.title)
    .join("; ");
  const more = n > 3 ? `; +${n - 3} more` : "";
  const result =
    `Completed ${n}/${n} steps autonomously. ${highlights}${more}. ` +
    `Output drafted and staged — ready for your review and sign-off.`;
  const confidence = 80 + (hashString(task.id + task.title) % 19);
  return { result, confidence };
}

/**
 * Build a fresh scheduled run for a task at the given queue position.
 *
 * When `explicitTime` (an "HH:mm" string) is provided, it's used directly as
 * `scheduledFor` instead of a time derived from the queue position within the
 * automation window — this powers the drawer's "Schedule execution" time
 * picker, where the user picks an exact time rather than accepting whatever
 * slot the overnight window would assign.
 */
export function makeRun(
  role: Role,
  task: Task,
  window: OvernightWindow,
  queuePosition: number,
  now: number,
  explicitTime?: string,
): OvernightRun {
  const { result, confidence } = buildResult(task);
  return {
    key: runKey(role, task.id),
    role,
    taskId: task.id,
    taskTitle: task.title,
    category: task.category,
    stepCount: task.steps.length,
    status: "scheduled",
    scheduledFor: explicitTime ? formatWindowBound(explicitTime) : slotTimeFor(window, queuePosition),
    result,
    confidence,
    updatedAt: now,
  };
}

/**
 * Build a run that goes straight to "ready" with a generated result,
 * bypassing the scheduled/running stages entirely. This is what persists a
 * Completed artifact once the Task_Panel's "Execute now" path reaches its
 * `done` state — the plan/execute UI already showed the "work happening", so
 * there's no need to re-simulate scheduling or running for it.
 */
export function makeCompletedRun(role: Role, task: Task, now: number): OvernightRun {
  const { result, confidence } = buildResult(task);
  const at = new Date(now);
  const minutesSinceMidnight = at.getHours() * 60 + at.getMinutes();
  return {
    key: runKey(role, task.id),
    role,
    taskId: task.id,
    taskTitle: task.title,
    category: task.category,
    stepCount: task.steps.length,
    status: "ready",
    scheduledFor: formatClock(minutesSinceMidnight),
    result,
    confidence,
    updatedAt: now,
  };
}

/** All runs belonging to a role, newest scheduling first is not guaranteed. */
export function runsForRole(state: OvernightState, role: Role): OvernightRun[] {
  return Object.values(state.runs).filter((run) => run.role === role);
}

/** Count runs for a role that still occupy a queue slot (used for staggering + badges). */
export function queuedCountForRole(state: OvernightState, role: Role): number {
  return runsForRole(state, role).filter((run) => QUEUE_STATUSES.has(run.status))
    .length;
}

/** Count runs for a role awaiting the morning review. */
export function readyCountForRole(state: OvernightState, role: Role): number {
  return runsForRole(state, role).filter((run) => run.status === "ready").length;
}

// ─── Persistence (best-effort; never throws into the UI) ─────────────────────

function isValidStatus(value: unknown): value is OvernightStatus {
  return (
    value === "scheduled" ||
    value === "running" ||
    value === "ready" ||
    value === "approved" ||
    value === "changes_requested"
  );
}

function isValidRun(value: unknown): value is OvernightRun {
  if (typeof value !== "object" || value === null) return false;
  const run = value as Record<string, unknown>;
  return (
    typeof run.key === "string" &&
    typeof run.taskId === "string" &&
    typeof run.role === "string" &&
    (ROLE_IDS as string[]).includes(run.role as string) &&
    isValidStatus(run.status)
  );
}

/** The empty state used on first load or when stored data is unusable. */
export function emptyState(): OvernightState {
  return { window: { ...DEFAULT_OVERNIGHT_WINDOW }, runs: {} };
}

/** Load + validate the overnight state; falls back to an empty state. */
export function loadOvernight(
  storage: Pick<Storage, "getItem">,
): OvernightState {
  try {
    const raw = storage.getItem(OVERNIGHT_STORAGE_KEY);
    if (raw === null) return emptyState();

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptyState();

    const record = parsed as Record<string, unknown>;
    const window =
      typeof record.window === "object" && record.window !== null
        ? (record.window as OvernightWindow)
        : { ...DEFAULT_OVERNIGHT_WINDOW };

    const runs: Record<string, OvernightRun> = {};
    if (typeof record.runs === "object" && record.runs !== null) {
      for (const [key, value] of Object.entries(record.runs)) {
        if (isValidRun(value)) runs[key] = value;
      }
    }
    return { window, runs };
  } catch {
    console.warn("Failed to load overnight queue; starting empty.");
    return emptyState();
  }
}

/** Persist the overnight state; swallows storage failures. */
export function saveOvernight(
  storage: Pick<Storage, "setItem">,
  state: OvernightState,
): void {
  try {
    storage.setItem(OVERNIGHT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to persist overnight queue.");
  }
}
