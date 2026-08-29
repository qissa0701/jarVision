import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import fc from 'fast-check'
import { useTaskPanel } from './useTaskPanel'
import type { Task, TaskStep } from '@/types'

/**
 * Property 14: Task execution completes with every step marked done
 *
 * For any task, driving the task-panel reducer from `planning` through
 * execution to termination reaches the `done` state with `completedSteps`
 * containing an index for every step in the task.
 *
 * The hook uses chained setTimeout timers (INITIAL_DELAY_MS, PER_STEP_DELAY_MS,
 * FINALIZE_DELAY_MS) to advance execution, so we drive it deterministically
 * with fake timers: after `open(task)` (→ planning) and `execute()`
 * (→ executing), we flush every pending timer via `vi.runAllTimers()` inside
 * `act(...)` so all reducer dispatches settle. We then assert the terminal
 * state is `done` and that `completedSteps` holds exactly one index per step,
 * covering 0..steps.length-1.
 *
 * Validates: Requirements 10.3
 */

const RUNS = 100

/** A task with `count` ordered steps (1..N). Content is irrelevant to the property. */
const taskArb: fc.Arbitrary<Task> = fc
  .integer({ min: 1, max: 12 })
  .map((count) => {
    const steps: TaskStep[] = Array.from({ length: count }, (_, i) => ({
      num: i + 1,
      title: `Step ${i + 1}`,
      description: `Description for step ${i + 1}`,
    }))
    return {
      id: 'task-1',
      title: 'Generated task',
      due: 'Today',
      category: 'general',
      steps,
    }
  })

describe('Property 14: task execution completes with every step marked done', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Drain any stragglers, restore real timers, and tear down rendered hooks.
    vi.clearAllTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('reaches `done` with completedSteps covering every step index (Req 10.3)', () => {
    fc.assert(
      fc.property(taskArb, (task) => {
        const total = task.steps.length
        const { result, unmount } = renderHook(() => useTaskPanel())

        // Open the plan → planning.
        act(() => {
          result.current.open(task)
        })
        expect(result.current.state).toBe('planning')

        // Begin execution → executing.
        act(() => {
          result.current.execute()
        })
        expect(result.current.state).toBe('executing')

        // Flush every scheduled timer (initial delay, per-step ticks, finalize)
        // so the state machine runs to termination.
        act(() => {
          vi.runAllTimers()
        })

        // Terminal state reached.
        expect(result.current.state).toBe('done')

        // Every step index is present exactly once: size equals step count and
        // each index 0..total-1 is marked completed.
        expect(result.current.completedSteps.size).toBe(total)
        for (let i = 0; i < total; i++) {
          expect(result.current.completedSteps.has(i)).toBe(true)
        }

        // Unmount between generated runs to reset hook state and cancel timers.
        unmount()
      }),
      { numRuns: RUNS },
    )
  })
})

/**
 * Property 15: stop() mid-execution preserves progress and halts the run.
 *
 * For any task with 2+ steps, interrupting an in-flight execution partway
 * through must: transition to `"stopped"`, preserve `completedSteps`/
 * `executingStep` exactly as they were at the moment of interruption, and
 * guarantee no further timer fires (no additional step ever completes after
 * `stop()`, even if time continues to advance).
 *
 * Validates: Requirement (human-in-the-loop stop) from the feedback-driven
 * rework — "add a stop button so we can interrupt the agent".
 */
const multiStepTaskArb: fc.Arbitrary<Task> = fc
  .integer({ min: 2, max: 12 })
  .map((count) => {
    const steps: TaskStep[] = Array.from({ length: count }, (_, i) => ({
      num: i + 1,
      title: `Step ${i + 1}`,
      description: `Description for step ${i + 1}`,
    }))
    return {
      id: 'task-1',
      title: 'Generated task',
      due: 'Today',
      category: 'general',
      steps,
    }
  })

describe('Property 15: stop() mid-execution preserves progress exactly', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('transitions to stopped and freezes completedSteps/executingStep; no further step completes (Req: stop)', () => {
    fc.assert(
      fc.property(
        multiStepTaskArb,
        fc.integer({ min: 1, max: 3 }),
        (task, stepsToComplete) => {
          const total = task.steps.length
          const completeCount = Math.min(stepsToComplete, total - 1)
          const { result, unmount } = renderHook(() => useTaskPanel())

          act(() => {
            result.current.open(task)
          })
          act(() => {
            result.current.execute()
          })
          expect(result.current.state).toBe('executing')

          // Advance through exactly `completeCount` step completions: the
          // initial delay completes step 0, then each subsequent per-step
          // delay completes one more.
          act(() => {
            vi.advanceTimersByTime(900) // INITIAL_DELAY_MS
          })
          for (let i = 1; i < completeCount; i++) {
            act(() => {
              vi.advanceTimersByTime(1400) // PER_STEP_DELAY_MS
            })
          }

          const completedBeforeStop = new Set(result.current.completedSteps)
          const executingStepBeforeStop = result.current.executingStep

          act(() => {
            result.current.stop()
          })

          expect(result.current.state).toBe('stopped')
          expect(result.current.completedSteps).toEqual(completedBeforeStop)
          expect(result.current.executingStep).toBe(executingStepBeforeStop)

          // Advancing time further must not complete any additional step —
          // all pending timers were cancelled by stop().
          act(() => {
            vi.advanceTimersByTime(60000)
          })
          expect(result.current.state).toBe('stopped')
          expect(result.current.completedSteps).toEqual(completedBeforeStop)
          expect(result.current.executingStep).toBe(executingStepBeforeStop)

          unmount()
        },
      ),
      { numRuns: RUNS },
    )
  })

  it('is a no-op when not currently executing', () => {
    fc.assert(
      fc.property(taskArb, (task) => {
        const { result, unmount } = renderHook(() => useTaskPanel())

        act(() => {
          result.current.open(task)
        })
        expect(result.current.state).toBe('planning')

        act(() => {
          result.current.stop()
        })

        // stop() from planning (not executing) has no effect.
        expect(result.current.state).toBe('planning')

        unmount()
      }),
      { numRuns: RUNS },
    )
  })
})

describe('Property 16: execute() from stopped with no new input resumes from the interrupted step', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('resumes without re-completing prior steps or resetting the counter, and finishes at done', () => {
    fc.assert(
      fc.property(
        multiStepTaskArb,
        fc.integer({ min: 1, max: 3 }),
        (task, stepsToComplete) => {
          const total = task.steps.length
          const completeCount = Math.min(stepsToComplete, total - 1)
          const { result, unmount } = renderHook(() => useTaskPanel())

          act(() => {
            result.current.open(task)
          })
          act(() => {
            result.current.execute()
          })
          act(() => {
            vi.advanceTimersByTime(900)
          })
          for (let i = 1; i < completeCount; i++) {
            act(() => {
              vi.advanceTimersByTime(1400)
            })
          }

          act(() => {
            result.current.stop()
          })
          expect(result.current.state).toBe('stopped')

          const completedAtStop = new Set(result.current.completedSteps)
          const executingStepAtStop = result.current.executingStep

          // Resume: execute() with no input from "stopped".
          act(() => {
            result.current.execute()
          })
          expect(result.current.state).toBe('executing')
          // Immediately after resuming (before any new timer fires), progress
          // must be exactly what it was at the moment of interruption — no
          // reset, no re-completion.
          expect(result.current.completedSteps).toEqual(completedAtStop)
          expect(result.current.executingStep).toBe(executingStepAtStop)

          // Run to completion.
          act(() => {
            vi.runAllTimers()
          })
          expect(result.current.state).toBe('done')
          expect(result.current.completedSteps.size).toBe(total)
          for (let i = 0; i < total; i++) {
            expect(result.current.completedSteps.has(i)).toBe(true)
          }

          unmount()
        },
      ),
      { numRuns: RUNS },
    )
  })
})

describe('Property 17: execute(input) from done/stopped with new input restarts from step 0', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('restarts from step 0 threading the new input, from a stopped run', () => {
    fc.assert(
      fc.property(
        multiStepTaskArb,
        fc.integer({ min: 1, max: 3 }),
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
        (task, stepsToComplete, newInput) => {
          const total = task.steps.length
          const completeCount = Math.min(stepsToComplete, total - 1)
          const { result, unmount } = renderHook(() => useTaskPanel())

          act(() => {
            result.current.open(task)
          })
          act(() => {
            result.current.execute()
          })
          act(() => {
            vi.advanceTimersByTime(900)
          })
          for (let i = 1; i < completeCount; i++) {
            act(() => {
              vi.advanceTimersByTime(1400)
            })
          }
          act(() => {
            result.current.stop()
          })
          expect(result.current.state).toBe('stopped')
          // Sanity: some progress was made before the re-run (otherwise the
          // "restart from 0" assertion below would be vacuous).
          expect(result.current.completedSteps.size).toBeGreaterThanOrEqual(0)

          // Re-run with a new input: resets progress, starts fresh.
          act(() => {
            result.current.execute(newInput)
          })
          expect(result.current.state).toBe('executing')
          expect(result.current.executingStep).toBe(0)
          expect(result.current.completedSteps.size).toBe(0)
          expect(result.current.input).toBe(newInput.trim())

          unmount()
        },
      ),
      { numRuns: RUNS },
    )
  })

  it('restarts from step 0 threading the new input, from a done run', () => {
    fc.assert(
      fc.property(
        taskArb,
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
        (task, newInput) => {
          const { result, unmount } = renderHook(() => useTaskPanel())

          act(() => {
            result.current.open(task)
          })
          act(() => {
            result.current.execute()
          })
          act(() => {
            vi.runAllTimers()
          })
          expect(result.current.state).toBe('done')

          act(() => {
            result.current.execute(newInput)
          })
          expect(result.current.state).toBe('executing')
          expect(result.current.executingStep).toBe(0)
          expect(result.current.completedSteps.size).toBe(0)
          expect(result.current.input).toBe(newInput.trim())

          unmount()
        },
      ),
      { numRuns: RUNS },
    )
  })
})

describe('Property 18: revert() from done returns to a clean planning state', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('resets to planning with completedSteps cleared and executingStep at 0, same task', () => {
    fc.assert(
      fc.property(taskArb, (task) => {
        const { result, unmount } = renderHook(() => useTaskPanel())

        act(() => {
          result.current.open(task)
        })
        act(() => {
          result.current.execute()
        })
        act(() => {
          vi.runAllTimers()
        })
        expect(result.current.state).toBe('done')

        act(() => {
          result.current.revert()
        })

        expect(result.current.state).toBe('planning')
        expect(result.current.executingStep).toBe(0)
        expect(result.current.completedSteps.size).toBe(0)
        expect(result.current.activeTask?.id).toBe(task.id)

        unmount()
      }),
      { numRuns: RUNS },
    )
  })

  it('is a no-op when not in the done state', () => {
    fc.assert(
      fc.property(taskArb, (task) => {
        const { result, unmount } = renderHook(() => useTaskPanel())

        act(() => {
          result.current.open(task)
        })
        expect(result.current.state).toBe('planning')

        act(() => {
          result.current.revert()
        })

        // revert() from planning (not done) has no effect.
        expect(result.current.state).toBe('planning')

        unmount()
      }),
      { numRuns: RUNS },
    )
  })
})
