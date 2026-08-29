// Unit test for the no-results indication path (Requirement 7.4).
//
// After filtering a role's data with a non-empty query that matches nothing,
// `hasAnyResults` must report false so the UI can show a no-results message.
// A query that does match at least one item must yield true.

import { describe, expect, it } from "vitest";

import { ROLE_DATA } from "@/data/roleData";
import { filterRoleData, hasAnyResults } from "@/lib/search";

describe("hasAnyResults after filtering (Requirement 7.4)", () => {
  const roleData = ROLE_DATA.engineer;

  it("returns false when a non-empty query matches nothing", () => {
    const filtered = filterRoleData(roleData, "zzznomatchqqq");

    // Every item section should have been filtered down to empty.
    expect(filtered.priorities).toHaveLength(0);
    expect(filtered.tasks).toHaveLength(0);
    expect(filtered.emails).toHaveLength(0);
    expect(filtered.meetings).toHaveLength(0);
    expect(filtered.suggestions).toHaveLength(0);

    expect(hasAnyResults(filtered)).toBe(false);
  });

  it("returns true when a non-empty query matches at least one item", () => {
    // "memory leak" appears in the engineer role's priorities/tasks.
    const filtered = filterRoleData(roleData, "memory leak");

    expect(hasAnyResults(filtered)).toBe(true);
  });
});
