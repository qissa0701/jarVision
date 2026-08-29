// ChatPanel — the persistent Jarvis chat & voice assistant side panel.
//
// Follows the same accessible dialog pattern already established by
// TaskPanel.tsx: `role="dialog"`, `aria-modal`, `aria-labelledby` pointing at
// the "Jarvis Assistant" heading, a focus trap via `useFocusTrap`, and
// Escape-to-close with focus restore.
//
// This is where overnight summaries and proactive suggestions now live
// conversationally (the Overnight/Suggestions widgets were removed in an
// earlier phase) — the caller threads the active role's real data and real
// overnight run queue into `useChatAssistant`, and this component is purely
// presentational over that hook's `messages`/`isThinking`/`sendMessage`.
//
// Voice: `useSpeechRecognition`/`useSpeechSynthesis` are instantiated locally
// since they're a UI-only concern (mic button, "Listening…" indicator,
// speaking a reply aloud) that no other part of the app needs. A
// voice-transcribed message automatically speaks the assistant's reply aloud;
// a typed message does not auto-speak, but every assistant bubble has an
// on-demand "replay" button.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  CornerDownLeft,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ChatMessage } from "@/hooks/useChatAssistant";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoiceMode } from "@/hooks/useVoiceMode";
import { VoiceModeOverlay } from "@/components/panels/VoiceModeOverlay";

const CHAT_PANEL_TITLE_ID = "chat-panel-title";

export interface ChatPanelProps {
  /** Ordered conversation history, oldest first. */
  messages: ChatMessage[];
  /** True while the assistant's reply is pending. */
  isThinking: boolean;
  /** Append a user message and (after a delay) the assistant's reply. */
  onSendMessage: (text: string) => void;
  /** Dismiss the panel (also invoked on Escape). */
  onClose: () => void;
}

/** A single message bubble, right-aligned for the user, left for the assistant. */
function MessageBubble({
  message,
  onReplay,
}: {
  message: ChatMessage;
  onReplay: (text: string) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] flex items-end gap-1.5 ${isUser ? "flex-row-reverse" : ""}`}
      >
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-indigo-600 dark:bg-indigo-500 text-white rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          }`}
        >
          {message.text}
        </div>
        {!isUser && (
          <button
            type="button"
            onClick={() => onReplay(message.text)}
            aria-label="Replay this message aloud"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ChatPanel({
  messages,
  isThinking,
  onSendMessage,
  onClose,
}: ChatPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: true, containerRef, onEscape: onClose });

  const [draft, setDraft] = useState("");

  // Tracks whether the *next* assistant reply should be spoken aloud
  // automatically (true only when the triggering user message came from
  // voice input, per spec — typed messages never auto-speak).
  const pendingVoiceReplyRef = useRef(false);
  const lastAnnouncedIdRef = useRef<string | null>(null);

  const synthesis = useSpeechSynthesis();
  const { speak } = synthesis;

  const sendText = useCallback(
    (text: string, fromVoice: boolean) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (fromVoice) pendingVoiceReplyRef.current = true;
      onSendMessage(trimmed);
    },
    [onSendMessage],
  );

  const recognition = useSpeechRecognition({
    onResult: (transcript) => sendText(transcript, true),
  });

  // Speak the newest assistant reply aloud, but only when it was triggered by
  // a voice message — guarded by message id so it fires exactly once per
  // reply, never re-speaking on unrelated re-renders.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.id === lastAnnouncedIdRef.current) return;
    lastAnnouncedIdRef.current = last.id;
    if (last.role === "assistant" && pendingVoiceReplyRef.current) {
      pendingVoiceReplyRef.current = false;
      speak(last.text);
    }
  }, [messages, speak]);

  // ─── Voice Mode — Siri/Gemini-Live-style conversational overlay ───────────
  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant"),
    [messages],
  );
  const voiceMode = useVoiceMode({
    isThinking,
    latestAssistantMessage,
    onTranscript: (text) => sendText(text, false),
  });

  // Auto-scroll the message list to the latest message/typing indicator.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isThinking]);

  const handleSubmit = () => {
    sendText(draft, false);
    setDraft("");
  };

  const handleMicToggle = () => {
    if (recognition.isListening) recognition.stop();
    else recognition.start();
  };

  const micTitle = recognition.isSupported
    ? recognition.isListening
      ? "Stop listening"
      : "Start voice input"
    : "Voice input isn't supported in this browser";

  const voiceModeTitle = voiceMode.isSupported
    ? "Start Voice Mode — talk with Jarvis hands-free"
    : "Voice Mode isn't supported in this browser";

  return (
    <motion.div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={CHAT_PANEL_TITLE_ID}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="absolute inset-y-0 right-0 w-[400px] bg-card text-card-foreground border-l border-border shadow-2xl flex flex-col z-30"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h3
            id={CHAT_PANEL_TITLE_ID}
            className="text-sm font-semibold text-foreground leading-snug"
          >
            Jarvis Assistant
          </h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={voiceMode.start}
            disabled={!voiceMode.isSupported || recognition.isListening}
            title={voiceModeTitle}
            aria-label={voiceModeTitle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <AudioLines className="w-3.5 h-3.5" />
            Voice Mode
          </button>
          <button
            onClick={onClose}
            aria-label="Close chat panel"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message list — role="log" + aria-live so replies are announced as they arrive. */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation with Jarvis"
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
      >
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Ask me about your priorities, tasks, meetings, overnight runs, or
            suggestions — or tap the mic and just talk.
          </p>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onReplay={speak} />
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-muted text-muted-foreground text-xs italic flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-pulse" />
              Jarvis is typing…
            </div>
          </div>
        )}
      </div>

      {/* Listening indicator */}
      {recognition.isListening && (
        <div className="px-4 pb-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Listening…
          </span>
        </div>
      )}

      {/* Composer */}
      <div className="px-4 py-3 border-t border-border flex items-end gap-2">
        <button
          type="button"
          onClick={handleMicToggle}
          disabled={!recognition.isSupported || voiceMode.isActive}
          title={micTitle}
          aria-label={micTitle}
          aria-pressed={recognition.isListening}
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${
            recognition.isListening
              ? "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500"
              : "text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-400/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {recognition.isSupported ? (
            <Mic className="w-4 h-4" />
          ) : (
            <MicOff className="w-4 h-4" />
          )}
        </button>
        <label htmlFor="chat-panel-input" className="sr-only">
          Message Jarvis
        </label>
        <input
          id="chat-panel-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Message Jarvis…"
          className="flex-1 px-3.5 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400/40 focus:border-indigo-300 dark:focus:border-indigo-400/50 placeholder:text-muted-foreground transition"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!draft.trim()}
          aria-label="Send message"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="px-4 pb-3 text-[10px] text-muted-foreground flex items-center gap-1">
        <CornerDownLeft className="w-2.5 h-2.5" />
        Press Enter to send
      </p>

      {/* Voice Mode overlay — full-bleed on top of the panel while active. */}
      <AnimatePresence>
        {voiceMode.isActive && (
          <VoiceModeOverlay
            phase={voiceMode.phase}
            interimTranscript={voiceMode.interimTranscript}
            messages={messages}
            onClose={voiceMode.stop}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
