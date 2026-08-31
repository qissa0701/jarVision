// WeekView — the Calendar widget's expanded weekly view.
//
// Shown when the widget is expanded (Req 4): synthesizes a Mon–Fri week from
// the role's existing meetings (see `src/lib/weekView.ts`) and renders one
// column per weekday. Purely presentational.

import { Clock } from "lucide-react";
import type { Meeting } from "@/types";
import { WEEKDAY_LABELS, type WeekdayLabel } from "@/constants/calendar";

export interface WeekViewProps {
  meetingsByWeekday: Record<WeekdayLabel, Meeting[]>;
  /** Fired when a meeting card is activated. */
  onSelectMeeting?: (meeting: Meeting) => void;
}

export function WeekView({ meetingsByWeekday, onSelectMeeting }: WeekViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
      {WEEKDAY_LABELS.map((weekday) => (
        <div key={weekday}>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {weekday}
          </p>
          <div className="space-y-1.5">
            {meetingsByWeekday[weekday].length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">
                No meetings
              </p>
            ) : (
              meetingsByWeekday[weekday].map((meeting) => (
                <button
                  key={meeting.id}
                  type="button"
                  onClick={() => onSelectMeeting?.(meeting)}
                  className="w-full text-left p-2 rounded-lg bg-card border border-border hover:border-blue-100 dark:hover:border-blue-400/20 hover:shadow-sm transition-all cursor-pointer"
                >
                  <p className="text-[11px] font-semibold text-foreground leading-snug">
                    {meeting.title}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {meeting.startTime}–{meeting.endTime}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
