// useSpeechSynthesis — thin wrapper over the browser's Web Speech API
// `window.speechSynthesis` for text-to-speech output.
//
// Feature-detects `window.speechSynthesis` so callers degrade gracefully when
// it's unavailable. Single-responsibility companion to
// `useSpeechRecognition` — this hook only speaks text and reports whether
// speech is in progress; it knows nothing about recognition.

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechSynthesisController {
  /** Whether this browser exposes `window.speechSynthesis`. */
  isSupported: boolean;
  /** Whether an utterance is currently being spoken. */
  isSpeaking: boolean;
  /** Speak the given text aloud. No-op if unsupported. */
  speak: (text: string) => void;
  /** Cancel any in-progress or queued speech. */
  cancel: () => void;
}

function getSynth(): SpeechSynthesis | undefined {
  if (typeof window === "undefined") return undefined;
  return window.speechSynthesis;
}

export function useSpeechSynthesis(): SpeechSynthesisController {
  const [isSupported] = useState(() => getSynth() !== undefined);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cancel = useCallback(() => {
    getSynth()?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      const synth = getSynth();
      const trimmed = text.trim();
      if (!synth || !trimmed) return;

      // Only one utterance should be "active" from this hook's perspective;
      // cancel anything already queued/speaking before starting the new one.
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      synth.speak(utterance);
    },
    [],
  );

  // Cancel any in-progress speech on unmount so it never keeps talking after
  // the component (e.g. the chat panel) has closed.
  useEffect(() => {
    return () => {
      getSynth()?.cancel();
    };
  }, []);

  return { isSupported, isSpeaking, speak, cancel };
}
