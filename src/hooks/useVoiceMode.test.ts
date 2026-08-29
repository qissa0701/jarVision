// Unit tests for useVoiceMode — the Voice Mode orchestration hook.
//
// Installs the same mocked-global `SpeechRecognition`/`speechSynthesis`
// approach already established in `useSpeechRecognition.test.ts` /
// `useSpeechSynthesis.test.ts` (jsdom implements neither API), then drives
// the full phase sequence through the mocks: listening → thinking (via the
// caller's `isThinking` prop) → speaking (via the mocked
// `SpeechSynthesisUtterance`'s onstart/onend) → back to listening again —
// verifying the continuous conversational loop, interim transcript
// surfacing, graceful degradation when unsupported, and that `stop()` fully
// tears down with no lingering recognizer/speech and no further phase
// changes.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoiceMode, type UseVoiceModeOptions } from "./useVoiceMode";
import type { ChatMessage } from "@/hooks/useChatAssistant";

// ─── Mock SpeechRecognition (mirrors useSpeechRecognition.test.ts) ─────────

class MockSpeechRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  start = vi.fn(() => {
    this.onstart?.();
  });
  stop = vi.fn(() => {
    this.onend?.();
  });
  abort = vi.fn();
}

function makeFinalResultEvent(transcript: string) {
  const item = { transcript, confidence: 0.9 };
  const result = { length: 1, isFinal: true, item: () => item, 0: item };
  return { resultIndex: 0, results: { length: 1, item: () => result, 0: result } };
}

function makeInterimResultEvent(transcript: string) {
  const item = { transcript, confidence: 0.5 };
  const result = { length: 1, isFinal: false, item: () => item, 0: item };
  return { resultIndex: 0, results: { length: 1, item: () => result, 0: result } };
}

/**
 * Simulates a real (non-continuous) SpeechRecognition instance's behavior:
 * a final result is immediately followed by the browser auto-ending
 * recognition (firing `onend`), which is what allows the next `start()` call
 * to actually construct a fresh recognizer instance. The lightweight
 * `MockSpeechRecognition` used in these tests only fires `onend` when `stop()`
 * is called explicitly, so tests exercising the "final transcript ⇒ later
 * listens again" loop drive both callbacks here to match real-world timing.
 */
function fireFinalTranscript(instance: MockSpeechRecognition, transcript: string) {
  instance.onresult?.(makeFinalResultEvent(transcript));
  instance.onend?.();
}

// ─── Mock SpeechSynthesis (mirrors useSpeechSynthesis.test.ts) ─────────────

class MockUtterance {
  text: string;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text?: string) {
    this.text = text ?? "";
  }
}

function installMocks() {
  const recognitionInstances: MockSpeechRecognition[] = [];
  class TrackedRecognition extends MockSpeechRecognition {
    constructor() {
      super();
      recognitionInstances.push(this);
    }
  }
  (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition =
    TrackedRecognition;

  const synthCancel = vi.fn();
  const synthSpeak = vi.fn();
  const mockSynth = { speak: synthSpeak, cancel: synthCancel } as unknown as SpeechSynthesis;
  (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis = mockSynth;
  (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance =
    MockUtterance;

  return { recognitionInstances, synthCancel, synthSpeak };
}

function removeMocks() {
  delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
  delete (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
}

function makeMessage(id: string, text = "reply text"): ChatMessage {
  return { id, role: "assistant", text, timestamp: Date.now() };
}

describe("useVoiceMode — feature detection / graceful degradation", () => {
  afterEach(removeMocks);

  it("reports isSupported: false when neither recognition nor synthesis is available", () => {
    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript: vi.fn(),
      }),
    );
    expect(result.current.isSupported).toBe(false);
  });

  it("reports isSupported: false when only recognition is available", () => {
    class TrackedRecognition extends MockSpeechRecognition {}
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition =
      TrackedRecognition;

    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript: vi.fn(),
      }),
    );
    expect(result.current.isSupported).toBe(false);
  });

  it("reports isSupported: false when only synthesis is available", () => {
    (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
    } as unknown as SpeechSynthesis;
    (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance =
      MockUtterance;

    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript: vi.fn(),
      }),
    );
    expect(result.current.isSupported).toBe(false);
  });

  it("reports isSupported: true when both APIs are available", () => {
    installMocks();
    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript: vi.fn(),
      }),
    );
    expect(result.current.isSupported).toBe(true);
  });

  it("start() is a no-op when unsupported — phase stays idle", () => {
    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript: vi.fn(),
      }),
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.isActive).toBe(false);
  });
});

describe("useVoiceMode — full phase loop", () => {
  let mocks: ReturnType<typeof installMocks>;

  beforeEach(() => {
    mocks = installMocks();
  });

  afterEach(removeMocks);

  it("start() enters voice mode, begins listening, and constructs a recognizer", () => {
    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript: vi.fn(),
      }),
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.phase).toBe("listening");
    expect(mocks.recognitionInstances).toHaveLength(1);
    expect(mocks.recognitionInstances[0].start).toHaveBeenCalledTimes(1);
    expect(mocks.recognitionInstances[0].interimResults).toBe(true);
  });

  it("surfaces the interim transcript while listening", () => {
    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript: vi.fn(),
      }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      mocks.recognitionInstances[0].onresult?.(makeInterimResultEvent("what's the pri"));
    });

    expect(result.current.interimTranscript).toBe("what's the pri");
  });

  it("forwards a final transcript to onTranscript", () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript,
      }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      mocks.recognitionInstances[0].onresult?.(
        makeFinalResultEvent("what are my priorities"),
      );
    });

    expect(onTranscript).toHaveBeenCalledWith("what are my priorities");
  });

  it("moves to 'thinking' when isThinking transitions to true while active", () => {
    const { result, rerender } = renderHook(
      (props: UseVoiceModeOptions) => useVoiceMode(props),
      {
        initialProps: {
          isThinking: false,
          latestAssistantMessage: undefined,
          onTranscript: vi.fn(),
        },
      },
    );

    act(() => {
      result.current.start();
    });
    expect(result.current.phase).toBe("listening");

    rerender({
      isThinking: true,
      latestAssistantMessage: undefined,
      onTranscript: vi.fn(),
    });

    expect(result.current.phase).toBe("thinking");
  });

  it("moves to 'speaking' and calls speak() when isThinking goes false with a new assistant message", () => {
    const message = makeMessage("m1", "here's your priority summary");
    const { result, rerender } = renderHook(
      (props: UseVoiceModeOptions) => useVoiceMode(props),
      {
        initialProps: {
          isThinking: false,
          latestAssistantMessage: undefined,
          onTranscript: vi.fn(),
        } as UseVoiceModeOptions,
      },
    );

    act(() => {
      result.current.start();
    });
    rerender({
      isThinking: true,
      latestAssistantMessage: undefined,
      onTranscript: vi.fn(),
    });
    expect(result.current.phase).toBe("thinking");

    rerender({
      isThinking: false,
      latestAssistantMessage: message,
      onTranscript: vi.fn(),
    });

    expect(result.current.phase).toBe("speaking");
    expect(mocks.synthSpeak).toHaveBeenCalledTimes(1);
    const utterance = mocks.synthSpeak.mock.calls[0][0] as MockUtterance;
    expect(utterance.text).toBe("here's your priority summary");
  });

  it("loops back to 'listening' and restarts recognition once speech ends", () => {
    const message = makeMessage("m1", "here's your priority summary");
    const { result, rerender } = renderHook(
      (props: UseVoiceModeOptions) => useVoiceMode(props),
      {
        initialProps: {
          isThinking: false,
          latestAssistantMessage: undefined,
          onTranscript: vi.fn(),
        } as UseVoiceModeOptions,
      },
    );

    act(() => {
      result.current.start();
    });
    // A real (non-continuous) recognizer auto-ends once it reports a final
    // transcript, which is what frees it up to be replaced by a fresh
    // instance for the next listening turn.
    act(() => {
      fireFinalTranscript(mocks.recognitionInstances[0], "what are my priorities");
    });
    rerender({ isThinking: true, latestAssistantMessage: undefined, onTranscript: vi.fn() });
    rerender({ isThinking: false, latestAssistantMessage: message, onTranscript: vi.fn() });

    const utterance = mocks.synthSpeak.mock.calls[0][0] as MockUtterance;
    act(() => {
      utterance.onstart?.();
    });
    expect(result.current.phase).toBe("speaking");

    act(() => {
      utterance.onend?.();
    });

    expect(result.current.phase).toBe("listening");
    // A second recognizer instance was constructed for the new listening turn.
    expect(mocks.recognitionInstances).toHaveLength(2);
    expect(mocks.recognitionInstances[1].start).toHaveBeenCalledTimes(1);
  });

  it("never speaks the same assistant message twice", () => {
    const message = makeMessage("m1", "here's your priority summary");
    const { result, rerender } = renderHook(
      (props: UseVoiceModeOptions) => useVoiceMode(props),
      {
        initialProps: {
          isThinking: false,
          latestAssistantMessage: undefined,
          onTranscript: vi.fn(),
        } as UseVoiceModeOptions,
      },
    );

    act(() => {
      result.current.start();
    });
    rerender({ isThinking: true, latestAssistantMessage: undefined, onTranscript: vi.fn() });
    rerender({ isThinking: false, latestAssistantMessage: message, onTranscript: vi.fn() });
    expect(mocks.synthSpeak).toHaveBeenCalledTimes(1);

    // Re-render again with the same message and isThinking still false — must
    // not re-trigger a second speak() call.
    rerender({ isThinking: false, latestAssistantMessage: message, onTranscript: vi.fn() });

    expect(mocks.synthSpeak).toHaveBeenCalledTimes(1);
  });

  it("does not treat a pre-existing assistant message as new when start() is called", () => {
    const priorMessage = makeMessage("m0", "old reply");
    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: priorMessage,
        onTranscript: vi.fn(),
      }),
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("listening");
    expect(mocks.synthSpeak).not.toHaveBeenCalled();
  });
});

describe("useVoiceMode — stop() teardown", () => {
  let mocks: ReturnType<typeof installMocks>;

  beforeEach(() => {
    mocks = installMocks();
  });

  afterEach(removeMocks);

  it("stop() cancels the recognizer, cancels speech, and resets phase to idle", () => {
    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript: vi.fn(),
      }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });

    expect(mocks.recognitionInstances[0].stop).toHaveBeenCalledTimes(1);
    expect(mocks.synthCancel).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe("idle");
    expect(result.current.isActive).toBe(false);
  });

  it("does not forward a transcript that arrives after stop()", () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript,
      }),
    );

    act(() => {
      result.current.start();
    });
    const recognizer = mocks.recognitionInstances[0];
    act(() => {
      result.current.stop();
    });
    // Simulate a late-firing onresult from the now-stopped recognizer.
    act(() => {
      recognizer.onresult?.(makeFinalResultEvent("late transcript"));
    });

    expect(onTranscript).not.toHaveBeenCalled();
  });

  it("does not transition phase after stop() even if isThinking/message props change", () => {
    const message = makeMessage("m1", "reply");
    const { result, rerender } = renderHook(
      (props: UseVoiceModeOptions) => useVoiceMode(props),
      {
        initialProps: {
          isThinking: false,
          latestAssistantMessage: undefined,
          onTranscript: vi.fn(),
        } as UseVoiceModeOptions,
      },
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.phase).toBe("idle");

    rerender({ isThinking: true, latestAssistantMessage: undefined, onTranscript: vi.fn() });
    expect(result.current.phase).toBe("idle");

    rerender({ isThinking: false, latestAssistantMessage: message, onTranscript: vi.fn() });
    expect(result.current.phase).toBe("idle");
    expect(mocks.synthSpeak).not.toHaveBeenCalled();
  });

  it("does not construct a second recognizer if start() is called twice in a row", () => {
    const { result } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript: vi.fn(),
      }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.start();
    });

    expect(mocks.recognitionInstances).toHaveLength(1);
  });

  it("tears down recognition/speech on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useVoiceMode({
        isThinking: false,
        latestAssistantMessage: undefined,
        onTranscript: vi.fn(),
      }),
    );

    act(() => {
      result.current.start();
    });
    const recognizer = mocks.recognitionInstances[0];

    unmount();

    expect(recognizer.stop).toHaveBeenCalled();
    expect(mocks.synthCancel).toHaveBeenCalled();
  });
});
