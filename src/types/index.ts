// Shared TypeScript types and interfaces for the Jarvis AI Dashboard.
// Shapes are ported verbatim from the original src/app/App.tsx monolith
// (Requirement 1.1). No shape changes so existing data and JSX remain compatible.

// ─── Union types ─────────────────────────────────────────────────────────────

/**
 * The five accounts a user can log in as. Each account has exactly one fixed
 * role — there is no in-session role switching; "switching roles" means
 * logging out and logging back in as a different account (see useAuthSession).
 */
export type Role =
  | "engineer"
  | "portfolio"
  | "infrastructure"
  | "people"
  | "leadership";
export type NavItem = "dashboard" | "settings";
export type Urgency = "critical" | "high" | "medium";
export type PanelState = "idle" | "planning" | "executing" | "done" | "stopped";
export type SuggestionKind = "warning" | "info" | "success";

// ─── Data interfaces ─────────────────────────────────────────────────────────

export interface Priority {
  id: string;
  title: string;
  urgency: Urgency;
  context: string;
}

export interface TaskStep {
  num: number;
  title: string;
  description: string;
  /**
   * Optional short label for the tool/system Jarvis uses to execute this step
   * (e.g. "clinic.js", "pg-pool", "k6", "Stripe API"). Optional so existing
   * data and tests remain valid; surfaced in the Task_Panel to communicate HOW
   * Jarvis autonomously executes each step.
   */
  tool?: string;
}

export interface Task {
  id: string;
  title: string;
  due: string;
  category: string;
  steps: TaskStep[];
}

export interface Email {
  id: string;
  sender: string;
  senderRole: string;
  subject: string;
  gist: string;
  time: string;
  initials: string;
  color: string;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: "video" | "in-person";
  attendees: string;
}

export interface Suggestion {
  id: string;
  text: string;
  action: string;
  kind: SuggestionKind;
}

export interface RoleData {
  name: string;
  firstName: string;
  title: string;
  avatar: string;
  priorities: Priority[];
  tasks: Task[];
  emails: Email[];
  meetings: Meeting[];
  suggestions: Suggestion[];
}

// ─── Global search mock data (Global_Search) ─────────────────────────────────
//
// "Documents" and "People" have no real backing data source elsewhere in this
// app (the old Agents view/data was removed in an earlier phase). These two
// shapes exist purely to give the Global_Search overlay something realistic
// to match against for those two categories; see src/data/documents.ts and
// src/data/people.ts for the small, explicitly-mocked datasets.

/** A mock document, searchable by title and snippet only (Global_Search). */
export interface Document {
  id: string;
  title: string;
  /** Short description/snippet searched alongside the title. */
  snippet: string;
  owner: string;
  updatedAt: string;
}

/** A mock colleague directory entry, searchable by name and title (Global_Search). */
export interface Person {
  id: string;
  name: string;
  title: string;
  initials: string;
}

// ─── Derived / view interfaces ───────────────────────────────────────────────

export type NotificationKind = Urgency | SuggestionKind;

/**
 * A single notification surfaced in the top-bar bell dropdown. Derived from the
 * active role's data (high-signal priorities, suggestions, and unread email).
 * `target`, when set, is the view to navigate to when the row is activated.
 */
export interface Notification {
  id: string;
  title: string;
  detail: string;
  kind: NotificationKind;
  target: NavItem | null;
  /**
   * Optional VISION Studio deep-link (FR-13.2). When set, activating the
   * notification enters VISION Studio with this journey pre-loaded instead of
   * navigating to a `target` nav destination.
   */
  visionJourneyId?: string | null;
}

// ─── Overnight automation ────────────────────────────────────────────────────

/**
 * Lifecycle of a task delegated to Jarvis for overnight execution. This is the
 * heart of the product: a task is `scheduled` for the overnight window, Jarvis
 * runs it (`running`) while you sleep, and by morning the result is `ready` for
 * a final human review — which ends in `approved` or `changes_requested`.
 */
export type OvernightStatus =
  | "scheduled"
  | "running"
  | "ready"
  | "approved"
  | "changes_requested";

/** The nightly automation window, stored as 24-hour "HH:mm" strings. */
export interface OvernightWindow {
  /** When Jarvis starts working, e.g. "23:00". */
  start: string;
  /** When the window closes / results are due, e.g. "06:00". */
  end: string;
}

/**
 * A single task delegated to the overnight queue. Keyed by `${role}:${taskId}`
 * so the same task id across different roles never collides. The AI `result`
 * and `confidence` are prepared when the task is scheduled but only surfaced to
 * the user once the run reaches a reviewable state.
 */
export interface OvernightRun {
  key: string;
  role: Role;
  taskId: string;
  taskTitle: string;
  category: string;
  stepCount: number;
  status: OvernightStatus;
  /** Human-readable run time within the window, e.g. "1:30 AM". */
  scheduledFor: string;
  /** AI-generated summary of what Jarvis produced. */
  result: string | null;
  /** Model confidence 0–100 for the produced result. */
  confidence: number | null;
  /** Last state-change timestamp (ms since epoch). */
  updatedAt: number;
}
