// useMeetingPrep — React adapter over the pure meeting-prep logic.
//
// Owns the persisted draft/approve state for each meeting's prep material
// (talking points/agenda), keyed by role + meeting id. Drafting produces mock
// generated text; approval/edit/discard are explicit human actions — nothing
// here auto-applies a draft. Mirrors `useOvernightQueue`'s layering: all
// state-shape logic lives in `src/lib/meetingPrep.ts`; this hook only wires
// that logic to React state and persistence.

import { useCallback, useState } from "react";
import type { Meeting, Role } from "@/types";
import {
  draftPrepText,
  emptyPrepState,
  getDraft,
  loadPrepState,
  savePrepState,
  withDraft,
  type PrepDraftState,
  type PrepState,
} from "@/lib/meetingPrep";
import { CALENDAR_PREP_STORAGE_KEY } from "@/constants/calendar";

/** The subset of Storage this hook needs. */
export type MeetingPrepStorage = Pick<Storage, "getItem" | "setItem">;

export interface MeetingPrepController {
  /** Look up a meeting's current draft state (defaults to "none"). */
  getDraftFor: (meeting: Meeting) => PrepDraftState;
  /** Generate a fresh mock draft for a meeting (→ "drafted"). */
  draft: (meeting: Meeting) => void;
  /** Update the draft text as the user edits it inline. */
  editDraft: (meeting: Meeting, text: string) => void;
  /** Explicitly approve the current draft (→ "approved"). */
  approve: (meeting: Meeting) => void;
  /** Discard the draft entirely, returning to "none". */
  discard: (meeting: Meeting) => void;
  /** Reopen an approved draft for editing (→ "drafted", text unchanged). */
  reopen: (meeting: Meeting) => void;
}

export function useMeetingPrep(
  role: Role,
  storage: MeetingPrepStorage = window.localStorage,
): MeetingPrepController {
  const [state, setState] = useState<PrepState>(() => {
    try {
      return loadPrepState(storage, CALENDAR_PREP_STORAGE_KEY);
    } catch {
      return emptyPrepState();
    }
  });

  const persist = useCallback(
    (next: PrepState) => {
      setState(next);
      savePrepState(storage, CALENDAR_PREP_STORAGE_KEY, next);
    },
    [storage],
  );

  const getDraftFor = useCallback(
    (meeting: Meeting) => getDraft(state, role, meeting.id),
    [state, role],
  );

  const draft = useCallback(
    (meeting: Meeting) => {
      persist(
        withDraft(state, role, meeting.id, {
          status: "drafted",
          text: draftPrepText(meeting),
          updatedAt: Date.now(),
        }),
      );
    },
    [state, role, persist],
  );

  const editDraft = useCallback(
    (meeting: Meeting, text: string) => {
      const current = getDraft(state, role, meeting.id);
      persist(
        withDraft(state, role, meeting.id, {
          ...current,
          text,
          updatedAt: Date.now(),
        }),
      );
    },
    [state, role, persist],
  );

  const approve = useCallback(
    (meeting: Meeting) => {
      const current = getDraft(state, role, meeting.id);
      persist(
        withDraft(state, role, meeting.id, {
          ...current,
          status: "approved",
          updatedAt: Date.now(),
        }),
      );
    },
    [state, role, persist],
  );

  const discard = useCallback(
    (meeting: Meeting) => {
      persist(
        withDraft(state, role, meeting.id, {
          status: "none",
          text: "",
          updatedAt: Date.now(),
        }),
      );
    },
    [state, role, persist],
  );

  const reopen = useCallback(
    (meeting: Meeting) => {
      const current = getDraft(state, role, meeting.id);
      persist(
        withDraft(state, role, meeting.id, {
          ...current,
          status: "drafted",
          updatedAt: Date.now(),
        }),
      );
    },
    [state, role, persist],
  );

  return { getDraftFor, draft, editDraft, approve, discard, reopen };
}
