// Pure artifact-generation logic for Completed tasks.
//
// This is the richer "what Jarvis produced" view shown on a Completed task's
// card — separate from (and complementary to) the `result`/`confidence`
// fields already on an `OvernightRun`. Generation is deterministic (no
// randomness) so tests are stable, mirroring `buildResult`/`hashString` in
// `src/lib/overnight.ts`.
//
// Two variants, chosen purely by the task's `category` (Requirement 4 of the
// Tasks widget spec):
//   • "code"     — Bug / Testing / Incident: a mini diff summary plus a mock
//     branch name and PR reference.
//   • "document" — everything else (including the leadership role's
//     Review/People categories): a short summary, 2-4 notable points, and 1-2
//     suggested comments. The copy is intentionally generic so it reads
//     naturally for both build-type tasks (an engineer's bug fix) and
//     review-type tasks (reviewing a teammate's deck) without any
//     role-specific branching here.

import type { Task } from "@/types";

/** Code-style artifact: a mock diff summary + branch/PR reference. */
export interface CodeArtifact {
  kind: "code";
  /** Mock branch name, e.g. "feature/t1". */
  branch: string;
  /** Mock PR reference label, e.g. "View PR #1234" (not a real link). */
  prLabel: string;
  /** Short mini diff summary lines, one per touched step. */
  diffSummary: string[];
  /** Mock count of files touched, for the diff summary header. */
  filesChanged: number;
}

/** Document-style artifact: summary + notable points + suggested comments. */
export interface DocumentArtifact {
  kind: "document";
  /** Short summary of what Jarvis produced. */
  summary: string;
  /** 2-4 notable points (risks/flags/changes, as applicable). */
  notablePoints: string[];
  /** 1-2 suggested comments a reviewer might leave. */
  suggestedComments: string[];
}

/** Discriminated union of the two artifact presentations. */
export type Artifact = CodeArtifact | DocumentArtifact;

/** Categories that render as a code-style artifact; everything else is a document. */
const CODE_CATEGORIES: ReadonlySet<string> = new Set(["Bug", "Testing", "Incident"]);

/** Small deterministic hash so a task's mock PR number is stable across renders. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function buildCodeArtifact(task: Task): CodeArtifact {
  const prNumber = 1000 + (hashString(task.id + task.title) % 9000);
  const diffSummary = task.steps.slice(0, 4).map((step, i) => {
    const file = step.tool ? `${step.tool.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : `module-${i + 1}`;
    return `~ ${file}: ${step.title.toLowerCase()}`;
  });
  return {
    kind: "code",
    branch: `feature/${task.id}`,
    prLabel: `View PR #${prNumber}`,
    diffSummary,
    filesChanged: diffSummary.length,
  };
}

function buildDocumentArtifact(task: Task): DocumentArtifact {
  const stepTitles = task.steps.map((s) => s.title);
  const summary = `Jarvis worked through "${task.title}" — ${stepTitles.length} step${
    stepTitles.length === 1 ? "" : "s"
  } completed, with a draft ready for your review.`;

  const notablePoints = stepTitles.slice(0, 4).map((title) => `Addressed: ${title}`);

  const suggestedComments = [
    "Looks solid overall — nice, clear progress on the key points here.",
    "One area worth a closer look before this is finalized: the details in the middle section.",
  ].slice(0, stepTitles.length > 1 ? 2 : 1);

  return {
    kind: "document",
    summary,
    notablePoints,
    suggestedComments,
  };
}

/** Build the artifact Jarvis produced for a completed task, purely from its shape. */
export function buildArtifact(task: Task): Artifact {
  return CODE_CATEGORIES.has(task.category)
    ? buildCodeArtifact(task)
    : buildDocumentArtifact(task);
}
