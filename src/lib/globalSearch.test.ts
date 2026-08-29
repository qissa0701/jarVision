// Unit tests for the Global_Search pure helpers (buildSearchIndex/searchGlobal).
//
// Coverage: empty-query behavior, multi-word matching across different
// fields, case-insensitivity, category tagging correctness, and that results
// from all 5 categories can be returned when they match.

import { describe, it, expect } from "vitest";
import type { Document, Email, Meeting, Person, RoleData, Task } from "@/types";
import { buildSearchIndex, hasAnyGlobalResults, searchGlobal } from "./globalSearch";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Fix memory leak in auth service",
    due: "Today",
    category: "Bug",
    steps: [
      { num: 1, title: "Capture heap snapshot", description: "Use clinic.js under load." },
    ],
    ...overrides,
  };
}

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    sender: "Sarah Kim",
    senderRole: "CTO",
    subject: "Security audit results",
    gist: "4 critical OWASP findings flagged.",
    time: "8:42 AM",
    initials: "SK",
    color: "#4f46e5",
    ...overrides,
  };
}

function makeMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: "m1",
    title: "Sprint Standup",
    startTime: "9:00",
    endTime: "9:15",
    type: "video",
    attendees: "Team (8)",
    ...overrides,
  };
}

function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: "doc1",
    title: "Q3 Security Audit Report",
    snippet: "OWASP findings and remediation owners.",
    owner: "Sarah Kim",
    updatedAt: "2 days ago",
    ...overrides,
  };
}

function makePerson(overrides: Partial<Person> = {}): Person {
  return {
    id: "person1",
    name: "Sarah Kim",
    title: "CTO",
    initials: "SK",
    ...overrides,
  };
}

function makeRoleData(overrides: Partial<RoleData> = {}): RoleData {
  return {
    name: "Alex Chen",
    firstName: "Alex",
    title: "Software Engineer",
    avatar: "AC",
    priorities: [],
    tasks: [makeTask()],
    emails: [makeEmail()],
    meetings: [makeMeeting()],
    suggestions: [],
    ...overrides,
  };
}

describe("buildSearchIndex", () => {
  it("tags every entry with the correct category", () => {
    const index = buildSearchIndex(makeRoleData(), [makeDocument()], [makePerson()]);

    const byCategory = Object.fromEntries(index.map((e) => [e.id, e.category]));
    expect(byCategory["task-t1"]).toBe("task");
    expect(byCategory["email-e1"]).toBe("email");
    expect(byCategory["meeting-m1"]).toBe("meeting");
    expect(byCategory["document-doc1"]).toBe("document");
    expect(byCategory["person-person1"]).toBe("person");
  });

  it("produces one entry per input item, preserving a reference to the original item", () => {
    const task = makeTask();
    const index = buildSearchIndex(makeRoleData({ tasks: [task] }), [], []);
    const entry = index.find((e) => e.category === "task");

    expect(entry?.item).toBe(task);
  });

  it("is pure: does not mutate any of its inputs", () => {
    const data = makeRoleData();
    const documents = [makeDocument()];
    const people = [makePerson()];
    const dataSnapshot = JSON.parse(JSON.stringify(data));
    const documentsSnapshot = JSON.parse(JSON.stringify(documents));
    const peopleSnapshot = JSON.parse(JSON.stringify(people));

    buildSearchIndex(data, documents, people);

    expect(data).toEqual(dataSnapshot);
    expect(documents).toEqual(documentsSnapshot);
    expect(people).toEqual(peopleSnapshot);
  });
});

describe("searchGlobal — empty query", () => {
  it("returns every entry across all categories for an empty query", () => {
    const index = buildSearchIndex(makeRoleData(), [makeDocument()], [makePerson()]);
    const results = searchGlobal(index, "");

    expect(results.task).toHaveLength(1);
    expect(results.email).toHaveLength(1);
    expect(results.meeting).toHaveLength(1);
    expect(results.document).toHaveLength(1);
    expect(results.person).toHaveLength(1);
  });

  it("returns every entry for a whitespace-only query", () => {
    const index = buildSearchIndex(makeRoleData(), [], []);
    const results = searchGlobal(index, "   \t  ");

    expect(results.task).toHaveLength(1);
    expect(results.email).toHaveLength(1);
    expect(results.meeting).toHaveLength(1);
  });
});

describe("searchGlobal — case-insensitivity", () => {
  it("matches regardless of the query's letter casing", () => {
    const index = buildSearchIndex(
      makeRoleData({ tasks: [makeTask({ title: "Fix memory leak in auth service" })] }),
      [],
      [],
    );

    expect(searchGlobal(index, "MEMORY LEAK").task).toHaveLength(1);
    expect(searchGlobal(index, "Memory Leak").task).toHaveLength(1);
    expect(searchGlobal(index, "memory leak").task).toHaveLength(1);
  });

  it("matches regardless of the indexed text's letter casing", () => {
    const index = buildSearchIndex(
      makeRoleData({ tasks: [makeTask({ title: "FIX MEMORY LEAK" })] }),
      [],
      [],
    );

    expect(searchGlobal(index, "memory leak").task).toHaveLength(1);
  });
});

describe("searchGlobal — multi-word matching across fields", () => {
  it("matches when query words appear in different fields of the same entry, in any order", () => {
    // "bug" only appears in `category`, "auth" only in `title` — neither field
    // alone contains the full phrase "auth bug", but the entry should still
    // match because every word appears somewhere in the combined text.
    const task = makeTask({
      title: "Fix memory leak in auth service",
      category: "Bug",
    });
    const index = buildSearchIndex(makeRoleData({ tasks: [task] }), [], []);

    expect(searchGlobal(index, "bug auth").task).toHaveLength(1);
    expect(searchGlobal(index, "auth bug").task).toHaveLength(1);
  });

  it("excludes an entry missing even one query word", () => {
    const task = makeTask({ title: "Fix memory leak in auth service", category: "Bug" });
    const index = buildSearchIndex(makeRoleData({ tasks: [task] }), [], []);

    // "database" appears nowhere in this entry's searchable text.
    expect(searchGlobal(index, "auth database").task).toHaveLength(0);
  });

  it("matches a natural-language-style multi-word query across task title and step text", () => {
    const task = makeTask({
      title: "Review PR #834: New payment flow",
      category: "Review",
      steps: [
        {
          num: 1,
          title: "Run integration tests locally",
          description: "Verify all Stripe error codes surface correctly.",
        },
      ],
    });
    const index = buildSearchIndex(makeRoleData({ tasks: [task] }), [], []);

    expect(searchGlobal(index, "stripe payment").task).toHaveLength(1);
  });
});

describe("searchGlobal — category coverage", () => {
  it("returns matching results from all 5 categories in a single query", () => {
    const data = makeRoleData({
      tasks: [makeTask({ title: "Sarah project kickoff" })],
      emails: [makeEmail({ subject: "Sarah's audit results" })],
      meetings: [makeMeeting({ title: "1:1 with Sarah Kim" })],
    });
    const documents = [makeDocument({ title: "Sarah's audit report" })];
    const people = [makePerson({ name: "Sarah Kim" })];
    const index = buildSearchIndex(data, documents, people);

    const results = searchGlobal(index, "sarah");

    expect(results.task).toHaveLength(1);
    expect(results.email).toHaveLength(1);
    expect(results.meeting).toHaveLength(1);
    expect(results.document).toHaveLength(1);
    expect(results.person).toHaveLength(1);
  });

  it("excludes non-matching entries from categories that do have a match elsewhere", () => {
    const data = makeRoleData({
      tasks: [
        makeTask({ id: "t1", title: "Sarah project kickoff" }),
        makeTask({ id: "t2", title: "Unrelated task" }),
      ],
    });
    const index = buildSearchIndex(data, [], []);

    const results = searchGlobal(index, "sarah");

    expect(results.task).toHaveLength(1);
    expect(results.task[0].id).toBe("task-t1");
  });
});

describe("hasAnyGlobalResults", () => {
  it("returns false when every category is empty", () => {
    const index = buildSearchIndex(makeRoleData(), [], []);
    const results = searchGlobal(index, "zzznomatchqqq");

    expect(hasAnyGlobalResults(results)).toBe(false);
  });

  it("returns true when at least one category has a match", () => {
    const index = buildSearchIndex(makeRoleData(), [], []);
    const results = searchGlobal(index, "memory leak");

    expect(hasAnyGlobalResults(results)).toBe(true);
  });
});
