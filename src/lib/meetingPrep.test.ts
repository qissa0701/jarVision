// Unit tests for meeting-prep generation, the "needs prep" heuristic, and the
// draft/approve persistence helpers.

import { describe, it, expect, vi } from "vitest";
import type { Meeting } from "@/types";
import {
  buildSummary,
  buildTalkingPoints,
  draftPrepText,
  emptyPrepState,
  gatherDocs,
  getDraft,
  hasMultipleAttendees,
  loadPrepState,
  meetingDurationMinutes,
  needsPrep,
  savePrepState,
  withDraft,
} from "./meetingPrep";

function meeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: "m1",
    title: "Sprint Standup",
    startTime: "9:00",
    endTime: "9:15",
    type: "video",
    attendees: "Team (8)",
    ...overrides,
  };
}

describe("gatherDocs / buildSummary / buildTalkingPoints", () => {
  it("returns 2-4 deterministic docs for the same meeting", () => {
    const m = meeting();
    const first = gatherDocs(m);
    const second = gatherDocs(m);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThanOrEqual(2);
    expect(first.length).toBeLessThanOrEqual(4);
  });

  it("includes the meeting's title/attendees/time in the summary", () => {
    const m = meeting({ title: "Architecture Review", attendees: "Eng leads (5)" });
    const summary = buildSummary(m);
    expect(summary).toContain("Architecture Review");
    expect(summary).toContain("Eng leads (5)");
  });

  it("returns 2-4 deterministic talking points for the same meeting", () => {
    const m = meeting();
    const first = buildTalkingPoints(m);
    const second = buildTalkingPoints(m);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThanOrEqual(2);
    expect(first.length).toBeLessThanOrEqual(4);
  });
});

describe("draftPrepText", () => {
  it("includes the meeting title and enumerated talking points", () => {
    const m = meeting({ title: "1:1 with Sarah Kim" });
    const text = draftPrepText(m);
    expect(text).toContain("1:1 with Sarah Kim");
    expect(text).toMatch(/1\./);
  });
});

describe("meetingDurationMinutes", () => {
  it("computes the duration in minutes", () => {
    expect(meetingDurationMinutes(meeting({ startTime: "9:00", endTime: "9:45" }))).toBe(45);
  });
});

describe("hasMultipleAttendees", () => {
  it("returns true for a parenthesized count greater than 1", () => {
    expect(hasMultipleAttendees(meeting({ attendees: "Team (8)" }))).toBe(true);
  });

  it("returns false for a parenthesized count of 1", () => {
    expect(hasMultipleAttendees(meeting({ attendees: "Solo (1)" }))).toBe(false);
  });

  it("returns true for a comma-separated attendee list", () => {
    expect(hasMultipleAttendees(meeting({ attendees: "CEO, Chief of Staff" }))).toBe(true);
  });

  it("returns false for a single named attendee", () => {
    expect(hasMultipleAttendees(meeting({ attendees: "Sarah K." }))).toBe(false);
  });
});

describe("needsPrep heuristic", () => {
  it("is true for a meeting >= 30 minutes even with a single attendee", () => {
    const m = meeting({ startTime: "9:00", endTime: "9:30", attendees: "Sarah K." });
    expect(needsPrep(m)).toBe(true);
  });

  it("is true for a meeting with multiple attendees even if short", () => {
    const m = meeting({ startTime: "9:00", endTime: "9:15", attendees: "Team (8)" });
    expect(needsPrep(m)).toBe(true);
  });

  it("is false for a short meeting with a single attendee", () => {
    const m = meeting({ startTime: "9:00", endTime: "9:15", attendees: "Sarah K." });
    expect(needsPrep(m)).toBe(false);
  });
});

describe("prep state persistence", () => {
  it("round-trips a draft through save/load", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    };
    const key = "test.prep";

    const state = withDraft(emptyPrepState(), "engineer", "m1", {
      status: "drafted",
      text: "Draft text",
      updatedAt: 123,
    });
    savePrepState(storage, key, state);

    const loaded = loadPrepState(storage, key);
    expect(getDraft(loaded, "engineer", "m1")).toEqual({
      status: "drafted",
      text: "Draft text",
      updatedAt: 123,
    });
  });

  it("falls back to an empty state when storage throws", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("boom");
      }),
    };
    const loaded = loadPrepState(storage, "test.prep");
    expect(getDraft(loaded, "engineer", "m1").status).toBe("none");
  });

  it("falls back to an empty state for malformed JSON", () => {
    const storage = { getItem: () => "not json" };
    const loaded = loadPrepState(storage, "test.prep");
    expect(getDraft(loaded, "engineer", "m1").status).toBe("none");
  });

  it("getDraft defaults to a fresh 'none' state for an unknown meeting", () => {
    expect(getDraft(emptyPrepState(), "engineer", "unknown")).toEqual({
      status: "none",
      text: "",
      updatedAt: 0,
    });
  });
});
