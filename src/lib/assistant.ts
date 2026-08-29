// Pure mock reply engine for the Jarvis chat assistant.
//
// This is the "brain" behind the chat & voice assistant: given a user query
// and the active role's real data (priorities/tasks/meetings/suggestions)
// plus the real overnight run queue, it returns a deterministic reply string.
// Deterministic and side-effect free (no randomness, no async) so it's fully
// unit-testable, mirroring the `buildResult`/`buildArtifact` pattern in
// `src/lib/overnight.ts`/`src/lib/artifact.ts`.
//
// Intent matching is case-insensitive keyword/substring matching against the
// raw query. Checks run in a fixed precedence order (first match wins) so a
// query touching multiple topics still gets a single, focused answer. The
// order mirrors the product spec's own listing: overnight summary → today's
// priorities/focus → tasks → meetings/calendar/schedule → suggestions →
// greeting → fallback. Word-boundary regexes are used throughout so short
// keywords (e.g. "hi") don't false-positive inside unrelated words (e.g.
// "this").

import type { OvernightRun, OvernightStatus, RoleData } from "@/types";

export interface AssistantContext {
  /** The active role's real data (priorities, tasks, meetings, suggestions). */
  data: RoleData;
  /** The active role's real overnight run queue. */
  overnightRuns: OvernightRun[];
}

// ─── Intent keyword patterns ──────────────────────────────────────────────────

const OVERNIGHT_PATTERN = /\bovernight\b|\blast night\b|\bwhile i slept\b/i;
const PRIORITY_PATTERN = /\bpriorit(?:y|ies)\b|\bfocus\b|\btoday\b/i;
const TASK_PATTERN = /\btasks?\b|\bto-do\b|\btodo\b/i;
const MEETING_PATTERN = /\bmeetings?\b|\bcalendar\b|\bschedule\b/i;
const SUGGESTION_PATTERN = /\bsuggest(?:ion)?s?\b|\brecommend(?:ation)?s?\b/i;
const GREETING_PATTERN = /\bhi\b|\bhello\b|\bhey\b/i;

// ─── Overnight summary ────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OvernightStatus, string> = {
  scheduled: "scheduled",
  running: "running",
  ready: "ready for your review",
  approved: "approved",
  changes_requested: "sent back for changes",
};

function countsByStatus(runs: OvernightRun[]): [OvernightStatus, number][] {
  const counts: Record<OvernightStatus, number> = {
    scheduled: 0,
    running: 0,
    ready: 0,
    approved: 0,
    changes_requested: 0,
  };
  for (const run of runs) counts[run.status] += 1;
  return (Object.entries(counts) as [OvernightStatus, number][]).filter(
    ([, count]) => count > 0,
  );
}

function summarizeOvernight(overnightRuns: OvernightRun[]): string {
  if (overnightRuns.length === 0) {
    return "Nothing ran overnight — your queue was empty, so there's no summary to give you.";
  }

  const counts = countsByStatus(overnightRuns);
  const countText = counts
    .map(([status, count]) => `${count} ${STATUS_LABEL[status]}`)
    .join(", ");
  const total = overnightRuns.length;
  const summaryLine = `Overnight I worked through ${total} task${total === 1 ? "" : "s"}: ${countText}.`;

  const reviewable = overnightRuns.filter(
    (run) => run.status === "ready" || run.status === "approved",
  );
  if (reviewable.length === 0) return summaryLine;

  const details = reviewable
    .map((run) => `"${run.taskTitle}" — ${run.result ?? "no summary available"}`)
    .join(" ");
  return `${summaryLine} Here's what's ready for you: ${details}`;
}

// ─── Priorities / focus ───────────────────────────────────────────────────────

function summarizePriorities(data: RoleData): string {
  const items = data.priorities.filter(
    (p) => p.urgency === "critical" || p.urgency === "high",
  );
  if (items.length === 0) {
    return `Nothing critical or high-urgency on your plate right now, ${data.firstName} — you're clear to focus on the rest of your list.`;
  }
  const list = items.map((p) => `"${p.title}"`).join("; ");
  return `Here's what's top priority for you today: ${list}.`;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

function summarizeTasks(data: RoleData): string {
  if (data.tasks.length === 0) {
    return "You don't have any tasks queued up right now.";
  }
  const list = data.tasks
    .map((t) => `"${t.title}" (${t.category}, due ${t.due})`)
    .join("; ");
  return `Here are your tasks: ${list}.`;
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

function summarizeMeetings(data: RoleData): string {
  if (data.meetings.length === 0) {
    return "You don't have any meetings on today's calendar.";
  }
  const list = data.meetings
    .map((m) => `"${m.title}" from ${m.startTime} to ${m.endTime} with ${m.attendees}`)
    .join("; ");
  return `Here's today's schedule: ${list}.`;
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

function summarizeSuggestions(data: RoleData): string {
  if (data.suggestions.length === 0) {
    return "I don't have any suggestions for you at the moment.";
  }
  const list = data.suggestions.map((s) => s.text).join(" ");
  return `Here's what I'd suggest: ${list}`;
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function greet(data: RoleData): string {
  return `Hey ${data.firstName}! I'm Jarvis. Ask me about your priorities, tasks, meetings, overnight runs, or suggestions.`;
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function fallback(): string {
  return "I'm not sure I caught that. I can help with your priorities, tasks, meetings, overnight summary, or suggestions — try asking about one of those.";
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Build the assistant's reply to a user query, purely from the active role's
 * real data and overnight run queue. No randomness, no async — same inputs
 * always produce the same reply.
 */
export function buildAssistantReply(
  query: string,
  context: AssistantContext,
): string {
  const { data, overnightRuns } = context;

  if (OVERNIGHT_PATTERN.test(query)) return summarizeOvernight(overnightRuns);
  if (PRIORITY_PATTERN.test(query)) return summarizePriorities(data);
  if (TASK_PATTERN.test(query)) return summarizeTasks(data);
  if (MEETING_PATTERN.test(query)) return summarizeMeetings(data);
  if (SUGGESTION_PATTERN.test(query)) return summarizeSuggestions(data);
  if (GREETING_PATTERN.test(query)) return greet(data);
  return fallback();
}
