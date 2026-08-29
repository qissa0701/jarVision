// Pure logic for per-meeting prep: gathered docs, summary, talking points, the
// "needs prep" heuristic, and the draft/approve state machine for prep
// material. Mirrors `src/lib/overnight.ts`'s layering: everything here is
// side-effect free (except the explicit storage load/save, which inject
// `Storage`), so it is unit-testable without a DOM. The stateful React
// adapter lives in `useMeetingPrep`.
//
// "Needs prep" heuristic (documented per the product spec): a meeting needs
// prep material drafted when its duration is >= PREP_MIN_DURATION_MIN (30
// minutes) OR it has more than one attendee. Both signals proxy for "this
// meeting matters enough to walk in prepared" — a quick 15-minute 1:1 doesn't,
// but a half-hour sync or a multi-person meeting does.

import type { Meeting, Role } from "@/types";
import { parseHHMM } from "@/lib/overnight";
import { PREP_MIN_DURATION_MIN } from "@/constants/calendar";
import { ROLE_IDS } from "@/constants/roles";

// ─── Mock prep material generation ───────────────────────────────────────────

/** A couple of deterministic, plausible-looking placeholder file names. */
const DOC_TEMPLATES = [
  "Meeting-notes-{slug}.docx",
  "{slug}-agenda.pdf",
  "{slug}-briefing-deck.pptx",
  "Prior-notes-{slug}.docx",
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

/** Small deterministic hash so generated prep content is stable per meeting. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Mock "gathered documents/files" Jarvis found related to the meeting. */
export function gatherDocs(meeting: Meeting): string[] {
  const slug = slugify(meeting.title) || meeting.id;
  const seed = hashString(meeting.id);
  const count = 2 + (seed % 3); // 2–4 docs
  return Array.from({ length: count }, (_, i) => {
    const template = DOC_TEMPLATES[(seed + i) % DOC_TEMPLATES.length];
    return template.replace("{slug}", slug);
  });
}

/** Mock short summary Jarvis produced from the gathered material. */
export function buildSummary(meeting: Meeting): string {
  return (
    `${meeting.title} with ${meeting.attendees}, ${meeting.startTime}–${meeting.endTime}. ` +
    `Jarvis reviewed related documents and prior notes to prepare a short briefing ` +
    `so you can walk in ready without re-reading everything yourself.`
  );
}

/** Mock 2–4 talking points, stable per meeting. */
export function buildTalkingPoints(meeting: Meeting): string[] {
  const seed = hashString(meeting.id + meeting.title);
  const pool = [
    `Confirm the goal for "${meeting.title}" and the decision you need out of it.`,
    `Recap the open item from last time with ${meeting.attendees}.`,
    `Flag any blockers before they eat into the meeting time.`,
    `Set a clear next step and owner before wrapping up.`,
    `Bring the latest numbers/status so the room isn't waiting on you.`,
  ];
  const count = 2 + (seed % 3); // 2–4 points
  const points: string[] = [];
  for (let i = 0; i < count; i += 1) {
    points.push(pool[(seed + i) % pool.length]);
  }
  return points;
}

/** Mock draft text Jarvis produces when asked to draft talking points/agenda. */
export function draftPrepText(meeting: Meeting): string {
  const points = buildTalkingPoints(meeting)
    .map((point, i) => `${i + 1}. ${point}`)
    .join("\n");
  return (
    `Draft talking points for "${meeting.title}"\n\n` +
    `${points}\n\n` +
    `— Drafted by Jarvis. Review and edit before the meeting; nothing here is sent automatically.`
  );
}

// ─── "Needs prep" heuristic ───────────────────────────────────────────────────

/** Minutes between a meeting's start and end. */
export function meetingDurationMinutes(meeting: Meeting): number {
  return parseHHMM(meeting.endTime) - parseHHMM(meeting.startTime);
}

/**
 * True when attendees looks like more than one person.
 *
 * `attendees` is a free-text display string (e.g. "Team (8)", "Sarah K.",
 * "CEO, Chief of Staff"), not a structured list, so this is a heuristic: a
 * parenthesized count greater than 1, or more than one comma-separated name,
 * both indicate multiple attendees.
 */
export function hasMultipleAttendees(meeting: Meeting): boolean {
  const countMatch = /\((\d+)\)/.exec(meeting.attendees);
  if (countMatch) {
    return Number(countMatch[1]) > 1;
  }
  return meeting.attendees.split(",").length > 1;
}

/**
 * Whether Jarvis should offer to draft prep material for this meeting.
 *
 * Heuristic: duration >= {@link PREP_MIN_DURATION_MIN} minutes, OR more than
 * one attendee.
 */
export function needsPrep(meeting: Meeting): boolean {
  return (
    meetingDurationMinutes(meeting) >= PREP_MIN_DURATION_MIN ||
    hasMultipleAttendees(meeting)
  );
}

// ─── Draft/approve state machine (human-in-the-loop) ─────────────────────────

export type PrepDraftStatus = "none" | "drafted" | "approved";

/** Persisted draft/approve state for a single meeting's prep material. */
export interface PrepDraftState {
  status: PrepDraftStatus;
  /** The current draft text (editable by the user before approval). */
  text: string;
  updatedAt: number;
}

/** The full persisted shape, keyed by role then meeting id. */
export type PrepState = Record<Role, Record<string, PrepDraftState>>;

function emptyRoleMap(): Record<Role, Record<string, PrepDraftState>> {
  const map = {} as Record<Role, Record<string, PrepDraftState>>;
  for (const role of ROLE_IDS) map[role] = {};
  return map;
}

/** The empty state used on first load or when stored data is unusable. */
export function emptyPrepState(): PrepState {
  return emptyRoleMap();
}

function isValidStatus(value: unknown): value is PrepDraftStatus {
  return value === "none" || value === "drafted" || value === "approved";
}

function isValidDraft(value: unknown): value is PrepDraftState {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Record<string, unknown>;
  return (
    isValidStatus(draft.status) &&
    typeof draft.text === "string" &&
    typeof draft.updatedAt === "number"
  );
}

/** Load + validate the persisted prep state; falls back to an empty state. */
export function loadPrepState(storage: Pick<Storage, "getItem">, key: string): PrepState {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return emptyPrepState();

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptyPrepState();

    const result = emptyRoleMap();
    for (const [role, meetingMap] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (!(ROLE_IDS as string[]).includes(role)) continue;
      if (typeof meetingMap !== "object" || meetingMap === null) continue;
      for (const [meetingId, draft] of Object.entries(
        meetingMap as Record<string, unknown>,
      )) {
        if (isValidDraft(draft)) {
          result[role as Role][meetingId] = draft;
        }
      }
    }
    return result;
  } catch {
    console.warn("Failed to load meeting prep state; starting empty.");
    return emptyPrepState();
  }
}

/** Persist the prep state; swallows storage failures. */
export function savePrepState(
  storage: Pick<Storage, "setItem">,
  key: string,
  state: PrepState,
): void {
  try {
    storage.setItem(key, JSON.stringify(state));
  } catch {
    console.warn("Failed to persist meeting prep state.");
  }
}

/** Return a copy of `state` with `role`/`meetingId`'s draft set to `draft`. */
export function withDraft(
  state: PrepState,
  role: Role,
  meetingId: string,
  draft: PrepDraftState,
): PrepState {
  return {
    ...state,
    [role]: {
      ...state[role],
      [meetingId]: draft,
    },
  };
}

/** Look up a role/meeting's draft state, defaulting to a fresh "none" state. */
export function getDraft(
  state: PrepState,
  role: Role,
  meetingId: string,
): PrepDraftState {
  return state[role]?.[meetingId] ?? { status: "none", text: "", updatedAt: 0 };
}
