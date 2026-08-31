// Tasks widget — one of the dashboard's two fixed widgets.
//
// A container that composes:
//   • a filter-chip row (TaskStatusChips) driven by the five-state model
//     derived in `src/lib/taskStatus.ts` (not_started/scheduled/in_progress/
//     needs_review/completed) plus an "All" chip, each labeled with a live
//     count. "Needs review" covers automated/overnight runs that have
//     finished and are waiting on a human look before being approved;
//   • the filtered task list, each row offering "Execute with Jarvis" (opens
//     TaskExecutionDrawer), a Scheduled task's "Simulate: run now" affordance,
//     and a Completed task's expandable ArtifactCard.
//
// Status is never stored on the task itself — it's derived per task from the
// existing overnight-run record (if any) plus whether the Task_Panel is
// currently executing that exact task (`deriveTaskStatus`), so this widget
// never invents a parallel state store.

import { useEffect, useState } from "react";
import { ArrowRight, Clock, Eye, PlayCircle, Sparkles } from "lucide-react";
import type { PanelState, Role, RoleData, Task } from "@/types";
import type { CascadeItem } from "@/types/vision";
import type { OvernightQueue } from "@/hooks/useOvernightQueue";
import { getJourney } from "@/data/visionJourneys";
import { countTasksByStatus, deriveTaskStatus, type TaskStatus } from "@/lib/taskStatus";
import { TaskStatusChips, type TaskFilter } from "@/components/widgets/TaskStatusChips";
import { TaskExecutionDrawer } from "@/components/widgets/TaskExecutionDrawer";
import { ArtifactCard, type ArtifactActionKind } from "@/components/widgets/ArtifactCard";

export interface TasksWidgetProps {
  /** Role data (already search-filtered upstream). */
  data: RoleData;
  /** The active role, used to key overnight runs. */
  role: Role;
  /** Opens the Task_Panel for a task ("Execute now" in the drawer). */
  onHandleTask: (task: Task) => void;
  /** The overnight run queue (schedule/runOne/completeNow/approve/requestChanges/getRun). */
  overnight: OvernightQueue;
  /** The Task_Panel's currently active task id, if any (for in-progress status). */
  taskPanelActiveTaskId: string | null;
  /** The Task_Panel's current state machine value. */
  taskPanelState: PanelState;
  /** Mocked Open/Download artifact actions, bubbled up to App.tsx for a toast. */
  onArtifactAction: (kind: ArtifactActionKind, task: Task) => void;
  /**
   * Action items cascaded from a VISION Studio simulation that are owned by
   * this account (already filtered to the active role via the org-role
   * mapping). Surfaced as a distinct group at the top of the task list (FR-7).
   */
  cascadedItems?: CascadeItem[];
}

export function TasksWidget({
  data,
  role,
  onHandleTask,
  overnight,
  taskPanelActiveTaskId,
  taskPanelState,
  onArtifactAction,
  cascadedItems = [],
}: TasksWidgetProps) {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [expandedArtifactId, setExpandedArtifactId] = useState<string | null>(null);

  // Task ids repeat across roles (e.g. every role has a "t1"), so any
  // role-local UI state (an open drawer, an expanded artifact) must reset
  // when the active role changes — otherwise switching roles could leave the
  // drawer open against a task belonging to the previous role's data.
  useEffect(() => {
    setDrawerTaskId(null);
    setExpandedArtifactId(null);
  }, [role]);

  const statusFor = (task: Task): TaskStatus => {
    const run = overnight.getRun(role, task.id);
    const isExecuting =
      taskPanelActiveTaskId === task.id && taskPanelState === "executing";
    return deriveTaskStatus(run, isExecuting);
  };

  const counts = countTasksByStatus(data.tasks, statusFor);

  const visibleTasks =
    filter === "all" ? data.tasks : data.tasks.filter((task) => statusFor(task) === filter);

  const drawerTask = drawerTaskId ? data.tasks.find((t) => t.id === drawerTaskId) ?? null : null;

  const closeDrawer = () => setDrawerTaskId(null);

  const handleExecuteNowFromDrawer = (task: Task) => {
    closeDrawer();
    onHandleTask(task);
  };

  const handleScheduleFromDrawer = (task: Task, time: string) => {
    overnight.schedule(role, task, time);
  };

  return (
    <div className="space-y-3">
      {cascadedItems.length > 0 && (
        <div className="rounded-xl border border-blue-100 dark:border-blue-400/20 bg-blue-50/60 dark:bg-blue-500/10 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
            <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
              From jarVision · {cascadedItems.length}
            </p>
          </div>
          <ul className="space-y-2">
            {cascadedItems.map((c) => {
              const tech = getJourney(c.sourceJourneyId)?.techName ?? "an emerging technology";
              return (
                <li key={c.id} className="rounded-lg bg-card border border-border p-2.5">
                  <p className="text-xs font-semibold text-foreground leading-snug">{c.actionText}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Cascaded to <span className="font-semibold">{c.targetRole}</span> · from {tech} ·{" "}
                    {c.layerOrigin} · traceable to journey <span className="font-mono">{c.sourceJourneyId}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <TaskStatusChips counts={counts} active={filter} onSelect={setFilter} />

      <div className="space-y-2.5">
        {visibleTasks.map((task) => {
          const run = overnight.getRun(role, task.id);
          const status = statusFor(task);
          const isArtifactExpanded = expandedArtifactId === task.id;

          return (
            <div
              key={task.id}
              className="flex flex-col gap-2 p-3 rounded-xl bg-muted hover:bg-blue-50/50 dark:hover:bg-blue-500/10 hover:border-blue-100 dark:hover:border-blue-400/20 border border-transparent transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-md border-2 border-border group-hover:border-blue-300 dark:group-hover:border-blue-400/50 flex-shrink-0 mt-0.5 transition-colors" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-sm text-foreground font-semibold leading-snug flex-1 min-w-0">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          task.due === "Today" ||
                          task.due.startsWith("Today") ||
                          task.due === "ASAP"
                            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {task.due}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 font-semibold">
                        {task.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {status === "scheduled" && run && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold">
                        <Clock className="w-3 h-3" />
                        Scheduled for {run.scheduledFor}
                      </span>
                    )}
                    {status === "in_progress" && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        In progress
                      </span>
                    )}
                    {status === "needs_review" && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
                        <Eye className="w-3 h-3" />
                        Need review
                      </span>
                    )}
                    {status === "completed" && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
                        Approved
                      </span>
                    )}

                    {status !== "completed" && status !== "needs_review" && (
                      <button
                        type="button"
                        onClick={() => setDrawerTaskId(task.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-100 dark:border-blue-400/20 hover:border-blue-200 dark:hover:border-blue-400/30 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        Execute with Jarvis
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {status === "scheduled" && (
                      <button
                        type="button"
                        onClick={() => overnight.runOne(role, task.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-muted-foreground border border-border hover:bg-card transition-colors"
                      >
                        <PlayCircle className="w-3 h-3" />
                        Simulate: run now
                      </button>
                    )}

                    {(status === "completed" || status === "needs_review") && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedArtifactId((current) => (current === task.id ? null : task.id))
                        }
                        aria-expanded={isArtifactExpanded}
                        className={
                          status === "needs_review"
                            ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-400/25 bg-amber-100 dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25 transition-colors"
                            : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-400/20 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                        }
                      >
                        {isArtifactExpanded ? "Hide artifact" : "Review artifact"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {(status === "completed" || status === "needs_review") && isArtifactExpanded && (
                <ArtifactCard
                  task={task}
                  run={run}
                  onArtifactAction={onArtifactAction}
                  onRequestChanges={(t) => overnight.requestChanges(role, t.id)}
                  onApprove={(t) => overnight.approve(role, t.id)}
                />
              )}
            </div>
          );
        })}

        {visibleTasks.length === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No tasks in this status.
          </p>
        )}
      </div>

      {drawerTask && (
        <TaskExecutionDrawer
          task={drawerTask}
          onClose={closeDrawer}
          onExecuteNow={handleExecuteNowFromDrawer}
          onSchedule={handleScheduleFromDrawer}
        />
      )}
    </div>
  );
}
