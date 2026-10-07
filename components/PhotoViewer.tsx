"use client";

import { useEffect } from "react";
import { labels } from "@/data/labels";
import type { ReplyLang } from "@/lib/types";
import { photoFile } from "./ResultGrid";

export function PhotoViewer({
  id,
  lang,
  onClose,
  onPick,
  onReject,
  file,
}: {
  id: string;
  lang: ReplyLang;
  onClose: () => void;
  onPick: () => void;
  onReject: () => void;
  file?: string;
}) {
  const photo = file ? { file, type: "memory" } : photoFile(id);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!photo) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/70 sm:items-center" role="dialog" aria-modal="true" aria-label="Photo">
      <div className="flex max-h-[100dvh] w-full max-w-[430px] flex-col bg-paper">
        <img src={photo.file} alt="Selected sample photo" className="max-h-[70dvh] w-full bg-[#e7dfd2] object-contain" />
        <div className="flex flex-col gap-2 p-3">
          <button type="button" onClick={onPick} className="min-h-11 rounded-full bg-terracotta px-4 text-[15px] font-semibold text-white">
            {labels.thisOne[lang]} ✓
          </button>
          <button type="button" onClick={onReject} className="min-h-11 rounded-full border border-ink px-4 text-[15px] font-medium">
            {labels.notThis[lang]}
          </button>
          <button type="button" onClick={onClose} className="min-h-11 text-sm text-muted">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
