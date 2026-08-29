// DashboardView — the dashboard, fixed to exactly two widgets: Calendar and
// Tasks, side-by-side on wide viewports and stacked on narrow ones.
//
// The widget registry/reorder/picker system has been removed: the dashboard is
// no longer user-customizable, so this view renders CalendarWidget and
// TasksWidget directly inside the shared WidgetCard shell, with no
// drag-and-drop or remove/reorder menu. The dashboard's own inline search
// filtering (and its "no results" empty state) was removed as part of the
// Global_Search redesign: the top-bar field now opens a full-screen overlay
// instead of filtering these widgets in place, so `data` is always the active
// role's real, unfiltered data.

import { Calendar, CheckSquare } from "lucide-react";
import type { Meeting, PanelState, Role, RoleData, Task } from "@/types";
import type { OvernightQueue } from "@/hooks/useOvernightQueue";
import type { CascadeItem } from "@/types/vision";
import { WidgetCard } from "@/components/widgets/WidgetCard";
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { TasksWidget } from "@/components/widgets/TasksWidget";
import type { ArtifactActionKind } from "@/components/widgets/ArtifactCard";

export interface DashboardViewProps {
  /** The active role's real data. */
  data: RoleData;
  /** The active role, threaded to the Calendar and Tasks widgets for per-role persistence. */
  role: Role;
  /** Opens the Task_Panel for a task. */
  onHandleTask: (task: Task) => void;
  /** Fired when a meeting card is activated. */
  onSelectMeeting: (meeting: Meeting) => void;
  /** Fired after "Plan My Day" focus blocks are synced into the schedule. */
  onSyncToCalendar: (syncedCount: number) => void;
  /** The overnight run queue, threaded to the Tasks widget. */
  overnight: OvernightQueue;
  /** The Task_Panel's currently active task id, if any. */
  taskPanelActiveTaskId: string | null;
  /** The Task_Panel's current state machine value. */
  taskPanelState: PanelState;
  /** Mocked Open/Download artifact actions, bubbled up to App.tsx for a toast. */
  onArtifactAction: (kind: ArtifactActionKind, task: Task) => void;
  /** VISION Studio action items cascaded to this account (FR-7). */
  cascadedItems?: CascadeItem[];
}

export function DashboardView({
  data,
  role,
  onHandleTask,
  onSelectMeeting,
  onSyncToCalendar,
  overnight,
  taskPanelActiveTaskId,
  taskPanelState,
  onArtifactAction,
  cascadedItems,
}: DashboardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <WidgetCard
        title="Calendar"
        icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
      >
        <CalendarWidget
          data={data}
          role={role}
          onSelectMeeting={onSelectMeeting}
          onSyncToCalendar={onSyncToCalendar}
        />
      </WidgetCard>
      <WidgetCard
        title="Tasks"
        icon={<CheckSquare className="w-4 h-4 text-muted-foreground" />}
      >
        <TasksWidget
          data={data}
          role={role}
          onHandleTask={onHandleTask}
          overnight={overnight}
          taskPanelActiveTaskId={taskPanelActiveTaskId}
          taskPanelState={taskPanelState}
          onArtifactAction={onArtifactAction}
          cascadedItems={cascadedItems}
        />
      </WidgetCard>
    </div>
  );
}
