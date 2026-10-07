import { optionLabel, questionText } from "../data/labels";
import type { Constraint, Intent, Photo, Question, ReplyLang } from "./types";

const FACET_LIST = ["occasion", "composition", "place", "institution", "people_present", "era_bucket"] as const;
const PREFERRED = new Set(["occasion", "composition", "place", "institution"]);

export function institutionKind(photo: Photo): string | null {
  if (!photo.institution) return null;
  const name = photo.institution.toLowerCase();
  if (name.includes("dps") || name.includes("school")) return "school";
  if (name.includes("university") || name.includes("college")) return "college";
  if (name.includes("tcs") || name.includes("work") || name.includes("course")) return "work";
  return null;
}

export function eraBucket(photo: Photo): string | null {
  if (photo.year == null && photo.user_age != null && photo.user_age <= 14) {
    if (photo.user_age <= 6) return "age_3_6";
    if (photo.user_age <= 10) return "age_7_10";
    return "age_11_14";
  }
  if (photo.year != null) return `decade_${Math.floor(photo.year / 10) * 10}`;
  return null;
}

export function peoplePresentKey(photo: Photo): string | null {
  if (photo.composition === "none" || photo.people.length === 0) return null;
  const others = photo.people.filter((p) => p !== "self").sort();
  if (others.length === 0) return photo.people.includes("self") ? "self" : null;
  return others.join("+");
}

export function occasionFacetValue(photo: Photo): string | null {
  if (!photo.occasion) return null;
  if (photo.occasion === "diwali" || photo.occasion === "holi") return "festival";
  return photo.occasion;
}

export function facetValue(photo: Photo, facet: string): string | null {
  switch (facet) {
    case "occasion":
      return occasionFacetValue(photo);
    case "composition":
      return photo.composition === "none" ? null : photo.composition;
    case "place":
      return photo.place;
    case "institution":
      return institutionKind(photo);
    case "era_bucket":
      return eraBucket(photo);
    case "people_present":
      return peoplePresentKey(photo);
    default:
      return null;
  }
}

export function matchesConstraints(photo: Photo, constraints: Constraint[]): boolean {
  return constraints.every((constraint) => {
    if (constraint.facet === "occasion" && constraint.value === "festival") {
      return photo.occasion === "diwali" || photo.occasion === "holi";
    }
    return facetValue(photo, constraint.facet) === constraint.value;
  });
}

export function normalizedEntropy(counts: number[]): number {
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (total <= 0 || counts.length < 2) return 0;
  let entropy = 0;
  for (const count of counts) {
    if (count <= 0) continue;
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy / Math.log2(counts.length);
}

function skipFacet(facet: string, intent: Intent, blocked: Set<string>): boolean {
  if (blocked.has(facet)) return true;
  if (facet === "people_present" && intent.people.length > 0) return true;
  return false;
}

export function selectFacet(args: {
  candidates: Photo[];
  intent: Intent;
  askedFacets: string[];
  constraints: Constraint[];
  round: number;
  replyLanguage: ReplyLang;
}): Question | null {
  const { candidates, intent, round, replyLanguage } = args;
  if (candidates.length <= 8 || round >= 3) return null;

  const blocked = new Set<string>([...args.askedFacets, ...args.constraints.map((c) => c.facet)]);
  let best: { facet: string; score: number; buckets: { value: string; count: number }[] } | null = null;
  const scored: { facet: string; score: number; buckets: { value: string; count: number }[] }[] = [];

  for (const facet of FACET_LIST) {
    if (skipFacet(facet, intent, blocked)) continue;
    const counts = new Map<string, number>();
    let nulls = 0;
    for (const photo of candidates) {
      const value = facetValue(photo, facet);
      if (!value) {
        nulls += 1;
        continue;
      }
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const buckets = [...counts.entries()].map(([value, count]) => ({ value, count }));
    if (buckets.length < 2) continue;
    const nullShare = nulls / candidates.length;
    if (nullShare > 0.5) continue;
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    const largest = Math.max(...buckets.map((b) => b.count)) / total;
    if (largest > 0.65) continue;
    if (buckets.filter((b) => b.count >= 2).length < 2) continue;
    const score = normalizedEntropy(buckets.map((b) => b.count)) * (1 - nullShare);
    if (score < 0.5) continue;
    scored.push({ facet, score, buckets });
    if (!best || score > best.score) best = { facet, score, buckets };
  }

  if (!best) return null;
  const close = scored.filter((item) => item.score >= best.score - 0.1);
  const preferred = close.filter((item) => PREFERRED.has(item.facet));
  const pool = preferred.length ? preferred : close;
  pool.sort((a, b) => b.score - a.score || FACET_LIST.indexOf(a.facet as (typeof FACET_LIST)[number]) - FACET_LIST.indexOf(b.facet as (typeof FACET_LIST)[number]));
  const chosen = pool[0];
  const options = chosen.buckets
    .filter((b) => b.count >= 2)
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, 4)
    .map((b) => ({
      value: b.value,
      count: b.count,
      label: optionLabel(chosen.facet, b.value, replyLanguage, intent),
    }));
  if (options.length < 2) return null;

  return {
    facet: chosen.facet,
    text: questionText(chosen.facet, replyLanguage, intent),
    options,
    allowSkip: true,
  };
}
