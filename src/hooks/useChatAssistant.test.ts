// Unit tests for the useChatAssistant hook: message ordering, the simulated
// "thinking" delay / isThinking flag, and reset() clearing the conversation
// (including cancelling any in-flight reply so a stale reply can never land
// against a cleared conversation after a role switch).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { OvernightRun } from "@/types";
import { ROLE_DATA } from "@/data/roleData";
import { useChatAssistant } from "./useChatAssistant";
import { THINKING_DELAY_MAX_MS } from "@/constants/chat";

const engineerData = ROLE_DATA.engineer;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useChatAssistant — sendMessage", () => {
  it("appends the user message immediately", () => {
    const { result } = renderHook(() => useChatAssistant(engineerData, []));

    act(() => {
      result.current.sendMessage("what are my priorities");
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].text).toBe("what are my priorities");
  });

  it("sets isThinking while the reply is pending, then appends the assistant reply", () => {
    const { result } = renderHook(() => useChatAssistant(engineerData, []));

    act(() => {
      result.current.sendMessage("what are my priorities");
    });
    expect(result.current.isThinking).toBe(true);
    expect(result.current.messages).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(THINKING_DELAY_MAX_MS);
    });

    expect(result.current.isThinking).toBe(false);
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].text).toContain("PR #847");
  });

  it("preserves message order across multiple sends", () => {
    const { result } = renderHook(() => useChatAssistant(engineerData, []));

    act(() => {
      result.current.sendMessage("hi");
    });
    act(() => {
      vi.advanceTimersByTime(THINKING_DELAY_MAX_MS);
    });
    act(() => {
      result.current.sendMessage("what are my tasks");
    });
    act(() => {
      vi.advanceTimersByTime(THINKING_DELAY_MAX_MS);
    });

    expect(result.current.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
    expect(result.current.messages[0].text).toBe("hi");
    expect(result.current.messages[2].text).toBe("what are my tasks");
  });

  it("assigns unique, stable ids to each message", () => {
    const { result } = renderHook(() => useChatAssistant(engineerData, []));

    act(() => {
      result.current.sendMessage("hi");
    });
    act(() => {
      vi.advanceTimersByTime(THINKING_DELAY_MAX_MS);
    });

    const ids = result.current.messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ignores an empty or whitespace-only message", () => {
    const { result } = renderHook(() => useChatAssistant(engineerData, []));

    act(() => {
      result.current.sendMessage("   ");
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isThinking).toBe(false);
  });

  it("uses the up-to-date data/overnightRuns context for the reply even if they change after sendMessage is created", () => {
    const { result, rerender } = renderHook(
      ({ data, runs }) => useChatAssistant(data, runs),
      { initialProps: { data: engineerData, runs: [] as OvernightRun[] } },
    );

    rerender({ data: ROLE_DATA.infrastructure, runs: [] });

    act(() => {
      result.current.sendMessage("what are my priorities");
    });
    act(() => {
      vi.advanceTimersByTime(THINKING_DELAY_MAX_MS);
    });

    // infrastructure's top priority text, not engineer's.
    expect(result.current.messages[1].text).toContain("prod-db-03");
  });
});

describe("useChatAssistant — reset", () => {
  it("clears the conversation", () => {
    const { result } = renderHook(() => useChatAssistant(engineerData, []));

    act(() => {
      result.current.sendMessage("hi");
    });
    act(() => {
      vi.advanceTimersByTime(THINKING_DELAY_MAX_MS);
    });
    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isThinking).toBe(false);
  });

  it("cancels an in-flight reply so it never lands after reset", () => {
    const { result } = renderHook(() => useChatAssistant(engineerData, []));

    act(() => {
      result.current.sendMessage("hi");
    });
    expect(result.current.isThinking).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isThinking).toBe(false);

    // Advance past when the cancelled reply timer would have fired.
    act(() => {
      vi.advanceTimersByTime(THINKING_DELAY_MAX_MS);
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isThinking).toBe(false);
  });
});
