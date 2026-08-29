// Overnight automation defaults and persistence key.
//
// The overnight window is the span during which Jarvis autonomously executes
// delegated tasks so their results are ready for a morning review. The window
// and the queue of runs are persisted separately from the dashboard layout so
// the two concerns stay independent.

import type { OvernightWindow } from "@/types";

/** Default nightly automation window: 11:00 PM → 6:00 AM. */
export const DEFAULT_OVERNIGHT_WINDOW: OvernightWindow = {
  start: "23:00",
  end: "06:00",
};

/** Versioned localStorage key for the overnight queue + window. */
export const OVERNIGHT_STORAGE_KEY = "jarvis.overnight.v1";

/** Minutes after the window opens before the first run starts. */
export const FIRST_RUN_OFFSET_MIN = 90;

/** Minutes between consecutive scheduled runs. */
export const RUN_STAGGER_MIN = 50;
