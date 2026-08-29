// Unit tests for the mock chat-assistant reply engine.
//
// Exercises every intent branch (overnight summary, priorities/focus, tasks,
// meetings, suggestions, greeting) plus the fallback, using real fixtures from
// `ROLE_DATA.engineer` and constructed `OvernightRun[]` fixtures — mirroring
// the fixture style used in `src/lib/overnight.test.ts`.

import { describe, it, expect } from "vitest";
import type { OvernightRun } from "@/types";
import { ROLE_DATA } from "@/data/roleData";
import { buildAssistantReply } from "./assistant";

const engineerData = ROLE_DATA.engineer;

function makeRun(overrides: Partial<OvernightRun> = {}): OvernightRun {
  return {
    key: "engineer:t1",
    role: "engineer",
    taskId: "t1",
    taskTitle: "Fix memory leak in auth service",
    category: "Bug",
    stepCount: 5,
    status: "ready",
    scheduledFor: "12:30 AM",
    result: "Completed 5/5 steps autonomously. Output drafted and staged.",
    confidence: 92,
    updatedAt: 0,
    ...overrides,
  };
}

describe("buildAssistantReply — overnight summary", () => {
  it("summarizes counts by status for a mix of runs", () => {
    const runs: OvernightRun[] = [
      makeRun({ taskId: "t1", status: "ready" }),
      makeRun({ taskId: "t2", status: "scheduled", result: null }),
      makeRun({ taskId: "t3", status: "running", result: null }),
    ];
    const reply = buildAssistantReply("what happened overnight?", {
      data: engineerData,
      overnightRuns: runs,
    });
    expect(reply).toMatch(/3 tasks/i);
    expect(reply).toMatch(/1 ready for your review/i);
    expect(reply).toMatch(/1 scheduled/i);
    expect(reply).toMatch(/1 running/i);
  });

  it("names the task and result text for ready/approved runs", () => {
    const runs: OvernightRun[] = [
      makeRun({ taskId: "t1", taskTitle: "Fix memory leak", status: "ready", result: "Drafted a fix." }),
      makeRun({ taskId: "t2", taskTitle: "Review PR #834", status: "approved", result: "Left review comments." }),
    ];
    const reply = buildAssistantReply("last night, what did you do?", {
      data: engineerData,
      overnightRuns: runs,
    });
    expect(reply).toContain("Fix memory leak");
    expect(reply).toContain("Drafted a fix.");
    expect(reply).toContain("Review PR #834");
    expect(reply).toContain("Left review comments.");
  });

  it('matches the "while I slept" phrasing', () => {
    const reply = buildAssistantReply("help me run through what you did while I slept", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toMatch(/nothing ran overnight/i);
  });

  it("handles an empty overnight queue", () => {
    const reply = buildAssistantReply("summarize the overnight run", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toMatch(/nothing ran overnight/i);
  });

  it("omits the ready-run detail sentence when no runs are ready/approved", () => {
    const runs: OvernightRun[] = [makeRun({ status: "scheduled", result: null })];
    const reply = buildAssistantReply("overnight summary please", {
      data: engineerData,
      overnightRuns: runs,
    });
    expect(reply).toMatch(/1 task/i);
    expect(reply).not.toContain("ready for you");
  });
});

describe("buildAssistantReply — priorities / focus", () => {
  it('lists critical/high priorities for "priority"', () => {
    const reply = buildAssistantReply("what's the priority for today", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain("PR #847");
  });

  it('matches "priorities" (plural)', () => {
    const reply = buildAssistantReply("what are my priorities", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain("PR #847");
  });

  it('matches "focus"', () => {
    const reply = buildAssistantReply("what should I focus on", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain("PR #847");
  });

  it("excludes medium-urgency priorities", () => {
    const reply = buildAssistantReply("priorities?", {
      data: engineerData,
      overnightRuns: [],
    });
    // p4 in engineer fixture is medium urgency.
    expect(reply).not.toContain("12 API endpoints undocumented");
  });

  it("uses the role's first name when there are no critical/high priorities", () => {
    const emptyPriorityData = { ...engineerData, priorities: [] };
    const reply = buildAssistantReply("priorities", {
      data: emptyPriorityData,
      overnightRuns: [],
    });
    expect(reply).toContain(engineerData.firstName);
    expect(reply).toMatch(/nothing critical or high-urgency/i);
  });
});

describe("buildAssistantReply — tasks", () => {
  it('lists task titles with due/category for "task"', () => {
    const reply = buildAssistantReply("what are my tasks", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain("Fix memory leak in auth service");
    expect(reply).toContain("Bug");
    expect(reply).toContain("Today");
  });

  it('matches "to-do"', () => {
    const reply = buildAssistantReply("what's on my to-do list", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain("Fix memory leak in auth service");
  });

  it("handles an empty task list", () => {
    const reply = buildAssistantReply("tasks?", {
      data: { ...engineerData, tasks: [] },
      overnightRuns: [],
    });
    expect(reply).toMatch(/don't have any tasks/i);
  });
});

describe("buildAssistantReply — meetings / calendar / schedule", () => {
  it('lists meetings with time and attendees for "meeting"', () => {
    // Deliberately avoids "today" here, since that's also a listed priority
    // keyword and priorities are checked first per the spec's intent order —
    // see the note in the "priority keyword precedence" test below.
    const reply = buildAssistantReply("do I have any meetings", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain("Sprint Standup");
    expect(reply).toContain("9:00");
    expect(reply).toContain("Team (8)");
  });

  it('a query mentioning both "today" and "meetings" resolves to priorities, since priority keywords are checked first (documented precedence)', () => {
    const reply = buildAssistantReply("do I have any meetings today", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toMatch(/top priority/i);
  });

  it('matches "calendar"', () => {
    const reply = buildAssistantReply("what's on my calendar", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain("Sprint Standup");
  });

  it('matches "schedule"', () => {
    const reply = buildAssistantReply("walk me through my schedule", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain("Sprint Standup");
  });

  it("handles an empty meeting list", () => {
    const reply = buildAssistantReply("meetings?", {
      data: { ...engineerData, meetings: [] },
      overnightRuns: [],
    });
    expect(reply).toMatch(/don't have any meetings/i);
  });
});

describe("buildAssistantReply — suggestions / recommendations", () => {
  it('lists suggestion text for "suggest"', () => {
    const reply = buildAssistantReply("any suggestions?", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain("PR #847 has been open 3 days");
  });

  it('matches "recommend"', () => {
    const reply = buildAssistantReply("what do you recommend", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain("PR #847 has been open 3 days");
  });

  it("handles an empty suggestion list", () => {
    const reply = buildAssistantReply("suggestions", {
      data: { ...engineerData, suggestions: [] },
      overnightRuns: [],
    });
    expect(reply).toMatch(/don't have any suggestions/i);
  });
});

describe("buildAssistantReply — greeting", () => {
  it('greets by first name for "hi"', () => {
    const reply = buildAssistantReply("hi there", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain(engineerData.firstName);
    expect(reply).toMatch(/jarvis/i);
  });

  it('matches "hello"', () => {
    const reply = buildAssistantReply("hello!", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain(engineerData.firstName);
  });

  it('matches "hey"', () => {
    const reply = buildAssistantReply("hey jarvis", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toContain(engineerData.firstName);
  });

  it('does not false-positive on a word containing "hi" (e.g. "this")', () => {
    const reply = buildAssistantReply("this is a test", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).not.toContain(engineerData.firstName);
  });
});

describe("buildAssistantReply — fallback", () => {
  it("names the topics it can help with for an unrecognized query", () => {
    const reply = buildAssistantReply("tell me a joke about databases", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply).toMatch(/priorities/i);
    expect(reply).toMatch(/tasks/i);
    expect(reply).toMatch(/meetings/i);
    expect(reply).toMatch(/overnight/i);
    expect(reply).toMatch(/suggestions/i);
  });

  it("never returns an empty string for gibberish input", () => {
    const reply = buildAssistantReply("asdkjhaskjdh", {
      data: engineerData,
      overnightRuns: [],
    });
    expect(reply.length).toBeGreaterThan(0);
  });
});

describe("buildAssistantReply — determinism", () => {
  it("returns the exact same reply for the same query and context", () => {
    const context = { data: engineerData, overnightRuns: [] };
    const first = buildAssistantReply("what are my priorities", context);
    const second = buildAssistantReply("what are my priorities", context);
    expect(first).toBe(second);
  });

  it("is case-insensitive", () => {
    const context = { data: engineerData, overnightRuns: [] };
    const lower = buildAssistantReply("what are my priorities", context);
    const upper = buildAssistantReply("WHAT ARE MY PRIORITIES", context);
    expect(lower).toBe(upper);
  });
});
