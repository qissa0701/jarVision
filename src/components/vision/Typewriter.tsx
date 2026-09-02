// Typewriter — reveals a string one character at a time to mimic an AI "typing"
// its answer. Used by the mock simulation-loading chain-of-thought and any
// other place that wants the reveal-as-you-go effect. Purely presentational.

import { useEffect, useRef, useState } from "react";

export interface TypewriterProps {
  /** Full text to reveal. */
  text: string;
  /** Milliseconds per character. Lower = faster typing. */
  speed?: number;
  /** Delay (ms) before typing starts. */
  startDelay?: number;
  /** Called once the full text has been revealed. */
  onDone?: () => void;
  /** Show a blinking caret while typing. */
  caret?: boolean;
  className?: string;
}

export function Typewriter({
  text,
  speed = 18,
  startDelay = 0,
  onDone,
  caret = true,
  className,
}: TypewriterProps) {
  const [count, setCount] = useState(0);
  // Keep the latest onDone without restarting the effect when it changes.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setCount(0);
    let interval: number | undefined;

    const timer = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            if (interval) window.clearInterval(interval);
            return c;
          }
          const next = c + 1;
          if (next >= text.length) {
            if (interval) window.clearInterval(interval);
            // Defer so the final characters paint before onDone fires.
            window.setTimeout(() => onDoneRef.current?.(), 0);
          }
          return next;
        });
      }, speed);
    }, startDelay);

    return () => {
      if (timer) window.clearTimeout(timer);
      if (interval) window.clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  const done = count >= text.length;

  return (
    <span className={className}>
      {text.slice(0, count)}
      {caret && !done && (
        <span className="inline-block w-[2px] h-[1em] -mb-[2px] ml-0.5 bg-current animate-pulse" aria-hidden="true" />
      )}
    </span>
  );
}
