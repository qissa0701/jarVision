// useCalendarNotes — React adapter over the pure calendar-notes logic.
//
// Owns the free-text "other intentions/priorities for the day" note for the
// active role, debounced-persisted to storage so typing never gets lost on
// re-render and there's no explicit save button (per the product spec).
// Mirrors `useOvernightQueue`'s layering: all load/save logic lives in
// `src/lib/calendarNotes.ts`; this hook only wires that logic to React state,
// persistence, and the debounce timer.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Role } from "@/types";
import {
  loadNotes,
  saveNotes,
  withNote,
  type CalendarNotesState,
} from "@/lib/calendarNotes";
import {
  CALENDAR_NOTES_DEBOUNCE_MS,
  CALENDAR_NOTES_STORAGE_KEY,
} from "@/constants/calendar";

/** The subset of Storage this hook needs. */
export type CalendarNotesStorage = Pick<Storage, "getItem" | "setItem">;

export interface CalendarNotesController {
  /** The active role's current note text. */
  note: string;
  /** Update the active role's note (debounced-persisted automatically). */
  setNote: (value: string) => void;
}

/**
 * React hook exposing the active role's daily note, debounced-persisted per
 * role.
 *
 * @param role - the active role; notes are stored independently per role.
 * @param storage - anything exposing `getItem`/`setItem`; defaults to
 *   `window.localStorage`. Injected for testability.
 * @param debounceMs - override for the persistence debounce delay (tests use
 *   a short delay to avoid slow, timer-heavy suites).
 */
export function useCalendarNotes(
  role: Role,
  storage: CalendarNotesStorage = window.localStorage,
  debounceMs: number = CALENDAR_NOTES_DEBOUNCE_MS,
): CalendarNotesController {
  const [state, setState] = useState<CalendarNotesState>(() =>
    loadNotes(storage, CALENDAR_NOTES_STORAGE_KEY),
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPendingSave = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cancel any pending debounced save on unmount so it never fires after the
  // component (and its storage reference) is gone.
  useEffect(() => clearPendingSave, [clearPendingSave]);

  const setNote = useCallback(
    (value: string) => {
      setState((prev) => {
        const next = withNote(prev, role, value);
        clearPendingSave();
        timerRef.current = setTimeout(() => {
          saveNotes(storage, CALENDAR_NOTES_STORAGE_KEY, next);
        }, debounceMs);
        return next;
      });
    },
    [role, storage, debounceMs, clearPendingSave],
  );

  return {
    note: state[role] ?? "",
    setNote,
  };
}
