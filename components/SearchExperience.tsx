"use client";

import { useEffect, useRef, useState } from "react";
import { labels, optionLabel } from "@/data/labels";
import type { Question, Ranked, ReplyLang, SearchAction, SearchState } from "@/lib/types";
import { ChipRow } from "./ChipRow";
import { HiddenBanner } from "./HiddenBanner";
import { PhotoViewer } from "./PhotoViewer";
import { QuestionCard } from "./QuestionCard";
import { ResultGrid } from "./ResultGrid";
import { SearchBar } from "./SearchBar";

const EXAMPLES = [
  "मुझे मेरी childhood की photos दिखाओ",
  "papa ki photos dikhao",
  "college ki farewell photos",
  "Goa wala cafe",
];

type Hidden = { count: number; byType: Record<string, number> };

async function postLog(body: Record<string, unknown>) {
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* logging must not break the demo */
  }
}

export function SearchExperience({
  mode,
  test,
}: {
  mode: "assist" | "classic";
  test?: {
    participantId: string;
    taskId: string;
    onInteraction: () => void;
    onComplete: (photoId: string) => void;
  };
}) {
  const sessionRef = useRef("");
  const [speechLang, setSpeechLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<SearchState | null>(null);
  const [results, setResults] = useState<Ranked[]>([]);
  const [hidden, setHidden] = useState<Hidden>({ count: 0, byType: {} });
  const [question, setQuestion] = useState<Question | null>(null);
  const [assistantText, setAssistantText] = useState("");
  const [lang, setLang] = useState<ReplyLang>("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(24);
  const [openId, setOpenId] = useState<string | null>(null);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    const key = "yaad_session";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    sessionRef.current = id;
    const saved = sessionStorage.getItem("yaad_speech");
    if (saved === "en-IN" || saved === "hi-IN") setSpeechLang(saved);
  }, []);

  function sessionId() {
    if (sessionRef.current) return sessionRef.current;
    const id = crypto.randomUUID();
    sessionRef.current = id;
    sessionStorage.setItem("yaad_session", id);
    return id;
  }

  function log(event: Record<string, unknown>) {
    void postLog({
      ...event,
      sessionId: sessionId(),
      participantId: test?.participantId ?? null,
      taskId: test?.taskId ?? null,
      mode,
    });
  }

  async function run(input: { query?: string; action?: SearchAction; inputMethod?: "typed" | "voice"; original?: string }) {
    setLoading(true);
    setError(null);
    setMarked(false);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId(),
          mode,
          ...(state ? { state } : {}),
          ...(input.query ? { query: input.query } : {}),
          ...(input.action ? { action: input.action } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Search failed. Try again.");
        return;
      }
      setState(data.state);
      setResults(data.results);
      setHidden(data.hidden);
      setQuestion(data.question);
      setAssistantText(data.assistantText);
      setLang(data.replyLanguage);
      setVisible(24);
      if (input.query) {
        test?.onInteraction();
        log({
          event: "query_submitted",
          text: input.query.slice(0, 200),
          inputMethod: input.inputMethod ?? "typed",
          detectedLanguage: data.replyLanguage,
        });
        if (input.original && input.original !== input.query) {
          log({ event: "voice_transcript_edited", original: input.original, edited: input.query });
        }
      }
      if (input.action?.type === "answer") {
        test?.onInteraction();
        log({ event: "chip_tapped", facet: input.action.facet, value: input.action.value, candidateCountAfter: data.results.length });
      }
      if (input.action?.type === "skip") {
        test?.onInteraction();
        log({ event: "question_skipped", facet: input.action.facet ?? data.question?.facet ?? "" });
      }
      if (input.action?.type === "remove") {
        test?.onInteraction();
        log({ event: "constraint_removed", facet: input.action.facet });
      }
      if (input.action?.type === "showHidden") log({ event: "hidden_shown", count: data.hidden?.count ?? 0 });
      if (data.question && input.action?.type !== "showHidden") {
        log({
          event: "question_shown",
          facet: data.question.facet,
          optionCount: data.question.options.length,
          candidateCount: data.results.length,
        });
      }
      if (data.usedFallback) log({ event: "fallback_used", reason: data.fallbackReason || "fallback" });
    } catch {
      setError("Couldn't reach search. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const placeholder = mode === "classic" ? "Type keywords…" : speechLang === "hi-IN" ? "बोलो या लिखो…" : "Type or speak…";
  const started = Boolean(state?.query);
  const chips =
    state?.intent && state.constraints.length
      ? state.constraints.map((constraint) => ({
          facet: constraint.facet,
          label: optionLabel(constraint.facet, constraint.value, lang, state.intent!),
        }))
      : [];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-x-clip bg-paper text-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          {mode === "classic" ? (
            <>
              <p className="text-xs uppercase tracking-wide text-muted">Yaad</p>
              <h1 className="font-display text-[1.65rem] leading-none">Keyword search</h1>
            </>
          ) : (
            <h1 className="font-display text-[1.7rem] leading-none">Yaad</h1>
          )}
          {!test && (
            <a href={mode === "classic" ? "/" : "/classic"} className="mt-1 inline-block text-sm underline underline-offset-2">
              {mode === "classic" ? "Back to Yaad" : "Keyword search"}
            </a>
          )}
        </div>
        {mode === "assist" && (
          <div className="flex shrink-0 rounded-full border border-line p-0.5" aria-label="Speech language">
            {(
              [
                ["en-IN", "EN"],
                ["hi-IN", "हि"],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                type="button"
                aria-pressed={speechLang === code}
                onClick={() => {
                  setSpeechLang(code);
                  sessionStorage.setItem("yaad_speech", code);
                }}
                className={`min-h-11 min-w-11 rounded-full px-2 text-sm ${speechLang === code ? "bg-ink font-semibold text-paper" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-3 px-3 pb-4">
        {error && <p className="rounded-xl border border-ink px-3 py-3 text-sm">{error}</p>}
        {loading && <p className="text-sm font-medium">{labels.searching[lang]}</p>}
        {mode === "assist" && question && (
          <QuestionCard
            question={question}
            lang={lang}
            onAnswer={(value) => run({ action: { type: "answer", facet: question.facet, value } })}
            onSkip={() => run({ action: { type: "skip", facet: question.facet } })}
          />
        )}
        {mode === "assist" && !question && started && assistantText && <p className="rounded-2xl border border-line bg-white px-3 py-3 text-[15px]">{assistantText}</p>}
        {marked && <p className="text-sm font-medium">Marked as the one ✓</p>}
        <ChipRow chips={chips} onRemove={(facet) => run({ action: { type: "remove", facet } })} />
        {mode === "assist" && (
          <HiddenBanner count={hidden.count} lang={lang} shown={Boolean(state?.showHidden)} onShow={() => run({ action: { type: "showHidden" } })} />
        )}
        {!started && !loading && (
          <div className="pt-6">
            <p className="font-display text-2xl leading-tight">Search a memory</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {mode === "classic"
                ? "Matches English words in captions and tags."
                : "Try a phrase in Hindi, Hinglish or English. Photos show up first."}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setDraft(example);
                    void run({ query: example, inputMethod: "typed" });
                  }}
                  className="min-h-11 rounded-2xl border border-line bg-white px-3 text-left text-[15px] leading-snug"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
        {started && results.length === 0 && !loading && (
          <div className="rounded-2xl border border-line bg-white px-3 py-4">
            <p className="text-[15px]">{labels.zero[lang]}</p>
            {state && state.constraints.length > 0 && (
              <button type="button" onClick={() => run({ query: state.query, inputMethod: "typed" })} className="mt-3 min-h-11 rounded-full border border-ink px-4 text-sm font-medium">
                {labels.removeFilters[lang]}
              </button>
            )}
          </div>
        )}
        {results.length > 0 && (
          <ResultGrid
            results={results}
            visible={visible}
            lang={lang}
            onLoadMore={() => setVisible((count) => count + 24)}
            onOpen={(id, rank) => {
              test?.onInteraction();
              log({ event: "photo_opened", photoId: id, rank });
              setOpenId(id);
            }}
          />
        )}
      </main>

      <div className="sticky bottom-0 border-t border-line bg-paper px-3 pb-3 pt-2">
        <p className="pb-2 text-center text-[11px] leading-tight text-muted">Sample library · simulated face groups</p>
        <SearchBar
          value={draft}
          placeholder={placeholder}
          speechLang={speechLang}
          enableMic={mode === "assist"}
          disabled={loading}
          onChange={setDraft}
          onSubmit={(inputMethod, original) => {
            const query = draft.trim();
            if (!query) return;
            void run({ query, inputMethod, original });
          }}
        />
      </div>

      {openId && (
        <PhotoViewer
          id={openId}
          lang={lang}
          onClose={() => setOpenId(null)}
          onReject={() => {
            log({ event: "photo_rejected", photoId: openId });
            setOpenId(null);
          }}
          onPick={() => {
            if (test) test.onComplete(openId);
            else setMarked(true);
            setOpenId(null);
          }}
        />
      )}
    </div>
  );
}
