// Accessibility + behavior tests for the ChatPanel side dialog, mirroring the
// TaskPanel.test.tsx pattern: dialog semantics, focus trap, Escape-to-close.
// Also covers the composer (typed send + Enter-to-send), the "Jarvis is
// typing…" indicator, the mic button's disabled/degraded state when the Web
// Speech API is unsupported, and the per-message replay button.
//
// `useSpeechSynthesis`/`useSpeechRecognition` are exercised against real
// jsdom (which lacks the underlying browser APIs), so `isSupported` is false
// by default here — the "supported" mic/voice paths are covered by their own
// hook unit tests (`useSpeechRecognition.test.ts`/`useSpeechSynthesis.test.ts`).

import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChatPanel, type ChatPanelProps } from "./ChatPanel";
import type { ChatMessage } from "@/hooks/useChatAssistant";

function makeMessages(): ChatMessage[] {
  return [
    { id: "m1", role: "user", text: "what are my priorities", timestamp: 1 },
    { id: "m2", role: "assistant", text: "Here's what's top priority…", timestamp: 2 },
  ];
}

function makeProps(overrides: Partial<ChatPanelProps> = {}): ChatPanelProps {
  return {
    messages: [],
    isThinking: false,
    onSendMessage: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

describe("ChatPanel accessibility", () => {
  it("renders a dialog whose accessible name is 'Jarvis Assistant'", () => {
    render(<ChatPanel {...makeProps()} />);

    const dialog = screen.getByRole("dialog", { name: "Jarvis Assistant" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("exposes the close control by its accessible name", () => {
    render(<ChatPanel {...makeProps()} />);

    expect(
      screen.getByRole("button", { name: /close chat panel/i }),
    ).toBeInTheDocument();
  });

  it("moves focus into the dialog on mount", () => {
    render(<ChatPanel {...makeProps()} />);

    const dialog = screen.getByRole("dialog", { name: "Jarvis Assistant" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ChatPanel {...makeProps({ onClose })} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores focus to the opener element when the panel unmounts", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open chat
          </button>
          {open && <ChatPanel {...makeProps({ onClose: () => setOpen(false) })} />}
        </div>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: /open chat/i });
    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: "Jarvis Assistant" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("renders the message list as a polite live region", () => {
    render(<ChatPanel {...makeProps({ messages: makeMessages() })} />);

    const log = screen.getByRole("log", { name: /conversation with jarvis/i });
    expect(log).toHaveAttribute("aria-live", "polite");
  });
});

describe("ChatPanel — message list", () => {
  it("shows an empty-state hint when there are no messages", () => {
    render(<ChatPanel {...makeProps()} />);
    expect(screen.getByText(/ask me about your priorities/i)).toBeInTheDocument();
  });

  it("renders user and assistant messages", () => {
    render(<ChatPanel {...makeProps({ messages: makeMessages() })} />);

    expect(screen.getByText("what are my priorities")).toBeInTheDocument();
    expect(screen.getByText("Here's what's top priority…")).toBeInTheDocument();
  });

  it('shows the "Jarvis is typing…" indicator while isThinking is true', () => {
    render(<ChatPanel {...makeProps({ isThinking: true })} />);
    expect(screen.getByText(/jarvis is typing/i)).toBeInTheDocument();
  });

  it("does not show the typing indicator when isThinking is false", () => {
    render(<ChatPanel {...makeProps({ isThinking: false })} />);
    expect(screen.queryByText(/jarvis is typing/i)).not.toBeInTheDocument();
  });

  it("renders a replay button only for assistant messages", () => {
    render(<ChatPanel {...makeProps({ messages: makeMessages() })} />);

    const replayButtons = screen.getAllByRole("button", {
      name: /replay this message aloud/i,
    });
    expect(replayButtons).toHaveLength(1);
  });
});

describe("ChatPanel — composer", () => {
  it("sends the typed message on clicking Send and clears the input", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<ChatPanel {...makeProps({ onSendMessage })} />);

    const input = screen.getByLabelText(/message jarvis/i);
    await user.type(input, "what's the priority for today");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(onSendMessage).toHaveBeenCalledWith("what's the priority for today");
    expect(input).toHaveValue("");
  });

  it("sends the typed message on pressing Enter", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<ChatPanel {...makeProps({ onSendMessage })} />);

    const input = screen.getByLabelText(/message jarvis/i);
    await user.type(input, "any suggestions{Enter}");

    expect(onSendMessage).toHaveBeenCalledWith("any suggestions");
  });

  it("disables the Send button when the input is empty", () => {
    render(<ChatPanel {...makeProps()} />);
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("never calls onSendMessage for a whitespace-only draft via Enter", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<ChatPanel {...makeProps({ onSendMessage })} />);

    const input = screen.getByLabelText(/message jarvis/i);
    await user.type(input, "   {Enter}");

    expect(onSendMessage).not.toHaveBeenCalled();
  });
});

describe("ChatPanel — voice degradation when unsupported", () => {
  it("disables the mic button and explains why via title/aria-label", () => {
    render(<ChatPanel {...makeProps()} />);

    const micButton = screen.getByRole("button", {
      name: /voice input isn't supported in this browser/i,
    });
    expect(micButton).toBeDisabled();
    expect(micButton).toHaveAttribute(
      "title",
      "Voice input isn't supported in this browser",
    );
  });

  it("does not show the Listening… indicator when unsupported", () => {
    render(<ChatPanel {...makeProps()} />);
    expect(screen.queryByText(/listening…/i)).not.toBeInTheDocument();
  });

  it("disables the Voice Mode entry button and explains why via title/aria-label", () => {
    render(<ChatPanel {...makeProps()} />);

    const voiceModeButton = screen.getByRole("button", {
      name: /voice mode isn't supported in this browser/i,
    });
    expect(voiceModeButton).toBeDisabled();
  });

  it("never renders the Voice Mode overlay when unsupported (clicking is a no-op)", async () => {
    const user = userEvent.setup();
    render(<ChatPanel {...makeProps()} />);

    const voiceModeButton = screen.getByRole("button", {
      name: /voice mode isn't supported in this browser/i,
    });
    await user.click(voiceModeButton);

    expect(
      screen.queryByRole("dialog", { name: "Jarvis Voice Mode" }),
    ).not.toBeInTheDocument();
  });
});
