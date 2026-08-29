// TaskExecutionDrawer — right-side drawer offering the two ways to delegate a
// task's execution to Jarvis:
//   • Execute now         — closes the drawer and opens the existing
//     Task_Panel (`onExecuteNow`, which the caller wires to `onHandleTask`).
//   • Schedule execution  — an `<input type="time">` (matching the pattern in
//     SettingsView.tsx) + a "Schedule" button that adds the task to the
//     Scheduled bucket for that exact chosen time.
//
// Reuses the same dialog accessibility pattern as TaskPanel.tsx: `role`,
// `aria-modal`, `aria-labelledby`, a focus trap via `useFocusTrap`, and
// Escape-to-close with focus restore.

import { useId, useRef, useState } from "react";
import { CalendarClock, Play, Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import type { Task } from "@/types";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface TaskExecutionDrawerProps {
  /** The task this drawer offers execution options for. */
  task: Task;
  /** Dismiss the drawer (also invoked on Escape). */
  onClose: () => void;
  /** Close the drawer and open the existing Task_Panel for this task. */
  onExecuteNow: (task: Task) => void;
  /** Schedule the task at the given "HH:mm" time. */
  onSchedule: (task: Task, time: string) => void;
}

export function TaskExecutionDrawer({
  task,
  onClose,
  onExecuteNow,
  onSchedule,
}: TaskExecutionDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const timeInputId = useId();
  const [time, setTime] = useState("21:00");

  useFocusTrap({ active: true, containerRef, onEscape: onClose });

  const handleExecuteNow = () => {
    onExecuteNow(task);
  };

  const handleSchedule = () => {
    if (!time) return;
    onSchedule(task, time);
    onClose();
  };

  return (
    <motion.div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="fixed inset-y-0 right-0 w-[380px] bg-card text-card-foreground border-l border-border shadow-2xl flex flex-col z-30"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-border">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 tracking-wide">
              EXECUTE WITH JARVIS
            </span>
          </div>
          <h3 id={titleId} className="text-sm font-semibold text-foreground leading-snug">
            {task.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close execution options"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
        {/* Execute now */}
        <section className="p-4 rounded-xl border border-border bg-muted">
          <div className="flex items-center gap-2 mb-1.5">
            <Play className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
            <h4 className="text-sm font-semibold text-foreground">Execute now</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Open the step-by-step plan and let Jarvis execute it right away.
          </p>
          <button
            type="button"
            onClick={handleExecuteNow}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Execute now
          </button>
        </section>

        {/* Schedule execution */}
        <section className="p-4 rounded-xl border border-border bg-muted">
          <div className="flex items-center gap-2 mb-1.5">
            <CalendarClock className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
            <h4 className="text-sm font-semibold text-foreground">Schedule execution</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Pick a time and Jarvis will run this task then, staging the result for your review.
          </p>
          <label htmlFor={timeInputId} className="text-[11px] font-semibold text-muted-foreground">
            Run at
          </label>
          <input
            id={timeInputId}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-border text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-400/30 focus:border-indigo-300 dark:focus:border-indigo-400/50"
          />
          <button
            type="button"
            onClick={handleSchedule}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-400/20 hover:border-indigo-200 dark:hover:border-indigo-400/30 transition-colors"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            Schedule
          </button>
        </section>
      </div>
    </motion.div>
  );
}
