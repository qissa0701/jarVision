// Pure "thinking out loud" reasoning-trace generation for an executing task
// step.
//
// This mirrors how an IDE coding agent narrates its own actions in real time
// (reading a file, analyzing output, editing a line, running tests) so the
// Task_Panel can show the human collaborator WHAT Jarvis is doing right now
// for the active step, not just a spinner. Generation is deterministic (no
// randomness, no Date.now()) so the same task/step/input always produces the
// same trace — this keeps the panel's staggered reveal stable across renders
// and makes the output trivially unit-testable, mirroring the deterministic
// `hashString` pattern already used in `src/lib/overnight.ts` and
// `src/lib/artifact.ts`.

import type { Task, TaskStep } from "@/types";

/** Small deterministic hash, duplicated locally (see overnight.ts/artifact.ts for the same pattern). */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Slugify a step title into a filesystem-safe fragment, e.g. "Fix memory leak" -> "fix-memory-leak". */
function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "step";
}

/** Fabricate a plausible mock file path Jarvis is "touching" for this step. */
function mockFilePath(step: TaskStep): string {
  return `src/tasks/${slugify(step.title)}.ts`;
}

/**
 * Tool-keyword categories, each contributing two "activity" trace lines that
 * reflect what that class of tool would actually be doing (running tests,
 * opening a PR, inspecting a database, etc.) — this is what makes the trace
 * shape differ meaningfully per `step.tool` rather than being generic filler.
 */
interface ToolCategory {
  pattern: RegExp;
  lines: (tool: string, step: TaskStep) => [string, string];
}

const TOOL_CATEGORIES: readonly ToolCategory[] = [
  {
    pattern: /jest|vitest|mocha|cypress|playwright/i,
    lines: (tool, step) => [
      `Running ${tool} test suite for "${step.title}"…`,
      `Running affected tests via ${tool}…`,
    ],
  },
  {
    pattern: /github|gitlab|bitbucket/i,
    lines: (tool) => [
      `Opening a pull request via ${tool}`,
      `Drafting PR description summarizing the change`,
    ],
  },
  {
    pattern: /postgres|pg-pool|mysql|redis|mongo|sql/i,
    lines: (tool) => [
      `Inspecting ${tool} connection and query metrics`,
      `Adjusting configuration based on observed load`,
    ],
  },
  {
    pattern: /k6|jmeter|loadtest|load-test|newrelic|datadog/i,
    lines: (tool) => [
      `Running load test via ${tool}`,
      `Analyzing ${tool} performance output`,
    ],
  },
  {
    pattern: /stripe|api|webhook/i,
    lines: (tool) => [
      `Calling ${tool} to verify behavior`,
      `Validating response payload against expectations`,
    ],
  },
];

/** The two middle "activity" lines, chosen from the step's tool (or lack thereof). */
function activityLines(tool: string | undefined, step: TaskStep): [string, string] {
  if (!tool) {
    return [
      `Analyzing "${step.title}" requirements`,
      `Drafting implementation for ${mockFilePath(step)}`,
    ];
  }
  const category = TOOL_CATEGORIES.find((c) => c.pattern.test(tool));
  if (category) return category.lines(tool, step);
  // A tool is declared but doesn't match a known category — still tool-aware,
  // just generic.
  return [`Invoking ${tool} for this step`, `Reviewing ${tool} output`];
}

/**
 * Build the deterministic "what Jarvis is doing right now" trace lines for a
 * single executing step. Always 3-5 lines:
 *   1. Reading a mock file path derived from the step.
 *   2-3. Two tool-aware (or fabricated, if no tool) activity lines around an
 *      "Editing <file>:<line>" line.
 *   4. (optional) A line referencing the user's re-run `input`, when given.
 */
export function buildStepReasoning(task: Task, step: TaskStep, input?: string): string[] {
  const file = mockFilePath(step);
  const tool = step.tool?.trim() || undefined;
  const [firstActivity, secondActivity] = activityLines(tool, step);
  // Deterministic mock line number in [10, 209], derived from task+step so
  // different steps/tasks fabricate different (but stable) locations.
  const lineNumber = 10 + (hashString(`${task.id}:${step.num}:${step.title}`) % 200);

  const lines: string[] = [
    `Reading ${file}`,
    firstActivity,
    `Editing ${file}:${lineNumber}`,
    secondActivity,
  ];

  const trimmedInput = input?.trim();
  if (trimmedInput) {
    lines.push(`Incorporating your note: "${trimmedInput}"`);
  }

  return lines;
}
