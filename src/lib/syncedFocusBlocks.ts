// Pure load/save/merge logic for "Plan My Day" focus blocks that have been
// synced into the Calendar widget's actual displayed schedule.
//
// `data.meetings` is read-only mock data owned by `ROLE_DATA` and must never
// be mutated, so a synced focus block is modeled as its own persisted shape,
// entirely separate from `Meeting`. Synced blocks are persisted per role
// (not per day — this is a single-day prototype, mirroring how
// `src/lib/calendarNotes.ts` and `src/lib/meetingPrep.ts` key their state) so
// switching roles never shows another role's synced focus time. Side-effect
// free aside from the explicit storage load/save, which inject `Storage`.

import type { Role } from "@/types";
import type { PlanBlock } from "@/lib/planMyDay";
import { ROLE_IDS } from "@/constants/roles";

/** A "Plan My Day" focus block that has been synced into the real schedule. */
export interface SyncedFocusBlock {
  /** Stable id (derived from priority id + start time) so re-syncing the same plan never duplicates an entry. */
  id: string;
  /** Minutes since midnight. */
  startMinutes: number;
  /** Minutes since midnight. */
  endMinutes: number;
  /** Human-readable start time, e.g. "9:00 AM". */
  startLabel: string;
  /** Human-readable end time, e.g. "9:30 AM". */
  endLabel: string;
  /** The synced block's display title (taken from the source priority). */
  title: string;
  /** The originating priority's id, kept for traceability back to the plan. */
  priorityId: string;
}

/** The persisted shape: synced focus blocks keyed by role. */
export type SyncedFocusState = Record<Role, SyncedFocusBlock[]>;

function emptyRoleMap(): SyncedFocusState {
  const map = {} as SyncedFocusState;
  for (const role of ROLE_IDS) map[role] = [];
  return map;
}

/** The empty state used on first load or when stored data is unusable. */
export function emptySyncedFocusState(): SyncedFocusState {
  return emptyRoleMap();
}

function focusBlockId(block: PlanBlock): string {
  return `${block.priority?.id ?? "focus"}-${block.startMinutes}`;
}

/** Map a generated "Plan My Day" focus block to its synced/persisted shape. */
export function toSyncedFocusBlock(block: PlanBlock): SyncedFocusBlock {
  return {
    id: focusBlockId(block),
    startMinutes: block.startMinutes,
    endMinutes: block.endMinutes,
    startLabel: block.startLabel,
    endLabel: block.endLabel,
    title: block.title,
    priorityId: block.priority?.id ?? "",
  };
}

function isValidSyncedFocusBlock(value: unknown): value is SyncedFocusBlock {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.id === "string" &&
    typeof b.startMinutes === "number" &&
    typeof b.endMinutes === "number" &&
    typeof b.startLabel === "string" &&
    typeof b.endLabel === "string" &&
    typeof b.title === "string" &&
    typeof b.priorityId === "string"
  );
}

/** Load + validate the persisted synced focus blocks; falls back to an empty state. */
export function loadSyncedFocusBlocks(
  storage: Pick<Storage, "getItem">,
  key: string,
): SyncedFocusState {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return emptySyncedFocusState();

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptySyncedFocusState();

    const result = emptyRoleMap();
    for (const [role, value] of Object.entries(parsed as Record<string, unknown>)) {
      if ((ROLE_IDS as string[]).includes(role) && Array.isArray(value)) {
        result[role as Role] = value.filter(isValidSyncedFocusBlock);
      }
    }
    return result;
  } catch {
    console.warn("Failed to load synced focus blocks; starting empty.");
    return emptySyncedFocusState();
  }
}

/** Persist the synced focus blocks; swallows storage failures. */
export function saveSyncedFocusBlocks(
  storage: Pick<Storage, "setItem">,
  key: string,
  state: SyncedFocusState,
): void {
  try {
    storage.setItem(key, JSON.stringify(state));
  } catch {
    console.warn("Failed to persist synced focus blocks.");
  }
}

/**
 * Merge newly-synced focus blocks into `role`'s existing list, de-duplicating
 * by id so re-syncing the same plan (e.g. after closing and reopening the
 * panel) never produces duplicate calendar entries.
 */
export function withSyncedFocusBlocks(
  state: SyncedFocusState,
  role: Role,
  blocks: SyncedFocusBlock[],
): SyncedFocusState {
  const existing = state[role] ?? [];
  const byId = new Map(existing.map((b) => [b.id, b]));
  for (const block of blocks) byId.set(block.id, block);
  return { ...state, [role]: Array.from(byId.values()) };
}
