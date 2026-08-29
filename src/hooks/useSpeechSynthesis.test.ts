// Unit tests for useSpeechSynthesis.
//
// jsdom does not implement `window.speechSynthesis`/`SpeechSynthesisUtterance`,
// so this file installs mocks for both for the duration of each test,
// verifying: `isSupported` reflects presence/absence, `speak()` constructs an
// utterance and calls through to `speechSynthesis.speak`, `isSpeaking` tracks
// the utterance's start/end, and `cancel()` calls through to
// `speechSynthesis.cancel`.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

class MockUtterance {
  text: string;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text?: string) {
    this.text = text ?? "";
  }
}

function installMockSynth() {
  const cancel = vi.fn();
  const speak = vi.fn();
  const mockSynth = { speak, cancel } as unknown as SpeechSynthesis;
  (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis = mockSynth;
  (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance =
    MockUtterance;
  return { speak, cancel };
}

function removeMockSynth() {
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
  delete (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
}

describe("useSpeechSynthesis — feature detection", () => {
  afterEach(removeMockSynth);

  it("reports isSupported: false when window.speechSynthesis is absent", () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.isSupported).toBe(false);
  });

  it("reports isSupported: true when window.speechSynthesis is present", () => {
    installMockSynth();
    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.isSupported).toBe(true);
  });

  it("speak() is a no-op when unsupported", () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => {
      result.current.speak("hello");
    });
    expect(result.current.isSpeaking).toBe(false);
  });
});

describe("useSpeechSynthesis — supported behavior", () => {
  let mocks: ReturnType<typeof installMockSynth>;

  beforeEach(() => {
    mocks = installMockSynth();
  });

  afterEach(removeMockSynth);

  it("speak() cancels any prior speech then calls speechSynthesis.speak with a new utterance", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("here's your priority summary");
    });

    expect(mocks.cancel).toHaveBeenCalledTimes(1);
    expect(mocks.speak).toHaveBeenCalledTimes(1);
    const utterance = mocks.speak.mock.calls[0][0] as MockUtterance;
    expect(utterance.text).toBe("here's your priority summary");
  });

  it("sets isSpeaking true on utterance start and false on end", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("hello");
    });
    const utterance = mocks.speak.mock.calls[0][0] as MockUtterance;

    act(() => {
      utterance.onstart?.();
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      utterance.onend?.();
    });
    expect(result.current.isSpeaking).toBe(false);
  });

  it("sets isSpeaking false on utterance error", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("hello");
    });
    const utterance = mocks.speak.mock.calls[0][0] as MockUtterance;

    act(() => {
      utterance.onstart?.();
    });
    act(() => {
      utterance.onerror?.();
    });
    expect(result.current.isSpeaking).toBe(false);
  });

  it("cancel() calls through to speechSynthesis.cancel and clears isSpeaking", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("hello");
    });
    const utterance = mocks.speak.mock.calls[0][0] as MockUtterance;
    act(() => {
      utterance.onstart?.();
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(mocks.cancel).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it("ignores an empty or whitespace-only speak() call", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("   ");
    });

    expect(mocks.speak).not.toHaveBeenCalled();
  });
});
