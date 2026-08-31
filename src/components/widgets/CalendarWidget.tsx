// Calendar widget — one of the dashboard's two fixed widgets.
//
// This is now a small container that composes the Calendar widget's Phase 2
// feature set on top of the original single-day timeline:
//   • "Plan My Day" — a toggleable time-blocked plan for today
//     (`PlanMyDayPanel`, logic in `src/lib/planMyDay.ts`).
//   • A free-text daily note, debounced-persisted per role
//     (`useCalendarNotes`).
//   • An expand toggle that switches from single-day to a synthesized weekly
//     view (`WeekView`, logic in `src/lib/weekView.ts`).
//   • Per-meeting prep (docs/summary/talking points) with a draft-and-approve
//     flow for meetings that need it (`MeetingPrepCard`, logic in
//     `src/lib/meetingPrep.ts`).
//
// The single-day timeline markup (left column) is unchanged from Phase 1.
// `role` is required (not just `data`) so notes and prep drafts persist
// per-role, matching `usePersistentLayout`/`useOvernightQueue`'s pattern.

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, NotebookPen, Target } from "lucide-react";
import type { Meeting, Role, RoleData } from "@/types";
import { TIME_SLOTS } from "@/constants/calendar";
import { buildDayPlan, type PlanBlock } from "@/lib/planMyDay";
import { parseHHMM } from "@/lib/overnight";
import { groupByWeekday, synthesizeWeek } from "@/lib/weekView";
import type { SyncedFocusBlock } from "@/lib/syncedFocusBlocks";
import { useCalendarNotes } from "@/hooks/useCalendarNotes";
import { useMeetingPrep } from "@/hooks/useMeetingPrep";
import { useSyncedFocusBlocks } from "@/hooks/useSyncedFocusBlocks";
import { PlanMyDayButton, PlanMyDayPanel } from "@/components/widgets/PlanMyDayPanel";
import { WeekView } from "@/components/widgets/WeekView";
import { MeetingPrepCard } from "@/components/widgets/MeetingPrepCard";

/** A chronological entry in the meeting-cards column: either a real meeting or a synced focus block. */
type MeetingColumnEntry =
  | { kind: "meeting"; meeting: Meeting; sortMinutes: number }
  | { kind: "focus"; focusBlock: SyncedFocusBlock; sortMinutes: number };

/**
 * Merge real meetings with synced focus blocks into a single chronological
 * list for the meeting-cards column. `data.meetings` is never mutated —
 * synced focus blocks are a separate, persisted list merged in purely for
 * display.
 */
function mergeMeetingsAndFocusBlocks(
  meetings: Meeting[],
  focusBlocks: SyncedFocusBlock[],
): MeetingColumnEntry[] {
  const meetingEntries: MeetingColumnEntry[] = meetings.map((meeting) => ({
    kind: "meeting",
    meeting,
    sortMinutes: parseHHMM(meeting.startTime),
  }));
  const focusEntries: MeetingColumnEntry[] = focusBlocks.map((focusBlock) => ({
    kind: "focus",
    focusBlock,
    sortMinutes: focusBlock.startMinutes,
  }));
  return [...meetingEntries, ...focusEntries].sort(
    (a, b) => a.sortMinutes - b.sortMinutes,
  );
}

export interface CalendarWidgetProps {
  /** Role data (already search-filtered upstream). */
  data: RoleData;
  /** The active role, used to key persisted notes and prep drafts per role. */
  role: Role;
  /** Fired when a meeting card is activated. */
  onSelectMeeting?: (meeting: Meeting) => void;
  /** Fired after "Plan My Day" focus blocks are synced into the schedule. */
  onSyncToCalendar?: (syncedCount: number) => void;
}

const NOTES_LABEL_ID = "calendar-notes-label";
const WEEK_VIEW_PANEL_ID = "calendar-week-view-panel";

export function CalendarWidget({
  data,
  role,
  onSelectMeeting,
  onSyncToCalendar,
}: CalendarWidgetProps) {
  const [planExpanded, setPlanExpanded] = useState(false);
  const [weekExpanded, setWeekExpanded] = useState(false);

  const { note, setNote } = useCalendarNotes(role);
  const prep = useMeetingPrep(role);
  const { syncedBlocks, syncBlocks } = useSyncedFocusBlocks(role);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const meetingAtTime = (t: string) => data.meetings.find((m) => m.startTime === t);
  const syncedBlockAtTime = (t: string) =>
    syncedBlocks.find((b) => b.startMinutes === parseHHMM(t));

  const plan = useMemo(
    () => buildDayPlan(data.meetings, data.priorities),
    [data.meetings, data.priorities],
  );

  const handleSyncPlan = (planToSync: PlanBlock[]) => {
    const count = syncBlocks(planToSync);
    onSyncToCalendar?.(count);
    return count;
  };

  const meetingsByWeekday = useMemo(
    () => groupByWeekday(synthesizeWeek(data.meetings)),
    [data.meetings],
  );

  return (
    <div className="space-y-4">
      {/* Plan My Day CTA + panel */}
      <div>
        <PlanMyDayButton
          expanded={planExpanded}
          onToggle={() => setPlanExpanded((e) => !e)}
        />
        {planExpanded && (
          <PlanMyDayPanel
            plan={plan}
            onClose={() => setPlanExpanded(false)}
            onSync={handleSyncPlan}
          />
        )}
      </div>

      {/* Free-text daily note */}
      <div>
        <label
          id={NOTES_LABEL_ID}
          htmlFor="calendar-daily-note"
          className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
        >
          <NotebookPen className="w-3 h-3" />
          Today&rsquo;s notes
        </label>
        <textarea
          id="calendar-daily-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Jot other intentions or priorities for today…"
          rows={2}
          className="w-full text-xs p-2.5 rounded-xl border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-400/40 focus:border-blue-300 dark:focus:border-blue-400/50 placeholder:text-muted-foreground resize-none"
        />
      </div>

      {/* Expand toggle: single day <-> week view */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {weekExpanded ? "This week" : today}
        </p>
        <button
          type="button"
          onClick={() => setWeekExpanded((e) => !e)}
          aria-expanded={weekExpanded}
          aria-controls={WEEK_VIEW_PANEL_ID}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
        >
          {weekExpanded ? (
            <>
              Collapse to day
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Expand to week
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {weekExpanded ? (
        <div id={WEEK_VIEW_PANEL_ID}>
          <WeekView
            meetingsByWeekday={meetingsByWeekday}
            onSelectMeeting={onSelectMeeting}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Timeline */}
          <div>
            <div className="space-y-1.5">
              {TIME_SLOTS.map((time) => {
                const m = meetingAtTime(time);
                const focusBlock = !m ? syncedBlockAtTime(time) : undefined;
                return (
                  <div key={time} className="flex items-start gap-3">
                    <span className="text-[11px] text-muted-foreground w-10 flex-shrink-0 mt-0.5 font-medium">
                      {time}
                    </span>
                    <div className="flex-1">
                      {m ? (
                        <div
                          className={`px-2.5 py-1.5 rounded-lg ${
                            m.type === "video"
                              ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-400/20"
                              : "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-400/20"
                          }`}
                        >
                          <div
                            className={`text-xs font-semibold leading-snug ${
                              m.type === "video"
                                ? "text-blue-800 dark:text-blue-300"
                                : "text-emerald-800 dark:text-emerald-300"
                            }`}
                          >
                            {m.title}
                          </div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              m.type === "video"
                                ? "text-blue-400 dark:text-blue-400/80"
                                : "text-emerald-500 dark:text-emerald-400/80"
                            }`}
                          >
                            {m.startTime}–{m.endTime}
                          </div>
                        </div>
                      ) : focusBlock ? (
                        <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-500/10 border border-dashed border-emerald-300 dark:border-emerald-400/30">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
                            <span className="text-xs font-semibold leading-snug text-emerald-800 dark:text-emerald-300">
                              Focus Time
                            </span>
                          </div>
                          <div className="text-[11px] mt-0.5 text-emerald-600 dark:text-emerald-400">
                            {focusBlock.title}
                          </div>
                        </div>
                      ) : (
                        <div className="h-4 flex items-center">
                          <div className="w-full border-t border-dashed border-border" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meeting cards with expandable prep, merged chronologically with any synced focus blocks */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {data.meetings.length} Microsoft Teams Meetings
            </p>
            <div className="space-y-2">
              {mergeMeetingsAndFocusBlocks(data.meetings, syncedBlocks).map((entry) =>
                entry.kind === "meeting" ? (
                  <MeetingPrepCard
                    key={entry.meeting.id}
                    meeting={entry.meeting}
                    draftState={prep.getDraftFor(entry.meeting)}
                    onSelectMeeting={onSelectMeeting}
                    onDraft={prep.draft}
                    onEditDraft={prep.editDraft}
                    onApprove={prep.approve}
                    onDiscard={prep.discard}
                    onReopen={prep.reopen}
                  />
                ) : (
                  <div
                    key={entry.focusBlock.id}
                    className="rounded-xl bg-emerald-50/50 dark:bg-emerald-500/10 border border-dashed border-emerald-300 dark:border-emerald-400/30 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
                          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 leading-snug">
                            Focus Time
                          </p>
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                          {entry.focusBlock.startLabel}–{entry.focusBlock.endLabel}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">
                          {entry.focusBlock.title}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        Synced from plan
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
