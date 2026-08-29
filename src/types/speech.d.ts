// Ambient type declarations for the Web Speech API's `SpeechRecognition`
// surface, which TypeScript's bundled `lib.dom.d.ts` does not (yet) include
// for this project's TS version — `SpeechSynthesis`/`SpeechSynthesisUtterance`
// are already provided by lib.dom.d.ts, so only the recognition side needs
// augmenting here. Modeled on the MDN Web Speech API reference:
// https://developer.mozilla.org/docs/Web/API/SpeechRecognition
//
// Kept intentionally minimal — just the members `useSpeechRecognition.ts`
// actually uses — rather than a full spec-complete surface.

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export interface SpeechRecognitionEventResultItem {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionEventResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionEventResultItem;
  [index: number]: SpeechRecognitionEventResultItem;
}

export interface SpeechRecognitionEventResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionEventResult;
  [index: number]: SpeechRecognitionEventResult;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionEventResultList;
}

export interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
