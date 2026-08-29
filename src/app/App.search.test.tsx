// Global_Search integration tests for the composed dashboard.
//
// These render the full <App/> and drive the real top-bar search trigger +
// the Global_Search overlay it opens to verify the redesigned search
// experience end-to-end:
//
//   • Activating the top-bar search field opens the full-screen overlay
//     (rather than filtering the dashboard in place).
//   • Typing in the overlay's own input shows categorized results (Tasks,
//     Emails, Meetings, Documents, People) as the query narrows.
//   • A query that matches nothing shows the overlay's own empty state.
//   • Activating a Task result closes the overlay and opens the Task_Panel.
//   • Activating a Meeting result closes the overlay and shows the meeting
//     toast.
//   • Activating an Email/Document/Person result closes the overlay and
//     shows a toast naming it (no real destination view exists for those).
//   • Cmd/Ctrl+K opens the overlay from anywhere, without clicking the field.
//
// The app persists the login session to localStorage via useAuthSession, so
// each test starts from a cleared store, logs in as the engineer account via
// the login screen, and only then exercises the dashboard's search overlay.

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "@/app/App";

beforeEach(() => {
  // Reset the persisted login session so every test starts at the login
  // screen. localStorage may be unavailable in this environment; the app
  // falls back to logged-out in that case, so guard the reset defensively.
  try {
    window.localStorage?.clear?.();
  } catch {
    // No persisted state to clear — logged-out default applies.
  }
});

/** Renders <App/> and logs in as the "Software Engineer" (engineer) account. */
async function renderLoggedIn(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole("button", { name: /alex chen/i }));
}

describe("App Global_Search overlay", () => {
  it("opens the overlay when the top-bar search field is activated", async () => {
    const user = userEvent.setup();
    await renderLoggedIn(user);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /search tasks, emails, docs/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/global search/i)).toBeInTheDocument();
  });

  it("opens the overlay via the Ctrl+K shortcut without clicking the field", async () => {
    const user = userEvent.setup();
    await renderLoggedIn(user);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.keyboard("{Control>}k{/Control}");

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("shows categorized results across Tasks, Emails, and Meetings as the query narrows", async () => {
    const user = userEvent.setup();
    await renderLoggedIn(user);

    await user.click(screen.getByRole("button", { name: /search tasks, emails, docs/i }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/global search/i);

    await user.type(input, "memory leak");

    expect(await within(dialog).findByText("Tasks")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Fix memory leak in auth service"),
    ).toBeInTheDocument();

    // A non-matching engineer task is not shown.
    expect(
      within(dialog).queryByText("Update OpenAPI documentation"),
    ).not.toBeInTheDocument();
  });

  it("matches multi-word queries across different fields (word-level matching)", async () => {
    const user = userEvent.setup();
    await renderLoggedIn(user);

    await user.click(screen.getByRole("button", { name: /search tasks, emails, docs/i }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/global search/i);

    // "auth" is in the title, "bug" is in the category — no single field
    // contains the full phrase, but every word appears somewhere in the item.
    await user.type(input, "bug auth");

    expect(
      await within(dialog).findByText("Fix memory leak in auth service"),
    ).toBeInTheDocument();
  });

  it("shows an empty state when the query matches nothing", async () => {
    const user = userEvent.setup();
    await renderLoggedIn(user);

    await user.click(screen.getByRole("button", { name: /search tasks, emails, docs/i }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/global search/i);

    await user.type(input, "zzznomatchqqq");

    expect(await within(dialog).findByText(/no results found/i)).toBeInTheDocument();
  });

  it("activating a Task result closes the overlay and opens the Task_Panel", async () => {
    const user = userEvent.setup();
    await renderLoggedIn(user);

    await user.click(screen.getByRole("button", { name: /search tasks, emails, docs/i }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/global search/i);
    await user.type(input, "memory leak");

    await user.click(
      await within(dialog).findByText("Fix memory leak in auth service"),
    );

    // The overlay closes and the Task_Panel opens in its place — both use
    // dialog semantics, so assert on the Task_Panel's own labelled container
    // rather than "no dialog exists at all".
    await waitFor(() => {
      expect(screen.getByLabelText(/close task panel/i)).toBeInTheDocument();
    });
    const panel = screen.getByLabelText(/close task panel/i).closest(
      '[role="dialog"]',
    ) as HTMLElement;
    expect(
      within(panel).getByText("Fix memory leak in auth service"),
    ).toBeInTheDocument();
  });

  it("activating a Meeting result closes the overlay and shows the meeting toast", async () => {
    const user = userEvent.setup();
    await renderLoggedIn(user);

    await user.click(screen.getByRole("button", { name: /search tasks, emails, docs/i }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/global search/i);
    await user.type(input, "Sprint Standup");

    await user.click(await within(dialog).findByText("Sprint Standup"));

    // "Sprint Standup" already appears in the Calendar widget underneath, so
    // assert on the toast's distinguishing description text instead of the
    // (now ambiguous) title alone.
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText(/9:00–9:15 · Team \(8\)/)).toBeInTheDocument();
  });

  it("activating an Email result closes the overlay and shows a toast naming it", async () => {
    const user = userEvent.setup();
    await renderLoggedIn(user);

    await user.click(screen.getByRole("button", { name: /search tasks, emails, docs/i }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/global search/i);
    await user.type(input, "Security audit results");

    await user.click(
      await within(dialog).findByText("Security audit results — action needed"),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(
      await screen.findByText("Security audit results — action needed"),
    ).toBeInTheDocument();
  });

  it("activating a Person result closes the overlay and shows a toast naming it", async () => {
    const user = userEvent.setup();
    await renderLoggedIn(user);

    await user.click(screen.getByRole("button", { name: /search tasks, emails, docs/i }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/global search/i);
    await user.type(input, "Sarah Kim");

    // "Sarah Kim" appears as both an email sender and a person; pick the
    // People group's entry specifically.
    const peopleGroup = (await within(dialog).findByText("People")).closest(
      '[cmdk-group=""]',
    ) as HTMLElement;
    await user.click(within(peopleGroup).getByText("Sarah Kim"));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText("Sarah Kim")).toBeInTheDocument();
  });

  it("closes via Escape without activating a result", async () => {
    const user = userEvent.setup();
    await renderLoggedIn(user);

    await user.click(screen.getByRole("button", { name: /search tasks, emails, docs/i }));
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
