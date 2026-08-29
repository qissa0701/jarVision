// Unit tests for the deterministic week-view synthesis.
//
// `synthesizeWeek`/`groupByWeekday` distribute a role's existing meetings
// across Mon–Fri without touching the shared `Meeting` type. These tests
// assert determinism (stable across calls/renders), full coverage (no
// meeting dropped or duplicated), and stable per-day ordering.

import { describe, it, expect } from "vitest";
import type { Meeting } from "@/types";
import { WEEKDAY_LABELS } from "@/constants/calendar";
import { groupByWeekday, synthesizeWeek } from "./weekView";

function meeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: "m1",
    title: "Standup",
    startTime: "9:00",
    endTime: "9:15",
    type: "video",
    attendees: "Team (5)",
    ...overrides,
  };
}

describe("synthesizeWeek", () => {
  it("assigns every meeting to one of the Mon-Fri weekday labels", () => {
    const meetings = [meeting({ id: "m1" }), meeting({ id: "m2" }), meeting({ id: "m3" })];
    const result = synthesizeWeek(meetings);

    expect(result).toHaveLength(3);
    for (const { weekday } of result) {
      expect(WEEKDAY_LABELS).toContain(weekday);
    }
  });

  it("is deterministic: the same meeting id always maps to the same weekday", () => {
    const meetings = [meeting({ id: "stable-id" })];
    const first = synthesizeWeek(meetings)[0].weekday;
    const second = synthesizeWeek(meetings)[0].weekday;
    const third = synthesizeWeek([meeting({ id: "stable-id" })])[0].weekday;

    expect(first).toBe(second);
    expect(first).toBe(third);
  });

  it("produces different assignments for meetings with different ids (not all on one day)", () => {
    // Enough distinct ids that collapsing onto a single day would be
    // statistically very unlikely if the hash is working as intended.
    const meetings = Array.from({ length: 10 }, (_, i) => meeting({ id: `id-${i}` }));
    const result = synthesizeWeek(meetings);
    const distinctWeekdays = new Set(result.map((r) => r.weekday));

    expect(distinctWeekdays.size).toBeGreaterThan(1);
  });
});

describe("groupByWeekday", () => {
  it("includes every weekday key even when no meetings land on it", () => {
    const grouped = groupByWeekday([]);
    for (const weekday of WEEKDAY_LABELS) {
      expect(grouped[weekday]).toEqual([]);
    }
  });

  it("preserves every input meeting exactly once across all days", () => {
    const meetings = [meeting({ id: "m1" }), meeting({ id: "m2" }), meeting({ id: "m3" })];
    const weekMeetings = synthesizeWeek(meetings);
    const grouped = groupByWeekday(weekMeetings);

    const allGrouped = WEEKDAY_LABELS.flatMap((day) => grouped[day]);
    expect(allGrouped).toHaveLength(meetings.length);
    expect(new Set(allGrouped.map((m) => m.id))).toEqual(
      new Set(meetings.map((m) => m.id)),
    );
  });

  it("sorts each day's meetings by start time", () => {
    const weekMeetings = [
      { weekday: "Mon" as const, meeting: meeting({ id: "late", startTime: "15:00" }) },
      { weekday: "Mon" as const, meeting: meeting({ id: "early", startTime: "9:00" }) },
    ];
    const grouped = groupByWeekday(weekMeetings);

    expect(grouped.Mon.map((m) => m.id)).toEqual(["early", "late"]);
  });
});
