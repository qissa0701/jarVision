// Property-based tests for the dashboard Search_Filter identity behavior.
//
// Property 5: Empty query is an identity filter
// Validates: Requirements 7.2
//
// "For any role data, filtering with an empty or whitespace-only query returns
//  data equal to the original (all items for the active role)."
//
// This test generates arbitrary RoleData together with empty or whitespace-only
// queries and asserts that filterRoleData returns data deep-equal to the
// original with every item in every section retained. Whitespace is drawn from
// a variety of Unicode whitespace characters so the trim-based normalization is
// exercised beyond plain ASCII spaces.

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

// ─── Arbitraries ─────────────────────────────────────────────────────────────

// Free-form text for item fields; content is irrelevant to identity behavior,
// but varied text ensures the identity path never accidentally filters items.
const textArb = fc.string({ maxLength: 12 });

const urgencyArb = fc.constantFrom(
  "critical",
  "high",
  "medium",
) as fc.Arbitrary<Priority["urgency"]>;
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

// Empty or whitespace-only queries: the empty string plus arbitrary-length runs
// of assorted Unicode whitespace characters, all of which normalize to "".
const whitespaceCharArb = fc.constantFrom(
  " ", // space
  "\t", // tab
  "\n", // line feed
  "\r", // carriage return
  "\f", // form feed
  "\v", // vertical tab
  "\u00a0", // no-break space
  "\u2003", // em space
);

const emptyOrWhitespaceQueryArb = fc.oneof(
  fc.constant(""),
  fc.stringOf(whitespaceCharArb, { minLength: 1, maxLength: 8 }),
);

// ─── Property 5 ──────────────────────────────────────────────────────────────

describe("Property 5: Empty query is an identity filter (Requirement 7.2)", () => {
  it("returns data deep-equal to the original for empty or whitespace-only queries", () => {
    fc.assert(
      fc.property(roleDataArb, emptyOrWhitespaceQueryArb, (data, query) => {
        const result = filterRoleData(data, query);

        // Whole-object identity: the filtered result equals the original data.
        expect(result).toEqual(data);

        // Every item in every section is retained (no drops), reinforcing that
        // all items for the active role remain visible.
        expect(result.priorities).toEqual(data.priorities);
        expect(result.tasks).toEqual(data.tasks);
        expect(result.emails).toEqual(data.emails);
        expect(result.meetings).toEqual(data.meetings);
        expect(result.suggestions).toEqual(data.suggestions);

        expect(result.priorities).toHaveLength(data.priorities.length);
        expect(result.tasks).toHaveLength(data.tasks.length);
        expect(result.emails).toHaveLength(data.emails.length);
        expect(result.meetings).toHaveLength(data.meetings.length);
        expect(result.suggestions).toHaveLength(data.suggestions.length);
      }),
      { numRuns: 200 },
    );
  });
});
