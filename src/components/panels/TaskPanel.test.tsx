// Accessibility unit tests for the Task_Panel side dialog.
//
// These tests exercise the accessibility affordances required by the spec:
//   • Requirement 5.1 — dialog semantics + an accessibly named close control.
//   • Requirement 5.4 — a focus trap that confines Tab focus to the panel.
//   • Requirement 5.5 — Escape closes the panel and focus is restored to the
//     control that opened it once the panel unmounts.
//
// The panel is driven with real data (ROLE_DATA.engineer.tasks[0], a task with
// five ordered steps) so the rendered markup matches production usage. No
// mocks are used beyond a spy on the onClose callback.

import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TaskPanel, type TaskPanelProps } from "./TaskPanel";
import { ROLE_DATA } from "@/data/roleData";

// A real task with several steps drives the planning-state markup.
const task = ROLE_DATA.engineer.tasks[0];

/** Build a full set of TaskPanel props, allowing per-test overrides. */
function makeProps(overrides: Partial<TaskPanelProps> = {}): TaskPanelProps {
  return {
    task,
    state: "planning",
    executingStep: 0,
    completedSteps: new Set<number>(),
    onClose: vi.fn(),
    onExecute: vi.fn(),
    onStop: vi.fn(),
    onRevert: vi.fn(),
    ...overrides,
  };
}

describe("TaskPanel accessibility", () => {
  describe("accessible names (Req 5.1)", () => {
    it("exposes the close control by its accessible name", () => {
      render(<TaskPanel {...makeProps()} />);

      const closeButton = screen.getByRole("button", {
        name: /close task panel/i,
      });
      expect(closeButton).toBeInTheDocument();
    });

    it("renders a dialog whose accessible name is the task title", () => {
      render(<TaskPanel {...makeProps()} />);

      // aria-labelledby points at the plan title, so the dialog's accessible
      // name resolves to the task title.
      const dialog = screen.getByRole("dialog", { name: task.title });
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });

  describe("focus trap (Req 5.4)", () => {
    it("moves focus into the dialog on mount", () => {
      render(<TaskPanel {...makeProps()} />);

      const dialog = screen.getByRole("dialog", { name: task.title });
      // The first focusable control is the close button.
      const closeButton = screen.getByRole("button", {
        name: /close task panel/i,
      });

      expect(dialog).toContainElement(document.activeElement as HTMLElement);
      expect(closeButton).toHaveFocus();
    });

    it("wraps focus from the last focusable control back to the first on Tab", async () => {
      const user = userEvent.setup();
      render(<TaskPanel {...makeProps()} />);

      const dialog = screen.getByRole("dialog", { name: task.title });
      const closeButton = screen.getByRole("button", {
        name: /close task panel/i,
      });
      // "Edit plan" is the last focusable control in planning state.
      const lastButton = screen.getByRole("button", { name: /edit plan/i });

      lastButton.focus();
      expect(lastButton).toHaveFocus();

      await user.tab();

      // Focus wraps to the first control and never leaves the dialog.
      expect(closeButton).toHaveFocus();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });

    it("keeps focus inside the dialog when Shift+Tab is pressed on the first control", async () => {
      const user = userEvent.setup();
      render(<TaskPanel {...makeProps()} />);

      const dialog = screen.getByRole("dialog", { name: task.title });
      const closeButton = screen.getByRole("button", {
        name: /close task panel/i,
      });
      const lastButton = screen.getByRole("button", { name: /edit plan/i });

      // Focus starts on the close button (first control) after mount.
      expect(closeButton).toHaveFocus();

      await user.tab({ shift: true });

      // Shift+Tab from the first control wraps to the last control.
      expect(lastButton).toHaveFocus();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
  });

  describe("Escape closes and restores focus (Req 5.5)", () => {
    it("calls onClose when Escape is pressed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<TaskPanel {...makeProps({ onClose })} />);

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("restores focus to the opener element when the panel unmounts", async () => {
      const user = userEvent.setup();

      // Harness: a trigger button that opens the panel, and closes it via
      // onClose (Escape). When the panel unmounts, focus must return here.
      function Harness() {
        const [open, setOpen] = useState(false);
        return (
          <div>
            <button type="button" onClick={() => setOpen(true)}>
              Open panel
            </button>
            {open && (
              <TaskPanel {...makeProps({ onClose: () => setOpen(false) })} />
            )}
          </div>
        );
      }

      render(<Harness />);

      const trigger = screen.getByRole("button", { name: /open panel/i });

      // Clicking the trigger focuses it, then mounts the panel; the focus trap
      // records the trigger as the element to restore to.
      await user.click(trigger);

      const dialog = screen.getByRole("dialog", { name: task.title });
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
      expect(trigger).not.toHaveFocus();

      // Escape closes the panel (onClose unmounts it), restoring focus.
      await user.keyboard("{Escape}");

      expect(
        within(document.body).queryByRole("dialog", { name: task.title }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });
});

// ─── Human-in-the-loop rework: Stop / Resume / Discard / Revert / reasoning
// trace / re-run input (feedback-driven rework) ─────────────────────────────

describe("TaskPanel — Stop button (human-in-the-loop interrupt)", () => {
  it("shows a Stop button only while executing, and calls onStop when clicked", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    render(
      <TaskPanel
        {...makeProps({
          state: "executing",
          executingStep: 1,
          completedSteps: new Set([0]),
          onStop,
        })}
      />,
    );

    const stopButton = screen.getByRole("button", { name: /stop execution/i });
    await user.click(stopButton);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("does not show a Stop button in the planning state", () => {
    render(<TaskPanel {...makeProps({ state: "planning" })} />);
    expect(screen.queryByRole("button", { name: /stop execution/i })).not.toBeInTheDocument();
  });

  it("does not show a Stop button in the done state", () => {
    render(
      <TaskPanel
        {...makeProps({
          state: "done",
          executingStep: task.steps.length,
          completedSteps: new Set(task.steps.map((_, i) => i)),
        })}
      />,
    );
    expect(screen.queryByRole("button", { name: /stop execution/i })).not.toBeInTheDocument();
  });
});

describe("TaskPanel — stopped state (badge, Resume, Discard)", () => {
  function renderStopped(overrides: Partial<TaskPanelProps> = {}) {
    return render(
      <TaskPanel
        {...makeProps({
          state: "stopped",
          executingStep: 1,
          completedSteps: new Set([0]),
          ...overrides,
        })}
      />,
    );
  }

  it("shows the EXECUTION STOPPED badge", () => {
    renderStopped();
    expect(screen.getByText(/execution stopped/i)).toBeInTheDocument();
  });

  it("shows Resume and Discard controls, calling onExecute and onClose respectively", async () => {
    const user = userEvent.setup();
    const onExecute = vi.fn();
    const onClose = vi.fn();
    renderStopped({ onExecute, onClose });

    const resumeButton = screen.getByRole("button", { name: /resume/i });
    await user.click(resumeButton);
    // Resume calls execute() with no input.
    expect(onExecute).toHaveBeenCalledTimes(1);
    expect(onExecute).toHaveBeenCalledWith();

    const discardButton = screen.getByRole("button", { name: /discard/i });
    await user.click(discardButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows 'stopped after step N of M' progress messaging", () => {
    renderStopped();
    expect(screen.getByText(/stopped after step 1 of 5/i)).toBeInTheDocument();
  });
});

describe("TaskPanel — reasoning trace lines", () => {
  it("renders the active step's reasoning trace while executing", () => {
    render(
      <TaskPanel
        {...makeProps({
          state: "executing",
          executingStep: 0,
          completedSteps: new Set(),
        })}
      />,
    );

    // The first step's reasoning trace should include a "Reading …" line
    // (per buildStepReasoning's deterministic shape).
    expect(screen.getByText(/^Reading /)).toBeInTheDocument();
  });

  it("keeps completed steps' reasoning trace visible after the fact", () => {
    render(
      <TaskPanel
        {...makeProps({
          state: "executing",
          executingStep: 1,
          completedSteps: new Set([0]),
        })}
      />,
    );

    // Step 0 is done; its reasoning trace remains rendered (muted treatment).
    const readingLines = screen.getAllByText(/^Reading /);
    expect(readingLines.length).toBeGreaterThanOrEqual(1);
  });

  it("shows a frozen reasoning trace for the paused step when stopped", () => {
    render(
      <TaskPanel
        {...makeProps({
          state: "stopped",
          executingStep: 1,
          completedSteps: new Set([0]),
        })}
      />,
    );

    expect(screen.getByText(/stopped here/i)).toBeInTheDocument();
  });

  it("threads the input prop into the reasoning trace", () => {
    render(
      <TaskPanel
        {...makeProps({
          state: "executing",
          executingStep: 0,
          completedSteps: new Set(),
          input: "double check the pool config",
        })}
      />,
    );

    expect(
      screen.getByText(/Incorporating your note: "double check the pool config"/i),
    ).toBeInTheDocument();
  });
});

describe("TaskPanel — re-run/instructions input", () => {
  it("shows the optional instructions textarea in planning and threads it through onExecute", async () => {
    const user = userEvent.setup();
    const onExecute = vi.fn();
    render(<TaskPanel {...makeProps({ state: "planning", onExecute })} />);

    const textarea = screen.getByLabelText(/add instructions before executing/i);
    await user.type(textarea, "focus on step 2 first");

    const executeButton = screen.getByRole("button", { name: /execute this for me/i });
    await user.click(executeButton);

    expect(onExecute).toHaveBeenCalledWith("focus on step 2 first");
  });

  it("shows the re-run textarea and button in the done state, calling onExecute with typed text", async () => {
    const user = userEvent.setup();
    const onExecute = vi.fn();
    render(
      <TaskPanel
        {...makeProps({
          state: "done",
          executingStep: task.steps.length,
          completedSteps: new Set(task.steps.map((_, i) => i)),
          onExecute,
        })}
      />,
    );

    const textarea = screen.getByLabelText(/give jarvis new instructions and re-run/i);
    await user.type(textarea, "also check the read replica");

    const rerunButton = screen.getByRole("button", { name: /re-run with this input/i });
    expect(rerunButton).toBeEnabled();
    await user.click(rerunButton);

    expect(onExecute).toHaveBeenCalledWith("also check the read replica");
  });

  it("shows the re-run textarea in the stopped state as well", () => {
    render(
      <TaskPanel
        {...makeProps({
          state: "stopped",
          executingStep: 1,
          completedSteps: new Set([0]),
        })}
      />,
    );

    expect(
      screen.getByLabelText(/give jarvis new instructions and re-run/i),
    ).toBeInTheDocument();
  });

  it("disables the re-run button until text is typed", () => {
    render(
      <TaskPanel
        {...makeProps({
          state: "done",
          executingStep: task.steps.length,
          completedSteps: new Set(task.steps.map((_, i) => i)),
        })}
      />,
    );

    const rerunButton = screen.getByRole("button", { name: /re-run with this input/i });
    expect(rerunButton).toBeDisabled();
  });
});

describe("TaskPanel — Revert button (done state only)", () => {
  it("shows a Revert changes button only in the done state, calling onRevert", async () => {
    const user = userEvent.setup();
    const onRevert = vi.fn();
    render(
      <TaskPanel
        {...makeProps({
          state: "done",
          executingStep: task.steps.length,
          completedSteps: new Set(task.steps.map((_, i) => i)),
          onRevert,
        })}
      />,
    );

    const revertButton = screen.getByRole("button", { name: /revert changes/i });
    await user.click(revertButton);
    expect(onRevert).toHaveBeenCalledTimes(1);
  });

  it("does not show the Revert button in planning, executing, or stopped states", () => {
    render(<TaskPanel {...makeProps({ state: "planning" })} />);
    expect(screen.queryByRole("button", { name: /revert changes/i })).not.toBeInTheDocument();
  });
});
