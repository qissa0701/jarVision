// New Simulation — Chatbot input (FR-3).
//
// The user pastes an article, link, or short description of an emerging tech.
// Seeded input is recognised and launches the matching pre-scripted journey
// (FR-3.2); un-seeded input falls back gracefully and offers the nearest seeded
// example (FR-3.4). Conversation is scripted — there is no live LLM.

import { useState } from "react";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { VISION_JOURNEYS, matchJourney } from "@/data/visionJourneys";
import { VisionButton } from "./visionUi";

interface ChatMessage {
  id: number;
  from: "user" | "vision";
  text: string;
}

export interface VisionChatbotProps {
  /** Launch the matched journey (opens its workspace). */
  onLaunchJourney: (journeyId: string) => void;
  onBack: () => void;
}

let msgId = 0;

export function VisionChatbot({ onLaunchJourney, onBack }: VisionChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: msgId++,
      from: "vision",
      text: "Paste an article, link, or a short description of an emerging technology and I'll simulate its adoption. I currently have scripted journeys for Agentic AI, Physical AI, and Wicked Intelligence.",
    },
  ]);
  const [input, setInput] = useState("");

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: msgId++, from: "user", text }]);
    setInput("");

    const match = matchJourney(text);
    if (match) {
      setMessages((m) => [
        ...m,
        {
          id: msgId++,
          from: "vision",
          text: `Recognised "${match.techName}". Launching its pre-scripted adoption journey — you'll walk from adoption path through the human-gated G0 → G3 lifecycle.`,
        },
      ]);
      // Small delay so the message renders before the view switches.
      window.setTimeout(() => onLaunchJourney(match.id), 400);
    } else {
      setMessages((m) => [
        ...m,
        {
          id: msgId++,
          from: "vision",
          text: "I don't have a scripted journey for that yet (this is a prototype with a fixed seed library). Try one of the seeded technologies below — they're the closest examples I can simulate end-to-end.",
        },
      ]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        VISION home
      </button>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
          <span className="text-sm font-semibold text-foreground">New simulation</span>
        </div>

        <div className="p-4 space-y-3 max-h-[46vh] overflow-y-auto scrollbar-hide">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.from === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Seeded suggestions (also the FR-3.4 fallback). */}
          <div className="flex flex-wrap gap-2 pt-1">
            {VISION_JOURNEYS.map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => onLaunchJourney(j.id)}
                className="text-[11px] px-2.5 py-1 rounded-full font-semibold border border-indigo-100 dark:border-indigo-400/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
              >
                {j.techName}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-border flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Paste an article / link / description…"
            className="flex-1 px-3 py-2 rounded-xl border border-border text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-400/30 resize-none"
          />
          <VisionButton onClick={submit} disabled={!input.trim()}>
            <Send className="w-3.5 h-3.5" />
            Send
          </VisionButton>
        </div>
      </div>
    </div>
  );
}
