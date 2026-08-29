// useChatAssistant — chat state hook for the Jarvis chat assistant.
//
// Owns an ordered, ephemeral (session-only, no localStorage persistence —
// intentionally simple per spec) message list. `sendMessage` appends the
// user's message immediately, then — after a short simulated "thinking"
// delay (timing feel mirrors `RUNNING_ENTER_MS` in `useOvernightQueue.ts`) —
// appends the assistant's reply computed via `buildAssistantReply`. While the
// reply is pending, `isThinking` is true so the panel can show a
// "Jarvis is typing…" indicator.
//
// All timers are tracked and cancelled on `reset()`/unmount so a role switch
// (which calls `reset()`) never lets a stale reply land against the new
// role's conversation, mirroring the timer-cleanliness pattern in
// `useTaskPanel.ts`/`useOvernightQueue.ts`.

import { useCallback, useEffect, useRef, useState } from "react";
import type { OvernightRun, RoleData } from "@/types";
import { buildAssistantReply } from "@/lib/assistant";
import { THINKING_DELAY_MAX_MS, THINKING_DELAY_MIN_MS } from "@/constants/chat";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
}

export interface ChatAssistantController {
  /** Ordered conversation history, oldest first. */
  messages: ChatMessage[];
  /** True while the assistant's reply is pending after a user message. */
  isThinking: boolean;
  /** Append a user message, then (after a short delay) the assistant's reply. */
  sendMessage: (text: string) => void;
  /** Clear the conversation entirely. Call on active-role change. */
  reset: () => void;
}

/** Random delay in the configured thinking-delay range, inclusive. */
function pickThinkingDelay(): number {
  const span = THINKING_DELAY_MAX_MS - THINKING_DELAY_MIN_MS;
  return THINKING_DELAY_MIN_MS + Math.round(Math.random() * span);
}

/**
 * React hook exposing the {@link ChatAssistantController} contract.
 *
 * @param data - the active role's real data, used as reply-engine context.
 * @param overnightRuns - the active role's real overnight run queue, used as
 *   reply-engine context.
 */
export function useChatAssistant(
  data: RoleData,
  overnightRuns: OvernightRun[],
): ChatAssistantController {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  // Latest context, read synchronously inside the timer callback to avoid a
  // stale closure without re-creating `sendMessage` on every data change.
  const contextRef = useRef({ data, overnightRuns });
  useEffect(() => {
    contextRef.current = { data, overnightRuns };
  }, [data, overnightRuns]);

  // Monotonically increasing counter so message ids are unique within a
  // session without depending on `crypto.randomUUID` (not guaranteed in every
  // test/runtime environment).
  const idCounterRef = useRef(0);
  const nextId = useCallback(() => {
    idCounterRef.current += 1;
    return `msg-${idCounterRef.current}`;
  }, []);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPendingReply = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cancel any in-flight reply timer on unmount so it never fires against an
  // unmounted component.
  useEffect(() => clearPendingReply, [clearPendingReply]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: nextId(),
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      clearPendingReply();
      setIsThinking(true);

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const reply = buildAssistantReply(trimmed, contextRef.current);
        const assistantMessage: ChatMessage = {
          id: nextId(),
          role: "assistant",
          text: reply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsThinking(false);
      }, pickThinkingDelay());
    },
    [nextId, clearPendingReply],
  );

  const reset = useCallback(() => {
    clearPendingReply();
    setIsThinking(false);
    setMessages([]);
  }, [clearPendingReply]);

  return { messages, isThinking, sendMessage, reset };
}
