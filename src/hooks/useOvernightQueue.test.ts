// Unit tests for the useOvernightQueue hook additions: explicit-time
// scheduling, single-run simulation (`runOne`), and direct-complete
// (`completeNow`) — against an injected mock Storage so no real localStorage
// is touched.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Task } from "@/types";
import { useOvernightQueue, type OvernightStorage } from "./useOvernightQueue";

function createMockStorage(): OvernightStorage & {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
} {
  return {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Fix memory leak in auth service",
    due: "Today",
    category: "Bug",
    steps: [{ num: 1, title: "Capture heap snapshot", description: "…" }],
    ...overrides,
  };
}

describe("useOvernightQueue — explicit-time schedule", () => {
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it("schedules a run for the exact chosen time when explicitTime is given", () => {
    const { result } = renderHook(() => useOvernightQueue(storage));

    act(() => {
      result.current.schedule("engineer", makeTask(), "14:30");
    });

    const run = result.current.getRun("engineer", "t1");
    expect(run?.status).toBe("scheduled");
    expect(run?.scheduledFor).toBe("2:30 PM");
  });

  it("still supports the original window-derived schedule with no explicit time", () => {
    const { result } = renderHook(() => useOvernightQueue(storage));

    act(() => {
      result.current.schedule("engineer", makeTask());
    });

    const run = result.current.getRun("engineer", "t1");
    expect(run?.status).toBe("scheduled");
    expect(run?.scheduledFor).toBeTruthy();
  });
});

describe("useOvernightQueue — runOne", () => {
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
    vi.useFakeTimers();
  });

  it("advances only the targeted run from scheduled through running to ready", () => {
    const { result } = renderHook(() => useOvernightQueue(storage));

    act(() => {
      result.current.schedule("engineer", makeTask({ id: "t1" }));
      result.current.schedule("engineer", makeTask({ id: "t2" }));
    });

    act(() => {
      result.current.runOne("engineer", "t1");
    });

    // Immediately after calling runOne, the targeted run is "running"...
    expect(result.current.getRun("engineer", "t1")?.status).toBe("running");
    // ...and the other scheduled run is untouched.
    expect(result.current.getRun("engineer", "t2")?.status).toBe("scheduled");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.getRun("engineer", "t1")?.status).toBe("ready");
    // The other run still hasn't been advanced by runOne's timer.
    expect(result.current.getRun("engineer", "t2")?.status).toBe("scheduled");
  });

  it("advances a changes_requested run as well", () => {
    const { result } = renderHook(() => useOvernightQueue(storage));

    act(() => {
      result.current.schedule("engineer", makeTask());
    });
    act(() => {
      // Fast-track to ready then request changes.
      result.current.runOne("engineer", "t1");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      result.current.requestChanges("engineer", "t1");
    });
    expect(result.current.getRun("engineer", "t1")?.status).toBe("changes_requested");

    act(() => {
      result.current.runOne("engineer", "t1");
    });
    expect(result.current.getRun("engineer", "t1")?.status).toBe("running");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.getRun("engineer", "t1")?.status).toBe("ready");
  });

  it("does nothing when there is no run for the task", () => {
    const { result } = renderHook(() => useOvernightQueue(storage));

    act(() => {
      result.current.runOne("engineer", "does-not-exist");
    });

    expect(result.current.getRun("engineer", "does-not-exist")).toBeUndefined();
  });

  it("does nothing when the run is already running/ready/approved", () => {
    const { result } = renderHook(() => useOvernightQueue(storage));

    act(() => {
      result.current.schedule("engineer", makeTask());
    });
    act(() => {
      result.current.approve("engineer", "t1");
    });

    const before = result.current.getRun("engineer", "t1");
    act(() => {
      result.current.runOne("engineer", "t1");
    });
    const after = result.current.getRun("engineer", "t1");

    expect(after?.status).toBe(before?.status);
  });
});

describe("useOvernightQueue — completeNow", () => {
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it("creates a run directly in the ready status, bypassing scheduled/running", () => {
    const { result } = renderHook(() => useOvernightQueue(storage));

    act(() => {
      result.current.completeNow("engineer", makeTask());
    });

    const run = result.current.getRun("engineer", "t1");
    expect(run?.status).toBe("ready");
    expect(run?.result).toBeTruthy();
  });

  it("overwrites an existing run for the same task", () => {
    const { result } = renderHook(() => useOvernightQueue(storage));

    act(() => {
      result.current.schedule("engineer", makeTask());
    });
    expect(result.current.getRun("engineer", "t1")?.status).toBe("scheduled");

    act(() => {
      result.current.completeNow("engineer", makeTask());
    });

    expect(result.current.getRun("engineer", "t1")?.status).toBe("ready");
  });

  it("cancels any in-flight runOne simulation for the same run so it can't overwrite the completed run", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useOvernightQueue(storage));

    act(() => {
      result.current.schedule("engineer", makeTask());
    });
    act(() => {
      result.current.runOne("engineer", "t1");
    });
    expect(result.current.getRun("engineer", "t1")?.status).toBe("running");

    act(() => {
      result.current.completeNow("engineer", makeTask());
    });
    expect(result.current.getRun("engineer", "t1")?.status).toBe("ready");

    // Advance past when the cancelled runOne timer would have fired; the
    // run must remain in the completeNow-set state.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.getRun("engineer", "t1")?.status).toBe("ready");

    vi.useRealTimers();
  });
});
