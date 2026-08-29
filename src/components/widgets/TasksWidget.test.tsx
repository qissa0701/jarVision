// Component tests for the Tasks widget: filter chip counts/filtering,
// opening the execution drawer and scheduling with a picked time, the
// "Simulate: run now" flow advancing a scheduled task to Completed, and the
// "Execute now" path handing off to the existing Task_Panel via onHandleTask.
//
// Tests behavior (what the user sees and can do), not implementation details.
// `overnight` is a lightweight mock satisfying the OvernightQueue contract so
// these tests don't depend on real timers/localStorage.

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OvernightRun, PanelState, RoleData, Task } from "@/types";
import type { OvernightQueue } from "@/hooks/useOvernightQueue";
import { TasksWidget } from "./TasksWidget";

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

function makeData(tasks: Task[]): RoleData {
  return {
    name: "Alex Chen",
    firstName: "Alex",
    title: "Software Engineer",
    avatar: "AC",
    priorities: [],
    tasks,
    emails: [],
    meetings: [],
    suggestions: [],
  };
}

/** A minimal OvernightQueue double, backed by an in-memory run map. */
function makeMockOvernight(initialRuns: Record<string, OvernightRun> = {}): OvernightQueue {
  const runs = { ...initialRuns };
  return {
    window: { start: "23:00", end: "06:00" },
    runsFor: () => Object.values(runs),
    getRun: (role, taskId) => runs[`${role}:${taskId}`],
    queuedCount: () => 0,
    readyCount: () => 0,
    isRunning: false,
    schedule: vi.fn((role, task, explicitTime) => {
      runs[`${role}:${task.id}`] = {
        key: `${role}:${task.id}`,
        role,
        taskId: task.id,
        taskTitle: task.title,
        category: task.category,
        stepCount: task.steps.length,
        status: "scheduled",
        scheduledFor: explicitTime ? "2:30 PM" : "1:30 AM",
        result: null,
        confidence: null,
        updatedAt: 0,
      };
    }),
    unschedule: vi.fn((role, taskId) => {
      delete runs[`${role}:${taskId}`];
    }),
    runNow: vi.fn(),
    runOne: vi.fn((role, taskId) => {
      const key = `${role}:${taskId}`;
      if (runs[key]) runs[key] = { ...runs[key], status: "ready" };
    }),
    completeNow: vi.fn((role, task) => {
      runs[`${role}:${task.id}`] = {
        key: `${role}:${task.id}`,
        role,
        taskId: task.id,
        taskTitle: task.title,
        category: task.category,
        stepCount: task.steps.length,
        status: "ready",
        scheduledFor: "3:00 PM",
        result: "Done",
        confidence: 90,
        updatedAt: 0,
      };
    }),
    approve: vi.fn((role, taskId) => {
      const key = `${role}:${taskId}`;
      if (runs[key]) runs[key] = { ...runs[key], status: "approved" };
    }),
    requestChanges: vi.fn((role, taskId) => {
      const key = `${role}:${taskId}`;
      if (runs[key]) runs[key] = { ...runs[key], status: "changes_requested" };
    }),
    setWindow: vi.fn(),
  };
}

function renderWidget(overrides: {
  tasks?: Task[];
  overnight?: OvernightQueue;
  onHandleTask?: (task: Task) => void;
  taskPanelActiveTaskId?: string | null;
  taskPanelState?: PanelState;
} = {}) {
  const tasks = overrides.tasks ?? [makeTask()];
  const overnight = overrides.overnight ?? makeMockOvernight();
  const onHandleTask = overrides.onHandleTask ?? vi.fn();
  const onArtifactAction = vi.fn();

  render(
    <TasksWidget
      data={makeData(tasks)}
      role="engineer"
      onHandleTask={onHandleTask}
      overnight={overnight}
      taskPanelActiveTaskId={overrides.taskPanelActiveTaskId ?? null}
      taskPanelState={overrides.taskPanelState ?? "idle"}
      onArtifactAction={onArtifactAction}
    />,
  );

  return { tasks, overnight, onHandleTask, onArtifactAction };
}

describe("TasksWidget — filter chips", () => {
  it("shows an All chip counting every task plus one chip per status", () => {
    renderWidget({
      tasks: [makeTask({ id: "t1" }), makeTask({ id: "t2" })],
    });

    const chipGroup = screen.getByRole("group", { name: /filter tasks by status/i });
    expect(within(chipGroup).getByRole("button", { name: /all\s*2/i })).toBeInTheDocument();
    expect(
      within(chipGroup).getByRole("button", { name: /not started\s*2/i }),
    ).toBeInTheDocument();
  });

  it("filters the visible task list when a status chip is clicked", async () => {
    const user = userEvent.setup();
    const scheduledRun: OvernightRun = {
      key: "engineer:t2",
      role: "engineer",
      taskId: "t2",
      taskTitle: "Scheduled task",
      category: "Docs",
      stepCount: 1,
      status: "scheduled",
      scheduledFor: "1:30 AM",
      result: null,
      confidence: null,
      updatedAt: 0,
    };
    renderWidget({
      tasks: [
        makeTask({ id: "t1", title: "Not started task" }),
        makeTask({ id: "t2", title: "Scheduled task" }),
      ],
      overnight: makeMockOvernight({ "engineer:t2": scheduledRun }),
    });

    expect(screen.getByText("Not started task")).toBeInTheDocument();
    expect(screen.getByText("Scheduled task")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^scheduled\s*1$/i }));

    expect(screen.queryByText("Not started task")).not.toBeInTheDocument();
    expect(screen.getByText("Scheduled task")).toBeInTheDocument();
  });
});

describe("TasksWidget — execution drawer", () => {
  it("opens the drawer with Execute now and Schedule execution options", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole("button", { name: /execute with jarvis/i }));

    const drawer = screen.getByRole("dialog", { name: "Fix memory leak in auth service" });
    expect(within(drawer).getByRole("button", { name: /^execute now$/i })).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: /^schedule$/i })).toBeInTheDocument();
  });

  it("schedules the task with the picked time and shows it under Scheduled", async () => {
    const user = userEvent.setup();
    const { overnight } = renderWidget();

    await user.click(screen.getByRole("button", { name: /execute with jarvis/i }));
    const drawer = screen.getByRole("dialog", { name: "Fix memory leak in auth service" });

    const timeInput = within(drawer).getByLabelText(/run at/i);
    await user.clear(timeInput);
    await user.type(timeInput, "1430");

    await user.click(within(drawer).getByRole("button", { name: /^schedule$/i }));

    expect(overnight.schedule).toHaveBeenCalledWith(
      "engineer",
      expect.objectContaining({ id: "t1" }),
      "14:30",
    );
    // Drawer closes after scheduling.
    expect(
      screen.queryByRole("dialog", { name: "Fix memory leak in auth service" }),
    ).not.toBeInTheDocument();
    // The task now shows its scheduled time.
    expect(screen.getByText(/scheduled for 2:30 pm/i)).toBeInTheDocument();
  });

  it("closes the drawer and delegates to onHandleTask when Execute now is clicked", async () => {
    const user = userEvent.setup();
    const { onHandleTask } = renderWidget();

    await user.click(screen.getByRole("button", { name: /execute with jarvis/i }));
    const drawer = screen.getByRole("dialog", { name: "Fix memory leak in auth service" });
    await user.click(within(drawer).getByRole("button", { name: /^execute now$/i }));

    expect(onHandleTask).toHaveBeenCalledWith(expect.objectContaining({ id: "t1" }));
    expect(
      screen.queryByRole("dialog", { name: "Fix memory leak in auth service" }),
    ).not.toBeInTheDocument();
  });
});

describe("TasksWidget — Simulate: run now", () => {
  it("advances a scheduled task to Completed via the simulate affordance", async () => {
    const user = userEvent.setup();
    const scheduledRun: OvernightRun = {
      key: "engineer:t1",
      role: "engineer",
      taskId: "t1",
      taskTitle: "Fix memory leak in auth service",
      category: "Bug",
      stepCount: 1,
      status: "scheduled",
      scheduledFor: "1:30 AM",
      result: null,
      confidence: null,
      updatedAt: 0,
    };
    const overnight = makeMockOvernight({ "engineer:t1": scheduledRun });
    const { rerender } = render(
      <TasksWidget
        data={makeData([makeTask()])}
        role="engineer"
        onHandleTask={vi.fn()}
        overnight={overnight}
        taskPanelActiveTaskId={null}
        taskPanelState="idle"
        onArtifactAction={vi.fn()}
      />,
    );

    const simulateButton = screen.getByRole("button", { name: /simulate: run now/i });
    await user.click(simulateButton);

    expect(overnight.runOne).toHaveBeenCalledWith("engineer", "t1");

    // Re-render to reflect the mock's synchronous state update (the real hook
    // would trigger a React re-render on its own state change).
    rerender(
      <TasksWidget
        data={makeData([makeTask()])}
        role="engineer"
        onHandleTask={vi.fn()}
        overnight={overnight}
        taskPanelActiveTaskId={null}
        taskPanelState="idle"
        onArtifactAction={vi.fn()}
      />,
    );

    // A "ready" run now derives to "needs_review" (awaiting human review),
    // not "completed" — the artifact toggle reads "Review artifact" here.
    expect(screen.getByRole("button", { name: /review artifact/i })).toBeInTheDocument();
  });
});

describe("TasksWidget — Execute with Jarvis on needs_review/completed tasks", () => {
  it("hides Execute with Jarvis for a needs_review task but keeps artifact actions", async () => {
    const readyRun: OvernightRun = {
      key: "engineer:t1",
      role: "engineer",
      taskId: "t1",
      taskTitle: "Fix memory leak in auth service",
      category: "Bug",
      stepCount: 1,
      status: "ready",
      scheduledFor: "3:00 PM",
      result: "Done",
      confidence: 90,
      updatedAt: 0,
    };
    renderWidget({ overnight: makeMockOvernight({ "engineer:t1": readyRun }) });

    expect(screen.queryByRole("button", { name: /execute with jarvis/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /review artifact/i })).toBeInTheDocument();
  });

  it("still shows Execute with Jarvis for not-started, scheduled, and in-progress tasks", () => {
    const scheduledRun: OvernightRun = {
      key: "engineer:t2",
      role: "engineer",
      taskId: "t2",
      taskTitle: "Scheduled task",
      category: "Docs",
      stepCount: 1,
      status: "scheduled",
      scheduledFor: "1:30 AM",
      result: null,
      confidence: null,
      updatedAt: 0,
    };
    renderWidget({
      tasks: [
        makeTask({ id: "t1", title: "Not started task" }),
        makeTask({ id: "t2", title: "Scheduled task" }),
        makeTask({ id: "t3", title: "In progress task" }),
      ],
      overnight: makeMockOvernight({ "engineer:t2": scheduledRun }),
      taskPanelActiveTaskId: "t3",
      taskPanelState: "executing",
    });

    expect(
      screen.getAllByRole("button", { name: /execute with jarvis/i }),
    ).toHaveLength(3);
  });
});

describe("TasksWidget — in-progress status from the Task_Panel", () => {
  it("shows an In progress badge when the Task_Panel is executing this exact task", () => {
    renderWidget({ taskPanelActiveTaskId: "t1", taskPanelState: "executing" });
    // Distinguish the row's status badge from the "In Progress" filter chip,
    // which also matches /in progress/i.
    const chipGroup = screen.getByRole("group", { name: /filter tasks by status/i });
    expect(within(chipGroup).getByRole("button", { name: /in progress\s*1/i })).toBeInTheDocument();
    expect(screen.getAllByText(/in progress/i).length).toBeGreaterThan(1);
  });

  it("does not treat a `stopped` Task_Panel as in_progress for the active task", () => {
    // Audit for the new "stopped" PanelState value (Req: human-in-the-loop
    // stop): TasksWidget's `isExecuting` check only matches "executing", so a
    // task the panel has stopped on must fall back to not_started (no
    // overnight run yet exists for it), not be misreported as in progress.
    renderWidget({ taskPanelActiveTaskId: "t1", taskPanelState: "stopped" });

    const chipGroup = screen.getByRole("group", { name: /filter tasks by status/i });
    expect(
      within(chipGroup).getByRole("button", { name: /not started\s*1/i }),
    ).toBeInTheDocument();
    expect(
      within(chipGroup).queryByRole("button", { name: /^in progress\s*1$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /execute with jarvis/i })).toBeInTheDocument();
  });
});
