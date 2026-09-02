// ChainOfThought — a mock "AI is thinking" loading screen.
//
// Reveals a list of reasoning steps one at a time, top to bottom, typing each
// step's detail with a typewriter effect (rather than dumping everything at
// once). Each finished step gets a check; the active step shows a spinner.
// Calls `onComplete` after the last step finishes. Purely presentational — the
// "thinking" is scripted.

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Bot, Check, Loader2, Sparkles } from "lucide-react";
import { Typewriter } from "./Typewriter";

export interface ThoughtStep {
  label: string;
  detail: string;
  /**
   * The specialized agent JARVISION is calling for this step (shown as a
   * chip). When set, the step reads as an orchestrated agent call via NEXUS.
   */
  agent?: string;
  /** The visual role of this step in the orchestration. */
  kind?: "call" | "aggregate" | "result";
}

export interface ChainOfThoughtProps {
  title?: string;
  steps: ThoughtStep[];
  onComplete?: () => void;
  /** Milliseconds per character for the detail typewriter. */
  typingSpeed?: number;
  /** Pause after a step finishes before the next begins. */
  stepPauseMs?: number;
  /** Hold after the final step before firing onComplete. */
  finalHoldMs?: number;
}

export function ChainOfThought({
  title = "Simulating adoption",
  steps,
  onComplete,
  typingSpeed = 14,
  stepPauseMs = 260,
  finalHoldMs = 650,
}: ChainOfThoughtProps) {
  // Steps at index < activeIndex are done; === activeIndex is typing now.
  const [activeIndex, setActiveIndex] = useState(0);
  const completedRef = useRef(false);

  const handleStepDone = (index: number) => {
    if (index < steps.length - 1) {
      window.setTimeout(() => setActiveIndex((i) => Math.max(i, index + 1)), stepPauseMs);
    } else if (!completedRef.current) {
      completedRef.current = true;
      window.setTimeout(() => onComplete?.(), finalHoldMs);
    }
  };

  // Safety net: if there are no steps, complete immediately.
  useEffect(() => {
    if (steps.length === 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [steps.length, onComplete]);

  const visible = steps.slice(0, activeIndex + 1);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-300" />
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="ml-auto text-[11px] font-medium text-muted-foreground">
          {Math.min(activeIndex + 1, steps.length)} / {steps.length}
        </span>
      </div>

      <ol className="p-4 space-y-3">
        {visible.map((step, index) => {
          const isActive = index === activeIndex;
          return (
            <motion.li
              key={step.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-3"
            >
              <span className="mt-0.5 flex-shrink-0">
                {isActive ? (
                  <Loader2 className="w-4 h-4 text-blue-500 dark:text-blue-300 animate-spin" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-semibold ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                {step.agent && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">
                    <Bot className="w-3 h-3" />
                    {step.agent}
                    <span className="font-normal text-muted-foreground">· via NEXUS</span>
                  </span>
                )}
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  {isActive ? (
                    <Typewriter
                      text={step.detail}
                      speed={typingSpeed}
                      onDone={() => handleStepDone(index)}
                    />
                  ) : (
                    step.detail
                  )}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
