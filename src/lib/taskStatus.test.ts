// Unit tests for the pure task-status derivation and count logic.

import { describe, it, expect } from "vitest";
import type { OvernightRun, Task } from "@/types";
import { countTasksByStatus, deriveTaskStatus, type TaskStatus } from "./taskStatus";

function makeRun(overrides: Partial<OvernightRun> = {}): OvernightRun {
  return {
    key: "engineer:t1",
    role: "engineer",
    taskId: "t1",
    taskTitle: "Fix memory leak",
    category: "Bug",
    stepCount: 5,
    status: "scheduled",
    scheduledFor: "1:30 AM",
    result: null,
    confidence: null,
    updatedAt: 0,
    ...overrides,
  };
}

function makeTask(id: string): Task {
  return { id, title: `Task ${id}`, due: "Today", category: "Bug", steps: [] };
}

describe("deriveTaskStatus", () => {
  it("returns not_started when there is no run and it isn't executing", () => {
    expect(deriveTaskStatus(undefined, false)).toBe("not_started");
  });

  it("returns scheduled for a scheduled run", () => {
    expect(deriveTaskStatus(makeRun({ status: "scheduled" }), false)).toBe("scheduled");
  });

  it("returns scheduled for a changes_requested run", () => {
    expect(deriveTaskStatus(makeRun({ status: "changes_requested" }), false)).toBe(
      "scheduled",
    );
  });

  it("returns in_progress for a running run", () => {
    expect(deriveTaskStatus(makeRun({ status: "running" }), false)).toBe("in_progress");
  });

  it("returns in_progress when currently executing via the Task_Panel, even with no run", () => {
    expect(deriveTaskStatus(undefined, true)).toBe("in_progress");
  });

  it("prefers the scheduled/changes_requested check over isExecuting, per the spec's precedence order", () => {
    // Rule 2 (scheduled/changes_requested) is checked before rule 3
    // (running/executing), so a scheduled run wins even if isExecuting is true.
    expect(deriveTaskStatus(makeRun({ status: "scheduled" }), true)).toBe("scheduled");
  });

  it("returns in_progress when executing and the run has no scheduled/changes_requested status", () => {
    expect(deriveTaskStatus(makeRun({ status: "ready" }), true)).toBe("in_progress");
  });

  it("returns needs_review for a ready run", () => {
    expect(deriveTaskStatus(makeRun({ status: "ready" }), false)).toBe("needs_review");
  });

  it("returns completed for an approved run", () => {
    expect(deriveTaskStatus(makeRun({ status: "approved" }), false)).toBe("completed");
  });
});

describe("countTasksByStatus", () => {
  it("counts each status plus a running all total", () => {
    const tasks = [makeTask("t1"), makeTask("t2"), makeTask("t3"), makeTask("t4")];
    const statusByTaskId: Record<string, TaskStatus> = {
      t1: "not_started",
      t2: "scheduled",
      t3: "in_progress",
      t4: "completed",
    };

    const counts = countTasksByStatus(tasks, (task) => statusByTaskId[task.id]);

    expect(counts).toEqual({
      all: 4,
      not_started: 1,
      scheduled: 1,
      in_progress: 1,
      needs_review: 0,
      completed: 1,
    });
  });

  it("returns all zeros (except all: 0) for an empty task list", () => {
    const counts = countTasksByStatus([], () => "not_started");
    expect(counts).toEqual({
      all: 0,
      not_started: 0,
      scheduled: 0,
      in_progress: 0,
      needs_review: 0,
      completed: 0,
    });
  });

  it("tallies multiple tasks sharing the same status", () => {
    const tasks = [makeTask("t1"), makeTask("t2"), makeTask("t3")];
    const counts = countTasksByStatus(tasks, () => "completed");
    expect(counts.completed).toBe(3);
    expect(counts.all).toBe(3);
  });
});
