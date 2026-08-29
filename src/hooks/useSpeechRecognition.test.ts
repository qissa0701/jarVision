// Unit tests for useSpeechRecognition.
//
// jsdom does not implement `SpeechRecognition`/`webkitSpeechRecognition`, so
// each test installs a mock constructor on `window` for the duration of the
// test and removes it afterward, verifying:
//   • `isSupported` reflects presence/absence of a constructor.
//   • `start()`/`stop()` call through to the mocked recognizer instance.
//   • `onResult`/`onError` fire from the recognizer's `onresult`/`onerror`
//     handlers, and `isListening` tracks `onstart`/`onend`.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeechRecognition } from "./useSpeechRecognition";

/** A minimal mock SpeechRecognition instance the test can drive manually. */
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

function makeResultEvent(transcript: string) {
  const item = { transcript, confidence: 0.9 };
  const result = { length: 1, isFinal: true, item: () => item, 0: item };
  return { resultIndex: 0, results: { length: 1, item: () => result, 0: result } };
}

/** Builds a result event containing a single, not-yet-final interim result. */
function makeInterimResultEvent(transcript: string) {
  const item = { transcript, confidence: 0.5 };
  const result = { length: 1, isFinal: false, item: () => item, 0: item };
  return { resultIndex: 0, results: { length: 1, item: () => result, 0: result } };
}

describe("useSpeechRecognition — feature detection", () => {
  afterEach(() => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  });

  it("reports isSupported: false when neither constructor is present", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn() }),
    );
    expect(result.current.isSupported).toBe(false);
  });

  it("reports isSupported: true when window.SpeechRecognition is present", () => {
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition =
      MockSpeechRecognition;
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn() }),
    );
    expect(result.current.isSupported).toBe(true);
  });

  it("reports isSupported: true when only window.webkitSpeechRecognition is present", () => {
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition =
      MockSpeechRecognition;
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn() }),
    );
    expect(result.current.isSupported).toBe(true);
  });

  it("start() is a no-op when unsupported", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn() }),
    );
    act(() => {
      result.current.start();
    });
    expect(result.current.isListening).toBe(false);
  });
});

describe("useSpeechRecognition — supported behavior", () => {
  let instances: MockSpeechRecognition[] = [];

  beforeEach(() => {
    instances = [];
    class TrackedMock extends MockSpeechRecognition {
      constructor() {
        super();
        instances.push(this);
      }
    }
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = TrackedMock;
  });

  afterEach(() => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  });

  it("start() constructs a recognizer, calls its start(), and sets isListening", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });

    expect(instances).toHaveLength(1);
    expect(instances[0].start).toHaveBeenCalledTimes(1);
    expect(result.current.isListening).toBe(true);
  });

  it("stop() calls through to the recognizer's stop() and clears isListening", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });

    expect(instances[0].stop).toHaveBeenCalledTimes(1);
    expect(result.current.isListening).toBe(false);
  });

  it("invokes onResult with the final transcript when the recognizer fires onresult", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult }));

    act(() => {
      result.current.start();
    });
    act(() => {
      instances[0].onresult?.(makeResultEvent("what's the priority for today"));
    });

    expect(onResult).toHaveBeenCalledWith("what's the priority for today");
  });

  it("invokes onError when the recognizer fires onerror", () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), onError }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      instances[0].onerror?.({ error: "not-allowed" });
    });

    expect(onError).toHaveBeenCalledWith("not-allowed");
  });

  it("does not start a second recognizer while already listening", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.start();
    });

    expect(instances).toHaveLength(1);
  });

  it("sets the configured lang on the recognizer", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn(), lang: "fr-FR" }),
    );

    act(() => {
      result.current.start();
    });

    expect(instances[0].lang).toBe("fr-FR");
  });

  it("sets interimResults: true on the recognizer", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });

    expect(instances[0].interimResults).toBe(true);
  });

  it("surfaces a partial transcript via interimTranscript without calling onResult", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult }));

    act(() => {
      result.current.start();
    });
    act(() => {
      instances[0].onresult?.(makeInterimResultEvent("what's the pri"));
    });

    expect(result.current.interimTranscript).toBe("what's the pri");
    expect(onResult).not.toHaveBeenCalled();
  });

  it("clears interimTranscript once a final result lands", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onResult }));

    act(() => {
      result.current.start();
    });
    act(() => {
      instances[0].onresult?.(makeInterimResultEvent("what's the pri"));
    });
    expect(result.current.interimTranscript).toBe("what's the pri");

    act(() => {
      instances[0].onresult?.(makeResultEvent("what's the priority for today"));
    });

    expect(onResult).toHaveBeenCalledWith("what's the priority for today");
    expect(result.current.interimTranscript).toBe("");
  });

  it("clears interimTranscript once listening stops", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onResult: vi.fn() }),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      instances[0].onresult?.(makeInterimResultEvent("hel"));
    });
    expect(result.current.interimTranscript).toBe("hel");

    act(() => {
      result.current.stop();
    });

    expect(result.current.interimTranscript).toBe("");
  });
});
