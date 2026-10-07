"use client";

import { labels } from "@/data/labels";
import type { Question, ReplyLang } from "@/lib/types";

export function QuestionCard({
  question,
  lang,
  onAnswer,
  onSkip,
  showPrompt = true,
}: {
  question: Question;
  lang: ReplyLang;
  onAnswer: (value: string) => void;
  onSkip: () => void;
  showPrompt?: boolean;
}) {
  return (
    <section className={showPrompt ? "rounded-2xl border border-line bg-white px-3 py-3" : ""} aria-live="polite">
      {showPrompt && <p className="mb-3 text-[15px] font-medium leading-snug">{question.text}</p>}
      <div className={showPrompt ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onAnswer(option.value)}
            className={
              showPrompt
                ? "min-h-11 rounded-full border border-line bg-paper px-3 text-left text-[15px] font-medium"
                : "flex min-h-11 w-full items-center justify-between rounded-xl border border-line bg-white px-3 text-left text-[15px] font-medium"
            }
          >
            <span>{option.label}</span>
            {question.facet !== "confirm" && (
              <span className="text-sm font-normal text-muted">{showPrompt ? `· ${option.count}` : option.count}</span>
            )}
          </button>
        ))}
        {question.allowSkip && (
          <button
            type="button"
            onClick={onSkip}
            className={
              showPrompt
                ? "min-h-11 rounded-full border border-dashed border-ink/40 px-3 text-[15px]"
                : "min-h-11 w-full rounded-xl border border-dashed border-ink/40 px-3 text-left text-[15px]"
            }
          >
            {labels.skip[lang]}
          </button>
        )}
      </div>
    </section>
  );
}
