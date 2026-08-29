// Unit tests for the overnight lib additions: explicit-time scheduling
// (`makeRun`'s `explicitTime` param) and direct-complete (`makeCompletedRun`).
// The pre-existing scheduling/result/persistence logic in this module is
// exercised indirectly via `useOvernightQueue.test.ts` and the App
// integration tests, so this file focuses on the new surface area.

import { describe, it, expect } from "vitest";
import type { Task } from "@/types";
import { makeCompletedRun, makeRun } from "./overnight";
import { DEFAULT_OVERNIGHT_WINDOW } from "@/constants/overnight";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Fix memory leak in auth service",
    due: "Today",
    category: "Bug",
    steps: [{ num: 1, title: "Capture heap snapshot", description: "…" }],
    ...overrides,
  };
}

describe("makeRun — explicit time", () => {
  it("uses the window-derived slot time when no explicit time is given", () => {
    const run = makeRun("engineer", makeTask(), DEFAULT_OVERNIGHT_WINDOW, 0, 0);
    // Window starts 23:00, first slot offset 90 min → 12:30 AM.
    expect(run.scheduledFor).toBe("12:30 AM");
    expect(run.status).toBe("scheduled");
  });

  it("uses the explicit time directly when provided, ignoring queue position", () => {
    const run = makeRun("engineer", makeTask(), DEFAULT_OVERNIGHT_WINDOW, 3, 0, "14:30");
    expect(run.scheduledFor).toBe("2:30 PM");
  });

  it("formats a midnight explicit time correctly", () => {
    const run = makeRun("engineer", makeTask(), DEFAULT_OVERNIGHT_WINDOW, 0, 0, "00:00");
    expect(run.scheduledFor).toBe("12:00 AM");
  });

  it("keys the run the same way regardless of explicit time", () => {
    const run = makeRun("engineer", makeTask({ id: "t9" }), DEFAULT_OVERNIGHT_WINDOW, 0, 0, "09:15");
    expect(run.key).toBe("engineer:t9");
    expect(run.taskId).toBe("t9");
  });
});

describe("makeCompletedRun", () => {
  it("creates a run directly in the ready status", () => {
    const run = makeCompletedRun("engineer", makeTask(), Date.now());
    expect(run.status).toBe("ready");
  });

  it("generates a non-null result and confidence", () => {
    const run = makeCompletedRun("engineer", makeTask(), Date.now());
    expect(run.result).toBeTruthy();
    expect(run.confidence).not.toBeNull();
  });

  it("keys the run consistently with the role and task id", () => {
    const run = makeCompletedRun("infrastructure", makeTask({ id: "t3" }), Date.now());
    expect(run.key).toBe("infrastructure:t3");
  });

  it("is deterministic in result/confidence for the same task (only updatedAt/scheduledFor vary by time)", () => {
    const task = makeTask();
    const a = makeCompletedRun("engineer", task, 0);
    const b = makeCompletedRun("engineer", task, 0);
    expect(a.result).toBe(b.result);
    expect(a.confidence).toBe(b.confidence);
  });
});
