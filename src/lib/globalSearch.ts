// Pure helpers for the Global_Search command-palette overlay.
//
// This module is intentionally independent from src/lib/search.ts (the
// existing dashboard inline Search_Filter): that module filters a single
// role's RoleData in place for the fixed 2-widget dashboard, while this one
// builds a flat, categorized index across five item types (tasks, emails,
// meetings, documents, people) for the full-screen overlay, and matches
// against it with a word-level algorithm rather than a single substring test.
//
// Matching algorithm (Requirement: natural-language queries):
//   1. Start from the same case-insensitive substring baseline already
//      established by src/lib/search.ts's normalizeQuery/matchesQuery.
//   2. Split the normalized query on whitespace into individual words.
//   3. An entry matches when *every* word is a substring of the entry's
//      combined searchable text, in any order and regardless of which field
//      it came from. This is a small, dependency-free improvement over a
//      single substring test: a query like "auth service bug" matches an
//      entry whose title contains "auth" and whose category contains "bug"
//      even though no single field contains the whole phrase, without
//      requiring a real NLP/fuzzy-matching library.
// An empty (or whitespace-only) query matches everything, mirroring the
// existing identity behavior in src/lib/search.ts.

import type {
  Document,
  Email,
  Meeting,
  Person,
  RoleData,
  Task,
} from "@/types";

/** The five categories the Global_Search overlay groups results under. */
export type SearchCategory = "task" | "email" | "meeting" | "document" | "person";

/** The underlying item a search entry was built from, per category. */
export type SearchableItem = Task | Email | Meeting | Document | Person;

/**
 * A single flattened, searchable entry in the global search index. `title`
 * and `secondary` are the two lines the overlay renders per result;
 * `searchableText` is the (lowercased) combined text every query word is
 * matched against, and `item` is the original object so activation handlers
 * can act on the real Task/Email/Meeting/Document/Person.
 */
export interface SearchIndexEntry {
  /** Unique across the whole index, e.g. "task-t1". */
  id: string;
  category: SearchCategory;
  title: string;
  secondary: string;
  searchableText: string;
  item: SearchableItem;
}

/** Results grouped by category, ready for the overlay to render one CommandGroup per key. */
export interface GroupedSearchResults {
  task: SearchIndexEntry[];
  email: SearchIndexEntry[];
  meeting: SearchIndexEntry[];
  document: SearchIndexEntry[];
  person: SearchIndexEntry[];
}

// ─── Index construction ──────────────────────────────────────────────────────

function taskEntry(task: Task): SearchIndexEntry {
  const stepText = task.steps
    .map((step) => `${step.title} ${step.description}`)
    .join(" ");
  return {
    id: `task-${task.id}`,
    category: "task",
    title: task.title,
    secondary: `${task.category} · Due ${task.due}`,
    searchableText: [task.title, task.due, task.category, stepText]
      .join(" ")
      .toLowerCase(),
    item: task,
  };
}

function emailEntry(email: Email): SearchIndexEntry {
  return {
    id: `email-${email.id}`,
    category: "email",
    title: email.subject,
    secondary: `${email.sender} · ${email.senderRole}`,
    searchableText: [
      email.sender,
      email.senderRole,
      email.subject,
      email.gist,
      email.time,
    ]
      .join(" ")
      .toLowerCase(),
    item: email,
  };
}

function meetingEntry(meeting: Meeting): SearchIndexEntry {
  return {
    id: `meeting-${meeting.id}`,
    category: "meeting",
    title: meeting.title,
    secondary: `${meeting.startTime}–${meeting.endTime} · ${meeting.attendees}`,
    searchableText: [
      meeting.title,
      meeting.startTime,
      meeting.endTime,
      meeting.type,
      meeting.attendees,
    ]
      .join(" ")
      .toLowerCase(),
    item: meeting,
  };
}

function documentEntry(document: Document): SearchIndexEntry {
  return {
    id: `document-${document.id}`,
    category: "document",
    title: document.title,
    secondary: `${document.owner} · Updated ${document.updatedAt}`,
    searchableText: [
      document.title,
      document.snippet,
      document.owner,
      document.updatedAt,
    ]
      .join(" ")
      .toLowerCase(),
    item: document,
  };
}

function personEntry(person: Person): SearchIndexEntry {
  return {
    id: `person-${person.id}`,
    category: "person",
    title: person.name,
    secondary: person.title,
    searchableText: [person.name, person.title].join(" ").toLowerCase(),
    item: person,
  };
}

/**
 * Build the flat, categorized search index for the Global_Search overlay from
 * a role's real (unfiltered) data plus the two mock datasets. Pure and
 * non-mutating: returns a fresh array every call.
 */
export function buildSearchIndex(
  data: RoleData,
  documents: Document[],
  people: Person[],
): SearchIndexEntry[] {
  return [
    ...data.tasks.map(taskEntry),
    ...data.emails.map(emailEntry),
    ...data.meetings.map(meetingEntry),
    ...documents.map(documentEntry),
    ...people.map(personEntry),
  ];
}

// ─── Matching ────────────────────────────────────────────────────────────────

/** Split a query into normalized (lowercased, trimmed) non-empty words. */
function queryWords(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

/** True when every word in `words` is a substring of `text` (already lowercased). */
function matchesAllWords(text: string, words: string[]): boolean {
  return words.every((word) => text.includes(word));
}

function emptyGroups(): GroupedSearchResults {
  return { task: [], email: [], meeting: [], document: [], person: [] };
}

/**
 * Match `query` against a pre-built search index, grouped by category.
 *
 * An empty (or whitespace-only) query matches every entry, mirroring
 * `filterRoleData`'s identity behavior for an empty query. For a non-empty
 * query, an entry matches when every word of the (normalized) query appears
 * somewhere in that entry's combined searchable text — the word-level
 * improvement over strict substring matching described above. Order within
 * each category is preserved from the index.
 */
export function searchGlobal(
  index: SearchIndexEntry[],
  query: string,
): GroupedSearchResults {
  const words = queryWords(query);
  const groups = emptyGroups();

  for (const entry of index) {
    if (words.length === 0 || matchesAllWords(entry.searchableText, words)) {
      groups[entry.category].push(entry);
    }
  }

  return groups;
}

/** True when a grouped result set has at least one entry in any category. */
export function hasAnyGlobalResults(groups: GroupedSearchResults): boolean {
  return (
    groups.task.length > 0 ||
    groups.email.length > 0 ||
    groups.meeting.length > 0 ||
    groups.document.length > 0 ||
    groups.person.length > 0
  );
}
