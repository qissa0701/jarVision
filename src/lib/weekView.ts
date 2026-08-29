// Pure logic for the Calendar widget's expanded week view.
//
// `data.meetings` only models "today" (~4 meetings, no day-of-week field) and
// the product spec prefers NOT widening the shared `Meeting` type to avoid
// blast radius on Tasks/notifications/search, which also read `RoleData`. So
// instead of adding a field, the week view is *synthesized*: each role's
// existing meetings are deterministically redistributed across Mon–Fri using
// a stable hash of the meeting id. The same input always produces the same
// week, so this is unit-testable and stable across re-renders without any
// persisted state.
//
// Side-effect free and independently unit-testable (no DOM).

import type { Meeting } from "@/types";
import { WEEKDAY_LABELS, type WeekdayLabel } from "@/constants/calendar";
import { parseHHMM } from "@/lib/overnight";

/** A meeting placed on a specific synthesized weekday. */
export interface WeekMeeting {
  weekday: WeekdayLabel;
  meeting: Meeting;
}

/** Small deterministic hash so a meeting's weekday is stable across renders. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministically assign each meeting to a weekday (Mon–Fri).
 *
 * The assignment is a pure function of `meeting.id`, so it never changes
 * between renders or across app sessions for the same data set, and every
 * role's meetings spread across the full working week rather than clustering
 * on a single day.
 */
export function synthesizeWeek(meetings: Meeting[]): WeekMeeting[] {
  return meetings.map((meeting, index) => {
    const weekdayIndex =
      hashString(meeting.id || String(index)) % WEEKDAY_LABELS.length;
    return { weekday: WEEKDAY_LABELS[weekdayIndex], meeting };
  });
}

/** Group synthesized week meetings by weekday, in `WEEKDAY_LABELS` order. */
export function groupByWeekday(
  weekMeetings: WeekMeeting[],
): Record<WeekdayLabel, Meeting[]> {
  const grouped: Record<WeekdayLabel, Meeting[]> = {
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
  };
  for (const { weekday, meeting } of weekMeetings) {
    grouped[weekday].push(meeting);
  }
  // Keep each day's meetings in a stable, readable order. `startTime` is an
  // unpadded "H:mm"/"HH:mm" string (e.g. "9:00", "15:00"), so a lexicographic
  // compare would incorrectly sort "15:00" before "9:00"; parse to minutes
  // instead.
  for (const weekday of WEEKDAY_LABELS) {
    grouped[weekday].sort(
      (a, b) => parseHHMM(a.startTime) - parseHHMM(b.startTime),
    );
  }
  return grouped;
}
