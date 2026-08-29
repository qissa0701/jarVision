// Timing constants for the chat assistant's simulated "thinking" delay.
//
// Mirrors the timing-feel of `RUNNING_ENTER_MS` in `useOvernightQueue.ts`: a
// short, deliberate delay so the "Jarvis is typing…" indicator reads as
// genuine processing rather than an instant, robotic reply.

/** Minimum simulated "thinking" delay before the assistant's reply appears. */
export const THINKING_DELAY_MIN_MS = 400;

/** Maximum simulated "thinking" delay before the assistant's reply appears. */
export const THINKING_DELAY_MAX_MS = 600;
