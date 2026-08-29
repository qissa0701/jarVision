// Pure logic for the Calendar widget's "Plan My Day" feature.
//
// Produces a deterministic, locally-computed time-blocked schedule for the
// day: the role's fixed meetings stay put, and the highest-urgency priority
// items are sliced into fixed-size focus blocks and dropped into the free
// gaps between meetings (earliest gap first). No backend/AI call — this is a
// prototype heuristic, same spirit as `src/lib/overnight.ts`'s pure
// scheduling math.
//
// Priorities (not tasks) are used as the sequenced items: a role's
// `priorities` array is already the day's top-of-mind concerns, ordered by
// urgency, and using it here avoids reaching into the Tasks widget's domain
// (`Task`/`TaskStep`), keeping this feature's blast radius scoped to the
// Calendar widget as required by this phase.
//
// Side-effect free and independently unit-testable (no DOM).

import type { Meeting, Priority } from "@/types";
import { formatClock, parseHHMM } from "@/lib/overnight";
import {
  FOCUS_BLOCK_DURATION_MIN,
  PLAN_DAY_END,
  PLAN_DAY_START,
} from "@/constants/calendar";

export type PlanBlockKind = "meeting" | "focus";

/** A single row in the generated day plan, in chronological order. */
export interface PlanBlock {
  kind: PlanBlockKind;
  /** Minutes since midnight. */
  startMinutes: number;
  /** Minutes since midnight. */
  endMinutes: number;
  /** Human-readable start time, e.g. "9:00 AM". */
  startLabel: string;
  /** Human-readable end time, e.g. "9:30 AM". */
  endLabel: string;
  title: string;
  detail: string;
  /** Present when `kind === "meeting"`. */
  meeting?: Meeting;
  /** Present when `kind === "focus"`. */
  priority?: Priority;
}

const URGENCY_RANK: Record<Priority["urgency"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

function meetingToBlock(meeting: Meeting): PlanBlock {
  const startMinutes = parseHHMM(meeting.startTime);
  const endMinutes = parseHHMM(meeting.endTime);
  return {
    kind: "meeting",
    startMinutes,
    endMinutes,
    startLabel: formatClock(startMinutes),
    endLabel: formatClock(endMinutes),
    title: meeting.title,
    detail: `Microsoft Teams · ${meeting.attendees}`,
    meeting,
  };
}

/**
 * Build today's time-blocked plan.
 *
 * Meetings are fixed and never moved. Free time between `dayStart` and
 * `dayEnd` (outside of any meeting) is carved into `blockDurationMin` focus
 * blocks and filled with priorities in urgency order (critical → high →
 * medium, ties broken by original order) until either the free time or the
 * priority list runs out. The result is fully sorted chronologically so
 * meetings and focus blocks interleave naturally.
 */
export function buildDayPlan(
  meetings: Meeting[],
  priorities: Priority[],
  dayStart: string = PLAN_DAY_START,
  dayEnd: string = PLAN_DAY_END,
  blockDurationMin: number = FOCUS_BLOCK_DURATION_MIN,
): PlanBlock[] {
  const dayStartMinutes = parseHHMM(dayStart);
  const dayEndMinutes = parseHHMM(dayEnd);

  const meetingBlocks = meetings
    .map(meetingToBlock)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  // Compute free gaps between dayStart/dayEnd around the fixed meetings.
  const gaps: Array<{ start: number; end: number }> = [];
  let cursor = dayStartMinutes;
  for (const block of meetingBlocks) {
    const gapStart = Math.max(cursor, dayStartMinutes);
    const gapEnd = Math.min(block.startMinutes, dayEndMinutes);
    if (gapEnd > gapStart) {
      gaps.push({ start: gapStart, end: gapEnd });
    }
    cursor = Math.max(cursor, block.endMinutes);
  }
  if (cursor < dayEndMinutes) {
    gaps.push({ start: cursor, end: dayEndMinutes });
  }

  // Highest-urgency, topmost priorities are placed first into the earliest
  // available gaps, one fixed-size focus block per priority.
  const orderedPriorities = [...priorities].sort(
    (a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency],
  );

  const focusBlocks: PlanBlock[] = [];
  let priorityIndex = 0;
  for (const gap of gaps) {
    let slotStart = gap.start;
    while (
      priorityIndex < orderedPriorities.length &&
      slotStart + blockDurationMin <= gap.end
    ) {
      const priority = orderedPriorities[priorityIndex];
      const slotEnd = slotStart + blockDurationMin;
      focusBlocks.push({
        kind: "focus",
        startMinutes: slotStart,
        endMinutes: slotEnd,
        startLabel: formatClock(slotStart),
        endLabel: formatClock(slotEnd),
        title: priority.title,
        detail: priority.context,
        priority,
      });
      slotStart = slotEnd;
      priorityIndex += 1;
    }
  }

  return [...meetingBlocks, ...focusBlocks].sort(
    (a, b) => a.startMinutes - b.startMinutes,
  );
}
