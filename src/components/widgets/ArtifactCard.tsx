// ArtifactCard — the artifact preview shown on a Completed task, revealing
// what Jarvis actually produced (not just a "done" status).
//
// Renders one of two variants depending on the task's category (see
// `src/lib/artifact.ts`):
//   • Code-style artifact (Bug/Testing/Incident) — a mini diff summary plus a
//     mock branch/PR reference.
//   • Document-style artifact (everything else) — a summary, notable points,
//     and suggested comments, with an inline comment/annotate input.
//
// Action row: Open / Download (mocked, bubble to `onArtifactAction`),
// Request changes (`overnight.requestChanges`) and Approve
// (`overnight.approve`), wired by the caller.
//
// Comments are tracked locally (useState) — the human-in-the-loop point is
// the visible comment affordance existing, not durable storage (per spec).

import { useId, useState } from "react";
import {
  Check,
  Download,
  ExternalLink,
  GitBranch,
  MessageSquarePlus,
  RotateCcw,
} from "lucide-react";
import type { OvernightRun, Task } from "@/types";
import { buildArtifact } from "@/lib/artifact";

export type ArtifactActionKind = "open" | "download";

export interface ArtifactCardProps {
  /** The completed task whose artifact is previewed. */
  task: Task;
  /** The task's overnight run, if any (used to show a supporting result line). */
  run: OvernightRun | undefined;
  /** Mocked Open/Download actions, bubbled up to App.tsx for a toast. */
  onArtifactAction: (kind: ArtifactActionKind, task: Task) => void;
  /** Move the run back to changes_requested (re-surfaces under Scheduled). */
  onRequestChanges: (task: Task) => void;
  /** Approve the run. */
  onApprove: (task: Task) => void;
}

export function ArtifactCard({
  task,
  run,
  onArtifactAction,
  onRequestChanges,
  onApprove,
}: ArtifactCardProps) {
  const artifact = buildArtifact(task);
  const isApproved = run?.status === "approved";
  const commentInputId = useId();
  const [comments, setComments] = useState<string[]>([]);
  const [commentDraft, setCommentDraft] = useState("");

  const handleAddComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    setComments((prev) => [...prev, text]);
    setCommentDraft("");
  };

  return (
    <div className="mt-2 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-400/20 bg-emerald-50/40 dark:bg-emerald-500/10">
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          <Check className="w-3 h-3" />
          {isApproved ? "Approved" : "Ready for review"}
        </span>
        {run?.confidence != null && (
          <span className="text-[11px] font-semibold text-muted-foreground">
            {run.confidence}% confidence
          </span>
        )}
      </div>

      {artifact.kind === "code" ? (
        <CodeArtifactPreview artifact={artifact} />
      ) : (
        <DocumentArtifactPreview
          artifact={artifact}
          comments={comments}
          commentDraft={commentDraft}
          commentInputId={commentInputId}
          onCommentDraftChange={setCommentDraft}
          onAddComment={handleAddComment}
        />
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          type="button"
          onClick={() => onArtifactAction("open", task)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-foreground border border-border hover:bg-muted transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open
        </button>
        <button
          type="button"
          onClick={() => onArtifactAction("download", task)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-foreground border border-border hover:bg-muted transition-colors"
        >
          <Download className="w-3 h-3" />
          Download
        </button>
        <button
          type="button"
          onClick={() => onRequestChanges(task)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Request changes
        </button>
        <button
          type="button"
          onClick={() => onApprove(task)}
          disabled={isApproved}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="w-3 h-3" />
          {isApproved ? "Approved" : "Approve"}
        </button>
      </div>
    </div>
  );
}

function CodeArtifactPreview({
  artifact,
}: {
  artifact: { branch: string; prLabel: string; diffSummary: string[]; filesChanged: number };
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[12px] font-mono text-foreground">{artifact.branch}</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-semibold">
          {artifact.prLabel}
        </span>
      </div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {artifact.filesChanged} file{artifact.filesChanged === 1 ? "" : "s"} changed
      </p>
      <ul className="space-y-0.5 font-mono">
        {artifact.diffSummary.map((line, i) => (
          <li key={i} className="text-[12px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocumentArtifactPreview({
  artifact,
  comments,
  commentDraft,
  commentInputId,
  onCommentDraftChange,
  onAddComment,
}: {
  artifact: { summary: string; notablePoints: string[]; suggestedComments: string[] };
  comments: string[];
  commentDraft: string;
  commentInputId: string;
  onCommentDraftChange: (value: string) => void;
  onAddComment: () => void;
}) {
  return (
    <div>
      <p className="text-[12px] text-foreground leading-relaxed mb-2">{artifact.summary}</p>

      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        Notable points
      </p>
      <ul className="list-disc list-inside space-y-0.5 mb-2.5">
        {artifact.notablePoints.map((point, i) => (
          <li key={i} className="text-[12px] text-foreground leading-relaxed">
            {point}
          </li>
        ))}
      </ul>

      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        Suggested comments
      </p>
      <ul className="space-y-1 mb-2.5">
        {artifact.suggestedComments.map((comment, i) => (
          <li key={i} className="text-[12px] text-muted-foreground italic leading-relaxed">
            “{comment}”
          </li>
        ))}
      </ul>

      {comments.length > 0 && (
        <ul className="space-y-1 mb-2.5">
          {comments.map((comment, i) => (
            <li
              key={i}
              className="text-[12px] text-foreground leading-relaxed p-2 rounded-lg bg-card border border-border"
            >
              {comment}
            </li>
          ))}
        </ul>
      )}

      <label htmlFor={commentInputId} className="text-[11px] font-semibold text-muted-foreground">
        Add a comment
      </label>
      <div className="flex items-center gap-1.5 mt-1">
        <input
          id={commentInputId}
          type="text"
          value={commentDraft}
          onChange={(e) => onCommentDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddComment();
            }
          }}
          placeholder="Leave a note for Jarvis…"
          className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400/40 focus:border-indigo-300 dark:focus:border-indigo-400/50 placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onAddComment}
          aria-label="Add comment"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-400/20 transition-colors flex-shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
