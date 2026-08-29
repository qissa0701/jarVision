// Mock people directory — PROTOTYPE DATA ONLY.
//
// This is "People" the user might search for (colleagues), NOT the removed
// "AI Agents" concept from an earlier phase. There is no real directory
// service in this codebase, so this small, hand-written list exists solely so
// the Global_Search overlay has something realistic to match against for the
// "People" category. Names are reused from the existing mock emails/meetings'
// sender and attendee fields across src/data/roleData.ts for consistency —
// searching "Sarah" or "Devon" here surfaces the same person mentioned
// elsewhere in the dashboard.

import type { Person } from "@/types";

export const MOCK_PEOPLE: Person[] = [
  { id: "person1", name: "Sarah Kim", title: "CTO", initials: "SK" },
  { id: "person2", name: "Marcus Lee", title: "Product Manager", initials: "ML" },
  { id: "person3", name: "Devon Ellis", title: "Platform Lead", initials: "DE" },
  { id: "person4", name: "Rachel Torres", title: "VP Engineering", initials: "RT" },
  { id: "person5", name: "James Okonkwo", title: "Strategic Partner", initials: "JO" },
  { id: "person6", name: "Lisa Huang", title: "Change Advisory Board", initials: "LH" },
  { id: "person7", name: "Chen Wei", title: "Engineering Manager", initials: "CW" },
  { id: "person8", name: "Anita Desai", title: "CHRO", initials: "AD" },
  { id: "person9", name: "Jamie Tran", title: "Candidate — Sr. SWE", initials: "JT" },
  { id: "person10", name: "Sam Ortiz", title: "Senior Engineer", initials: "SO" },
];
