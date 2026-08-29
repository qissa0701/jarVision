// useTaskPanel — task-panel state machine
// (idle → planning → executing → done/stopped).
//
// Ports the chained-setTimeout task execution from the original src/app/App.tsx
// monolith into a `useReducer` state machine with guarded, self-cleaning timer
// side effects. The reducer stays pure; all timers live in the hook and are
// cancelled on close/reset/unmount/stop so a role switch, dismissal, or
// interrupt never leaves a dangling timeout mutating unmounted state
// (Requirements 10.2, 10.3, 10.5).
//
// Human-in-the-loop additions on top of the original plan/execute flow:
//   • `stop()` — interrupts a mid-flight execution. All pending timers are
//     cancelled immediately (no further step completes), the machine moves
//     to `"stopped"`, and `completedSteps`/`executingStep` are preserved
//     exactly as they were at the moment of interruption.
//   • `execute(input?)` semantics depend on the state it's called from:
//       - from `"planning"`            → normal first execution, from step 0.
//       - from `"stopped"`, no `input`  → **Resume**: continue the step loop
//         starting at the exact `executingStep` it stopped at. Nothing is
//         reset; already-completed steps are not re-completed.
//       - from `"done"`/`"stopped"` with a **new** `input` string → **Re-run**:
//         resets `completedSteps`/`executingStep` and starts over from step 0,
//         threading `input` through so the reasoning trace can reference it.
//     The last-used `input` (if any) is stored so the caller (TaskPanel) can
//     pass it to `buildStepReasoning` for every step's trace during that run.
//   • `revert()` — from `"done"`, resets back to a fresh, unexecuted
//     `"planning"` state for the same task (completedSteps cleared,
//     executingStep reset to 0). This is the panel-local half of "revert";
//     undoing the persisted overnight completion is the composition root's
//     job (see App.tsx's `handleRevertTask`).

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { PanelState, Task } from "@/types";

// ─── Timing (preserved verbatim from the original App.tsx behavior) ──────────
/** Delay before the first step is marked complete once execution begins. */
const INITIAL_DELAY_MS = 900;
/** Delay between each subsequent step completion. */
const PER_STEP_DELAY_MS = 1400;
/** Delay before the panel transitions to the terminal `done` state. */
const FINALIZE_DELAY_MS = 700;

/**
 * Public controller contract consumed by the composition root and TaskPanel.
 * Mirrors the interface defined in design.md.
 */
export interface TaskPanelController {
  activeTask: Task | null;
  state: PanelState;
  executingStep: number;
  completedSteps: Set<number>;
  /** The last-used re-run instructions for the current/most recent run, if any. */
  input: string | undefined;
  /** Open a task's plan (→ planning). */
  open: (task: Task) => void;
  /**
   * Run/resume/re-run the plan. Semantics depend on the current state:
   *   - "planning" → fresh execution from step 0.
   *   - "stopped", no input → resume from the exact interrupted step.
   *   - "done"/"stopped" with a new input → restart from step 0 with input.
   */
  execute: (input?: string) => void;
  /** Interrupt a mid-flight execution (→ stopped). No-op unless executing. */
  stop: () => void;
  /** Reset a completed plan back to a fresh, unexecuted planning state. */
  revert: () => void;
  /** Dismiss the panel (→ idle). */
  close: () => void;
  /** Force the panel back to idle, e.g. on role change (→ idle). */
  reset: () => void;
}

interface TaskPanelState {
  activeTask: Task | null;
  state: PanelState;
  executingStep: number;
  completedSteps: Set<number>;
  input: string | undefined;
}

type TaskPanelAction =
  | { type: "OPEN"; task: Task }
  | { type: "EXECUTE_FRESH"; input: string | undefined }
  | { type: "EXECUTE_RESUME" }
  | { type: "COMPLETE_STEP"; completed: number; nextStep?: number }
  | { type: "FINISH"; total: number }
  | { type: "STOP" }
  | { type: "REVERT" }
  | { type: "RESET" };

const IDLE_STATE: TaskPanelState = {
  activeTask: null,
  state: "idle",
  executingStep: 0,
  completedSteps: new Set<number>(),
  input: undefined,
};

function reducer(
  state: TaskPanelState,
  action: TaskPanelAction,
): TaskPanelState {
  switch (action.type) {
    case "OPEN":
      // Fresh plan: reset progress counters (mirrors original openTask).
      return {
        activeTask: action.task,
        state: "planning",
        executingStep: 0,
        completedSteps: new Set<number>(),
        input: undefined,
      };

    case "EXECUTE_FRESH":
      // Guard: only a planned/completed/interrupted task can (re)start.
      if (
        !state.activeTask ||
        (state.state !== "planning" && state.state !== "done" && state.state !== "stopped")
      ) {
        return state;
      }
      // Restart from a clean slate, threading the new input through.
      return {
        ...state,
        state: "executing",
        executingStep: 0,
        completedSteps: new Set<number>(),
        input: action.input,
      };

    case "EXECUTE_RESUME":
      // Guard: resuming only makes sense from an interrupted run.
      if (!state.activeTask || state.state !== "stopped") return state;
      // Continue exactly where it left off — no counters are reset.
      return { ...state, state: "executing" };

    case "COMPLETE_STEP": {
      const completedSteps = new Set(state.completedSteps);
      completedSteps.add(action.completed);
      return {
        ...state,
        completedSteps,
        // Non-final ticks advance the active step; the final tick leaves it in
        // place until FINISH sets it to `total`, matching the original.
        executingStep: action.nextStep ?? state.executingStep,
      };
    }

    case "FINISH":
      return { ...state, state: "done", executingStep: action.total };

    case "STOP":
      // Guard: only meaningful mid-execution; preserves progress exactly.
      if (state.state !== "executing") return state;
      return { ...state, state: "stopped" };

    case "REVERT":
      // Guard: only meaningful once a run has completed.
      if (state.state !== "done") return state;
      return {
        ...state,
        state: "planning",
        executingStep: 0,
        completedSteps: new Set<number>(),
        input: undefined,
      };

    case "RESET":
      return {
        activeTask: null,
        state: "idle",
        executingStep: 0,
        completedSteps: new Set<number>(),
        input: undefined,
      };

    default:
      return state;
  }
}

/**
 * React hook exposing the {@link TaskPanelController} contract backed by a
 * reducer state machine and guarded timers.
 */
export function useTaskPanel(): TaskPanelController {
  const [state, dispatch] = useReducer(reducer, IDLE_STATE);

  // Latest state, read synchronously inside event handlers/timers to avoid
  // stale closures without re-creating the callbacks on every state change.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // All pending timers, so any transition away from executing can cancel them.
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) clearTimeout(id);
    timersRef.current.clear();
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, delay);
    timersRef.current.add(id);
  }, []);

  // Cancel any in-flight execution timers when the hook unmounts.
  useEffect(() => clearTimers, [clearTimers]);

  const open = useCallback(
    (task: Task) => {
      clearTimers();
      dispatch({ type: "OPEN", task });
    },
    [clearTimers],
  );

  const close = useCallback(() => {
    clearTimers();
    dispatch({ type: "RESET" });
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    dispatch({ type: "RESET" });
  }, [clearTimers]);

  const revert = useCallback(() => {
    // No timers can be pending in "done" (they've all already fired), but
    // clear defensively for symmetry with the other transitions.
    clearTimers();
    dispatch({ type: "REVERT" });
  }, [clearTimers]);

  const stop = useCallback(() => {
    // No-op unless currently executing (guarded again in the reducer, but
    // checking here avoids cancelling timers pointlessly).
    if (stateRef.current.state !== "executing") return;
    clearTimers();
    dispatch({ type: "STOP" });
  }, [clearTimers]);

  /** Drive the step-completion timer chain starting at `fromStep`. */
  const runStepLoop = useCallback(
    (task: Task, fromStep: number) => {
      const total = task.steps.length;
      let step = fromStep;

      const tick = () => {
        const completed = step;
        step++;
        if (step < total) {
          dispatch({ type: "COMPLETE_STEP", completed, nextStep: step });
          schedule(tick, PER_STEP_DELAY_MS);
        } else {
          dispatch({ type: "COMPLETE_STEP", completed });
          schedule(() => dispatch({ type: "FINISH", total }), FINALIZE_DELAY_MS);
        }
      };

      // The very first tick of a resumed run uses the same per-step delay as
      // any other step (it's continuing an already-running plan, not
      // starting fresh), while a brand new run uses the longer "thinking"
      // initial delay before its first step completes.
      const firstDelay = fromStep > 0 ? PER_STEP_DELAY_MS : INITIAL_DELAY_MS;
      schedule(tick, firstDelay);
    },
    [schedule],
  );

  const execute = useCallback(
    (input?: string) => {
      const current = stateRef.current;
      const task = current.activeTask;
      if (!task) return;

      const trimmedInput = input?.trim();
      const hasNewInput = Boolean(trimmedInput);

      if (current.state === "stopped" && !hasNewInput) {
        // Resume: continue from the exact interrupted step, no new input.
        clearTimers();
        dispatch({ type: "EXECUTE_RESUME" });
        runStepLoop(task, current.executingStep);
        return;
      }

      if (current.state === "planning" || current.state === "done" || current.state === "stopped") {
        // Fresh execution or re-run-with-input: start over from step 0.
        clearTimers();
        dispatch({ type: "EXECUTE_FRESH", input: trimmedInput || undefined });
        runStepLoop(task, 0);
        return;
      }
      // Any other state (idle/executing) — nothing to do.
    },
    [clearTimers, runStepLoop],
  );

  return {
    activeTask: state.activeTask,
    state: state.state,
    executingStep: state.executingStep,
    completedSteps: state.completedSteps,
    input: state.input,
    open,
    execute,
    stop,
    revert,
    close,
    reset,
  };
}
