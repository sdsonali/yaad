import { labels } from "../data/labels";
import libraryJson from "../data/photos.json";
import { selectFacet } from "./facets";
import { replyLanguageFor } from "./language";
import { classicSearch, retrieve } from "./retrieve";
import type { Intent, Photo, Question, Ranked, ReplyLang, SearchAction, SearchState } from "./types";

export const library = libraryJson as Photo[];
const byId = new Map(library.map((photo) => [photo.id, photo]));

function withExtra(extra: Photo[]) {
  if (!extra.length) return { photos: library, index: byId };
  const photos = [...extra, ...library];
  return { photos, index: new Map(photos.map((photo) => [photo.id, photo])) };
}

export function emptyState(): SearchState {
  return { query: "", intent: null, constraints: [], askedFacets: [], round: 0, showHidden: false };
}

export function reduceState(prev: SearchState | null, action: SearchAction | undefined, intent?: Intent, query?: string): SearchState {
  if (query != null) {
    return {
      query,
      intent: intent ?? null,
      constraints: [],
      askedFacets: [],
      round: 0,
      showHidden: false,
    };
  }
  const state = prev ?? emptyState();
  if (!action) return state;
  if (action.type === "showHidden") return { ...state, showHidden: true };
  if (action.type === "remove") {
    return {
      ...state,
      constraints: state.constraints.filter((c) => c.facet !== action.facet),
      askedFacets: state.askedFacets.filter((facet) => facet !== action.facet),
      round: Math.max(0, state.round - 1),
      showHidden: false,
    };
  }
  if (action.type === "skip") {
    const facet = action.facet;
    if (!facet || state.askedFacets.includes(facet)) return state;
    return { ...state, askedFacets: [...state.askedFacets, facet], round: state.round + 1 };
  }
  const without = state.constraints.filter((c) => c.facet !== action.facet);
  return {
    ...state,
    constraints: [...without, { facet: action.facet, value: action.value }],
    askedFacets: state.askedFacets.includes(action.facet) ? state.askedFacets : [...state.askedFacets, action.facet],
    round: state.round + 1,
    showHidden: false,
  };
}

export type RetrievalView = {
  results: Ranked[];
  hidden: { count: number; byType: Record<string, number> };
  question: Question | null;
  assistantText: string;
  replyLanguage: ReplyLang;
};

export function viewFor(state: SearchState, mode: "assist" | "classic", extra: Photo[] = []): RetrievalView {
  const { photos, index } = withExtra(extra);
  if (mode === "classic") {
    const results = classicSearch(photos, state.query);
    return {
      results,
      hidden: { count: 0, byType: {} },
      question: null,
      assistantText: "",
      replyLanguage: "en",
    };
  }
  if (!state.intent) {
    return { results: [], hidden: { count: 0, byType: {} }, question: null, assistantText: "", replyLanguage: "en" };
  }
  const lang = replyLanguageFor(state.query, state.intent.language);
  const retrieved = retrieve(photos, state.intent, state.constraints);
  const candidates = retrieved.results.map((row) => index.get(row.id)).filter((photo): photo is Photo => Boolean(photo));
  const question = selectFacet({
    candidates,
    intent: state.intent,
    askedFacets: state.askedFacets,
    constraints: state.constraints,
    round: state.round,
    replyLanguage: lang,
  });
  const results = state.showHidden ? [...retrieved.results, ...retrieved.hidden.items] : retrieved.results;
  const assistantText = question ? question.text : results.length ? labels.here[lang] : labels.zero[lang];
  return {
    results,
    hidden: { count: retrieved.hidden.count, byType: retrieved.hidden.byType },
    question,
    assistantText,
    replyLanguage: lang,
  };
}

export function currentQuestionFacet(state: SearchState, extra: Photo[] = []): string | null {
  if (!state.intent) return null;
  const { photos, index } = withExtra(extra);
  const lang = replyLanguageFor(state.query, state.intent.language);
  const retrieved = retrieve(photos, state.intent, state.constraints);
  const candidates = retrieved.results.map((row) => index.get(row.id)).filter((photo): photo is Photo => Boolean(photo));
  return selectFacet({
    candidates,
    intent: state.intent,
    askedFacets: state.askedFacets,
    constraints: state.constraints,
    round: state.round,
    replyLanguage: lang,
  })?.facet ?? null;
}
