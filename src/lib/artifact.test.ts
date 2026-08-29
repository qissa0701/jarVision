// Unit tests for the pure artifact-generation logic.

import { describe, it, expect } from "vitest";
import type { Task } from "@/types";
import { buildArtifact, type CodeArtifact, type DocumentArtifact } from "./artifact";
import { ROLE_DATA } from "@/data/roleData";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Fix memory leak in auth service",
    due: "Today",
    category: "Bug",
    steps: [
      { num: 1, title: "Capture heap snapshot", description: "…", tool: "clinic.js" },
      { num: 2, title: "Identify retention paths", description: "…", tool: "Chrome DevTools" },
    ],
    ...overrides,
  };
}

describe("buildArtifact — category routing", () => {
  it.each(["Bug", "Testing", "Incident"])(
    "produces a code artifact for category %s",
    (category) => {
      const artifact = buildArtifact(makeTask({ category }));
      expect(artifact.kind).toBe("code");
    },
  );

  it.each(["Review", "People", "Docs", "Planning", "Presentation"])(
    "produces a document artifact for category %s",
    (category) => {
      const artifact = buildArtifact(makeTask({ category }));
      expect(artifact.kind).toBe("document");
    },
  );
});

describe("buildArtifact — code artifact shape", () => {
  it("includes a mock branch named after the task id", () => {
    const artifact = buildArtifact(makeTask({ id: "t7", category: "Bug" })) as CodeArtifact;
    expect(artifact.branch).toBe("feature/t7");
  });

  it("includes a mock PR label", () => {
    const artifact = buildArtifact(makeTask({ category: "Bug" })) as CodeArtifact;
    expect(artifact.prLabel).toMatch(/^View PR #\d+$/);
  });

  it("derives a diff summary line per step, up to 4", () => {
    const artifact = buildArtifact(
      makeTask({
        category: "Bug",
        steps: [
          { num: 1, title: "Step one", description: "" },
          { num: 2, title: "Step two", description: "" },
          { num: 3, title: "Step three", description: "" },
          { num: 4, title: "Step four", description: "" },
          { num: 5, title: "Step five", description: "" },
        ],
      }),
    ) as CodeArtifact;
    expect(artifact.diffSummary).toHaveLength(4);
    expect(artifact.filesChanged).toBe(4);
  });

  it("is deterministic for the same task", () => {
    const task = makeTask({ category: "Testing" });
    expect(buildArtifact(task)).toEqual(buildArtifact(task));
  });
});

describe("buildArtifact — document artifact shape", () => {
  it("includes a summary, notable points, and suggested comments", () => {
    const artifact = buildArtifact(makeTask({ category: "Docs" })) as DocumentArtifact;
    expect(artifact.summary).toContain(makeTask({ category: "Docs" }).title);
    expect(artifact.notablePoints.length).toBeGreaterThanOrEqual(1);
    expect(artifact.notablePoints.length).toBeLessThanOrEqual(4);
    expect(artifact.suggestedComments.length).toBeGreaterThanOrEqual(1);
    expect(artifact.suggestedComments.length).toBeLessThanOrEqual(2);
  });

  it("is deterministic for the same task", () => {
    const task = makeTask({ category: "Review" });
    expect(buildArtifact(task)).toEqual(buildArtifact(task));
  });

  // Leadership's tasks are categorized "Review"/"People" and must read
  // sensibly through the same generic document template used for build-type
  // tasks — no role-specific branching in the generator itself.
  it("reads sensibly for a leadership review-type task", () => {
    const reviewTask = ROLE_DATA.leadership.tasks.find(
      (t) => t.title === "Review Sam Ortiz's promotion packet",
    );
    expect(reviewTask).toBeDefined();
    const artifact = buildArtifact(reviewTask as Task) as DocumentArtifact;
    expect(artifact.kind).toBe("document");
    expect(artifact.summary).toContain("Review Sam Ortiz's promotion packet");
    expect(artifact.notablePoints.length).toBeGreaterThan(0);
  });

  it("reads sensibly for an engineer build-type task", () => {
    const bugFixTask = ROLE_DATA.engineer.tasks.find(
      (t) => t.title === "Update OpenAPI documentation",
    );
    expect(bugFixTask).toBeDefined();
    const artifact = buildArtifact(bugFixTask as Task) as DocumentArtifact;
    expect(artifact.kind).toBe("document");
    expect(artifact.summary).toContain("Update OpenAPI documentation");
  });
});
