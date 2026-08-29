// Accessibility + behavior tests for VoiceModeOverlay, mirroring the
// TaskPanel.test.tsx / ChatPanel.test.tsx pattern: dialog semantics, focus
// trap, Escape-to-close, an accessibly named close control, and a
// `role="status"`/`aria-live="polite"` region reflecting the current phase
// and interim transcript. Also covers rendering the conversation transcript
// and phase-specific copy for each of the four phases.

import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VoiceModeOverlay, type VoiceModeOverlayProps } from "./VoiceModeOverlay";
import type { ChatMessage } from "@/hooks/useChatAssistant";

function makeMessages(): ChatMessage[] {
  return [
    { id: "m1", role: "user", text: "what are my priorities", timestamp: 1 },
    { id: "m2", role: "assistant", text: "Here's what's top priority…", timestamp: 2 },
  ];
}

function makeProps(overrides: Partial<VoiceModeOverlayProps> = {}): VoiceModeOverlayProps {
  return {
    phase: "idle",
    interimTranscript: "",
    messages: [],
    onClose: vi.fn(),
    ...overrides,
  };
}

describe("VoiceModeOverlay accessibility", () => {
  it("renders a dialog whose accessible name is 'Jarvis Voice Mode'", () => {
    render(<VoiceModeOverlay {...makeProps()} />);

    const dialog = screen.getByRole("dialog", { name: "Jarvis Voice Mode" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("exposes the close control by its accessible name", () => {
    render(<VoiceModeOverlay {...makeProps()} />);

    expect(
      screen.getByRole("button", { name: /end voice mode/i }),
    ).toBeInTheDocument();
  });

  it("moves focus into the dialog on mount", () => {
    render(<VoiceModeOverlay {...makeProps()} />);

    const dialog = screen.getByRole("dialog", { name: "Jarvis Voice Mode" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<VoiceModeOverlay {...makeProps({ onClose })} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the 'End voice mode' button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<VoiceModeOverlay {...makeProps({ onClose })} />);

    await user.click(screen.getByRole("button", { name: /end voice mode/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores focus to the opener element when the overlay unmounts", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open voice mode
          </button>
          {open && (
            <VoiceModeOverlay {...makeProps({ onClose: () => setOpen(false) })} />
          )}
        </div>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: /open voice mode/i });
    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: "Jarvis Voice Mode" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("renders a polite live status region reflecting the current phase", () => {
    render(<VoiceModeOverlay {...makeProps({ phase: "listening" })} />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/listening/i);
  });
});

describe("VoiceModeOverlay — phase-specific visuals", () => {
  it('shows "Tap to talk" in the idle phase', () => {
    render(<VoiceModeOverlay {...makeProps({ phase: "idle" })} />);
    expect(screen.getByText(/tap to talk/i)).toBeInTheDocument();
  });

  it('shows "Listening…" and the interim transcript in the listening phase', () => {
    render(
      <VoiceModeOverlay
        {...makeProps({ phase: "listening", interimTranscript: "what's the pri" })}
      />,
    );
    expect(screen.getByText(/listening…/i)).toBeInTheDocument();
    expect(screen.getByText(/hearing: what's the pri/i)).toBeInTheDocument();
  });

  it("does not show a 'Hearing:' line when there is no interim transcript yet", () => {
    render(<VoiceModeOverlay {...makeProps({ phase: "listening", interimTranscript: "" })} />);
    expect(screen.queryByText(/hearing:/i)).not.toBeInTheDocument();
  });

  it('shows "Thinking…" in the thinking phase', () => {
    render(<VoiceModeOverlay {...makeProps({ phase: "thinking" })} />);
    expect(screen.getByText(/thinking…/i)).toBeInTheDocument();
  });

  it('shows "Speaking…" and the assistant\'s reply text in the speaking phase', () => {
    render(
      <VoiceModeOverlay
        {...makeProps({ phase: "speaking", messages: makeMessages() })}
      />,
    );
    expect(screen.getByText(/speaking…/i)).toBeInTheDocument();
    // The reply text appears twice: once in the transcript log, once in the
    // "speaking" live caption below the orb — getAllByText covers both.
    expect(screen.getAllByText(/here's what's top priority/i).length).toBeGreaterThan(0);
  });
});

describe("VoiceModeOverlay — conversation transcript", () => {
  it("shows an empty-state hint when there are no messages", () => {
    render(<VoiceModeOverlay {...makeProps()} />);
    expect(screen.getByText(/say something/i)).toBeInTheDocument();
  });

  it("renders the full message history behind the orb", () => {
    render(<VoiceModeOverlay {...makeProps({ messages: makeMessages() })} />);

    expect(screen.getByText("what are my priorities")).toBeInTheDocument();
    expect(screen.getAllByText(/here's what's top priority/i).length).toBeGreaterThan(0);
  });

  it("renders the transcript as a labeled log region", () => {
    render(<VoiceModeOverlay {...makeProps({ messages: makeMessages() })} />);
    expect(
      screen.getByRole("log", { name: /voice conversation with jarvis/i }),
    ).toBeInTheDocument();
  });
});
