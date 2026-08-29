// useSpeechRecognition — thin wrapper over the browser's Web Speech API
// (`SpeechRecognition` / `webkitSpeechRecognition`) for voice-to-text input.
//
// Feature-detects the API so callers can degrade gracefully in browsers that
// lack it entirely (notably Firefox, per MDN's browser compatibility table:
// https://developer.mozilla.org/docs/Web/API/SpeechRecognition#browser_compatibility).
// A single-responsibility hook — this owns only "listen and produce a final
// transcript"; text-to-speech is the separate `useSpeechSynthesis` hook so
// each stays focused (SRP) and either can be unit-tested independently.
//
// The recognizer instance is created lazily on `start()` (not eagerly on
// mount) so constructing the hook has no side effects, and is torn down on
// `stop()`/unmount so no dangling recognizer keeps the microphone "hot" or
// fires callbacks after the caller has moved on.

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionInstance,
} from "@/types/speech";

export interface UseSpeechRecognitionOptions {
  /** Called with the final transcript once recognition produces one. */
  onResult: (transcript: string) => void;
  /** Called when the recognizer reports an error (e.g. "not-allowed"). */
  onError?: (error: string) => void;
  /** BCP 47 language tag; defaults to "en-US". */
  lang?: string;
}

export interface SpeechRecognitionController {
  /** Whether this browser exposes a SpeechRecognition implementation. */
  isSupported: boolean;
  /** Whether recognition is actively listening right now. */
  isListening: boolean;
  /**
   * The latest partial (not-yet-final) transcript heard while listening.
   * Cleared once listening stops or a final result lands, so callers that
   * only care about the final transcript (via `onResult`) can simply ignore
   * this field — it's additive and doesn't change existing behavior.
   */
  interimTranscript: string;
  /** Begin listening. No-op if unsupported or already listening. */
  start: () => void;
  /** Stop listening (recognition finalizes and fires onResult if it has a transcript). */
  stop: () => void;
}

function getConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions,
): SpeechRecognitionController {
  const { onResult, onError, lang = "en-US" } = options;

  // Latest callbacks/lang, read inside the recognizer's event handlers to
  // avoid stale closures without recreating start/stop on every render.
  const optionsRef = useRef({ onResult, onError, lang });
  useEffect(() => {
    optionsRef.current = { onResult, onError, lang };
  }, [onResult, onError, lang]);

  const [isSupported] = useState(() => getConstructor() !== undefined);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const teardown = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    recognitionRef.current = null;
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (isListening) return;
    const Ctor = getConstructor();
    if (!Ctor) return;

    setInterimTranscript("");

    const recognition = new Ctor();
    recognition.lang = optionsRef.current.lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const results = event.results;
      // Walk every result from `resultIndex` onward (not just the last one)
      // so an interim result reported alongside earlier interim results in
      // the same event list is captured in full — matching how the Web
      // Speech API reports incremental partials.
      let interim = "";
      for (let i = event.resultIndex; i < results.length; i += 1) {
        const result = results[i];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) {
          const finalTranscript = transcript.trim();
          if (finalTranscript) optionsRef.current.onResult(finalTranscript);
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      optionsRef.current.onError?.(event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      teardown();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, teardown]);

  // Stop and tear down any in-flight recognition on unmount.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      teardown();
    };
  }, [teardown]);

  return { isSupported, isListening, interimTranscript, start, stop };
}
