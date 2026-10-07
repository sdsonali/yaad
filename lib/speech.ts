export type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type Ctor = new () => SpeechRec;

export function getSpeechRecognition(win: Window | null | undefined): Ctor | null {
  if (!win) return null;
  const host = win as Window & { webkitSpeechRecognition?: Ctor; SpeechRecognition?: Ctor };
  return host.webkitSpeechRecognition || host.SpeechRecognition || null;
}

export function isSpeechSupported(win: Window | null | undefined): boolean {
  return Boolean(getSpeechRecognition(win));
}
