// Property-based tests for the dashboard Search_Filter whitespace behavior.
//
// Property 6: Leading and trailing whitespace is insignificant
// Validates: Requirements 7.6
//
// "For any role data and any query, filtering with the query surrounded by
//  arbitrary leading/trailing whitespace yields the same result as filtering
//  with the trimmed query."
//
// This test generates arbitrary RoleData together with an arbitrary base query
// and arbitrary runs of leading/trailing whitespace, then asserts that
// filterRoleData(data, base) is deep-equal to filterRoleData(data, pad(base)),
// where pad surrounds the base query with the generated whitespace. Because the
// two results must match for every input, trimming the surrounding whitespace
// is shown to be insignificant to the filter's output.

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

// A small alphabet (plus spaces) makes substring collisions between generated
// text and queries frequent, so both the "kept" and "dropped" branches of the
// filter are exercised across runs.
const textArb = fc.stringOf(fc.constantFrom("a", "b", "c", "d", " "), {
  maxLength: 8,
});

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

// A base query whose own leading/trailing whitespace has been stripped, so it
// serves as the stable "trimmed query" reference point. It may be empty (to
// exercise the identity path) or contain interior spaces.
const baseQueryArb = fc
  .stringOf(fc.constantFrom("a", "b", "c", "d", " "), { maxLength: 4 })
  .map((s) => s.trim());

// Assorted Unicode whitespace characters, matching String.prototype.trim's
// notion of whitespace, so the trim-based normalization is exercised beyond
// plain ASCII spaces.
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

const whitespaceRunArb = fc.stringOf(whitespaceCharArb, { maxLength: 6 });

// ─── Property 6 ──────────────────────────────────────────────────────────────

describe("Property 6: Leading and trailing whitespace is insignificant (Requirement 7.6)", () => {
  it("padding a query with leading/trailing whitespace yields the same filtered result as the trimmed query", () => {
    fc.assert(
      fc.property(
        roleDataArb,
        baseQueryArb,
        whitespaceRunArb,
        whitespaceRunArb,
        (data, base, lead, trail) => {
          const padded = `${lead}${base}${trail}`;

          const fromBase = filterRoleData(data, base);
          const fromPadded = filterRoleData(data, padded);

          // Whole-object equivalence: surrounding whitespace does not change
          // the filtered output.
          expect(fromPadded).toEqual(fromBase);

          // Section-level equivalence reinforces that no items are added or
          // dropped as a result of the surrounding whitespace.
          expect(fromPadded.priorities).toEqual(fromBase.priorities);
          expect(fromPadded.tasks).toEqual(fromBase.tasks);
          expect(fromPadded.emails).toEqual(fromBase.emails);
          expect(fromPadded.meetings).toEqual(fromBase.meetings);
          expect(fromPadded.suggestions).toEqual(fromBase.suggestions);
        },
      ),
      { numRuns: 200 },
    );
  });
});
