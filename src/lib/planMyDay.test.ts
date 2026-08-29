// Unit tests for the "Plan My Day" scheduling heuristic.
//
// These exercise `buildDayPlan`'s pure scheduling math directly (no DOM):
// meetings stay fixed, priorities fill free gaps in urgency order, and the
// result is fully chronologically sorted.

import { describe, it, expect } from "vitest";
import type { Meeting, Priority } from "@/types";
import { buildDayPlan } from "./planMyDay";

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

function priority(overrides: Partial<Priority> = {}): Priority {
  return {
    id: "p1",
    title: "Fix the bug",
    urgency: "critical",
    context: "Due today",
    ...overrides,
  };
}

describe("buildDayPlan", () => {
  it("returns only meetings when there are no priorities", () => {
    const meetings = [meeting()];
    const plan = buildDayPlan(meetings, []);

    expect(plan).toHaveLength(1);
    expect(plan[0].kind).toBe("meeting");
    expect(plan[0].title).toBe("Standup");
  });

  it("returns focus blocks filling the whole day when there are no meetings", () => {
    const priorities = [
      priority({ id: "p1", urgency: "critical" }),
      priority({ id: "p2", urgency: "high" }),
    ];
    const plan = buildDayPlan([], priorities, "9:00", "10:00", 30);

    expect(plan).toHaveLength(2);
    expect(plan.every((b) => b.kind === "focus")).toBe(true);
    expect(plan[0].startLabel).toBe("9:00 AM");
    expect(plan[0].endLabel).toBe("9:30 AM");
    expect(plan[1].startLabel).toBe("9:30 AM");
    expect(plan[1].endLabel).toBe("10:00 AM");
  });

  it("never moves a meeting: every meeting block's time matches the input", () => {
    const meetings = [
      meeting({ id: "m1", startTime: "9:00", endTime: "9:15" }),
      meeting({ id: "m2", startTime: "11:00", endTime: "11:30", title: "Review" }),
    ];
    const priorities = [priority()];
    const plan = buildDayPlan(meetings, priorities);

    const meetingBlocks = plan.filter((b) => b.kind === "meeting");
    expect(meetingBlocks).toHaveLength(2);
    expect(meetingBlocks[0].startLabel).toBe("9:00 AM");
    expect(meetingBlocks[0].endLabel).toBe("9:15 AM");
    expect(meetingBlocks[1].startLabel).toBe("11:00 AM");
    expect(meetingBlocks[1].endLabel).toBe("11:30 AM");
  });

  it("places the highest-urgency priorities into the earliest available gaps", () => {
    const meetings = [meeting({ id: "m1", startTime: "9:30", endTime: "10:00" })];
    const priorities = [
      priority({ id: "low", urgency: "medium", title: "Low priority item" }),
      priority({ id: "top", urgency: "critical", title: "Top priority item" }),
    ];
    // Free gap 9:00-9:30 (30 min, fits exactly one 30-min block).
    const plan = buildDayPlan(meetings, priorities, "9:00", "10:00", 30);

    const focusBlocks = plan.filter((b) => b.kind === "focus");
    expect(focusBlocks).toHaveLength(1);
    expect(focusBlocks[0].title).toBe("Top priority item");
  });

  it("returns the plan sorted chronologically, interleaving meetings and focus blocks", () => {
    const meetings = [
      meeting({ id: "m1", startTime: "11:00", endTime: "11:30" }),
      meeting({ id: "m2", startTime: "9:30", endTime: "10:00", title: "Early sync" }),
    ];
    const priorities = [priority({ id: "p1" }), priority({ id: "p2", urgency: "high" })];
    const plan = buildDayPlan(meetings, priorities, "9:00", "12:00", 30);

    const startMinutesSequence = plan.map((b) => b.startMinutes);
    const sorted = [...startMinutesSequence].sort((a, b) => a - b);
    expect(startMinutesSequence).toEqual(sorted);
  });

  it("stops placing focus blocks once free time runs out, even with priorities left over", () => {
    const meetings = [meeting({ id: "m1", startTime: "9:30", endTime: "17:00" })];
    const priorities = [priority({ id: "p1" }), priority({ id: "p2" })];
    // Only a 30-min gap (9:00-9:30) is free.
    const plan = buildDayPlan(meetings, priorities, "9:00", "17:00", 30);

    const focusBlocks = plan.filter((b) => b.kind === "focus");
    expect(focusBlocks).toHaveLength(1);
  });

  it("is deterministic: calling twice with the same input produces the same plan", () => {
    const meetings = [meeting()];
    const priorities = [priority()];
    const first = buildDayPlan(meetings, priorities);
    const second = buildDayPlan(meetings, priorities);
    expect(first).toEqual(second);
  });
});
