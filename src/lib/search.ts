// Pure search-filtering helpers for the dashboard Search_Filter (Requirement 7).
//
// All functions are pure and non-mutating: `filterRoleData` returns a new
// RoleData whose item arrays are filtered copies, and never touches ROLE_DATA
// or the input object. Matching is case-insensitive substring matching over
// each item's human-readable text fields, with leading/trailing whitespace in
// the query treated as insignificant (Requirements 7.1, 7.2, 7.6).

import type {
  Email,
  Meeting,
  Priority,
  RoleData,
  Suggestion,
  Task,
} from "@/types";

/**
 * Normalize a raw query for comparison: trim surrounding whitespace and
 * lowercase it. Leading/trailing whitespace is therefore insignificant
 * (Requirement 7.6) and matching is case-insensitive (Requirement 7.1).
 */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Case-insensitive substring match. Returns true when `text` contains `query`
 * once both are compared in normalized (trimmed + lowercased) form. A query
 * that normalizes to the empty string matches any text.
 */
export function matchesQuery(text: string, query: string): boolean {
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery === "") {
    return true;
  }
  return text.toLowerCase().includes(normalizedQuery);
}

// ─── Per-item searchable text ────────────────────────────────────────────────
// Each helper collects the human-readable text fields for an item type so a
// single query is matched across all of that item's visible content.

function priorityText(priority: Priority): string {
  return [priority.title, priority.urgency, priority.context].join(" ");
}

function taskText(task: Task): string {
  const stepText = task.steps
    .map((step) => `${step.title} ${step.description}`)
    .join(" ");
  return [task.title, task.due, task.category, stepText].join(" ");
}

function emailText(email: Email): string {
  return [email.sender, email.senderRole, email.subject, email.gist, email.time].join(
    " ",
  );
}

function meetingText(meeting: Meeting): string {
  return [
    meeting.title,
    meeting.startTime,
    meeting.endTime,
    meeting.type,
    meeting.attendees,
  ].join(" ");
}

function suggestionText(suggestion: Suggestion): string {
  return [suggestion.text, suggestion.action, suggestion.kind].join(" ");
}

/**
 * Filter a role's dashboard data by `query`.
 *
 * When `query` is empty or whitespace-only the original `data` object is
 * returned unchanged (identity), so every item for the active role is shown
 * (Requirement 7.2). For a non-empty query, each item array keeps only the
 * items whose text content contains the query, compared case-insensitively
 * (Requirement 7.1). Non-item metadata (name, title, avatar, ...) is preserved.
 * The input is never mutated.
 */
export function filterRoleData(data: RoleData, query: string): RoleData {
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery === "") {
    return data;
  }

  return {
    ...data,
    priorities: data.priorities.filter((item) =>
      matchesQuery(priorityText(item), normalizedQuery),
    ),
    tasks: data.tasks.filter((item) => matchesQuery(taskText(item), normalizedQuery)),
    emails: data.emails.filter((item) => matchesQuery(emailText(item), normalizedQuery)),
    meetings: data.meetings.filter((item) =>
      matchesQuery(meetingText(item), normalizedQuery),
    ),
    suggestions: data.suggestions.filter((item) =>
      matchesQuery(suggestionText(item), normalizedQuery),
    ),
  };
}

/**
 * True when `data` contains at least one item across any of its item sections
 * (priorities, tasks, emails, meetings, suggestions). Used to drive the
 * no-results indication after filtering (Requirement 7.4).
 */
export function hasAnyResults(data: RoleData): boolean {
  return (
    data.priorities.length > 0 ||
    data.tasks.length > 0 ||
    data.emails.length > 0 ||
    data.meetings.length > 0 ||
    data.suggestions.length > 0
  );
}
