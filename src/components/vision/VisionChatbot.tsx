// New Simulation — Chatbot input (FR-3).
//
// The user pastes an article, links, or a short description of an emerging tech,
// and/or attaches PDF files (mock-uploaded — we just extract a title from the
// filename). Multiple links and multiple PDFs are supported. On send we scan
// everything for the three seed tech names ("Agentic AI", "Physical AI",
// "Wicked Intelligence"), case-insensitively; the first name that appears
// decides which pre-seeded article/journey we launch (see matchJourneyByPrompt).
//
// Before opening the journey we play a scripted "chain of thought" loading
// sequence that types out its reasoning step by step. There is no live LLM.

import { useRef, useState } from "react";
import { ArrowLeft, FileText, Link2, Paperclip, Send, Sparkles, X } from "lucide-react";
import type { Journey } from "@/types/vision";
import { matchJourneyByPrompt } from "@/data/visionJourneys";
import { VisionButton } from "./visionUi";
import { ChainOfThought, type ThoughtStep } from "./ChainOfThought";

interface ChatMessage {
  id: number;
  from: "user" | "vision";
  text: string;
}

interface PdfAttachment {
  id: number;
  fileName: string;
  /** Title "extracted" from the PDF (mock — derived from the filename). */
  title: string;
}

export interface VisionChatbotProps {
  /** Launch the matched journey (opens its workspace). */
  onLaunchJourney: (journeyId: string) => void;
  onBack: () => void;
}

let msgId = 0;
let attId = 0;

const URL_RE = /\bhttps?:\/\/[^\s]+/gi;

/** Mock "title extraction" from a PDF filename: strip extension, prettify. */
function extractPdfTitle(fileName: string): string {
  const base = fileName
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!base) return "Untitled document";
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Pull distinct URLs out of free text. */
function extractLinks(text: string): string[] {
  const found = text.match(URL_RE) ?? [];
  return Array.from(new Set(found.map((u) => u.replace(/[.,);]+$/, ""))));
}

/** Build the scripted reasoning steps, tailored to the matched journey. */
function buildThoughtSteps(journey: Journey, sourceCount: number): ThoughtStep[] {
  const rec =
    journey.useCases.find((u) => u.id === journey.recommendedUseCaseId) ?? journey.useCases[0];
  const opps = rec.opportunities.slice(0, 2).join("; ");
  const risks = rec.risks.slice(0, 2).join("; ");
  return [
    {
      label: "Collecting sources",
      detail: `Ingesting ${sourceCount} source${sourceCount === 1 ? "" : "s"} and extracting the core topic…`,
    },
    {
      label: "Recognising the technology",
      detail: `Matched "${journey.techName}" against the seed library — ${journey.tagline}`,
    },
    {
      label: "Investigating possibilities",
      detail: `Scanning ${journey.useCases.length} candidate use cases across ${journey.targetFunctions.length} business functions…`,
    },
    {
      label: "Identifying opportunities",
      detail: `Strongest upside: ${opps}.`,
    },
    {
      label: "Identifying risks",
      detail: `Key risks to watch: ${risks}.`,
    },
    {
      label: "Mapping multi-layer impact",
      detail: "Projecting enterprise, domain, and individual impact of adoption…",
    },
    {
      label: "Assessing human readiness",
      detail: "Mapping required skills, certifications, and potential change drivers…",
    },
    {
      label: "Assembling the simulation",
      detail: "Compiling the adoption journey and the human-gated G0 → G3 lifecycle.",
    },
  ];
}

export function VisionChatbot({ onLaunchJourney, onBack }: VisionChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: msgId++,
      from: "vision",
      text: "Paste an article, links, or a short description of an emerging technology — or attach PDF files — and I'll simulate its adoption. I currently have scripted journeys for Agentic AI, Physical AI, and Wicked Intelligence.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pdfs, setPdfs] = useState<PdfAttachment[]>([]);
  const [loading, setLoading] = useState<{ steps: ThoughtStep[]; journeyId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectedLinks = extractLinks(input);
  const canSend = !loading && (input.trim().length > 0 || pdfs.length > 0);

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const next: PdfAttachment[] = [];
    for (const file of Array.from(fileList)) {
      if (!/\.pdf$/i.test(file.name)) continue; // mock: only PDFs
      next.push({ id: attId++, fileName: file.name, title: extractPdfTitle(file.name) });
    }
    if (next.length > 0) setPdfs((p) => [...p, ...next]);
    // Reset so the same file can be re-picked.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePdf = (id: number) => setPdfs((p) => p.filter((f) => f.id !== id));

  const submit = () => {
    if (!canSend) return;
    const text = input.trim();
    const links = extractLinks(text);

    // Compose a readable summary of what the user submitted.
    const parts: string[] = [];
    if (text) parts.push(text);
    if (pdfs.length > 0) {
      parts.push(
        `Attached ${pdfs.length} PDF${pdfs.length === 1 ? "" : "s"}: ` +
          pdfs.map((p) => `"${p.title}"`).join(", "),
      );
    }
    const userText = parts.join("\n");
    setMessages((m) => [...m, { id: msgId++, from: "user", text: userText }]);

    // Everything the matcher should consider: description + link text + PDF titles.
    const matchText = [text, links.join(" "), pdfs.map((p) => p.title).join(" ")].join(" ");
    const sourceCount = (text ? 1 : 0) + links.length + pdfs.length || 1;

    setInput("");
    setPdfs([]);

    const match = matchJourneyByPrompt(matchText);
    if (match) {
      setMessages((m) => [
        ...m,
        {
          id: msgId++,
          from: "vision",
          text: `Recognised "${match.techName}". Let me work through it…`,
        },
      ]);
      setLoading({ steps: buildThoughtSteps(match, sourceCount), journeyId: match.id });
    } else {
      setMessages((m) => [
        ...m,
        {
          id: msgId++,
          from: "vision",
          text: "I couldn't find one of my seeded technologies in that. This prototype recognises Agentic AI, Physical AI, and Wicked Intelligence — mention one of those (in the text, a link, or a PDF title) and I'll simulate it end-to-end.",
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
        JARVISION home
      </button>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-300" />
          <span className="text-sm font-semibold text-foreground">New simulation</span>
        </div>

        <div className="p-4 space-y-3 max-h-[46vh] overflow-y-auto scrollbar-hide">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                  m.from === "user" ? "bg-blue-600 text-white" : "bg-muted text-foreground"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <ChainOfThought
              steps={loading.steps}
              onComplete={() => {
                const id = loading.journeyId;
                setLoading(null);
                onLaunchJourney(id);
              }}
            />
          )}
        </div>

        {!loading && (
          <div className="border-t border-border p-3 space-y-2.5">
            {/* Attachment / link chips */}
            {(pdfs.length > 0 || detectedLinks.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {pdfs.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-400/20"
                    title={p.fileName}
                  >
                    <FileText className="w-3 h-3" />
                    <span className="max-w-[180px] truncate">{p.title}</span>
                    <button
                      type="button"
                      onClick={() => removePdf(p.id)}
                      aria-label={`Remove ${p.title}`}
                      className="hover:text-blue-900 dark:hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {detectedLinks.map((url) => (
                  <span
                    key={url}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg bg-muted text-muted-foreground border border-border"
                    title={url}
                  >
                    <Link2 className="w-3 h-3" />
                    <span className="max-w-[200px] truncate">{url}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={(e) => onPickFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach PDF files"
                title="Attach PDF files"
                className="flex-shrink-0 w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-blue-600 dark:hover:text-blue-300 hover:bg-muted transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
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
                placeholder="Paste an article, one or more links, or a description… (attach PDFs with the clip)"
                className="flex-1 px-3 py-2 rounded-xl border border-border text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30 resize-none"
              />
              <VisionButton onClick={submit} disabled={!canSend}>
                <Send className="w-3.5 h-3.5" />
                Send
              </VisionButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
