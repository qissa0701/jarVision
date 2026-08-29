// useOvernightQueue — React adapter over the pure overnight logic.
//
// Owns the persisted queue of tasks Jarvis runs overnight and the automation
// window. Scheduling adds a run; "run now" simulates the overnight execution
// (scheduled → running → ready) using self-cleaning timers so the morning
// review state can be previewed without waiting until the small hours. Approval
// and change-requests close the loop with the required human review.
//
// All scheduling math and result generation live in `src/lib/overnight.ts`;
// this hook only wires that logic to React state, persistence, and timers.

import { useCallback, useEffect, useRef, useState } from "react";
import type { OvernightRun, OvernightWindow, Role, Task } from "@/types";
import {
  emptyState,
  loadOvernight,
  makeCompletedRun,
  makeRun,
  queuedCountForRole,
  readyCountForRole,
  runKey,
  runsForRole,
  saveOvernight,
  type OvernightState,
} from "@/lib/overnight";

/** The subset of Storage this hook needs. */
export type OvernightStorage = Pick<Storage, "getItem" | "setItem">;

export interface OvernightQueue {
  window: OvernightWindow;
  /** All runs for the given role. */
  runsFor: (role: Role) => OvernightRun[];
  /** Look up a single run by role + task id, or undefined. */
  getRun: (role: Role, taskId: string) => OvernightRun | undefined;
  /** Count of runs for a role still occupying a queue slot. */
  queuedCount: (role: Role) => number;
  /** Count of runs for a role awaiting review. */
  readyCount: (role: Role) => number;
  /** Whether any run is currently mid-execution (for UI affordances). */
  isRunning: boolean;
  /**
   * Delegate a task to tonight's queue. When `explicitTime` ("HH:mm") is
   * given, the run is scheduled for that exact time instead of a slot derived
   * from the automation window — this is how the drawer's "Schedule
   * execution" time picker schedules a task.
   */
  schedule: (role: Role, task: Task, explicitTime?: string) => void;
  /** Remove a task from the queue entirely. */
  unschedule: (role: Role, taskId: string) => void;
  /** Simulate the overnight run so results become ready for review. */
  runNow: () => void;
  /**
   * Simulate a single scheduled (or changes-requested) run advancing through
   * scheduled/changes_requested → running → ready, without touching any other
   * run in the queue. Powers a Scheduled task's "Simulate: run now" affordance.
   */
  runOne: (role: Role, taskId: string) => void;
  /**
   * Create (or overwrite) a run straight into "ready" status with a generated
   * result, bypassing scheduled/running entirely. This is what persists a
   * Completed artifact once the Task_Panel's "Execute now" path reaches its
   * `done` state.
   */
  completeNow: (role: Role, task: Task) => void;
  /** Approve a completed run after review. */
  approve: (role: Role, taskId: string) => void;
  /** Send a completed run back with a change request. */
  requestChanges: (role: Role, taskId: string) => void;
  /** Update the automation window. */
  setWindow: (window: OvernightWindow) => void;
}

const RUNNING_ENTER_MS = 600;
const RUNNING_STAGGER_MS = 550;

export function useOvernightQueue(
  storage: OvernightStorage = window.localStorage,
): OvernightQueue {
  const [state, setState] = useState<OvernightState>(() => {
    try {
      return loadOvernight(storage);
    } catch {
      return emptyState();
    }
  });
  const [isRunning, setIsRunning] = useState(false);

  // Track pending timers so a re-run or unmount cancels them cleanly.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // Separate timer bookkeeping for single-run simulations ("Simulate: run
  // now" on one Scheduled task), keyed by run key so simulating one run never
  // cancels — or is cancelled by — the batch `runNow` timers or another run's
  // simulation.
  const singleRunTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const clearSingleRunTimer = useCallback((key: string) => {
    const existing = singleRunTimers.current.get(key);
    if (existing) {
      clearTimeout(existing);
      singleRunTimers.current.delete(key);
    }
  }, []);
  const clearAllSingleRunTimers = useCallback(() => {
    singleRunTimers.current.forEach(clearTimeout);
    singleRunTimers.current.clear();
  }, []);

  // Persist on every change.
  useEffect(() => {
    saveOvernight(storage, state);
  }, [storage, state]);

  // Cancel outstanding timers on unmount.
  useEffect(() => {
    return () => {
      clearTimers();
      clearAllSingleRunTimers();
    };
  }, [clearTimers, clearAllSingleRunTimers]);

  const runsFor = useCallback(
    (role: Role) => runsForRole(state, role),
    [state],
  );

  const getRun = useCallback(
    (role: Role, taskId: string) => state.runs[runKey(role, taskId)],
    [state],
  );

  const queuedCount = useCallback(
    (role: Role) => queuedCountForRole(state, role),
    [state],
  );

  const readyCount = useCallback(
    (role: Role) => readyCountForRole(state, role),
    [state],
  );

  const schedule = useCallback((role: Role, task: Task, explicitTime?: string) => {
    setState((prev) => {
      const position = queuedCountForRole(prev, role);
      const run = makeRun(role, task, prev.window, position, Date.now(), explicitTime);
      return { ...prev, runs: { ...prev.runs, [run.key]: run } };
    });
  }, []);

  const unschedule = useCallback((role: Role, taskId: string) => {
    setState((prev) => {
      const next = { ...prev.runs };
      delete next[runKey(role, taskId)];
      return { ...prev, runs: next };
    });
  }, []);

  const setStatus = useCallback(
    (key: string, status: OvernightRun["status"]) => {
      setState((prev) => {
        const run = prev.runs[key];
        if (!run) return prev;
        return {
          ...prev,
          runs: {
            ...prev.runs,
            [key]: { ...run, status, updatedAt: Date.now() },
          },
        };
      });
    },
    [],
  );

  const runNow = useCallback(() => {
    clearTimers();

    // Collect the keys of everything that should execute tonight: freshly
    // scheduled work plus anything sent back for changes.
    const pending = Object.values(state.runs).filter(
      (run) => run.status === "scheduled" || run.status === "changes_requested",
    );
    if (pending.length === 0) return;

    setIsRunning(true);

    // Move all pending runs into the running state immediately.
    setState((prev) => {
      const runs = { ...prev.runs };
      for (const run of pending) {
        runs[run.key] = { ...runs[run.key], status: "running", updatedAt: Date.now() };
      }
      return { ...prev, runs };
    });

    // Then complete them one-by-one so the UI shows progress.
    pending.forEach((run, index) => {
      const timer = setTimeout(
        () => {
          setStatus(run.key, "ready");
          // Clear the running flag once the last run completes.
          if (index === pending.length - 1) setIsRunning(false);
        },
        RUNNING_ENTER_MS + index * RUNNING_STAGGER_MS,
      );
      timers.current.push(timer);
    });
  }, [state.runs, clearTimers, setStatus]);

  const runOne = useCallback(
    (role: Role, taskId: string) => {
      const key = runKey(role, taskId);
      const run = state.runs[key];
      if (!run || (run.status !== "scheduled" && run.status !== "changes_requested")) {
        return;
      }

      // Cancel any prior simulation already in flight for this exact run.
      clearSingleRunTimer(key);

      setStatus(key, "running");

      const timer = setTimeout(() => {
        singleRunTimers.current.delete(key);
        setStatus(key, "ready");
      }, RUNNING_ENTER_MS);
      singleRunTimers.current.set(key, timer);
    },
    [state.runs, setStatus, clearSingleRunTimer],
  );

  const completeNow = useCallback((role: Role, task: Task) => {
    // Direct-complete bypasses scheduled/running: cancel any in-flight
    // simulation for this run so it can't later overwrite the completed run.
    clearSingleRunTimer(runKey(role, task.id));
    setState((prev) => {
      const run = makeCompletedRun(role, task, Date.now());
      return { ...prev, runs: { ...prev.runs, [run.key]: run } };
    });
  }, [clearSingleRunTimer]);

  const approve = useCallback(
    (role: Role, taskId: string) => setStatus(runKey(role, taskId), "approved"),
    [setStatus],
  );

  const requestChanges = useCallback(
    (role: Role, taskId: string) =>
      setStatus(runKey(role, taskId), "changes_requested"),
    [setStatus],
  );

  const setWindow = useCallback((window: OvernightWindow) => {
    setState((prev) => ({ ...prev, window }));
  }, []);

  return {
    window: state.window,
    runsFor,
    getRun,
    queuedCount,
    readyCount,
    isRunning,
    schedule,
    unschedule,
    runNow,
    runOne,
    completeNow,
    approve,
    requestChanges,
    setWindow,
  };
}
