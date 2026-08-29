// Mock document directory — PROTOTYPE DATA ONLY.
//
// There is no real "Documents" data source anywhere else in this codebase.
// This small, hand-written list exists solely so the Global_Search overlay
// has something realistic to match against for the "Documents" category. It
// is not wired into any other view and carries no persistence — do not treat
// it as a real document store.
//
// Titles/snippets loosely echo themes already present in src/data/roleData.ts
// (security audits, portfolio reviews, incident postmortems, offer letters,
// roadmap decks) so results feel at home next to the real Tasks/Emails/
// Meetings for whichever role is active.

import type { Document } from "@/types";

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc1",
    title: "Q3 Security Audit Report",
    snippet: "OWASP findings, remediation owners, and auth service risk summary.",
    owner: "Sarah Kim",
    updatedAt: "2 days ago",
  },
  {
    id: "doc2",
    title: "Q3 Portfolio Review Deck",
    snippet: "Board-ready slides covering RAG status across all 12 initiatives.",
    owner: "Priya Sharma",
    updatedAt: "Yesterday",
  },
  {
    id: "doc3",
    title: "prod-db-03 Incident Postmortem",
    snippet: "Root cause, timeline, and remediation steps for the disk-space incident.",
    owner: "Jordan Park",
    updatedAt: "3 days ago",
  },
  {
    id: "doc4",
    title: "Jamie Tran — Offer Letter Draft",
    snippet: "Revised comp package and equity terms for the Sr. SWE L5 offer.",
    owner: "Morgan Rivera",
    updatedAt: "Today",
  },
  {
    id: "doc5",
    title: "Q4 Roadmap Exec Summary",
    snippet: "Strategic bets, resourcing asks, and success metrics for exec review.",
    owner: "Taylor Brooks",
    updatedAt: "1 week ago",
  },
  {
    id: "doc6",
    title: "CIS Benchmark Remediation Evidence",
    snippet: "Before/after config diffs for the three open compliance findings.",
    owner: "Jordan Park",
    updatedAt: "4 days ago",
  },
];
