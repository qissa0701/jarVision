// Pure load/save logic for the Calendar widget's free-text daily notes.
//
// Notes are persisted per role (same role-keying pattern as
// `src/lib/meetingPrep.ts`'s PrepState) so switching roles never shows another
// role's jotted intentions. Side-effect free aside from the explicit
// storage load/save, which inject `Storage` — mirrors `src/lib/overnight.ts`.

import type { Role } from "@/types";
import { ROLE_IDS } from "@/constants/roles";

/** The persisted shape: free-text notes keyed by role. */
export type CalendarNotesState = Record<Role, string>;

function emptyRoleMap(): CalendarNotesState {
  const map = {} as CalendarNotesState;
  for (const role of ROLE_IDS) map[role] = "";
  return map;
}

/** The empty state used on first load or when stored data is unusable. */
export function emptyNotesState(): CalendarNotesState {
  return emptyRoleMap();
}

/** Load + validate the persisted notes; falls back to an empty state. */
export function loadNotes(
  storage: Pick<Storage, "getItem">,
  key: string,
): CalendarNotesState {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return emptyNotesState();

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptyNotesState();

    const result = emptyRoleMap();
    for (const [role, value] of Object.entries(parsed as Record<string, unknown>)) {
      if ((ROLE_IDS as string[]).includes(role) && typeof value === "string") {
        result[role as Role] = value;
      }
    }
    return result;
  } catch {
    console.warn("Failed to load calendar notes; starting empty.");
    return emptyNotesState();
  }
}

/** Persist the notes; swallows storage failures. */
export function saveNotes(
  storage: Pick<Storage, "setItem">,
  key: string,
  state: CalendarNotesState,
): void {
  try {
    storage.setItem(key, JSON.stringify(state));
  } catch {
    console.warn("Failed to persist calendar notes.");
  }
}

/** Return a copy of `state` with `role`'s note set to `note`. */
export function withNote(
  state: CalendarNotesState,
  role: Role,
  note: string,
): CalendarNotesState {
  return { ...state, [role]: note };
}
