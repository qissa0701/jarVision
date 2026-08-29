// VoiceModeOverlay — a Siri/Gemini-Live-style conversational overlay.
//
// Rendered as a full-bleed layer on top of the existing ChatPanel (mirrors
// TaskPanel/ChatPanel's own dialog pattern: `role="dialog"`, `aria-modal`,
// `aria-labelledby`, a focus trap via `useFocusTrap`, Escape-to-close with
// focus restore). This is a purely presentational component — all state
// machine logic (phase transitions, recognition/synthesis orchestration)
// lives in `useVoiceMode`; this component just renders whatever `phase`,
// `interimTranscript` etc. it's given.
//
// Visual language matches the rest of the app: a large pulsing orb/ring
// communicates the current phase (an amplified take on the pulsing dot
// already used for ChatPanel's "Listening…" indicator and TaskPanel's
// "JARVIS EXECUTING" badge), Tailwind theme tokens
// (bg-card/border-border/text-muted-foreground/bg-muted), rounded-2xl, and
// indigo as the primary accent. `motion/react` drives the pulse/scale
// animation, consistent with TaskPanel's shimmering active-step treatment.

import { useRef } from "react";
import { Mic, PhoneOff, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ChatMessage } from "@/hooks/useChatAssistant";
import type { VoiceModePhase } from "@/hooks/useVoiceMode";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const VOICE_OVERLAY_TITLE_ID = "voice-mode-overlay-title";

export interface VoiceModeOverlayProps {
  /** Current point in the listen → thinking → speak → listen loop. */
  phase: VoiceModePhase;
  /** Latest partial transcript heard while in the "listening" phase. */
  interimTranscript: string;
  /** Ordered conversation history, oldest first, shown behind the orb. */
  messages: ChatMessage[];
  /** Exit voice mode (also invoked on Escape / the close button). */
  onClose: () => void;
}

/** Phase-specific copy + tone, kept in one place so the orb/label always agree. */
const PHASE_COPY: Record<VoiceModePhase, { label: string; tone: string }> = {
  idle: { label: "Tap to talk", tone: "text-muted-foreground" },
  listening: { label: "Listening…", tone: "text-indigo-600 dark:text-indigo-300" },
  thinking: { label: "Thinking…", tone: "text-indigo-600 dark:text-indigo-300" },
  speaking: { label: "Speaking…", tone: "text-indigo-600 dark:text-indigo-300" },
};

/** The big pulsing orb/ring whose animation communicates the current phase. */
function VoiceOrb({ phase }: { phase: VoiceModePhase }) {
  if (phase === "thinking") {
    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          style={{ borderTopColor: "transparent", borderLeftColor: "transparent" }}
        />
      </div>
    );
  }

  if (phase === "speaking") {
    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600 flex items-center justify-center z-10">
          <div className="flex items-end gap-0.5 h-6">
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full bg-white"
                animate={{ height: ["30%", "100%", "30%"] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.12,
                }}
              />
            ))}
          </div>
        </div>
        <motion.div
          className="absolute inset-0 rounded-full bg-indigo-400/30"
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }

  if (phase === "listening") {
    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600 flex items-center justify-center z-10">
          <Mic className="w-7 h-7 text-white" />
        </div>
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-indigo-400"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 0.9,
            }}
          />
        ))}
      </div>
    );
  }

  // idle
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Mic className="w-7 h-7 text-muted-foreground" />
      </div>
    </div>
  );
}

export function VoiceModeOverlay({
  phase,
  interimTranscript,
  messages,
  onClose,
}: VoiceModeOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: true, containerRef, onEscape: onClose });

  const copy = PHASE_COPY[phase];
  const latestAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <motion.div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={VOICE_OVERLAY_TITLE_ID}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-40 bg-card text-card-foreground flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h3
            id={VOICE_OVERLAY_TITLE_ID}
            className="text-sm font-semibold text-foreground leading-snug"
          >
            Jarvis Voice Mode
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="End voice mode"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 dark:bg-red-500/80 dark:hover:bg-red-500 transition-colors flex-shrink-0"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          End voice mode
        </button>
      </div>

      {/* Conversation transcript — the "journey" history behind the orb. */}
      <div
        role="log"
        aria-label="Voice conversation with Jarvis"
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
      >
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            {"Say something — I'm listening."}
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-indigo-600 dark:bg-indigo-500 text-white rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {/* State indicator: orb + phase-specific live text, announced via aria-live. */}
      <div className="flex flex-col items-center gap-4 px-5 pb-8 pt-2 flex-shrink-0">
        <VoiceOrb phase={phase} />
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-1.5 min-h-[2.5rem] text-center"
        >
          <span className={`text-sm font-bold tracking-wide ${copy.tone}`}>{copy.label}</span>
          <AnimatePresence mode="wait">
            {phase === "listening" && interimTranscript && (
              <motion.p
                key="interim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground italic max-w-xs"
              >
                Hearing: {interimTranscript}
              </motion.p>
            )}
            {phase === "speaking" && latestAssistantMessage && (
              <motion.p
                key="speaking-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground max-w-xs"
              >
                {latestAssistantMessage.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
