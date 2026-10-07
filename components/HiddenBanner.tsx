"use client";

import { labels } from "@/data/labels";
import type { ReplyLang } from "@/lib/types";

export function HiddenBanner({
  count,
  lang,
  shown,
  onShow,
}: {
  count: number;
  lang: ReplyLang;
  shown: boolean;
  onShow: () => void;
}) {
  if (count <= 0) return null;
  if (shown) {
    return (
      <p className="rounded-xl border border-line bg-white px-3 py-3 text-sm leading-snug">
        <span aria-hidden="true">▤ </span>
        {labels.showing[lang]}
      </p>
    );
  }
  return (
    <button type="button" onClick={onShow} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 py-2 text-left text-sm leading-snug">
      <span aria-hidden="true">▤ </span>
      {labels.hiddenBanner[lang].replace("{n}", String(count))}
      <span className="font-semibold"> · {labels.show[lang]}</span>
    </button>
  );
}
