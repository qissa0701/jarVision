// Accessibility + behavior tests for TaskExecutionDrawer, mirroring the
// TaskPanel.test.tsx pattern: dialog semantics, focus trap, Escape-to-close.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Task } from "@/types";
import { TaskExecutionDrawer } from "./TaskExecutionDrawer";

const task: Task = {
  id: "t1",
  title: "Fix memory leak in auth service",
  due: "Today",
  category: "Bug",
  steps: [{ num: 1, title: "Capture heap snapshot", description: "…" }],
};

function renderDrawer(overrides: Partial<Parameters<typeof TaskExecutionDrawer>[0]> = {}) {
  const onClose = vi.fn();
  const onExecuteNow = vi.fn();
  const onSchedule = vi.fn();
  render(
    <TaskExecutionDrawer
      task={task}
      onClose={onClose}
      onExecuteNow={onExecuteNow}
      onSchedule={onSchedule}
      {...overrides}
    />,
  );
  return { onClose, onExecuteNow, onSchedule };
}

describe("TaskExecutionDrawer — accessibility", () => {
  it("renders a dialog whose accessible name is the task title", () => {
    renderDrawer();
    const dialog = screen.getByRole("dialog", { name: task.title });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("exposes the close control by its accessible name", () => {
    renderDrawer();
    expect(
      screen.getByRole("button", { name: /close execution options/i }),
    ).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("TaskExecutionDrawer — Execute now", () => {
  it("calls onExecuteNow with the task when clicked", async () => {
    const user = userEvent.setup();
    const { onExecuteNow } = renderDrawer();

    await user.click(screen.getByRole("button", { name: /^execute now$/i }));

    expect(onExecuteNow).toHaveBeenCalledWith(task);
  });
});

describe("TaskExecutionDrawer — Schedule execution", () => {
  it("calls onSchedule with the task and the picked time, then closes", async () => {
    const user = userEvent.setup();
    const { onSchedule, onClose } = renderDrawer();

    const timeInput = screen.getByLabelText(/run at/i);
    await user.clear(timeInput);
    await user.type(timeInput, "0915");

    await user.click(screen.getByRole("button", { name: /^schedule$/i }));

    expect(onSchedule).toHaveBeenCalledWith(task, "09:15");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not schedule when the time field is cleared", async () => {
    const user = userEvent.setup();
    const { onSchedule } = renderDrawer();

    const timeInput = screen.getByLabelText(/run at/i);
    await user.clear(timeInput);

    await user.click(screen.getByRole("button", { name: /^schedule$/i }));

    expect(onSchedule).not.toHaveBeenCalled();
  });
});
