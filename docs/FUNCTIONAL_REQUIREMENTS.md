# Functional Requirements Document (FRD)
## Jarvis AI Dashboard

**Version:** 1.0
**Status:** Draft — derived from current implementation
**Date:** 2026-08-06

---

## 1. Purpose and Scope

This document describes the functional requirements of the Jarvis AI Dashboard as currently implemented. It reflects the *observed behavior* of the codebase (React 18 + TypeScript + Vite + Tailwind + shadcn/ui), not aspirational features.

**Important note on current implementation status:** This build is a **frontend-only prototype**. All role, task, email, meeting, and document/people data is static mock data (`src/data/`). There is no backend, no real authentication (only a client-side login gate that selects which persona's mock data to display — no password or credential is verified), no persistence beyond browser `localStorage`, and no real AI/LLM integration — "Jarvis" responses and task executions are simulated locally with timers and canned logic (`src/lib/assistant.ts`, `src/lib/overnight.ts`). This document treats the simulated behavior as the specified functional behavior, and flags where a production system would need a real backing service.

### 1.1 In Scope
- Role-based dashboard views and data switching
- Calendar widget (day/week view, day planning, meeting prep, notes)
- Tasks widget (filtering, execution delegation, artifact review)
- Task execution panel (AI plan/execute/stop/resume/revert state machine)
- Jarvis chat assistant (text + voice input, voice mode overlay)
- Global command-palette search
- Settings 
- Notifications

### 1.2 Out of Scope
- Multi-user/collaboration features
- Mobile-native applications

---

## 2. Definitions

| Term | Definition |
|---|---|
| Jarvis | The AI assistant persona; in this build, a simulated local logic layer, not a live LLM |
| Widget | A fixed dashboard panel (Calendar or Tasks) |
| Overnight Run | A task delegated to Jarvis for execution during a configured overnight window |
| Artifact | A mock deliverable (code diff or document) produced by Jarvis for a completed/reviewable task |

---

## 3. User Roles

The application gates the dashboard behind a lightweight, client-side **Login** screen rather than in-app role switching. On launch, the Login screen presents five persona **accounts**; selecting one signs the user in as that persona for the session. Each account maps to exactly one fixed role, with independently scoped mock data. The five personas are aligned to VISION Studio's org-level roles (see the VISION Studio FRD § 3) so that action items cascaded from a VISION simulation land in the right account's task list:

1. Solution Architect (Alex Chen) — also owns Enterprise / Governance Architect cascades
2. Portfolio Manager (Priya Sharma) — also owns Project Manager (PM) cascades
3. Security / 1LoD (Jordan Park) — also owns Data Privacy Manager cascades
4. People & Culture / L&D (Morgan Rivera)
5. Innovation Lead (Taylor Brooks) — primary VISION user; also owns Finance / IT Finance cascades

A logged-in user's role is fixed for the session — there is no in-app Role Switcher. To act as a different persona, the user logs out from the sidebar (returning to the Login screen) and logs back in as a different account. Logging out closes any open Task Execution Panel or Chat Panel and resets in-progress state, so a subsequent login never inherits stale or mismatched data from the previous session. The active session (chosen role) is persisted to `localStorage`, so a returning user lands back in their last account without seeing the Login screen again.

**Note:** This Login screen is a UX affordance for choosing a demo persona, not an access-control boundary — it verifies no password or real credential (see § 6 Security).

---

## 4. Functional Requirements

### FR-1: Navigation

## 4. Functional Requirements

Each requirement below is expressed as a user story in the form "As a user, I can/want ..., so that ...", with the original requirement ID preserved for traceability.

### FR-1: Navigation

- **FR-1.1** — As a user, I can navigate between two top-level destinations, **Dashboard** and **Settings**, from an icon-rail sidebar, so that I can quickly reach either area of the app.
- **FR-1.2** — As a user, I can pick one of five persona accounts on the Login screen to sign in as that persona for my session, so that I can view the dashboard as a specific role. (This is a client-side persona selector, not real authentication — no password or credential is checked.)
- **FR-1.3** — As a user, I can log out from the sidebar to return to the Login screen, and logging out closes any open Task Execution Panel or Chat Panel and resets in-progress state, so that logging back in as a different account never leaves me looking at stale or mismatched data from the previous session.

### FR-2: Dashboard Layout

- **FR-2.1** — As a user, I can see exactly two fixed widgets (Calendar and Tasks) on the Dashboard with no widget picker, add/remove, or reordering controls, so that I get a simple, consistent layout without needing to configure anything.
- **FR-2.2** — As a user, I can see a time-based greeting (e.g. "Good morning, {firstName}") in the top bar, so that the dashboard feels personalized to me.

### FR-3: Calendar Widget

- **FR-3.1** — As a user, I can view the active role's meetings for the current day in a single-day timeline showing title, time range, type (video/in-person), and attendees, so that I can quickly see what's on my schedule.
- **FR-3.2** — As a user, I can trigger a "Plan My Day" action that generates focus-time blocks around my existing meetings, prioritized by my top priorities, so that Jarvis helps me make productive use of open time.
- **FR-3.3** — As a user, I can review and explicitly approve generated focus-time blocks before they're added ("synced") to my visible calendar, so that I stay in control of my schedule (human-in-the-loop).
- **FR-3.4** — As a user, I can enter and persist free-text daily notes scoped to my role, so that I can keep context relevant to whichever persona I'm using.
- **FR-3.5** — As a user, I can toggle a Week View that synthesizes a Monday–Friday view from my meetings, so that I can see my schedule beyond just today.
- **FR-3.6** — As a user, when a meeting is flagged as needing preparation, I can open a "Prep" card with AI-drafted supporting materials (documents, summary, talking points) and review/approve them before use, so that I walk in prepared without blindly trusting AI-generated content (human-in-the-loop draft → approve workflow).

### FR-4: Tasks Widget

- **FR-4.1** — As a user, I can view the active role's tasks as a list showing title, due date, category, and status, so that I can track what needs to be done.
- **FR-4.2** — As a user, I can filter tasks using status chips (All, Not Started, Scheduled, In Progress, Needs Review, Completed), each showing a live count, so that I can quickly focus on tasks in a particular state.
- **FR-4.3** — As a user, I can select "Execute with Jarvis" on a task to open a Task Execution Drawer, so that I can delegate the task to Jarvis.
- **FR-4.4** — As a user, I can choose **Execute Now** (opens the Task Execution Panel immediately) or **Schedule Execution** (adds the task to the overnight queue, see FR-6) from the Task Execution Drawer, so that I can decide when Jarvis works on a task.
- **FR-4.5** — As a user, I can trigger "Simulate: run now" on a task in "Scheduled" status, so that I can immediately advance a scheduled run for demo/testing purposes.
- **FR-4.6** — As a user, I can expand an Artifact Card on a "Completed" or "Needs Review" task to see a mock deliverable (code-diff-style or document-style) and Open, Download, Request Changes, Approve, or leave a comment, so that I can review Jarvis's work before accepting it.
- **FR-4.7** — As a user, when I approve or request changes on an artifact, I want the task's status to update accordingly, so that the task list always reflects the current review outcome.

### FR-5: Task Execution Panel (Jarvis Delegation)

- **FR-5.1** — As a user, when I execute a task, I can view a step-by-step execution panel driven by a state machine (`idle`, `planning`, `executing`, `done`, `stopped`), so that I always know where Jarvis is in the process.
- **FR-5.2** — As a user, I can view the task's plan (ordered steps, each with a title, description, and associated tool/system label) during planning, so that I know what Jarvis intends to do before it happens.
- **FR-5.3** — As a user, I can see a live "reasoning trace" for the current step and a chip identifying the tool being used during execution, so that I can follow along with Jarvis's work in real time.
- **FR-5.4** — As a user, I can Stop, Resume, Revert, or Re-run with new instructions at any point during execution, so that I stay in control of the automation.
- **FR-5.5** — As a user, when I stop an execution, I want the task's status to persist as interrupted/stopped and remain resumable, so that I don't lose progress and can pick it back up later.
- **FR-5.6** — As a user, when all steps complete, I want the task to move to a "done"/reviewable state with its artifact surfaced via the Artifact Card (FR-4.6), so that I can review the finished work.

### FR-6: Overnight Automation

- **FR-6.1** — As a user, I can schedule tasks for execution within a configurable overnight window (start/end time, see FR-9.1), so that Jarvis can work on tasks while I'm away.
- **FR-6.2** — As a user, I can track an overnight run through its lifecycle (`scheduled` → `running` → `ready` → `approved`/`changes_requested`), so that I always know the current state of a queued task.
- **FR-6.3** — As a user, when an overnight run reaches `ready` status, I can review its AI-generated result and confidence score before it's marked `approved`, so that nothing ships without my explicit review.
- **FR-6.4** — As a user, I want overnight runs to never auto-approve without my action, so that I retain final control over automated work.

### FR-7: Jarvis Chat Assistant

- **FR-7.1** — As a user, I can toggle a persistent side chat panel ("Jarvis Assistant"), so that I can access the assistant whenever I need it.
- **FR-7.2** — As a user, I can type a message to Jarvis and get a response based on my active role's data, so that I can get contextual help through text.
- **FR-7.3** — As a user, I can speak to Jarvis using my microphone instead of typing (browser Speech Recognition API), so that I can interact hands-free.
- **FR-7.4** — As a user, I can have assistant replies read aloud via text-to-speech (browser Speech Synthesis API), so that I can consume responses without reading them.
- **FR-7.5** — As a user, I can open a full-screen Voice Mode overlay with a listening → thinking → speaking loop, so that I can have an immersive voice conversation with Jarvis.

### FR-8: Global Search

- **FR-8.1** — As a user, I can open a global search overlay via a top-bar button or the Ctrl/Cmd+K shortcut, so that I can quickly search the app from anywhere.
- **FR-8.2** — As a user, I can search across Tasks, Emails, and Meetings (live role data) plus Documents and People (mock datasets) using word-level multi-field matching, so that I can find relevant information regardless of its type.
- **FR-8.3** — As a user, I can see search results grouped and labeled by category, so that I can scan results efficiently.
- **FR-8.4** — As a user, I can see an empty state when my search has no matches, so that I know to refine my query.
- **FR-8.5** — As a user, I can activate a Task result to open its Task Execution Panel (per FR-5), so that I can jump straight into working on it.
- **FR-8.6** — As a user, I can activate a Meeting, Email, Document, or Person result to see a toast notification, so that I get confirmation of the action even though no dedicated detail view exists yet for these categories.

### FR-9: Settings

- **FR-9.1** — As a user, I can configure the overnight automation window's start and end time, so that I control when Jarvis is allowed to run tasks (with an on-screen notice that human review is always required for results).
- **FR-9.2** — As a user, I can toggle light/dark appearance mode, so that I can use the dashboard comfortably in different lighting conditions.
- **FR-9.3** — As a user, I can clear all saved preferences (role selection, theme, notes, overnight queue) from local storage, so that I can reset the app to a clean state.
- **FR-9.4** — As a user, I can view static "About" information (product name/version info), so that I know which version of the app I'm using.

### FR-10: Notifications

- **FR-10.1** — As a user, I can see a notification bell with an indicator when unread items exist, so that I know when something needs my attention.
- **FR-10.2** — As a user, I can open a notification dropdown listing items derived from my active role's high-urgency priorities, suggestions, and unread emails, so that I can triage what matters most.
- **FR-10.3** — As a user, I can click a notification with a navigation target to be routed to the corresponding view (Dashboard or Settings), so that I can act on it immediately.

### FR-11: Top Bar

- **FR-11.1** — As a user, I can see a time-of-day-based greeting personalized with my first name in the top bar, so that the dashboard feels tailored to me.
- **FR-11.2** — As a user, I can access Global Search, the Jarvis Chat toggle, the theme toggle, and Notifications from the top bar, so that key actions are always within reach no matter where I am in the app.

All entities below are currently sourced from static mock data (`src/data/roleData.ts`, `documents.ts`, `people.ts`) and typed in `src/types/index.ts`:

- **RoleData**: name, firstName, title, avatar, priorities[], tasks[], emails[], meetings[], suggestions[]
- **Task**: id, title, due, category, steps[] (each step: num, title, description, optional tool)
- **Meeting**: id, title, startTime, endTime, type (video/in-person), attendees
- **Email**: id, sender, senderRole, subject, gist, time, initials, color
- **Priority**: id, title, urgency (critical/high/medium), context
- **Suggestion**: id, text, action, kind (warning/info/success)
- **OvernightRun**: key, role, taskId, taskTitle, category, stepCount, status, scheduledFor, result, confidence, updatedAt
- **Document** (search-only mock): id, title, snippet, owner, updatedAt
- **Person** (search-only mock): id, name, title, initials

---

## 6. Non-Functional Considerations (Observed)

| Area | Observation |
|---|---|
| Persistence | Browser `localStorage` only (role selection, theme, notes, overnight queue). No server-side persistence; data is lost across browsers/devices. |
| Security | A client-side Login screen selects which persona's mock data to display, but performs no real authentication (no password or credential is verified) and no authorization. Not suitable for production or multi-user use without adding a real auth layer. |
| AI/Backend | No real AI provider or backend API is integrated. All "Jarvis" intelligence is simulated with local logic and timers — production use would require integrating a real LLM/agent backend. |
| Accessibility | Built on Radix UI/shadcn primitives, which provide baseline ARIA support; full WCAG compliance has not been verified and would require manual testing with assistive technologies. |
| Browser APIs | Voice input/output (FR-7.3, FR-7.4) depend on browser Speech Recognition/Synthesis APIs, which have inconsistent cross-browser support (notably limited/absent in some non-Chromium browsers). |
| Testing | Integration tests exist for role switching, task execution flow, fixed-widget layout, and global search (`App.integration.test.tsx`, `App.search.test.tsx`). |

---

## 7. Assumptions

- "Jarvis" branding implies eventual real AI integration; current behavior is a UX prototype of that intended experience.
- The five roles and their mock data represent illustrative personas, not a real org directory.
- Overnight automation window and human-approval gating are core product principles (not just a UI detail) and should be preserved in any future real-backend implementation.

## 8. Out-of-Scope / Removed Features (Historical Note)

Per code comments in `App.tsx`, a prior version of the product included a customizable widget picker/reorder system with additional standalone views (Tasks, Calendar, Email, Agents as full pages). These were explicitly removed in favor of the current fixed two-widget dashboard. This is noted here so future requirement changes don't inadvertently reintroduce scope that was deliberately cut.
