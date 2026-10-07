import { describe, expect, it } from "vitest";
import { normalizedEntropy, selectFacet } from "../lib/facets";
import type { Intent, Photo } from "../lib/types";

function photo(id: string, over: Partial<Photo> = {}): Photo {
  return {
    id,
    file: `/photos/${id}.svg`,
    type: "memory",
    caption_en: id,
    tags: [],
    people: ["self"],
    person_count: 1,
    composition: "group",
    occasion: null,
    place: null,
    year: null,
    user_age: null,
    source: "camera",
    objects: [],
    text_in_image: null,
    institution: null,
    sensory_notes: null,
    ...over,
  };
}

const intent: Intent = {
  language: "en",
  normalized_query_en: "photos",
  people: [],
  life_stage: null,
  age_range: null,
  year_range: null,
  places: [],
  occasions: [],
  objects: [],
  wanted_types: ["memory"],
  excluded_types: [],
  solo_only: null,
  keywords: [],
  confidence: 0.8,
};

function ask(candidates: Photo[], round = 0) {
  return selectFacet({ candidates, intent, askedFacets: [], constraints: [], round, replyLanguage: "en" });
}

describe("facets", () => {
  it("asks nothing when 8 or fewer candidates remain", () => {
    const photos = Array.from({ length: 8 }, (_, i) => photo(`p${i}`, { occasion: i < 4 ? "birthday" : "trip" }));
    expect(ask(photos)).toBeNull();
  });

  it("asks nothing after three rounds", () => {
    const photos = Array.from({ length: 10 }, (_, i) => photo(`p${i}`, { occasion: i < 5 ? "birthday" : "trip" }));
    expect(ask(photos, 3)).toBeNull();
  });

  it("never chooses a facet where 80% share one value", () => {
    const photos = [
      ...Array.from({ length: 8 }, (_, i) => photo(`a${i}`, { occasion: "birthday", place: i < 4 ? "goa" : "shimla" })),
      ...Array.from({ length: 2 }, (_, i) => photo(`b${i}`, { occasion: "trip", place: i === 0 ? "goa" : "shimla" })),
    ];
    const question = ask(photos);
    expect(question?.facet).toBe("place");
    expect(question?.options.map((option) => option.value)).not.toContain("birthday");
  });

  it("never chooses a facet that is mostly unknown", () => {
    const photos = [
      ...Array.from({ length: 6 }, (_, i) => photo(`n${i}`, { occasion: i < 3 ? "birthday" : "trip", place: null })),
      photo("g1", { occasion: "birthday", place: "goa" }),
      photo("g2", { occasion: "trip", place: "goa" }),
      photo("s1", { occasion: "birthday", place: "shimla" }),
      photo("s2", { occasion: "trip", place: "shimla" }),
    ];
    const question = ask(photos);
    expect(question?.facet).toBe("occasion");
    expect(question?.facet).not.toBe("place");
  });

  it("normalizes a coin flip to 1 and a sure thing to 0", () => {
    expect(normalizedEntropy([5, 5])).toBeCloseTo(1);
    expect(normalizedEntropy([10, 0])).toBe(0);
  });
});
