"use client";

import catalogJson from "@/data/catalog.public.json";
import { labels } from "@/data/labels";
import type { Ranked, ReplyLang } from "@/lib/types";

const catalog = catalogJson as { id: string; file: string; type: string }[];
const byId = new Map(catalog.map((item) => [item.id, item]));

export function ResultGrid({
  results,
  visible,
  lang,
  onOpen,
  onLoadMore,
  catalogExtra = [],
}: {
  results: Ranked[];
  visible: number;
  lang: ReplyLang;
  onOpen: (id: string, rank: number) => void;
  onLoadMore: () => void;
  catalogExtra?: { id: string; file: string; type: string }[];
}) {
  const lookup = new Map(byId);
  for (const item of catalogExtra) lookup.set(item.id, item);
  const slice = results.slice(0, visible);
  return (
    <div>
      <p className="mb-2 text-sm text-muted">{results.length === 1 ? "1 photo" : `${results.length} photos`}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {slice.map((row, index) => {
          const photo = lookup.get(row.id);
          if (!photo) return null;
          const badge = photo.type === "memory" ? null : labels.typeBadge[photo.type]?.[lang];
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpen(row.id, index + 1)}
              className="relative aspect-[10/13] overflow-hidden rounded-md bg-[#e7dfd2] text-left"
            >
              <img
                src={photo.file}
                alt={`Sample photo ${index + 1}`}
                className="h-full w-full object-cover"
                loading={index < 6 ? "eager" : "lazy"}
                decoding="async"
              />
              {badge && (
                <span className="absolute bottom-1 left-1 rounded bg-ink/90 px-1.5 py-0.5 text-[11px] font-medium text-white">{badge}</span>
              )}
            </button>
          );
        })}
      </div>
      {visible < results.length && (
        <button type="button" onClick={onLoadMore} className="mt-3 min-h-11 w-full rounded-full border border-line bg-white text-[15px] font-medium">
          {labels.loadMore[lang]}
        </button>
      )}
    </div>
  );
}

export function photoFile(id: string): { file: string; type: string } | undefined {
  return byId.get(id);
}
