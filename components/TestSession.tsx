"use client";

import { useRef, useState } from "react";
import type { TaskStep } from "@/lib/plan";
import { SearchExperience } from "./SearchExperience";
import { TaskCard } from "./TaskCard";

async function postLog(body: Record<string, unknown>) {
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* ignore */
  }
}

export function TestSession({
  participantId,
  taskId,
  prompt,
  mode,
  plan,
}: {
  participantId: string;
  taskId: string;
  prompt: string;
  mode: "assist" | "classic";
  plan: TaskStep[];
}) {
  const [phase, setPhase] = useState<"intro" | "run" | "survey" | "done">("intro");
  const [openPrompt, setOpenPrompt] = useState(false);
  const [ease, setEase] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const started = useRef(0);
  const interactions = useRef(0);
  const sessionRef = useRef("");
  function sid() {
    if (sessionRef.current) return sessionRef.current;
    const key = "yaad_session";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    sessionRef.current = id;
    return id;
  }

  function log(event: Record<string, unknown>) {
    void postLog({ ...event, sessionId: sid(), participantId, taskId, mode });
  }

  const index = plan.findIndex((step) => step.taskId === taskId);
  const next = plan[index + 1];

  if (phase === "intro") {
    return (
      <TaskCard
        prompt={prompt}
        onStart={() => {
          started.current = Date.now();
          interactions.current = 0;
          log({ event: "task_started" });
          setPhase("run");
        }}
      />
    );
  }

  if (phase === "survey") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper px-4 py-8">
        <h1 className="font-display text-2xl">Two quick questions</h1>
        <fieldset className="mt-6">
          <legend className="text-[15px] font-medium">How easy was that? (1–5)</legend>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-pressed={ease === n} onClick={() => setEase(n)} className={`h-11 w-11 rounded-full border text-sm font-semibold ${ease === n ? "border-ink bg-ink text-paper" : "border-line bg-white"}`}>
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className="text-[15px] font-medium">How confident are you that it's the right photo? (1–5)</legend>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-pressed={confidence === n} onClick={() => setConfidence(n)} className={`h-11 w-11 rounded-full border text-sm font-semibold ${confidence === n ? "border-ink bg-ink text-paper" : "border-line bg-white"}`}>
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          disabled={ease == null || confidence == null}
          onClick={() => {
            log({ event: "survey_answered", ease, confidence });
            setPhase("done");
          }}
          className="mt-8 min-h-11 rounded-full bg-terracotta text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center bg-paper px-5">
        <h1 className="font-display text-3xl">Thank you</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">That task is saved. The right photo is not revealed here.</p>
        {next ? (
          <a href={`/test?p=${encodeURIComponent(participantId)}&task=${next.taskId}&mode=${next.mode}`} className="mt-6 flex min-h-11 items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-paper">
            Next task · {next.taskId} · {next.mode === "classic" ? "Keyword search" : "Yaad"}
          </a>
        ) : (
          <p className="mt-6 text-[15px] font-medium">Session complete.</p>
        )}
        <p className="mt-8 text-[11px] text-muted">Sample library · simulated face groups</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto flex w-full max-w-[430px] items-start gap-2 bg-[#efe7da] px-3 py-2">
        <button type="button" onClick={() => setOpenPrompt((open) => !open)} className="min-h-11 flex-1 text-left text-sm leading-snug">
          <span className="font-semibold">{taskId} · {mode === "classic" ? "Keyword search" : "Yaad"}</span>
          <span className="mt-0.5 block">{openPrompt ? prompt : prompt.length > 72 ? `${prompt.slice(0, 72)}…` : prompt}</span>
        </button>
        <button
          type="button"
          className="min-h-11 shrink-0 rounded-full border border-ink px-3 text-sm"
          onClick={() => {
            log({ event: "task_abandoned", timeMs: Date.now() - started.current, interactionCount: interactions.current });
            setPhase("survey");
          }}
        >
          I give up
        </button>
      </div>
      <SearchExperience
        mode={mode}
        test={{
          participantId,
          taskId,
          onInteraction: () => {
            interactions.current += 1;
          },
          onComplete: (photoId: string) => {
            log({
              event: "task_completed",
              photoId,
              timeMs: Date.now() - started.current,
              interactionCount: interactions.current,
            });
            setPhase("survey");
          },
        }}
      />
    </div>
  );
}
