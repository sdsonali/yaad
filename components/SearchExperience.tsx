"use client";

import { useEffect, useRef, useState } from "react";
import { labels, optionLabel } from "@/data/labels";
import { isRejection } from "@/lib/language";
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

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  results?: Ranked[];
  question?: Question | null;
  hidden?: Hidden;
  showHidden?: boolean;
};

type SavedChat = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
  state: SearchState | null;
  lang: ReplyLang;
  marked: boolean;
};

const CHAT_STORAGE_KEY = "yaad_chats";

function chatTitle(messages: ChatMessage[]) {
  const text = messages.find((message) => message.role === "user")?.text.trim();
  return (text || "Chat").slice(0, 72);
}

function formatChatTime(ts: number) {
  const date = new Date(ts);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function readChats(): SavedChat[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedChat[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((chat) => chat && typeof chat.id === "string" && Array.isArray(chat.messages))
      .slice(0, 30)
      .map((chat) => ({
        ...chat,
        title: typeof chat.title === "string" ? chat.title : chatTitle(chat.messages),
        updatedAt: typeof chat.updatedAt === "number" ? chat.updatedAt : Date.now(),
        state: chat.state ? { ...chat.state, excluded: chat.state.excluded ?? [] } : null,
        lang: chat.lang || "en",
        marked: Boolean(chat.marked),
      }));
  } catch {
    return [];
  }
}

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
  const speechLang = "hi-IN" as const;
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);
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
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [chatId, setChatId] = useState("");
  const [ready, setReady] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const key = "yaad_session";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    sessionRef.current = id;
  }, []);

  useEffect(() => {
    if (test) {
      setReady(true);
      return;
    }
    const saved = readChats();
    setChats(saved);
    if (saved[0]) {
      setChatId(saved[0].id);
      setMessages(saved[0].messages);
      setState(saved[0].state);
      setLang(saved[0].lang);
      setMarked(saved[0].marked);
    } else {
      setChatId(crypto.randomUUID());
    }
    setReady(true);
  }, [test]);

  useEffect(() => {
    if (test || !ready || !chatId || messages.length === 0) return;
    const chat: SavedChat = {
      id: chatId,
      title: chatTitle(messages),
      updatedAt: Date.now(),
      messages,
      state,
      lang,
      marked,
    };
    const next = [chat, ...readChats().filter((item) => item.id !== chat.id)].slice(0, 30);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(next));
    setChats(next);
  }, [messages, state, lang, marked, chatId, ready, test]);

  function openSavedChat(chat: SavedChat) {
    setChatId(chat.id);
    setMessages(chat.messages);
    setState(chat.state);
    setLang(chat.lang);
    setMarked(chat.marked);
    setDraft("");
    setError(null);
    setOpenId(null);
    setVisible(24);
    setHistoryOpen(false);
  }

  function startNewChat() {
    setChatId(crypto.randomUUID());
    setMessages([]);
    setState(null);
    setResults([]);
    setHidden({ count: 0, byType: {} });
    setQuestion(null);
    setAssistantText("");
    setMarked(false);
    setDraft("");
    setError(null);
    setOpenId(null);
    setVisible(24);
    setHistoryOpen(false);
  }

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    thread.scrollTop = thread.scrollHeight;
  }, [messages, loading, error]);

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

  function pushMessage(message: Omit<ChatMessage, "id">) {
    setMessages((prev) => [...prev, { ...message, id: crypto.randomUUID() }]);
  }

  async function run(input: { query?: string; action?: SearchAction; inputMethod?: "typed" | "voice"; original?: string; userText?: string }) {
    let request = input;
    if (mode === "assist" && input.query && state && isRejection(input.query)) {
      const last = [...messages].reverse().find((message) => message.role === "assistant" && message.results && message.results.length > 0);
      request = {
        ...input,
        query: undefined,
        userText: input.query,
        action: { type: "reject", ids: last?.results?.map((row) => row.id) ?? [] },
      };
    }
    if (mode === "assist" && (request.query || request.userText)) {
      pushMessage({ role: "user", text: request.userText || request.query || "" });
      if (request.query) setDraft("");
    }
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
          ...(request.query ? { query: request.query } : {}),
          ...(request.action ? { action: request.action } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data.error || "Search failed. Try again.";
        setError(message);
        if (mode === "assist") pushMessage({ role: "assistant", text: message });
        return;
      }
      setState(data.state);
      if (mode === "assist") {
        pushMessage({
          role: "assistant",
          text: data.assistantText || "",
          results: data.results,
          question: data.question,
          hidden: data.hidden,
          showHidden: Boolean(data.state?.showHidden),
        });
      }
      setResults(data.results);
      setHidden(data.hidden);
      setQuestion(data.question);
      setAssistantText(data.assistantText);
      setLang(data.replyLanguage);
      setVisible(24);
      if (request.action?.type === "reject") {
        for (const photoId of request.action.ids) log({ event: "photo_rejected", photoId });
      }
      if (request.query) {
        test?.onInteraction();
        log({
          event: "query_submitted",
          text: (request.query ?? "").slice(0, 200),
          inputMethod: request.inputMethod ?? "typed",
          detectedLanguage: data.replyLanguage,
        });
        if (request.original && request.original !== request.query) {
          log({ event: "voice_transcript_edited", original: request.original, edited: request.query });
        }
      }
      if (request.action?.type === "answer") {
        test?.onInteraction();
        log({ event: "chip_tapped", facet: request.action.facet, value: request.action.value, candidateCountAfter: data.results.length });
      }
      if (request.action?.type === "skip") {
        test?.onInteraction();
        log({ event: "question_skipped", facet: request.action.facet ?? data.question?.facet ?? "" });
      }
      if (request.action?.type === "remove") {
        test?.onInteraction();
        log({ event: "constraint_removed", facet: request.action.facet });
      }
      if (request.action?.type === "showHidden") log({ event: "hidden_shown", count: data.hidden?.count ?? 0 });
      if (data.question && request.action?.type !== "showHidden") {
        log({
          event: "question_shown",
          facet: data.question.facet,
          optionCount: data.question.options.length,
          candidateCount: data.results.length,
        });
      }
      if (data.usedFallback) log({ event: "fallback_used", reason: data.fallbackReason || "fallback" });
    } catch {
      const message = "Couldn't reach search. Check your connection.";
      setError(message);
      if (mode === "assist") pushMessage({ role: "assistant", text: message });
    } finally {
      setLoading(false);
    }
  }

  const placeholder = mode === "classic" ? "Type keywords…" : "Message…";
  const started = Boolean(state?.query);
  const liveAssistantId = [...messages].reverse().find((message) => message.role === "assistant")?.id;
  const chips =
    state?.intent && state.constraints.length
      ? state.constraints.map((constraint) => ({
          facet: constraint.facet,
          label: optionLabel(constraint.facet, constraint.value, lang, state.intent!),
        }))
      : [];

  function openPhoto(id: string, rank: number) {
    test?.onInteraction();
    log({ event: "photo_opened", photoId: id, rank });
    setOpenId(id);
  }

  if (mode === "assist") {
    return (
      <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-paper text-ink">
        <header className="flex items-center justify-between gap-3 px-4 py-3">
          <h1 className="font-display text-[1.45rem] leading-none">Yaad</h1>
          {!test && (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setHistoryOpen(true)} className="text-sm font-medium">
                Chats
              </button>
              <button type="button" onClick={startNewChat} className="text-sm font-medium">
                New
              </button>
              <a href="/classic" className="text-sm text-muted underline underline-offset-2">
                Keyword search
              </a>
            </div>
          )}
        </header>

        <div ref={threadRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
          {ready && messages.length === 0 && !loading && (
            <div className={chats.length > 0 ? "flex flex-col pb-2" : "flex flex-1 flex-col justify-end pb-2"}>
              <p className="font-display text-[1.7rem] leading-tight">What photo are you looking for?</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">Ask in Hindi, Hinglish, or English. I’ll reply with photos.</p>
              <div className="mt-4 flex flex-col gap-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => void run({ query: example, inputMethod: "typed" })}
                    className="min-h-11 rounded-2xl border border-line bg-white px-3 text-left text-[15px] leading-snug"
                  >
                    {example}
                  </button>
                ))}
              </div>
              {chats.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-medium text-muted">Earlier chats</p>
                  <div className="flex flex-col gap-2">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => openSavedChat(chat)}
                        className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-line bg-white px-3 py-2 text-left"
                      >
                        <span className="truncate text-[15px]">{chat.title}</span>
                        <span className="shrink-0 text-xs text-muted">{formatChatTime(chat.updatedAt)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="ml-10 flex justify-end">
                <p className="max-w-full rounded-2xl rounded-br-md bg-ink px-3 py-2 text-[15px] leading-snug text-paper">{message.text}</p>
              </div>
            ) : (
              <div key={message.id} className="mr-6 flex flex-col gap-3">
                {message.text && <p className="text-[15px] leading-snug">{message.text}</p>}
                {message.question && message.id === liveAssistantId && (
                  <QuestionCard
                    question={message.question}
                    lang={lang}
                    showPrompt={false}
                    onAnswer={(value) => {
                      const asked = message.question!;
                      const label = asked.options.find((option) => option.value === value)?.label ?? value;
                      if (asked.facet === "confirm" && value === "yes") {
                        const photoId = message.results?.[0]?.id;
                        pushMessage({ role: "user", text: label });
                        pushMessage({ role: "assistant", text: "Marked as the one ✓" });
                        if (test && photoId) test.onComplete(photoId);
                        else setMarked(true);
                        return;
                      }
                      if (asked.facet === "confirm") {
                        void run({ action: { type: "reject", ids: message.results?.map((row) => row.id) ?? [] }, userText: label });
                        return;
                      }
                      void run({ action: { type: "answer", facet: asked.facet, value }, userText: label });
                    }}
                    onSkip={() => void run({ action: { type: "skip", facet: message.question!.facet }, userText: labels.skip[lang] })}
                  />
                )}
                {message.hidden && message.id === liveAssistantId && (
                  <HiddenBanner
                    count={message.hidden.count}
                    lang={lang}
                    shown={Boolean(message.showHidden)}
                    onShow={() => void run({ action: { type: "showHidden" } })}
                  />
                )}
                {message.results && message.results.length > 0 && (
                  <ResultGrid
                    results={message.results}
                    visible={message.id === liveAssistantId ? visible : Math.min(12, message.results.length)}
                    lang={lang}
                    onLoadMore={() => setVisible((count) => count + 24)}
                    onOpen={openPhoto}
                  />
                )}
                {message.id === liveAssistantId && (message.results?.length ?? 0) === 0 && chips.length > 0 && state?.query && (
                  <button
                    type="button"
                    onClick={() => void run({ query: state.query, userText: labels.removeFilters[lang] })}
                    className="min-h-11 w-fit rounded-full border border-ink px-4 text-sm font-medium"
                  >
                    {labels.removeFilters[lang]}
                  </button>
                )}
              </div>
            ),
          )}
          {loading && <p className="text-sm font-medium text-muted">{labels.searching[lang]}</p>}
          {marked && <p className="text-sm font-medium">Marked as the one ✓</p>}
        </div>

        <div className="border-t border-line bg-paper px-3 pb-3 pt-2">
          <ChipRow chips={chips} onRemove={(facet) => void run({ action: { type: "remove", facet } })} />
          <p className="pb-2 text-center text-[11px] leading-tight text-muted">Sample library · simulated face groups</p>
          <SearchBar
            value={draft}
            placeholder={placeholder}
            speechLang={speechLang}
            enableMic
            disabled={loading}
            onChange={setDraft}
            onSubmit={(inputMethod, original) => {
              const query = draft.trim();
              if (!query) return;
              void run({ query, inputMethod, original });
            }}
          />
        </div>

        {historyOpen && !test && (
          <div className="absolute inset-0 z-30 flex flex-col bg-paper">
            <header className="flex items-center justify-between px-4 py-3">
              <h2 className="font-display text-[1.45rem] leading-none">Chats</h2>
              <button type="button" onClick={() => setHistoryOpen(false)} className="text-sm font-medium">
                Close
              </button>
            </header>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-4">
              <button
                type="button"
                onClick={startNewChat}
                className="min-h-11 rounded-2xl border border-ink bg-ink px-3 text-left text-[15px] font-medium text-paper"
              >
                New chat
              </button>
              {chats.length === 0 && <p className="px-1 pt-2 text-sm text-muted">Earlier chats will show up here.</p>}
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => openSavedChat(chat)}
                  className={`flex min-h-11 items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left ${chat.id === chatId ? "border-ink bg-white" : "border-line bg-white"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px]">{chat.title}</span>
                    <span className="block text-xs text-muted">{chat.id === chatId ? "This chat" : formatChatTime(chat.updatedAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {openId && (
          <PhotoViewer
            id={openId}
            lang={lang}
            onClose={() => setOpenId(null)}
            onReject={() => {
              const photoId = openId;
              setOpenId(null);
              void run({ action: { type: "reject", ids: photoId ? [photoId] : [] }, userText: labels.notThis[lang] });
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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-x-clip bg-paper text-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted">Yaad</p>
          <h1 className="font-display text-[1.65rem] leading-none">Keyword search</h1>
          {!test && (
            <a href="/" className="mt-1 inline-block text-sm underline underline-offset-2">
              Back to Yaad
            </a>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-3 pb-4">
        {error && <p className="rounded-xl border border-ink px-3 py-3 text-sm">{error}</p>}
        {loading && <p className="text-sm font-medium">{labels.searching[lang]}</p>}
        {marked && <p className="text-sm font-medium">Marked as the one ✓</p>}
        {!started && !loading && (
          <div className="pt-6">
            <p className="font-display text-2xl leading-tight">Search a memory</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">Matches English words in captions and tags.</p>
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
          enableMic={false}
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
