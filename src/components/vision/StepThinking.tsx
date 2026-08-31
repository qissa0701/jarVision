// StepThinking — a short "AI is thinking" gate placed in front of any step's
// content. It plays a compact chain-of-thought (typed out) once, then reveals
// its children with a fade. Used to make every step in the journey feel like a
// live simulation. Key it per step so it replays each time a step is entered.

import { useState } from "react";
import { motion } from "motion/react";
import { ChainOfThought, type ThoughtStep } from "./ChainOfThought";

export interface StepThinkingProps {
  steps: ThoughtStep[];
  children: React.ReactNode;
  title?: string;
  /** Milliseconds per character while typing each step's detail. */
  typingSpeed?: number;
  stepPauseMs?: number;
  finalHoldMs?: number;
}

export function StepThinking({
  steps,
  children,
  title = "Thinking",
  typingSpeed = 9,
  stepPauseMs = 140,
  finalHoldMs = 350,
}: StepThinkingProps) {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {children}
      </motion.div>
    );
  }

  return (
    <ChainOfThought
      title={title}
      steps={steps}
      typingSpeed={typingSpeed}
      stepPauseMs={stepPauseMs}
      finalHoldMs={finalHoldMs}
      onComplete={() => setDone(true)}
    />
  );
}
