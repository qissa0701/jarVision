// Component tests for ArtifactCard: the code vs. document artifact variants,
// and the Approve/Request changes/Open/Download interactions.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OvernightRun, Task } from "@/types";
import { ArtifactCard } from "./ArtifactCard";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Fix memory leak in auth service",
    due: "Today",
    category: "Bug",
    steps: [{ num: 1, title: "Capture heap snapshot", description: "…" }],
    ...overrides,
  };
}

function makeRun(overrides: Partial<OvernightRun> = {}): OvernightRun {
  return {
    key: "engineer:t1",
    role: "engineer",
    taskId: "t1",
    taskTitle: "Fix memory leak in auth service",
    category: "Bug",
    stepCount: 1,
    status: "ready",
    scheduledFor: "1:30 AM",
    result: "Done",
    confidence: 88,
    updatedAt: 0,
    ...overrides,
  };
}

describe("ArtifactCard — code artifact (Bug/Testing/Incident)", () => {
  it("shows a mock branch and PR reference for a Bug-category task", () => {
    render(
      <ArtifactCard
        task={makeTask({ category: "Bug" })}
        run={makeRun()}
        onArtifactAction={vi.fn()}
        onRequestChanges={vi.fn()}
        onApprove={vi.fn()}
      />,
    );

    expect(screen.getByText("feature/t1")).toBeInTheDocument();
    expect(screen.getByText(/view pr #\d+/i)).toBeInTheDocument();
  });
});

describe("ArtifactCard — document artifact (other categories)", () => {
  it("shows a summary, notable points, suggested comments, and a comment input", () => {
    render(
      <ArtifactCard
        task={makeTask({ category: "Review", title: "Review Sam Ortiz's promotion packet" })}
        run={makeRun({ category: "Review" })}
        onArtifactAction={vi.fn()}
        onRequestChanges={vi.fn()}
        onApprove={vi.fn()}
      />,
    );

    expect(screen.getByText(/review sam ortiz's promotion packet/i)).toBeInTheDocument();
    expect(screen.getByText(/notable points/i)).toBeInTheDocument();
    expect(screen.getByText(/suggested comments/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/add a comment/i)).toBeInTheDocument();
  });

  it("adds a typed comment to the visible running list", async () => {
    const user = userEvent.setup();
    render(
      <ArtifactCard
        task={makeTask({ category: "Docs" })}
        run={makeRun({ category: "Docs" })}
        onArtifactAction={vi.fn()}
        onRequestChanges={vi.fn()}
        onApprove={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/add a comment/i);
    await user.type(input, "Looks good, ship it.");
    await user.click(screen.getByRole("button", { name: /add comment/i }));

    expect(screen.getByText("Looks good, ship it.")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });
});

describe("ArtifactCard — action row", () => {
  it("calls onArtifactAction with 'open' when Open is clicked", async () => {
    const user = userEvent.setup();
    const onArtifactAction = vi.fn();
    const task = makeTask();
    render(
      <ArtifactCard
        task={task}
        run={makeRun()}
        onArtifactAction={onArtifactAction}
        onRequestChanges={vi.fn()}
        onApprove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^open$/i }));
    expect(onArtifactAction).toHaveBeenCalledWith("open", task);
  });

  it("calls onArtifactAction with 'download' when Download is clicked", async () => {
    const user = userEvent.setup();
    const onArtifactAction = vi.fn();
    const task = makeTask();
    render(
      <ArtifactCard
        task={task}
        run={makeRun()}
        onArtifactAction={onArtifactAction}
        onRequestChanges={vi.fn()}
        onApprove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^download$/i }));
    expect(onArtifactAction).toHaveBeenCalledWith("download", task);
  });

  it("calls onRequestChanges when Request changes is clicked", async () => {
    const user = userEvent.setup();
    const onRequestChanges = vi.fn();
    const task = makeTask();
    render(
      <ArtifactCard
        task={task}
        run={makeRun()}
        onArtifactAction={vi.fn()}
        onRequestChanges={onRequestChanges}
        onApprove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /request changes/i }));
    expect(onRequestChanges).toHaveBeenCalledWith(task);
  });

  it("calls onApprove when Approve is clicked", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const task = makeTask();
    render(
      <ArtifactCard
        task={task}
        run={makeRun()}
        onArtifactAction={vi.fn()}
        onRequestChanges={vi.fn()}
        onApprove={onApprove}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^approve$/i }));
    expect(onApprove).toHaveBeenCalledWith(task);
  });

  it("shows Approved and disables the Approve button once the run is approved", () => {
    render(
      <ArtifactCard
        task={makeTask()}
        run={makeRun({ status: "approved" })}
        onArtifactAction={vi.fn()}
        onRequestChanges={vi.fn()}
        onApprove={vi.fn()}
      />,
    );

    const approveButtons = screen.getAllByRole("button", { name: /approved/i });
    expect(approveButtons.some((btn) => btn.hasAttribute("disabled"))).toBe(true);
  });
});
