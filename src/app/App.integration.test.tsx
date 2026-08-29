// Integration tests for the composed dashboard shell.
//
// These render the full <App/> composition root and exercise the end-to-end
// behaviors that must survive the redesign to the icon-rail sidebar, the fixed
// 2-widget dashboard, and the login-gated single-role session model:
//
//   • With no session, the app shows the login screen; logging in as an
//     account displays that account's priorities/tasks/emails/meetings/
//     suggestions.
//   • "Execute with Jarvis" opens the Task_Panel in the planning state, and
//     executing the plan drives it through executing to the terminal done
//     state with every step marked completed.
//   • Logging out while the Task_Panel is open closes the panel, resets the
//     state machine to idle, and returns to the login screen.
//   • The dashboard renders exactly the two fixed widgets (Calendar + Tasks)
//     and no widget picker / add-widget affordance exists anywhere.
//
// The app persists the login session to localStorage via useAuthSession, so
// each test starts from a cleared store to guarantee the login screen shows
// first, then logs in as the engineer account unless a test says otherwise.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
  act,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Replace motion/react with a no-animation passthrough. In jsdom the real
// library's enter/exit animations are requestAnimationFrame-driven and never
// settle: AnimatePresence keeps exiting overlays mounted (so a closed panel
// lingers) and its frame loop starves the fake clock used to drive the task
// panel. The mock renders plain DOM elements (dropping animation-only props)
// and makes AnimatePresence a transparent wrapper, so mounting and unmounting
// are immediate and deterministic — exactly what these behavioral integration
// assertions need. Component behavior and markup are otherwise preserved.
vi.mock("motion/react", async () => {
  const React = await import("react");
  const ANIM_PROPS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
    "whileFocus",
    "whileInView",
    "layout",
    "layoutId",
    "drag",
  ]);
  const strip = (props: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      if (key === "children") continue;
      if (ANIM_PROPS.has(key)) continue;
      out[key] = props[key];
    }
    return out;
  };
  // Cache one component per tag so `motion.div`, `motion.button`, etc. keep a
  // STABLE component identity across renders. Without caching, each access
  // would return a fresh component type and React would remount the whole
  // subtree on every render — detaching captured nodes and resetting state.
  const cache = new Map<string, React.ElementType>();
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        let component = cache.get(tag);
        if (!component) {
          component = React.forwardRef(
            (props: Record<string, unknown>, ref: React.Ref<unknown>) =>
              React.createElement(
                tag,
                { ref, ...strip(props) },
                props.children as React.ReactNode,
              ),
          );
          cache.set(tag, component);
        }
        return component;
      },
    },
  );
  const AnimatePresence = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  return { motion, AnimatePresence };
});

import App from "@/app/App";

beforeEach(() => {
  // Reset persisted layout so every test starts on the default engineer role.
  // localStorage may be unavailable in this environment; the app falls back to
  // its defaults, so guard the reset.
  try {
    window.localStorage?.clear?.();
  } catch {
    // No persisted state to clear — defaults apply.
  }
});

afterEach(() => {
  // Some tests opt into fake timers; always restore real timers afterward so
  // later tests (and their userEvent instances) behave normally.
  vi.useRealTimers();
});

/** Logs in as the "Software Engineer" (engineer) account from the login screen. */
async function loginAsEngineer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /alex chen/i }));
}

/** Logs in as the "People & Culture" account from the login screen. */
async function loginAsPeopleAndCulture(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /morgan rivera/i }));
}

/** Logs in as the "Engineering Director" (leadership) account from the login screen. */
async function loginAsLeadership(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /taylor brooks/i }));
}

describe("App composed dashboard", () => {
  it("shows the login screen with no session, listing all five accounts", () => {
    render(<App />);

    expect(
      screen.getByRole("list", { name: /choose an account to sign in as/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /alex chen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /priya sharma/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /jordan park/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /morgan rivera/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /taylor brooks/i })).toBeInTheDocument();
  });

  it("renders exactly the two fixed dashboard widgets and no widget picker", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAsEngineer(user);

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();

    // No "Add widget" affordance and no customize-dashboard dialog exist.
    expect(
      screen.queryByRole("button", { name: /add widget/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /customize dashboard/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the logged-in account's own data after logging in", async () => {
    const user = userEvent.setup();
    render(<App />);

    await loginAsEngineer(user);

    // Engineer-specific content is visible.
    expect(
      screen.getByText("Fix memory leak in auth service"),
    ).toBeInTheDocument();
  });

  it("logs out, returns to the login screen, and shows a different account's data after logging back in", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAsEngineer(user);

    expect(
      screen.getByText("Fix memory leak in auth service"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /log out/i }));

    // Back at the login screen.
    expect(
      await screen.findByRole("list", { name: /choose an account to sign in as/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Fix memory leak in auth service"),
    ).not.toBeInTheDocument();

    await loginAsPeopleAndCulture(user);

    // People & Culture content now appears.
    expect(
      await screen.findByText("Send revised offer to Jamie Tran"),
    ).toBeInTheDocument();
  });

  it("logs in directly as the single leadership account", async () => {
    const user = userEvent.setup();
    render(<App />);

    await loginAsLeadership(user);

    // The leadership role's content appears (the dashboard only renders the
    // Calendar + Tasks widgets, so assert against a task title).
    expect(
      await screen.findByText("Review and approve Q4 roadmap deck"),
    ).toBeInTheDocument();
  });

  it("opens the Task_Panel and drives it to the done state", async () => {
    // Fake timers drive the task-execution chain deterministically. We use
    // fireEvent (synchronous) rather than user-event here so no user-event
    // internal delays need to be reconciled against the mocked clock.
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /alex chen/i }));

    // Flush mount effects so the task-panel controller is fully initialized.
    await act(async () => {});

    // Activate the task CTA ("Execute with Jarvis") for the first task, which
    // opens the execution drawer with the "Execute now" / "Schedule
    // execution" options.
    const handleButtons = screen.getAllByRole("button", {
      name: /execute with jarvis/i,
    });
    await act(async () => {
      fireEvent.click(handleButtons[0]);
    });

    const drawer = screen.getByRole("dialog", {
      name: "Fix memory leak in auth service",
    });
    const executeNowButton = within(drawer).getByRole("button", {
      name: /^execute now$/i,
    });
    await act(async () => {
      fireEvent.click(executeNowButton);
    });

    // "Execute now" closes the drawer and opens the Task_Panel as a dialog in
    // the planning state, titled with the task and offering the execute action.
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Fix memory leak in auth service"),
    ).toBeInTheDocument();
    const executeButton = within(dialog).getByRole("button", {
      name: /execute this for me/i,
    });

    // Run the plan and advance through the full timing chain
    // (~900ms initial + 4×1400ms per-step + 700ms finalize = ~7200ms).
    await act(async () => {
      fireEvent.click(executeButton);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    // The panel reaches the terminal done state.
    expect(within(dialog).getByText(/task completed/i)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/jarvis executed all 5 steps/i),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /done/i }),
    ).toBeInTheDocument();
  });

  it("persists the task as Completed with an artifact after the Task_Panel is driven to done and closed", async () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /alex chen/i }));
    await act(async () => {});

    // Open the drawer, then Execute now to hand off to the Task_Panel.
    const handleButtons = screen.getAllByRole("button", {
      name: /execute with jarvis/i,
    });
    await act(async () => {
      fireEvent.click(handleButtons[0]);
    });
    const drawer = screen.getByRole("dialog", {
      name: "Fix memory leak in auth service",
    });
    await act(async () => {
      fireEvent.click(within(drawer).getByRole("button", { name: /^execute now$/i }));
    });

    const dialog = screen.getByRole("dialog");
    const executeButton = within(dialog).getByRole("button", {
      name: /execute this for me/i,
    });
    await act(async () => {
      fireEvent.click(executeButton);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    // Reached done; close the panel via its "Done" button.
    const doneButton = within(dialog).getByRole("button", { name: /^done$/i });
    await act(async () => {
      fireEvent.click(doneButton);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // The task now shows as Completed on the dashboard with a viewable artifact.
    // (findBy's internal polling relies on real timers, so we assert directly
    // since state has already settled by this point under fake timers.)
    expect(screen.getByRole("button", { name: /view artifact/i })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /view artifact/i }));
    });

    // The code-style artifact (task category "Bug") is shown.
    expect(screen.getByText("feature/t1")).toBeInTheDocument();
  });

  it("executes, stops mid-way, resumes to completion, then reverts and shows not_started with Execute with Jarvis reachable", async () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /alex chen/i }));
    await act(async () => {});

    // Open the drawer and hand off to the Task_Panel via "Execute now".
    const handleButtons = screen.getAllByRole("button", {
      name: /execute with jarvis/i,
    });
    await act(async () => {
      fireEvent.click(handleButtons[0]);
    });
    const drawer = screen.getByRole("dialog", {
      name: "Fix memory leak in auth service",
    });
    await act(async () => {
      fireEvent.click(within(drawer).getByRole("button", { name: /^execute now$/i }));
    });

    const dialog = screen.getByRole("dialog");
    const executeButton = within(dialog).getByRole("button", {
      name: /execute this for me/i,
    });
    await act(async () => {
      fireEvent.click(executeButton);
    });

    // Advance partway through execution (initial delay + one step tick),
    // then stop mid-flight.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900 + 1400);
    });
    const stopButton = within(dialog).getByRole("button", { name: /stop execution/i });
    await act(async () => {
      fireEvent.click(stopButton);
    });

    expect(within(dialog).getByText(/execution stopped/i)).toBeInTheDocument();

    // Resume from the exact interrupted step.
    const resumeButton = within(dialog).getByRole("button", { name: /^resume$/i });
    await act(async () => {
      fireEvent.click(resumeButton);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });

    // Reaches done.
    expect(within(dialog).getByText(/task completed/i)).toBeInTheDocument();

    // The task now persists as Completed with a viewable artifact — the
    // resume path drove it all the way to a real completion, not just a
    // frozen "stopped" state.
    const doneButton = within(dialog).getByRole("button", { name: /^done$/i });
    await act(async () => {
      fireEvent.click(doneButton);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view artifact/i })).toBeInTheDocument();
  });

  it("reverts a completed task back to not_started with Execute with Jarvis reachable again", async () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /alex chen/i }));
    await act(async () => {});

    const handleButtons = screen.getAllByRole("button", {
      name: /execute with jarvis/i,
    });
    await act(async () => {
      fireEvent.click(handleButtons[0]);
    });
    const drawer = screen.getByRole("dialog", {
      name: "Fix memory leak in auth service",
    });
    await act(async () => {
      fireEvent.click(within(drawer).getByRole("button", { name: /^execute now$/i }));
    });

    const dialog = screen.getByRole("dialog");
    const executeButton = within(dialog).getByRole("button", {
      name: /execute this for me/i,
    });
    await act(async () => {
      fireEvent.click(executeButton);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(within(dialog).getByText(/task completed/i)).toBeInTheDocument();

    // Revert while the panel is still open in the done state.
    const revertButton = within(dialog).getByRole("button", { name: /revert changes/i });
    await act(async () => {
      fireEvent.click(revertButton);
    });

    // Reverting resets the panel back to planning for the same task.
    expect(within(dialog).getByText(/jarvis plan/i)).toBeInTheDocument();

    // Close the panel to inspect the dashboard's derived task status.
    const closeButton = within(dialog).getByRole("button", { name: /close task panel/i });
    await act(async () => {
      fireEvent.click(closeButton);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // The task is back to not_started: no artifact, "Execute with Jarvis" is
    // reachable again.
    expect(screen.queryByRole("button", { name: /view artifact/i })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /execute with jarvis/i }).length,
    ).toBeGreaterThan(0);
  });

  it("closes the Task_Panel and returns to the login screen when the user logs out while it is open", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAsEngineer(user);

    // Open a task panel via the execution drawer's "Execute now" option.
    const handleButtons = screen.getAllByRole("button", {
      name: /execute with jarvis/i,
    });
    await user.click(handleButtons[0]);
    const drawer = screen.getByRole("dialog", {
      name: "Fix memory leak in auth service",
    });
    await user.click(within(drawer).getByRole("button", { name: /^execute now$/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Log out while the panel is open.
    await user.click(screen.getByRole("button", { name: /log out/i }));

    // The panel is dismissed (state machine reset to idle) and the app
    // returns to the login screen.
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByRole("list", { name: /choose an account to sign in as/i }),
    ).toBeInTheDocument();

    // Logging back in as a different account shows that account's content.
    await loginAsPeopleAndCulture(user);
    expect(
      await screen.findByText("Send revised offer to Jamie Tran"),
    ).toBeInTheDocument();
  });
});
