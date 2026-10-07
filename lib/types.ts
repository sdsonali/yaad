export const PHOTO_TYPES = ["memory", "document", "screenshot", "object"] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

export type Photo = {
  id: string;
  file: string;
  type: PhotoType;
  caption_en: string;
  tags: string[];
  people: string[];
  person_count: number;
  composition: "solo" | "duo" | "group" | "none";
  occasion: string | null;
  place: string | null;
  year: number | null;
  user_age: number | null;
  source: "camera" | "scan" | "whatsapp" | "screenshot";
  objects: string[];
  text_in_image: string | null;
  institution: string | null;
  sensory_notes: string | null;
};

export type ReplyLang = "en" | "hi_deva" | "hinglish_roman";

export type Intent = {
  language: ReplyLang | "mixed";
  normalized_query_en: string;
  people: string[];
  life_stage: "childhood" | "school" | "college" | "recent" | null;
  age_range: [number, number] | null;
  year_range: [number, number] | null;
  places: string[];
  occasions: string[];
  objects: string[];
  wanted_types: PhotoType[];
  excluded_types: PhotoType[];
  solo_only: boolean | null;
  keywords: string[];
  confidence: number;
};

export type Constraint = { facet: string; value: string };

export type SearchState = {
  query: string;
  intent: Intent | null;
  constraints: Constraint[];
  askedFacets: string[];
  round: number;
  showHidden: boolean;
  excluded: string[];
};

export type QuestionOption = { label: string; value: string; count: number };

export type Question = {
  facet: string;
  text: string;
  options: QuestionOption[];
  allowSkip: boolean;
};

export type HiddenInfo = {
  count: number;
  byType: Record<string, number>;
  items: { id: string; score: number }[];
};

export type Ranked = { id: string; score: number };

export const FACETS = [
  "occasion",
  "composition",
  "place",
  "institution",
  "people_present",
  "era_bucket",
] as const;
export type Facet = (typeof FACETS)[number];

export type SearchAction =
  | { type: "answer"; facet: string; value: string }
  | { type: "skip"; facet?: string }
  | { type: "remove"; facet: string }
  | { type: "showHidden" }
  | { type: "reject"; ids: string[] };
