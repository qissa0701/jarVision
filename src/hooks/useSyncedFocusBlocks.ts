// useSyncedFocusBlocks — React adapter over the pure synced-focus-block logic.
//
// Owns the persisted list of "Plan My Day" focus blocks that have been
// synced into the Calendar widget's actual displayed schedule for the active
// role. Mirrors `useCalendarNotes`'s layering: all load/save/merge logic
// lives in `src/lib/syncedFocusBlocks.ts`; this hook only wires that logic to
// React state and persistence.

import { useCallback, useState } from "react";
import type { Role } from "@/types";
import type { PlanBlock } from "@/lib/planMyDay";
import {
  loadSyncedFocusBlocks,
  saveSyncedFocusBlocks,
  toSyncedFocusBlock,
  withSyncedFocusBlocks,
  type SyncedFocusBlock,
  type SyncedFocusState,
} from "@/lib/syncedFocusBlocks";
import { CALENDAR_SYNCED_FOCUS_STORAGE_KEY } from "@/constants/calendar";

/** The subset of Storage this hook needs. */
export type SyncedFocusBlocksStorage = Pick<Storage, "getItem" | "setItem">;

export interface SyncedFocusBlocksController {
  /** The active role's currently synced focus blocks. */
  syncedBlocks: SyncedFocusBlock[];
  /**
   * Sync the given "Plan My Day" focus blocks into the active role's real
   * schedule (persisted). Returns the number of blocks synced.
   */
  syncBlocks: (blocks: PlanBlock[]) => number;
}

/**
 * React hook exposing the active role's synced focus blocks, persisted per
 * role.
 *
 * @param role - the active role; synced blocks are stored independently per
 *   role.
 * @param storage - anything exposing `getItem`/`setItem`; defaults to
 *   `window.localStorage`. Injected for testability.
 */
export function useSyncedFocusBlocks(
  role: Role,
  storage: SyncedFocusBlocksStorage = window.localStorage,
): SyncedFocusBlocksController {
  const [state, setState] = useState<SyncedFocusState>(() =>
    loadSyncedFocusBlocks(storage, CALENDAR_SYNCED_FOCUS_STORAGE_KEY),
  );

  const syncBlocks = useCallback(
    (blocks: PlanBlock[]) => {
      const focusOnly = blocks.filter((b) => b.kind === "focus");
      const synced = focusOnly.map(toSyncedFocusBlock);
      setState((prev) => {
        const next = withSyncedFocusBlocks(prev, role, synced);
        saveSyncedFocusBlocks(storage, CALENDAR_SYNCED_FOCUS_STORAGE_KEY, next);
        return next;
      });
      return synced.length;
    },
    [role, storage],
  );

  return {
    syncedBlocks: state[role] ?? [],
    syncBlocks,
  };
}
