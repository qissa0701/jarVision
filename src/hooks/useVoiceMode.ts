// useVoiceMode — orchestration hook for the Siri/Gemini-Live-style
// conversational "Voice Mode" overlay.
//
// Composes `useSpeechRecognition` (with interim results enabled) and
// `useSpeechSynthesis` internally so the presentational `VoiceModeOverlay`
// component stays purely declarative over a single `phase` value, mirroring
// this codebase's existing pure/stateful separation (see
// `useOvernightQueue`/`useTaskPanel`).
//
// State machine (four phases): idle → listening → thinking → speaking → back
// to listening, looping until `stop()` is called.
//
//   • start() enters voice mode and immediately begins listening.
//   • A final transcript from recognition is forwarded to `onTranscript`
//     (wired by the caller to `chatAssistant.sendMessage`); phase moves to
//     "thinking" once the caller's `isThinking` prop actually transitions to
//     true — the hook doesn't guess, it reacts to the real signal.
//   • When `isThinking` transitions from true to false *and* a new assistant
//     message has arrived (guarded by message id so a message is never
//     spoken twice — mirroring `ChatPanel.tsx`'s `lastAnnouncedIdRef`), phase
//     moves to "speaking" and the hook calls `speak()` on that message's
//     text. If no new message arrived (defensive fallback), it returns
//     straight to "listening" instead of getting stuck.
//   • When speech ends (`isSpeaking` transitions true → false) and voice mode
//     is still active, phase returns to "listening" and recognition restarts
//     automatically — this is the continuous conversational loop.
//   • stop() tears down everything synchronously (cancels recognition and
//     speech, flips an internal `activeRef` guard) so no further phase
//     transitions can occur after exit, even if an in-flight async callback
//     (e.g. a trailing `onresult`) fires late.
//
// `isSupported` requires *both* recognition and synthesis to be available —
// Voice Mode is an all-or-nothing conversational experience (listening
// without being able to speak back, or vice versa, isn't a coherent "Siri"
// experience) — so callers should disable voice-mode entry entirely with an
// explanatory message when this is false.

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/hooks/useChatAssistant";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

export type VoiceModePhase = "idle" | "listening" | "thinking" | "speaking";

export interface UseVoiceModeOptions {
  /** True while the assistant's reply is pending after a user message. */
  isThinking: boolean;
  /** The most recent assistant message in the conversation, if any. */
  latestAssistantMessage: ChatMessage | undefined;
  /** Called with the final transcript once recognition produces one. */
  onTranscript: (text: string) => void;
  /** BCP 47 language tag; defaults to "en-US". */
  lang?: string;
}

export interface VoiceModeController {
  /** Current point in the listen → thinking → speak → listen loop. */
  phase: VoiceModePhase;
  /** Whether voice mode is currently open (entered via `start()`). */
  isActive: boolean;
  /** Latest partial transcript heard while in the "listening" phase. */
  interimTranscript: string;
  /** True only when both recognition AND synthesis are available. */
  isSupported: boolean;
  /** Enter voice mode and begin listening. No-op if unsupported or already active. */
  start: () => void;
  /** Exit voice mode: cancels any in-flight recognition/speech. */
  stop: () => void;
}

export function useVoiceMode(options: UseVoiceModeOptions): VoiceModeController {
  const { isThinking, latestAssistantMessage, onTranscript, lang } = options;

  // Latest props, read inside effects/callbacks to avoid stale closures
  // without forcing those effects/callbacks to re-run on every render —
  // mirrors `optionsRef` in `useSpeechRecognition.ts` / `contextRef` in
  // `useChatAssistant.ts`.
  const propsRef = useRef({ isThinking, latestAssistantMessage, onTranscript });
  useEffect(() => {
    propsRef.current = { isThinking, latestAssistantMessage, onTranscript };
  }, [isThinking, latestAssistantMessage, onTranscript]);

  const [phase, setPhase] = useState<VoiceModePhase>("idle");
  const [isActive, setIsActive] = useState(false);

  // Synchronous mirror of `isActive` for guards inside callbacks/effects —
  // React state updates aren't immediately visible to code running in the
  // same tick, but this ref is, so `stop()` can reliably prevent any
  // already-in-flight transition from landing after exit.
  const activeRef = useRef(false);

  // Guards against re-speaking the same assistant message twice and against
  // treating a message that existed before voice mode opened as "new".
  const lastSpokenIdRef = useRef<string | null>(null);
  // Previous-value trackers used to detect the *transitions* this state
  // machine reacts to (true→false / false→true), not just current values.
  const prevIsThinkingRef = useRef(isThinking);
  const prevIsSpeakingRef = useRef(false);

  const handleFinalTranscript = useCallback((transcript: string) => {
    if (!activeRef.current) return;
    propsRef.current.onTranscript(transcript);
  }, []);

  const recognition = useSpeechRecognition({ onResult: handleFinalTranscript, lang });
  const synthesis = useSpeechSynthesis();

  const isSupported = recognition.isSupported && synthesis.isSupported;

  // ─── Effect: isThinking false → true while active ⇒ phase "thinking" ──────
  useEffect(() => {
    if (activeRef.current && !prevIsThinkingRef.current && isThinking) {
      setPhase("thinking");
    }
    prevIsThinkingRef.current = isThinking;
  }, [isThinking]);

  // ─── Effect: isThinking true → false while active ⇒ speak the new reply ───
  useEffect(() => {
    if (!activeRef.current) return;
    // The transition check above already advanced `prevIsThinkingRef` to the
    // current `isThinking` value in the same render pass, so re-derive the
    // "was thinking, now isn't" condition from `phase` instead (set to
    // "thinking" by the effect above) to avoid double-tracking the same
    // transition in two refs.
    if (phase !== "thinking" || isThinking) return;

    const message = latestAssistantMessage;
    if (message && message.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = message.id;
      setPhase("speaking");
      synthesis.speak(message.text);
    } else {
      // No new message to speak (defensive fallback) — resume listening
      // rather than getting stuck in "thinking".
      setPhase("listening");
      recognition.start();
    }
    // synthesis/recognition are stable controller objects whose methods are
    // themselves memoized by their owning hooks; omitting them here avoids
    // re-running this effect on every render while still calling the latest
    // implementation via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThinking, phase, latestAssistantMessage]);

  // ─── Effect: isSpeaking true → false while active ⇒ back to listening ─────
  useEffect(() => {
    const wasSpeaking = prevIsSpeakingRef.current;
    prevIsSpeakingRef.current = synthesis.isSpeaking;
    if (!activeRef.current) return;
    if (wasSpeaking && !synthesis.isSpeaking) {
      setPhase("listening");
      recognition.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synthesis.isSpeaking]);

  const start = useCallback(() => {
    if (!isSupported || activeRef.current) return;
    activeRef.current = true;
    setIsActive(true);
    // Baseline the "previous" trackers against the current props so a
    // pre-existing assistant message/thinking state isn't misread as a fresh
    // transition, and so an old message never gets spoken just because voice
    // mode opened.
    lastSpokenIdRef.current = propsRef.current.latestAssistantMessage?.id ?? null;
    prevIsThinkingRef.current = propsRef.current.isThinking;
    prevIsSpeakingRef.current = false;
    setPhase("listening");
    recognition.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setIsActive(false);
    recognition.stop();
    synthesis.cancel();
    setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cancel any in-flight recognition/speech on unmount so neither keeps
  // running after the overlay (or its host panel) has closed.
  useEffect(() => {
    return () => {
      activeRef.current = false;
      recognition.stop();
      synthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    isActive,
    interimTranscript: recognition.interimTranscript,
    isSupported,
    start,
    stop,
  };
}
