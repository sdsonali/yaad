"use client";

import { labels } from "@/data/labels";
import type { Question, ReplyLang } from "@/lib/types";

export function QuestionCard({
  question,
  lang,
  onAnswer,
  onSkip,
}: {
  question: Question;
  lang: ReplyLang;
  onAnswer: (value: string) => void;
  onSkip: () => void;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white px-3 py-3" aria-live="polite">
      <p className="mb-3 text-[15px] font-medium leading-snug">{question.text}</p>
      <div className="flex flex-wrap gap-2">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onAnswer(option.value)}
            className="min-h-11 rounded-full border border-line bg-paper px-3 text-left text-[15px] font-medium"
          >
            {option.label}
            <span className="ml-1 text-sm font-normal text-muted">· {option.count}</span>
          </button>
        ))}
        {question.allowSkip && (
          <button type="button" onClick={onSkip} className="min-h-11 rounded-full border border-dashed border-ink/40 px-3 text-[15px]">
            {labels.skip[lang]}
          </button>
        )}
      </div>
    </section>
  );
}
