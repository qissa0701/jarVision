// MeetingPrepCard — a single meeting card with an expandable "Prep" section.
//
// Jarvis-gathered prep material (docs, summary, talking points) is always
// shown once expanded. When the meeting "needs prep" (see
// `src/lib/meetingPrep.ts`'s `needsPrep` heuristic — duration >= 30 min or
// more than one attendee), a draft-and-approve flow is offered:
//   none     — "Draft talking points" button.
//   drafted  — editable textarea + Approve / Discard.
//   approved — read-only approved text + Edit / Discard.
// Nothing here auto-applies a draft: text only reaches "approved" when the
// user explicitly clicks Approve (human-in-the-loop).

import { useId, useState } from "react";
import { Check, Clock, FileText, Pencil, Sparkles, Users } from "lucide-react";
import type { Meeting } from "@/types";
import { gatherDocs, buildSummary, buildTalkingPoints, needsPrep } from "@/lib/meetingPrep";
import type { PrepDraftState } from "@/lib/meetingPrep";

export interface MeetingPrepCardProps {
  meeting: Meeting;
  draftState: PrepDraftState;
  onSelectMeeting?: (meeting: Meeting) => void;
  onDraft: (meeting: Meeting) => void;
  onEditDraft: (meeting: Meeting, text: string) => void;
  onApprove: (meeting: Meeting) => void;
  onDiscard: (meeting: Meeting) => void;
  onReopen: (meeting: Meeting) => void;
}

export function MeetingPrepCard({
  meeting,
  draftState,
  onSelectMeeting,
  onDraft,
  onEditDraft,
  onApprove,
  onDiscard,
  onReopen,
}: MeetingPrepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const prepPanelId = useId();

  const meetingNeedsPrep = needsPrep(meeting);
  const docs = gatherDocs(meeting);
  const summary = buildSummary(meeting);
  const talkingPoints = buildTalkingPoints(meeting);

  return (
    <div className="rounded-xl bg-card border border-border hover:border-indigo-100 dark:hover:border-indigo-400/20 hover:shadow-sm transition-all overflow-hidden">
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          onClick={() => onSelectMeeting?.(meeting)}
          className="flex-1 min-w-0 text-left cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-snug">
                {meeting.title}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  {meeting.startTime}–{meeting.endTime}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                meeting.type === "video"
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                  : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
              }`}
            >
              {meeting.type === "video" ? "Microsoft Teams" : "In-person"}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{meeting.attendees}</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={prepPanelId}
          className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-400/20 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          {expanded ? "Hide prep" : "Prep"}
        </button>
      </div>

      {expanded && (
        <div id={prepPanelId} className="px-3 pb-3 border-t border-border pt-3">
          <div className="mb-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Related documents
            </p>
            <ul className="space-y-1">
              {docs.map((doc) => (
                <li key={doc} className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground truncate">{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Summary
            </p>
            <p className="text-[12px] text-foreground leading-relaxed">{summary}</p>
          </div>

          <div className="mb-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Talking points
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {talkingPoints.map((point) => (
                <li key={point} className="text-[12px] text-foreground leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {meetingNeedsPrep && (
            <PrepDraftSection
              meeting={meeting}
              draftState={draftState}
              onDraft={onDraft}
              onEditDraft={onEditDraft}
              onApprove={onApprove}
              onDiscard={onDiscard}
              onReopen={onReopen}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface PrepDraftSectionProps {
  meeting: Meeting;
  draftState: PrepDraftState;
  onDraft: (meeting: Meeting) => void;
  onEditDraft: (meeting: Meeting, text: string) => void;
  onApprove: (meeting: Meeting) => void;
  onDiscard: (meeting: Meeting) => void;
  onReopen: (meeting: Meeting) => void;
}

/**
 * The draft → review → approve human-in-the-loop flow for a meeting's prep
 * material. Nothing here is "finalized" until the user explicitly clicks
 * Approve; editing or discarding are always available before that point.
 */
function PrepDraftSection({
  meeting,
  draftState,
  onDraft,
  onEditDraft,
  onApprove,
  onDiscard,
  onReopen,
}: PrepDraftSectionProps) {
  const textareaId = useId();

  if (draftState.status === "none") {
    return (
      <div className="pt-1 border-t border-border">
        <button
          type="button"
          onClick={() => onDraft(meeting)}
          className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-400/20 hover:border-indigo-200 dark:hover:border-indigo-400/30 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Draft talking points
        </button>
      </div>
    );
  }

  if (draftState.status === "drafted") {
    return (
      <div className="pt-2 mt-1 border-t border-border">
        <label htmlFor={textareaId} className="text-[11px] font-semibold text-muted-foreground">
          Draft (review and edit before approving)
        </label>
        <textarea
          id={textareaId}
          value={draftState.text}
          onChange={(e) => onEditDraft(meeting, e.target.value)}
          rows={5}
          className="mt-1 w-full text-[12px] p-2 rounded-lg border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400/40 focus:border-indigo-300 dark:focus:border-indigo-400/50"
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => onApprove(meeting)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
          >
            <Check className="w-3 h-3" />
            Approve
          </button>
          <button
            type="button"
            onClick={() => onDiscard(meeting)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-muted-foreground border border-border hover:bg-muted transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

  // approved
  return (
    <div className="pt-2 mt-1 border-t border-border">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
          <Check className="w-3 h-3" />
          Approved
        </span>
      </div>
      <p className="text-[12px] text-foreground whitespace-pre-wrap p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-400/20">
        {draftState.text}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => onReopen(meeting)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-muted-foreground border border-border hover:bg-muted transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDiscard(meeting)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-muted-foreground border border-border hover:bg-muted transition-colors"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
