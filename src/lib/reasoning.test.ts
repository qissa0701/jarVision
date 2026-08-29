// Unit tests for the deterministic "thinking out loud" reasoning-trace
// generator (`buildStepReasoning`). Covers:
//   • determinism — same task/step/input always produces the same trace.
//   • different output shape per tool "category" (test tool vs PR tool vs
//     db tool vs no tool at all).
//   • the input-referencing line appears only when `input` is provided (and
//     is trimmed/ignored when blank).
//   • the trace is always 3-5 lines, per the spec.

import { describe, it, expect } from "vitest";
import { buildStepReasoning } from "./reasoning";
import type { Task, TaskStep } from "@/types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Fix memory leak in auth service",
    due: "Today",
    category: "Bug",
    steps: [],
    ...overrides,
  };
}

function makeStep(overrides: Partial<TaskStep> = {}): TaskStep {
  return {
    num: 1,
    title: "Capture heap snapshot",
    description: "Capture a heap snapshot to find the leak.",
    ...overrides,
  };
}

describe("buildStepReasoning — determinism", () => {
  it("returns the exact same trace for the same task/step/input across calls", () => {
    const task = makeTask();
    const step = makeStep({ tool: "Jest" });

    const first = buildStepReasoning(task, step, "focus on the pool config");
    const second = buildStepReasoning(task, step, "focus on the pool config");

    expect(second).toEqual(first);
  });

  it("returns the exact same trace with no input across calls", () => {
    const task = makeTask();
    const step = makeStep();

    const first = buildStepReasoning(task, step);
    const second = buildStepReasoning(task, step);

    expect(second).toEqual(first);
  });

  it("produces a different trace for a different step on the same task", () => {
    const task = makeTask();
    const stepA = makeStep({ num: 1, title: "Capture heap snapshot" });
    const stepB = makeStep({ num: 2, title: "Patch connection pool" });

    expect(buildStepReasoning(task, stepA)).not.toEqual(buildStepReasoning(task, stepB));
  });
});

describe("buildStepReasoning — trace length", () => {
  it("returns between 3 and 5 lines with no input", () => {
    const lines = buildStepReasoning(makeTask(), makeStep());
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines.length).toBeLessThanOrEqual(5);
  });

  it("returns between 3 and 5 lines with input provided", () => {
    const lines = buildStepReasoning(makeTask(), makeStep(), "please double check edge cases");
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines.length).toBeLessThanOrEqual(5);
  });
});

describe("buildStepReasoning — tool-aware shape", () => {
  it("mentions running tests when the step's tool is a test runner (e.g. Jest)", () => {
    const lines = buildStepReasoning(makeTask(), makeStep({ tool: "Jest" }));
    expect(lines.some((l) => /jest/i.test(l) && /test/i.test(l))).toBe(true);
  });

  it("mentions opening a PR when the step's tool is GitHub", () => {
    const lines = buildStepReasoning(makeTask(), makeStep({ tool: "GitHub" }));
    expect(lines.some((l) => /pull request|pr/i.test(l))).toBe(true);
  });

  it("mentions the database when the step's tool is a db-like tool (e.g. pg-pool)", () => {
    const lines = buildStepReasoning(makeTask(), makeStep({ tool: "pg-pool" }));
    expect(lines.some((l) => /pg-pool/i.test(l))).toBe(true);
  });

  it("fabricates a plausible file path from the step title when no tool is set", () => {
    const lines = buildStepReasoning(makeTask(), makeStep({ tool: undefined, title: "Capture heap snapshot" }));
    expect(lines.some((l) => /capture-heap-snapshot/.test(l))).toBe(true);
    expect(lines[0]).toMatch(/^Reading src\//);
  });

  it("produces a differently-shaped trace for different tool categories", () => {
    const testTrace = buildStepReasoning(makeTask(), makeStep({ tool: "Jest" }));
    const prTrace = buildStepReasoning(makeTask(), makeStep({ tool: "GitHub" }));
    const noToolTrace = buildStepReasoning(makeTask(), makeStep({ tool: undefined }));

    expect(testTrace).not.toEqual(prTrace);
    expect(testTrace).not.toEqual(noToolTrace);
    expect(prTrace).not.toEqual(noToolTrace);
  });

  it("still produces a tool-aware trace for an unrecognized tool label", () => {
    const lines = buildStepReasoning(makeTask(), makeStep({ tool: "FrobTool" }));
    expect(lines.some((l) => /frobtool/i.test(l))).toBe(true);
  });
});

describe("buildStepReasoning — input-referencing line", () => {
  it("includes a line referencing the input when input is given", () => {
    const lines = buildStepReasoning(makeTask(), makeStep(), "watch out for null sessions");

    expect(lines.some((l) => l.includes('Incorporating your note: "watch out for null sessions"'))).toBe(
      true,
    );
  });

  it("omits the input-referencing line when input is undefined", () => {
    const lines = buildStepReasoning(makeTask(), makeStep());
    expect(lines.some((l) => l.startsWith("Incorporating your note"))).toBe(false);
  });

  it("omits the input-referencing line when input is empty/whitespace only", () => {
    const lines = buildStepReasoning(makeTask(), makeStep(), "   ");
    expect(lines.some((l) => l.startsWith("Incorporating your note"))).toBe(false);
  });

  it("trims the input before including it in the trace line", () => {
    const lines = buildStepReasoning(makeTask(), makeStep(), "  add retries  ");
    expect(lines.some((l) => l === 'Incorporating your note: "add retries"')).toBe(true);
  });
});
