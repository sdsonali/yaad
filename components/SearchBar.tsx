"use client";

import { useEffect, useRef, useState } from "react";
import { MicButton } from "./MicButton";
import { getSpeechRecognition } from "@/lib/speech";

type Props = {
  value: string;
  placeholder: string;
  speechLang: "hi-IN" | "en-IN";
  enableMic?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: (inputMethod: "typed" | "voice", originalTranscript?: string) => void;
};

export function SearchBar({ value, placeholder, speechLang, enableMic = true, disabled, onChange, onSubmit }: Props) {
  const [speechOk, setSpeechOk] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const originalRef = useRef<string | null>(null);
  const liveRef = useRef("");
  const timerRef = useRef<number | null>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    setSpeechOk(Boolean(getSpeechRecognition(window)));
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      recRef.current?.stop();
    };
  }, []);

  function clearTimer() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setSending(false);
  }

  function scheduleSend(transcript: string) {
    clearTimer();
    originalRef.current = transcript;
    setSending(true);
    timerRef.current = window.setTimeout(() => {
      setSending(false);
      const original = originalRef.current ?? transcript;
      originalRef.current = null;
      onSubmit("voice", original);
    }, 1500);
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const Ctor = getSpeechRecognition(window);
    if (!Ctor) {
      setSpeechOk(false);
      return;
    }
    clearTimer();
    setNote(null);
    const rec = new Ctor();
    rec.lang = speechLang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) text += event.results[i][0]?.transcript ?? "";
      liveRef.current = text.trim();
      onChange(liveRef.current);
    };
    rec.onerror = () => setNote("Couldn't hear that. Type instead.");
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      const text = (liveRef.current || valueRef.current).trim();
      if (text) scheduleSend(text);
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      setNote("Couldn't hear that. Type instead.");
    }
  }

  return (
    <div>
      {enableMic && speechOk === false && (
        <p className="mb-2 text-center text-sm text-muted">Voice input isn't supported in this browser. Type your search.</p>
      )}
      {listening && <p className="mb-1 text-center text-sm font-medium">Listening</p>}
      {sending && (
        <p className="mb-1 flex items-center justify-center gap-3 text-sm font-medium">
          Sending…
          <button
            type="button"
            className="min-h-11 rounded-full border border-ink px-3"
            onClick={() => {
              clearTimer();
              originalRef.current = null;
            }}
          >
            Cancel
          </button>
        </p>
      )}
      {note && <p className="mb-1 text-center text-sm text-muted">{note}</p>}
      <form
        className="flex min-h-[52px] items-center gap-1 rounded-full border border-line bg-white pl-4 shadow-bar"
        onSubmit={(event) => {
          event.preventDefault();
          clearTimer();
          const original = originalRef.current;
          originalRef.current = null;
          onSubmit(original ? "voice" : "typed", original ?? undefined);
        }}
      >
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            if (sending) clearTimer();
          }}
          placeholder={placeholder}
          aria-label="Search photos"
          maxLength={200}
          className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted"
        />
        {enableMic && speechOk ? <MicButton listening={listening} onClick={toggleMic} /> : enableMic && speechOk === null ? <span className="inline-block h-11 w-11" /> : null}
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Search"
          className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terracotta text-white disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}
