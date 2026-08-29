// Task_Panel — the right-hand "Jarvis plan" side panel (Requirements 5.1, 5.4,
// 5.5, 10.2, 10.3).
//
// This panel is the visual hero of the execution layer: it doesn't just show a
// plan, it narrates Jarvis autonomously executing each step with a live,
// tool-aware activity feed AND a deterministic "thinking out loud" reasoning
// trace per step (`buildStepReasoning`), directly addressing the feedback that
// the human/agent collaboration during execution wasn't visible enough. The
// plan/execution state machine (`planning → executing → done|stopped`) drives
// four distinct experiences:
//
//   • planning  — the step-by-step plan, each step annotated with the tool
//     Jarvis will use, plus an optional "add instructions before executing"
//     textarea that threads a re-run input through to the reasoning trace.
//   • executing — a state-aware "JARVIS EXECUTING" badge with a live pulse, a
//     header progress bar, a shimmering active step row showing a live
//     "Working…" activity line + tool chip + its reasoning trace, and an
//     always-reachable Stop button (human-in-the-loop interrupt).
//   • stopped   — an "EXECUTION STOPPED" badge, the plan frozen exactly at the
//     step it was interrupted on (visually distinct "paused" row), and
//     Resume (continue from the exact interrupted step, same input) /
//     Discard (close) footer controls.
//   • done      — an "EXECUTION COMPLETE" badge, a reinforced summary that
//     credits Jarvis with executing every step across the distinct tools
//     used, and Done / Revert changes footer controls.
//
// Both "done" and "stopped" additionally surface a "give Jarvis new
// instructions and re-run" textarea — distinct from Resume: Resume continues
// the SAME run with no new input, while Re-run restarts from step 0 with the
// new input threaded through (see `useTaskPanel`'s `execute(input?)` and
// `revert()` semantics).
//
// Accessibility affordances required by the spec are preserved:
//   • dialog semantics — `role="dialog"`, `aria-modal`, and `aria-labelledby`
//     pointing at the plan title (Requirement 5.1).
//   • a focus trap via `useFocusTrap`, confining focus to the panel (Req 5.4).
//   • Escape-to-close with focus restore (Requirement 5.5).
//   • an accessibly named icon-only close control (Requirement 5.1).
//   • every new interrupt/resume/discard/revert control has an accessible
//     name and is keyboard-reachable within the existing focus trap.
//
// `TaskPanel` remains a controlled/presentational component: all
// execute/stop/revert semantics live in `useTaskPanel` (the caller), reached
// here purely through props (`onExecute`, `onStop`, `onRevert`).

import { useEffect, useId, useRef, useState } from "react";
import {
  CheckCircle,
  Pencil,
  Play,
  Sparkles,
  Square,
  Terminal,
  Undo2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import type { PanelState, Task } from "@/types";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { buildStepReasoning } from "@/lib/reasoning";

/** Accessible-name anchor id for the plan title (used by `aria-labelledby`). */
const TASK_PANEL_TITLE_ID = "task-panel-title";

export interface TaskPanelProps {
  /** The task whose plan/execution state is displayed. */
  task: Task;
  /** Current panel state machine value. */
  state: PanelState;
  /** Zero-based index of the step currently executing. */
  executingStep: number;
  /** Set of zero-based step indices that have completed. */
  completedSteps: Set<number>;
  /**
   * The last-used re-run instructions for the current/most recent run, if
   * any. Threaded into each step's reasoning trace so it reflects the
   * user's note (see `buildStepReasoning`).
   */
  input?: string;
  /** Dismiss the panel (also invoked on Escape). */
  onClose: () => void;
  /**
   * Begin/resume/re-run the plan. Semantics depend on the state it's called
   * from (see `useTaskPanel.execute`): fresh execution from "planning", a
   * resume from "stopped" when called with no input, or a from-step-0 re-run
   * from "done"/"stopped" when called with a new input string.
   */
  onExecute: (input?: string) => void;
  /** Interrupt a mid-flight execution (human-in-the-loop stop). */
  onStop: () => void;
  /** Reset a completed plan back to a fresh, unexecuted planning state. */
  onRevert: () => void;
}

/** A subtle, reusable tool chip that communicates which system Jarvis uses. */
function ToolChip({
  tool,
  tone = "muted",
}: {
  tool: string;
  tone?: "muted" | "indigo" | "amber";
}) {
  const toneClasses =
    tone === "indigo"
      ? "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-400/20"
      : tone === "amber"
        ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/20"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${toneClasses}`}
    >
      <Terminal className="w-2.5 h-2.5" />
      {tool}
    </span>
  );
}

/**
 * A staggered "thinking out loud" reasoning trace — the lines from
 * `buildStepReasoning` for one step, rendered so it reads as Jarvis narrating
 * its own actions in real time (mirrors the `motion.div` stagger already
 * used in the planning step list). Three tones:
 *   • "active" — the step executing right now: indigo-tinted, staggered in.
 *   • "paused" — the step a Stop interrupted mid-flight: amber-tinted, static
 *     (no further lines will arrive), signalling "this is where it stopped".
 *   • "done"   — an already-completed step: muted/plain, no box, so the full
 *     execution history stays inspectable without dominating the list.
 */
function ReasoningTrace({
  lines,
  tone,
}: {
  lines: string[];
  tone: "active" | "paused" | "done";
}) {
  if (tone === "done") {
    return (
      <ul className="mt-1.5 space-y-0.5">
        {lines.map((line, i) => (
          <li
            key={i}
            className="text-[10px] text-muted-foreground/80 leading-relaxed flex items-start gap-1.5"
          >
            <Terminal className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 opacity-70" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  }

  const boxClasses =
    tone === "active"
      ? "bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-400/20"
      : "bg-amber-50/70 dark:bg-amber-500/10 border-amber-100 dark:border-amber-400/20";
  const textClasses =
    tone === "active" ? "text-indigo-700 dark:text-indigo-300" : "text-amber-700 dark:text-amber-300";
  const iconClasses =
    tone === "active" ? "text-indigo-500 dark:text-indigo-400" : "text-amber-500 dark:text-amber-400";

  return (
    <div className={`mt-2 space-y-1 rounded-lg border px-2.5 py-2 ${boxClasses}`}>
      {lines.map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12, duration: 0.18 }}
          className={`text-[11px] leading-relaxed flex items-start gap-1.5 ${textClasses}`}
        >
          <Terminal className={`w-2.5 h-2.5 mt-0.5 flex-shrink-0 ${iconClasses}`} />
          <span>{line}</span>
        </motion.p>
      ))}
    </div>
  );
}

/** Shared textarea styling for the optional/re-run instructions inputs. */
const INSTRUCTIONS_TEXTAREA_CLASSES =
  "w-full text-xs p-2.5 rounded-xl border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400/40 focus:border-indigo-300 dark:focus:border-indigo-400/50 placeholder:text-muted-foreground resize-none";

export function TaskPanel({
  task,
  state,
  executingStep,
  completedSteps,
  input,
  onClose,
  onExecute,
  onStop,
  onRevert,
}: TaskPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Confine focus to the panel while it is mounted, close on Escape, and
  // restore focus to the opener on unmount (Requirements 5.4, 5.5).
  useFocusTrap({ active: true, containerRef, onEscape: onClose });

  const totalSteps = task.steps.length;

  // Local draft for the optional "add instructions before executing" textarea
  // (planning state) and the "give Jarvis new instructions and re-run"
  // textarea (done/stopped state). Two separate drafts since they serve
  // distinct flows and the panel remounts fresh per task via `key` upstream.
  const [planningDraft, setPlanningDraft] = useState("");
  const [rerunDraft, setRerunDraft] = useState("");
  const planningInputId = useId();
  const rerunInputId = useId();

  // Clear the re-run draft once a fresh run begins, so a prior typed note
  // doesn't linger visually once it's been submitted and threaded through.
  useEffect(() => {
    if (state === "executing") setRerunDraft("");
  }, [state]);

  // ─── Derived execution state (from existing props only, no new timers) ──────
  const completedCount = completedSteps.size;
  const progress = totalSteps > 0 ? completedCount / totalSteps : 0;
  const progressPct = Math.round(progress * 100);
  // Distinct tools declared across the plan — used in the done summary to
  // reinforce the breadth of autonomous execution.
  const distinctTools = Array.from(
    new Set(
      task.steps
        .map((s) => s.tool)
        .filter((t): t is string => Boolean(t && t.trim())),
    ),
  );

  const isExecuting = state === "executing";
  const isDoneState = state === "done";
  const isStoppedState = state === "stopped";
  // Steps render with the execution-style list (vs. the plain plan list)
  // whenever a run has started, is interrupted, or has finished.
  const hasRunView = isExecuting || isDoneState || isStoppedState;

  return (
    <motion.div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={TASK_PANEL_TITLE_ID}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="absolute inset-y-0 right-0 w-[400px] bg-card text-card-foreground border-l border-border shadow-2xl flex flex-col z-30"
    >
      {/* Header */}
      <div className="flex flex-col px-5 py-4 border-b border-border gap-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              {/* State-aware badge (Requirement: header state badge). */}
              {isExecuting ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  JARVIS EXECUTING
                </span>
              ) : isStoppedState ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-300 tracking-wide">
                  <Square className="w-3 h-3" />
                  EXECUTION STOPPED
                </span>
              ) : isDoneState ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-300 tracking-wide">
                  <CheckCircle className="w-3.5 h-3.5" />
                  EXECUTION COMPLETE
                </span>
              ) : (
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 tracking-wide">
                  JARVIS PLAN
                </span>
              )}
            </div>
            <h3
              id={TASK_PANEL_TITLE_ID}
              className="text-sm font-semibold text-foreground leading-snug"
            >
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${task.due === "Today" || task.due.startsWith("Today") || task.due === "ASAP" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300" : "bg-muted text-muted-foreground"}`}
              >
                {task.due}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-semibold">
                {task.category}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {totalSteps} steps
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close task panel"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar — during execution, after a stop, and on completion. */}
        {hasRunView && (
          <div className="flex flex-col gap-1.5">
            <div
              className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPct}
              aria-label="Execution progress"
            >
              <motion.div
                className={`h-full rounded-full ${isDoneState ? "bg-emerald-500 dark:bg-emerald-400" : isStoppedState ? "bg-amber-500 dark:bg-amber-400" : "bg-indigo-600 dark:bg-indigo-400"}`}
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold ${isDoneState ? "text-emerald-600 dark:text-emerald-300" : isStoppedState ? "text-amber-600 dark:text-amber-300" : "text-indigo-600 dark:text-indigo-300"}`}
              >
                {isStoppedState
                  ? `Stopped after step ${completedCount} of ${totalSteps}`
                  : `${completedCount}/${totalSteps} steps`}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {progressPct}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
        {state === "planning" && (
          <>
            <p className="text-xs text-muted-foreground mb-5">
              {"Here's my step-by-step plan. Review each step, then execute or make adjustments."}
            </p>
            <div className="space-y-0">
              {task.steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.2 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                      {step.num}
                    </div>
                    {i < totalSteps - 1 && (
                      <div
                        className="w-px bg-border flex-1 my-1"
                        style={{ minHeight: 12 }}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-semibold text-foreground">
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {step.description}
                    </p>
                    {/* Tool chip communicates HOW Jarvis will execute this step. */}
                    {step.tool && (
                      <div className="mt-1.5">
                        <ToolChip tool={step.tool} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Optional instructions before the first execution. */}
            <div className="mt-4">
              <label
                htmlFor={planningInputId}
                className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block"
              >
                Add instructions before executing (optional)
              </label>
              <textarea
                id={planningInputId}
                value={planningDraft}
                onChange={(e) => setPlanningDraft(e.target.value)}
                placeholder="e.g. Prioritize the connection pool fix first…"
                rows={2}
                className={INSTRUCTIONS_TEXTAREA_CLASSES}
              />
            </div>
          </>
        )}

        {hasRunView && (
          <>
            <p className="text-xs text-muted-foreground mb-5">
              {isExecuting
                ? "Executing your plan step by step…"
                : isStoppedState
                  ? "Execution was stopped. Resume to continue, or discard to close."
                  : "All steps completed successfully."}
            </p>
            <div className="space-y-0">
              {task.steps.map((step, i) => {
                const isDone = completedSteps.has(i);
                const isActive = isExecuting && executingStep === i && !isDone;
                // The step the run was interrupted on: not completed, and it's
                // the exact step index execution stopped at.
                const isPaused = isStoppedState && executingStep === i && !isDone;
                const isFuture = !isDone && !isActive && !isPaused;
                return (
                  <div key={step.num} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${isDone ? "bg-emerald-500 dark:bg-emerald-500/90" : isActive ? "bg-indigo-600 dark:bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-500/15" : isPaused ? "bg-amber-500 dark:bg-amber-500/90 ring-4 ring-amber-100 dark:ring-amber-500/15" : "bg-muted"}`}
                      >
                        {isDone ? (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        ) : isActive ? (
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : isPaused ? (
                          <Square className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {step.num}
                          </span>
                        )}
                      </div>
                      {i < totalSteps - 1 && (
                        <div
                          className={`w-px flex-1 my-1 transition-colors duration-500 ${isDone ? "bg-emerald-200 dark:bg-emerald-500/25" : "bg-border"}`}
                          style={{ minHeight: 12 }}
                        />
                      )}
                    </div>
                    <div
                      className={`flex-1 pb-4 transition-opacity duration-300 ${isFuture && executingStep > 0 ? "opacity-35" : ""}`}
                    >
                      {/* Active step reads as "in progress right now": a subtle
                          pulsing tinted row wrapping the title + live activity. */}
                      {isActive ? (
                        <motion.div
                          initial={{ opacity: 0.6 }}
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="-mx-2 px-2 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-400/20"
                        >
                          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                            {step.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs italic text-muted-foreground animate-pulse">
                              Working…
                            </span>
                            {step.tool && (
                              <ToolChip tool={step.tool} tone="indigo" />
                            )}
                          </div>
                          {/* "Thinking out loud" reasoning trace for the active step. */}
                          <ReasoningTrace
                            lines={buildStepReasoning(task, step, input)}
                            tone="active"
                          />
                        </motion.div>
                      ) : isPaused ? (
                        <div className="-mx-2 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-400/20">
                          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                            {step.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                              Stopped here
                            </span>
                            {step.tool && <ToolChip tool={step.tool} tone="amber" />}
                          </div>
                          {/* Reasoning trace frozen at the point of interruption. */}
                          <ReasoningTrace
                            lines={buildStepReasoning(task, step, input)}
                            tone="paused"
                          />
                        </div>
                      ) : (
                        <p
                          className={`text-sm font-semibold transition-colors duration-200 ${isDone ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}
                        >
                          {step.title}
                        </p>
                      )}
                      {isDone && (
                        <>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {step.description}
                          </p>
                          {step.tool && (
                            <div className="mt-1.5">
                              <ToolChip tool={step.tool} />
                            </div>
                          )}
                          {/* Completed steps keep their reasoning trace visible
                              (muted treatment) so the full execution history
                              stays inspectable after the fact. */}
                          <ReasoningTrace
                            lines={buildStepReasoning(task, step, input)}
                            tone="done"
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {isDoneState && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="mt-2 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-400/20"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    Task completed
                  </p>
                </div>
                <p className="text-[12px] text-emerald-600 dark:text-emerald-300 mt-1">
                  Jarvis executed all {totalSteps} steps autonomously
                  {distinctTools.length > 0
                    ? ` across ${distinctTools.length} ${distinctTools.length === 1 ? "tool" : "tools"}`
                    : ""}
                  . Check your tools for results.
                </p>
                {distinctTools.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {distinctTools.map((tool) => (
                      <ToolChip key={tool} tool={tool} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Re-run with new instructions — available once a run has
                finished or been stopped. Distinct from Resume/Discard below:
                submitting this restarts from step 0 with the new input. */}
            {(isDoneState || isStoppedState) && (
              <div className="mt-4">
                <label
                  htmlFor={rerunInputId}
                  className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block"
                >
                  Give Jarvis new instructions and re-run
                </label>
                <textarea
                  id={rerunInputId}
                  value={rerunDraft}
                  onChange={(e) => setRerunDraft(e.target.value)}
                  placeholder="e.g. Also check the read-replica connection settings…"
                  rows={2}
                  className={INSTRUCTIONS_TEXTAREA_CLASSES}
                />
                <button
                  type="button"
                  onClick={() => onExecute(rerunDraft)}
                  disabled={!rerunDraft.trim()}
                  className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Re-run with this input
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border flex gap-2.5">
        {state === "planning" && (
          <>
            <button
              onClick={() => onExecute(planningDraft)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Play className="w-4 h-4" />
              Execute this for me
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border hover:bg-muted text-foreground text-sm font-semibold rounded-xl transition-colors">
              <Pencil className="w-3.5 h-3.5" />
              Edit plan
            </button>
          </>
        )}
        {isExecuting && (
          <>
            <div className="flex-1 flex items-center justify-center gap-2.5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-xl">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-300 dark:border-indigo-400/50 border-t-transparent animate-spin" />
              Step {Math.min(executingStep + 1, totalSteps)} of {totalSteps}…
            </div>
            {/* Human-in-the-loop interrupt: always reachable while executing. */}
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop execution"
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-400/20 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-700 dark:text-red-300 text-sm font-semibold rounded-xl transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
          </>
        )}
        {isStoppedState && (
          <>
            <button
              type="button"
              onClick={() => onExecute()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border hover:bg-muted text-foreground text-sm font-semibold rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
          </>
        )}
        {isDoneState && (
          <>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Done
            </button>
            <button
              type="button"
              onClick={onRevert}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border hover:bg-muted text-muted-foreground text-sm font-semibold rounded-xl transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Revert changes
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
