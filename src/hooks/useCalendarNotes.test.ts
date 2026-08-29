// Unit tests for useCalendarNotes: debounced persistence and per-role
// isolation, against an injected mock Storage.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCalendarNotes, type CalendarNotesStorage } from "./useCalendarNotes";
import { CALENDAR_NOTES_STORAGE_KEY } from "@/constants/calendar";

function createMockStorage(): CalendarNotesStorage & {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
} {
  return {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
  };
}

describe("useCalendarNotes", () => {
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
    vi.useFakeTimers();
  });

  it("starts with an empty note when nothing is persisted", () => {
    const { result } = renderHook(() => useCalendarNotes("engineer", storage, 50));
    expect(result.current.note).toBe("");
  });

  it("updates the note value immediately (no lost keystrokes)", () => {
    const { result } = renderHook(() => useCalendarNotes("engineer", storage, 50));

    act(() => {
      result.current.setNote("Focus on the deploy");
    });

    expect(result.current.note).toBe("Focus on the deploy");
  });

  it("debounces the persisted write until after the delay elapses", () => {
    const { result } = renderHook(() => useCalendarNotes("engineer", storage, 50));

    act(() => {
      result.current.setNote("Focus on the deploy");
    });
    // Not yet persisted.
    expect(storage.setItem).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      CALENDAR_NOTES_STORAGE_KEY,
      expect.stringContaining("Focus on the deploy"),
    );
  });

  it("only persists the final value when typed in quick succession", () => {
    const { result } = renderHook(() => useCalendarNotes("engineer", storage, 50));

    act(() => {
      result.current.setNote("F");
    });
    act(() => {
      vi.advanceTimersByTime(20);
      result.current.setNote("Fo");
    });
    act(() => {
      vi.advanceTimersByTime(20);
      result.current.setNote("Foo");
    });
    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith(
      CALENDAR_NOTES_STORAGE_KEY,
      expect.stringContaining("Foo"),
    );
  });

  it("keeps notes independent per role", () => {
    storage.getItem.mockReturnValue(
      JSON.stringify({ engineer: "Engineer note", portfolio: "Portfolio note" }),
    );

    const { result: engineerResult } = renderHook(() =>
      useCalendarNotes("engineer", storage, 50),
    );
    const { result: portfolioResult } = renderHook(() =>
      useCalendarNotes("portfolio", storage, 50),
    );

    expect(engineerResult.current.note).toBe("Engineer note");
    expect(portfolioResult.current.note).toBe("Portfolio note");
  });
});
