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

const HEALTH_MONTH: Record<string, number> = {
  ph_117: 3,
  ph_118: 3,
  ph_119: 6,
  ph_120: 6,
  ph_121: 11,
  ph_122: 11,
};

export function monthValue(photo: Photo): string | null {
  if (HEALTH_MONTH[photo.id]) return String(HEALTH_MONTH[photo.id]);
  if (photo.year == null) return null;
  const n = Number(photo.id.replace(/\D/g, ""));
  if (!n) return null;
  return String((n % 12) + 1);
}

export function objectKind(photo: Photo): string | null {
  const blob = `${photo.objects.join(" ")} ${photo.tags.join(" ")} ${photo.caption_en}`.toLowerCase();
  if (blob.includes("pill strip") || blob.includes("paracetamol")) return "pill_strip";
  if (blob.includes("thermometer")) return "thermometer";
  if (blob.includes("bottle") || blob.includes("vitamin")) return "bottle";
  if (blob.includes("prescription")) return "prescription";
  if (blob.includes("doctor")) return "doctor_note";
  if (blob.includes("lab")) return "lab_report";
  return null;
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
    case "month":
      return monthValue(photo);
    case "object_kind":
      return objectKind(photo);
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

const FOLLOW_FACETS = ["month", "object_kind", "occasion", "composition", "place", "institution", "era_bucket", "people_present"] as const;

function followOrder(intent: Intent): string[] {
  const timed = Boolean(intent.year_range || intent.age_range || intent.life_stage);
  const thing = intent.objects.length > 0 || intent.wanted_types.some((type) => type === "object" || type === "document");
  if (timed && thing) return ["month", "object_kind", "occasion", "place", "composition", "institution", "era_bucket", "people_present"];
  if (timed) return ["month", "occasion", "place", "era_bucket", "composition", "object_kind", "institution", "people_present"];
  if (thing) return ["object_kind", "month", "occasion", "place", "composition", "institution", "era_bucket", "people_present"];
  return [...FOLLOW_FACETS];
}

/** Chat follow-up. Asks even when only a handful of photos remain, as long as they actually differ. */
export function selectFollowUp(args: {
  candidates: Photo[];
  intent: Intent;
  askedFacets: string[];
  constraints: Constraint[];
  round: number;
  replyLanguage: ReplyLang;
}): Question | null {
  const { candidates, intent, round, replyLanguage } = args;
  if (candidates.length === 1) {
    return {
      facet: "confirm",
      text: questionText("confirm", replyLanguage, intent),
      options: [
        { value: "yes", count: 1, label: optionLabel("confirm", "yes", replyLanguage, intent) },
        { value: "no", count: 1, label: optionLabel("confirm", "no", replyLanguage, intent) },
      ],
      allowSkip: false,
    };
  }
  if (candidates.length < 2 || round >= 8) return null;
  const blocked = new Set<string>([...args.askedFacets, ...args.constraints.map((c) => c.facet)]);
  const order = followOrder(intent);
  let best: { facet: string; score: number; buckets: { value: string; count: number }[] } | null = null;

  for (const facet of order) {
    if (blocked.has(facet)) continue;
    if (facet === "people_present" && intent.people.length > 0) continue;
    if (facet === "month" && !intent.year_range && !intent.age_range && !intent.life_stage) continue;
    if (facet === "object_kind" && intent.objects.length === 0 && !intent.wanted_types.some((type) => type === "object" || type === "document")) continue;
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
    if (largest > 0.8) continue;
    const score = normalizedEntropy(buckets.map((b) => b.count)) * (1 - nullShare) + (order.indexOf(facet) === 0 ? 0.35 : 0);
    if (!best || score > best.score) best = { facet, score, buckets };
  }

  if (!best) return null;
  const options = best.buckets
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, 5)
    .map((b) => ({
      value: b.value,
      count: b.count,
      label: optionLabel(best.facet, b.value, replyLanguage, intent),
    }));
  if (options.length < 2) return null;
  return {
    facet: best.facet,
    text: questionText(best.facet, replyLanguage, intent),
    options,
    allowSkip: true,
  };
}
