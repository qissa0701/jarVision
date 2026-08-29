// Unit tests for the calendar-notes pure load/save logic.

import { describe, it, expect, vi } from "vitest";
import { emptyNotesState, loadNotes, saveNotes, withNote } from "./calendarNotes";

describe("withNote", () => {
  it("sets only the given role's note, leaving others untouched", () => {
    const state = emptyNotesState();
    const next = withNote(state, "engineer", "Ship the fix");
    expect(next.engineer).toBe("Ship the fix");
    expect(next.portfolio).toBe("");
  });
});

describe("notes persistence", () => {
  it("round-trips notes through save/load", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    };
    const key = "test.notes";

    const state = withNote(emptyNotesState(), "engineer", "Focus on the deploy");
    saveNotes(storage, key, state);

    const loaded = loadNotes(storage, key);
    expect(loaded.engineer).toBe("Focus on the deploy");
  });

  it("falls back to an empty state when storage throws", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("boom");
      }),
    };
    const loaded = loadNotes(storage, "test.notes");
    expect(loaded.engineer).toBe("");
  });

  it("falls back to an empty state for malformed JSON", () => {
    const storage = { getItem: () => "not json" };
    const loaded = loadNotes(storage, "test.notes");
    expect(loaded.engineer).toBe("");
  });

  it("ignores non-string values and unknown role keys when loading", () => {
    const storage = {
      getItem: () => JSON.stringify({ engineer: 42, "not-a-role": "x", portfolio: "ok" }),
    };
    const loaded = loadNotes(storage, "test.notes");
    expect(loaded.engineer).toBe("");
    expect(loaded.portfolio).toBe("ok");
  });
});
