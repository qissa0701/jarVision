// Component tests for the Calendar widget's Phase 2 interactive flows,
// testing behavior (what the user sees and can do) rather than implementation.
//
// Covers:
//   • Opening "Plan My Day" reveals a time-blocked plan.
//   • Typing a note persists it (survives a re-render/remount).
//   • Expanding to week view shows the synthesized weekly layout.
//   • Opening a meeting's "Prep" reveals gathered docs/summary/talking points.
//   • Drafting and approving prep material follows the human-in-the-loop flow.
//
// "Sprint Standup" (the first engineer meeting) appears in more than one
// place at once (the day timeline, its own meeting card, and — once
// activated — the plan panel or week view), so tests scope queries to a
// specific region (`within`) rather than asserting on the bare meeting title
// whenever more than one copy could be on screen.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CalendarWidget } from "./CalendarWidget";
import { ROLE_DATA } from "@/data/roleData";

const data = ROLE_DATA.engineer;

/**
 * `window.localStorage` is unreliable in this test environment (Node's
 * experimental global `localStorage` can shadow jsdom's implementation and
 * throw on read/write), so tests that exercise real persistence install a
 * simple in-memory polyfill for the duration of the test file rather than
 * depending on the ambient implementation.
 */
function installMemoryLocalStorage(): void {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(window, "localStorage", {
    value: memoryStorage,
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  installMemoryLocalStorage();
});

/** Find the meeting card (with its own "Prep" button) for a given title. */
function getMeetingCard(title: string): HTMLElement {
  const heading = screen.getByText(title, { selector: "p" });
  return heading.closest('[class*="rounded-xl"][class*="border-border"]') as HTMLElement;
}

describe("CalendarWidget — Plan My Day", () => {
  it("shows a time-blocked plan for today when Plan My Day is activated", async () => {
    const user = userEvent.setup();
    render(<CalendarWidget data={data} role="engineer" />);

    const planButton = screen.getByRole("button", { name: /^plan my day$/i });
    expect(planButton).toHaveAttribute("aria-expanded", "false");

    await user.click(planButton);

    expect(planButton).toHaveAttribute("aria-expanded", "true");
    // The button's label never changes, even while expanded.
    expect(screen.getByRole("button", { name: /^plan my day$/i })).toBeInTheDocument();
    // It is framed as a real plan the user can see, not a toast.
    const introText = screen.getByText(/here's today's plan/i);
    expect(introText).toBeInTheDocument();
    const planPanel = introText.closest("#plan-my-day-panel") as HTMLElement;
    // The plan includes at least one of today's fixed meetings by title.
    expect(within(planPanel).getByText("Sprint Standup")).toBeInTheDocument();
  });

  it("closes the plan via the explicit close control without approving anything", async () => {
    const user = userEvent.setup();
    render(<CalendarWidget data={data} role="engineer" />);

    const planButton = screen.getByRole("button", { name: /^plan my day$/i });
    await user.click(planButton);
    expect(screen.getByText(/here's today's plan/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close plan/i }));

    expect(screen.queryByText(/here's today's plan/i)).not.toBeInTheDocument();
    expect(planButton).toHaveAttribute("aria-expanded", "false");
  });

  it("gates Sync to Calendar behind Approve plan, then adds a Focus Time entry to the timeline", async () => {
    const user = userEvent.setup();
    render(<CalendarWidget data={data} role="engineer" />);

    await user.click(screen.getByRole("button", { name: /^plan my day$/i }));

    const syncButton = screen.getByRole("button", { name: /sync to calendar/i });
    expect(syncButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /approve plan/i }));
    expect(screen.getAllByText(/plan approved/i).length).toBeGreaterThan(0);

    const enabledSyncButton = screen.getByRole("button", { name: /sync to calendar/i });
    expect(enabledSyncButton).toBeEnabled();
    await user.click(enabledSyncButton);

    // Inline confirmation in the panel.
    expect(screen.getByText(/focus block.*added to your calendar/i)).toBeInTheDocument();
    // Button disables/relabels after a successful sync.
    expect(screen.getByRole("button", { name: /synced/i })).toBeDisabled();

    // The focus block now appears as a real calendar entry in the single-day
    // timeline, distinctly labeled "Focus Time".
    expect(screen.getAllByText("Focus Time").length).toBeGreaterThan(0);
  });
});

describe("CalendarWidget — daily notes", () => {
  it("persists a typed note across remounts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CalendarWidget data={data} role="engineer" />);

    const noteInput = screen.getByLabelText(/today.s notes/i);
    await user.type(noteInput, "Follow up with design on the mockups");

    expect(noteInput).toHaveValue("Follow up with design on the mockups");

    // Wait for the debounced persistence write, then remount to simulate a
    // fresh render reading from storage.
    await new Promise((resolve) => setTimeout(resolve, 500));
    unmount();

    render(<CalendarWidget data={data} role="engineer" />);
    expect(screen.getByLabelText(/today.s notes/i)).toHaveValue(
      "Follow up with design on the mockups",
    );
  });

  it("keeps notes independent per role", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CalendarWidget data={data} role="engineer" />);

    const noteInput = screen.getByLabelText(/today.s notes/i);
    await user.type(noteInput, "Engineer-only note");
    await new Promise((resolve) => setTimeout(resolve, 500));
    unmount();

    render(<CalendarWidget data={ROLE_DATA.portfolio} role="portfolio" />);
    expect(screen.getByLabelText(/today.s notes/i)).toHaveValue("");
  });
});

describe("CalendarWidget — week view", () => {
  it("switches from single-day to a weekly layout when expanded", async () => {
    const user = userEvent.setup();
    render(<CalendarWidget data={data} role="engineer" />);

    const expandButton = screen.getByRole("button", { name: /expand to week/i });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");

    await user.click(expandButton);

    expect(
      screen.getByRole("button", { name: /collapse to day/i }),
    ).toHaveAttribute("aria-expanded", "true");
    // Weekday columns are visible.
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    // Every one of today's meetings is placed somewhere in the week — the
    // single-day timeline/meeting cards are unmounted while expanded, so
    // there is exactly one copy of each title on screen.
    expect(screen.getByText("Sprint Standup")).toBeInTheDocument();
    expect(screen.getByText("Architecture Review")).toBeInTheDocument();
  });

  it("returns to the single-day timeline when collapsed again", async () => {
    const user = userEvent.setup();
    render(<CalendarWidget data={data} role="engineer" />);

    await user.click(screen.getByRole("button", { name: /expand to week/i }));
    await user.click(screen.getByRole("button", { name: /collapse to day/i }));

    expect(screen.queryByText("Mon")).not.toBeInTheDocument();
    // Single-day "N Microsoft Teams Meetings" heading is back.
    expect(screen.getByText(/microsoft teams meetings/i)).toBeInTheDocument();
  });
});

describe("CalendarWidget — meeting prep", () => {
  it("reveals gathered docs, a summary, and talking points when Prep is opened", async () => {
    const user = userEvent.setup();
    render(<CalendarWidget data={data} role="engineer" />);

    const meetingCard = getMeetingCard("Sprint Standup");
    const prepButton = within(meetingCard).getByRole("button", { name: /^prep$/i });

    await user.click(prepButton);

    expect(
      within(meetingCard).getByText("Related documents"),
    ).toBeInTheDocument();
    expect(within(meetingCard).getByText("Summary")).toBeInTheDocument();
    expect(within(meetingCard).getByText("Talking points")).toBeInTheDocument();
  });

  it("drafts, edits, and approves prep material via the human-in-the-loop flow", async () => {
    const user = userEvent.setup();
    render(<CalendarWidget data={data} role="engineer" />);

    const meetingCard = getMeetingCard("Sprint Standup");
    await user.click(within(meetingCard).getByRole("button", { name: /^prep$/i }));

    // Draft.
    const draftButton = within(meetingCard).getByRole("button", {
      name: /draft talking points/i,
    });
    await user.click(draftButton);

    const textarea = within(meetingCard).getByRole("textbox", {
      name: /draft \(review and edit before approving\)/i,
    });
    expect((textarea as HTMLTextAreaElement).value.length).toBeGreaterThan(0);

    // Edit inline before approving — nothing is finalized yet.
    await user.clear(textarea);
    await user.type(textarea, "My reviewed talking points");
    expect(within(meetingCard).queryByText(/approved/i)).not.toBeInTheDocument();

    // Explicitly approve.
    await user.click(within(meetingCard).getByRole("button", { name: /approve/i }));

    expect(within(meetingCard).getByText(/approved/i)).toBeInTheDocument();
    expect(within(meetingCard).getByText("My reviewed talking points")).toBeInTheDocument();
  });

  it("supports discarding a draft without approving it", async () => {
    const user = userEvent.setup();
    render(<CalendarWidget data={data} role="engineer" />);

    const meetingCard = getMeetingCard("Sprint Standup");
    await user.click(within(meetingCard).getByRole("button", { name: /^prep$/i }));
    await user.click(
      within(meetingCard).getByRole("button", { name: /draft talking points/i }),
    );
    await user.click(within(meetingCard).getByRole("button", { name: /discard/i }));

    expect(
      within(meetingCard).getByRole("button", { name: /draft talking points/i }),
    ).toBeInTheDocument();
  });
});

describe("CalendarWidget — meeting selection", () => {
  it("still fires onSelectMeeting when a meeting card is activated", async () => {
    const user = userEvent.setup();
    const onSelectMeeting = vi.fn();
    render(
      <CalendarWidget data={data} role="engineer" onSelectMeeting={onSelectMeeting} />,
    );

    const meetingCard = getMeetingCard("Sprint Standup");
    await user.click(within(meetingCard).getByText("Sprint Standup"));

    expect(onSelectMeeting).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sprint Standup" }),
    );
  });
});
