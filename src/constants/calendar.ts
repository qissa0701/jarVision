// Calendar widget time slots (Requirement 1.3).
// Ported verbatim from the original src/app/App.tsx monolith.

export const TIME_SLOTS = [
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
] as const;

// ─── Calendar widget Phase 2 (Plan My Day / week view / notes / prep) ────────

/** Weekday labels for the synthesized Mon–Fri week view. */
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export type WeekdayLabel = (typeof WEEKDAY_LABELS)[number];

/** "Plan My Day" scheduling bounds — a typical 9am–5pm workday. */
export const PLAN_DAY_START = "9:00";
export const PLAN_DAY_END = "17:00";

/**
 * Fixed duration (minutes) of each focus block "Plan My Day" carves out of
 * free time for a priority item. Kept simple/deterministic per the product
 * spec rather than trying to estimate effort per item.
 */
export const FOCUS_BLOCK_DURATION_MIN = 30;

/**
 * Meeting-prep heuristic threshold: meetings running this long (in minutes)
 * or longer are considered to "need prep" (see `src/lib/meetingPrep.ts` for
 * the full heuristic, which also considers attendee count).
 */
export const PREP_MIN_DURATION_MIN = 30;

/** Versioned localStorage key for the free-text daily notes, keyed by role. */
export const CALENDAR_NOTES_STORAGE_KEY = "jarvis.calendar.notes.v1";

/** Versioned localStorage key for meeting-prep draft/approve state. */
export const CALENDAR_PREP_STORAGE_KEY = "jarvis.calendar.prep.v1";

/**
 * Versioned localStorage key for "Plan My Day" focus blocks that have been
 * synced into the Calendar widget's displayed schedule, keyed by role.
 */
export const CALENDAR_SYNCED_FOCUS_STORAGE_KEY = "jarvis.calendar.syncedFocus.v1";

/** Debounce delay before a note edit is written to storage. */
export const CALENDAR_NOTES_DEBOUNCE_MS = 400;
