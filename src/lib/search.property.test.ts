// Property-based tests for the dashboard Search_Filter pure helpers.
//
// Property 4: Search returns only matching items
// Validates: Requirements 7.1
//
// "For any role data and any non-empty query, every item present in the
//  filtered result has text content that contains the query when compared
//  case-insensitively, and no matching item from the original data is dropped."
//
// The test independently re-derives each item's searchable text (mirroring the
// field selection in src/lib/search.ts) rather than reusing the production
// helpers, so it genuinely checks the filter's behavior instead of tautologically
// agreeing with it.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { filterRoleData } from "@/lib/search";
import type {
  Email,
  Meeting,
  Priority,
  RoleData,
  Suggestion,
  Task,
} from "@/types";

// ─── Independent text extraction (mirrors src/lib/search.ts field selection) ──

const priorityText = (p: Priority): string =>
  [p.title, p.urgency, p.context].join(" ");

const taskText = (t: Task): string =>
  [
    t.title,
    t.due,
    t.category,
    t.steps.map((s) => `${s.title} ${s.description}`).join(" "),
  ].join(" ");

const emailText = (e: Email): string =>
  [e.sender, e.senderRole, e.subject, e.gist, e.time].join(" ");

const meetingText = (m: Meeting): string =>
  [m.title, m.startTime, m.endTime, m.type, m.attendees].join(" ");

const suggestionText = (s: Suggestion): string =>
  [s.text, s.action, s.kind].join(" ");

// A non-strict, independent match check: case-insensitive substring against the
// trimmed query. Used to compute the expected filtered arrays.
const matches = (text: string, query: string): boolean =>
  text.toLowerCase().includes(query.trim().toLowerCase());

// ─── Arbitraries ─────────────────────────────────────────────────────────────

// A small alphabet (plus spaces) makes substring collisions between generated
// text and queries frequent, so both the "kept" and "dropped" branches of the
// filter are exercised across runs.
const textArb = fc.stringOf(fc.constantFrom("a", "b", "c", "d", " "), {
  maxLength: 8,
});

// Non-empty query whose trimmed form is guaranteed non-whitespace, so the
// filter takes its real filtering path (not the empty-query identity path).
const queryArb = fc.stringOf(fc.constantFrom("a", "b", "c", "d"), {
  minLength: 1,
  maxLength: 3,
});

const urgencyArb = fc.constantFrom("critical", "high", "medium") as fc.Arbitrary<
  Priority["urgency"]
>;
const suggestionKindArb = fc.constantFrom(
  "warning",
  "info",
  "success",
) as fc.Arbitrary<Suggestion["kind"]>;
const meetingTypeArb = fc.constantFrom("video", "in-person") as fc.Arbitrary<
  Meeting["type"]
>;

const priorityArb: fc.Arbitrary<Priority> = fc.record({
  id: fc.uuid(),
  title: textArb,
  urgency: urgencyArb,
  context: textArb,
});

const taskArb: fc.Arbitrary<Task> = fc.record({
  id: fc.uuid(),
  title: textArb,
  due: textArb,
  category: textArb,
  steps: fc.array(
    fc.record({
      num: fc.nat(),
      title: textArb,
      description: textArb,
    }),
    { maxLength: 3 },
  ),
});

const emailArb: fc.Arbitrary<Email> = fc.record({
  id: fc.uuid(),
  sender: textArb,
  senderRole: textArb,
  subject: textArb,
  gist: textArb,
  time: textArb,
  initials: textArb,
  color: textArb,
});

const meetingArb: fc.Arbitrary<Meeting> = fc.record({
  id: fc.uuid(),
  title: textArb,
  startTime: textArb,
  endTime: textArb,
  type: meetingTypeArb,
  attendees: textArb,
});

const suggestionArb: fc.Arbitrary<Suggestion> = fc.record({
  id: fc.uuid(),
  text: textArb,
  action: textArb,
  kind: suggestionKindArb,
});

const roleDataArb: fc.Arbitrary<RoleData> = fc.record({
  name: textArb,
  firstName: textArb,
  title: textArb,
  avatar: textArb,
  priorities: fc.array(priorityArb, { maxLength: 6 }),
  tasks: fc.array(taskArb, { maxLength: 6 }),
  emails: fc.array(emailArb, { maxLength: 6 }),
  meetings: fc.array(meetingArb, { maxLength: 6 }),
  suggestions: fc.array(suggestionArb, { maxLength: 6 }),
});

// ─── Property 4 ──────────────────────────────────────────────────────────────

describe("Property 4: Search returns only matching items (Requirement 7.1)", () => {
  it("every filtered item matches the query and no matching item is dropped", () => {
    fc.assert(
      fc.property(roleDataArb, queryArb, (data, query) => {
        const result = filterRoleData(data, query);

        // Part 1 — soundness: every item in the result matches the query.
        for (const p of result.priorities) {
          expect(matches(priorityText(p), query)).toBe(true);
        }
        for (const t of result.tasks) {
          expect(matches(taskText(t), query)).toBe(true);
        }
        for (const e of result.emails) {
          expect(matches(emailText(e), query)).toBe(true);
        }
        for (const m of result.meetings) {
          expect(matches(meetingText(m), query)).toBe(true);
        }
        for (const s of result.suggestions) {
          expect(matches(suggestionText(s), query)).toBe(true);
        }

        // Part 2 — completeness: no matching item from the original is dropped.
        // Filtering keeps order, so the result must equal the independently
        // computed subset of matching items for each section.
        expect(result.priorities).toEqual(
          data.priorities.filter((p) => matches(priorityText(p), query)),
        );
        expect(result.tasks).toEqual(
          data.tasks.filter((t) => matches(taskText(t), query)),
        );
        expect(result.emails).toEqual(
          data.emails.filter((e) => matches(emailText(e), query)),
        );
        expect(result.meetings).toEqual(
          data.meetings.filter((m) => matches(meetingText(m), query)),
        );
        expect(result.suggestions).toEqual(
          data.suggestions.filter((s) => matches(suggestionText(s), query)),
        );
      }),
      { numRuns: 200 },
    );
  });
});
