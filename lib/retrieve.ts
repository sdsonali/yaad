import MiniSearch from "minisearch";
import { matchesConstraints } from "./facets";
import { processTerm } from "./text";
import type { Constraint, HiddenInfo, Intent, Photo, Ranked } from "./types";

export const SCORE_THRESHOLD = 1.5;

const indexCache = new WeakMap<Photo[], MiniSearch<{ id: string }>>();

function blob(photo: Photo): string {
  return [photo.caption_en, photo.tags.join(" "), photo.sensory_notes ?? "", photo.text_in_image ?? ""]
    .filter(Boolean)
    .join(" \n ");
}

function indexFor(photos: Photo[]): MiniSearch<{ id: string }> {
  const cached = indexCache.get(photos);
  if (cached) return cached;
  const mini = new MiniSearch({
    idField: "id",
    fields: ["caption_en", "tags", "sensory_notes", "text_in_image"],
    processTerm,
    searchOptions: { processTerm },
  });
  mini.addAll(
    photos.map((photo) => ({
      id: photo.id,
      caption_en: photo.caption_en,
      tags: photo.tags.join(" "),
      sensory_notes: photo.sensory_notes ?? "",
      text_in_image: photo.text_in_image ?? "",
    })),
  );
  indexCache.set(photos, mini);
  return mini;
}

function lexicalBoost(photos: Photo[], keywords: string[]): Map<string, number> {
  const scores = new Map<string, number>();
  if (!keywords.length) return scores;
  const hits = indexFor(photos).search(keywords.join(" "), {
    prefix: true,
    combineWith: "OR",
    fuzzy: (term) => (term.length > 4 ? 0.2 : false),
    boost: { sensory_notes: 2, tags: 1.4, caption_en: 1, text_in_image: 1 },
  });
  let max = 0;
  for (const hit of hits) max = Math.max(max, hit.score);
  const byId = new Map(photos.map((photo) => [photo.id, blob(photo).toLowerCase()]));
  for (const photo of photos) {
    const text = byId.get(photo.id) ?? "";
    let overlap = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) overlap += 1;
    }
    const coverage = (overlap / keywords.length) * 2;
    const hit = hits.find((item) => String(item.id) === photo.id);
    const miniNorm = max > 0 && hit ? (hit.score / max) * 2 : 0;
    const boost = Math.min(2, Math.max(miniNorm, coverage));
    if (boost > 0) scores.set(photo.id, boost);
  }
  return scores;
}

function peopleToMatch(intent: Intent): string[] {
  const named = intent.people.filter((person) => person !== "self");
  return named.length ? named : intent.people;
}

function within(value: number, range: [number, number]): boolean {
  return value >= range[0] - 1 && value <= range[1] + 1;
}

export function scorePhoto(photo: Photo, intent: Intent, lexical: number): { score: number; hardExclude: boolean } {
  let score = 0;
  let hardExclude = false;
  const needed = peopleToMatch(intent);
  if (needed.length && needed.every((person) => photo.people.includes(person))) {
    score += 3 * needed.length;
  }
  if (intent.solo_only) {
    if (photo.composition === "solo") score += 3;
    else hardExclude = true;
  }
  if (intent.occasions.length && photo.occasion && intent.occasions.includes(photo.occasion)) score += 3;
  if (intent.places.length && photo.place && intent.places.includes(photo.place)) score += 2;
  if (intent.age_range) {
    if (photo.user_age == null || !within(photo.user_age, intent.age_range)) hardExclude = true;
    else score += 2;
  }
  if (intent.year_range) {
    if (photo.year == null || !within(photo.year, intent.year_range)) hardExclude = true;
    else score += 2;
  }
  if (intent.objects.length) {
    const hay = photo.objects.join(" ").toLowerCase();
    if (intent.objects.some((object) => hay.includes(object.toLowerCase()))) score += 2;
  }
  score += lexical;
  return { score, hardExclude };
}

export function retrieve(
  photos: Photo[],
  intent: Intent,
  constraints: Constraint[] = [],
): { results: Ranked[]; hidden: HiddenInfo; total: number } {
  const lexical = lexicalBoost(photos, intent.keywords);
  const wanted = new Set(intent.wanted_types.length ? intent.wanted_types : ["memory"]);
  const excluded = new Set(intent.excluded_types);
  const results: Ranked[] = [];
  const hiddenItems: Ranked[] = [];
  const byType: Record<string, number> = {};

  for (const photo of photos) {
    if (!matchesConstraints(photo, constraints)) continue;
    const { score, hardExclude } = scorePhoto(photo, intent, lexical.get(photo.id) ?? 0);
    if (hardExclude || score <= SCORE_THRESHOLD) continue;
    const row = { id: photo.id, score };
    if (excluded.has(photo.type) || !wanted.has(photo.type)) {
      hiddenItems.push(row);
      byType[photo.type] = (byType[photo.type] ?? 0) + 1;
    } else {
      results.push(row);
    }
  }

  const byScore = (a: Ranked, b: Ranked) => b.score - a.score || a.id.localeCompare(b.id);
  results.sort(byScore);
  hiddenItems.sort(byScore);
  const noise = (byType.document ?? 0) + (byType.screenshot ?? 0);
  return {
    results,
    hidden: { count: noise, byType, items: hiddenItems },
    total: results.length,
  };
}

export function classicSearch(photos: Photo[], query: string): Ranked[] {
  const q = query.trim();
  if (!q) return [];
  const mini = new MiniSearch({
    idField: "id",
    fields: ["caption_en", "tags"],
    processTerm,
  });
  mini.addAll(photos.map((photo) => ({ id: photo.id, caption_en: photo.caption_en, tags: photo.tags.join(" ") })));
  return mini
    .search(q, { prefix: true, combineWith: "OR", fuzzy: (term) => (term.length > 4 ? 0.2 : false) })
    .map((hit) => ({ id: String(hit.id), score: hit.score }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
