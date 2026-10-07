import { describe, expect, it } from "vitest";
import { normalizedEntropy, selectFacet, selectFollowUp } from "../lib/facets";
import { isRejection } from "../lib/language";
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

  it("asks the month, then what you saw, for last year's medicine photos", () => {
    const meds = [
      photo("ph_117", { type: "object", year: 2025, composition: "none", objects: ["pill strip", "medicine"], caption_en: "paracetamol strip" }),
      photo("ph_118", { type: "object", year: 2025, composition: "none", objects: ["pill bottle", "medicine"], caption_en: "vitamin bottle" }),
      photo("ph_119", { type: "object", year: 2025, composition: "none", objects: ["thermometer", "medicine"], caption_en: "thermometer" }),
      photo("ph_120", { type: "document", year: 2025, composition: "none", objects: ["prescription"], caption_en: "prescription slip" }),
      photo("ph_121", { type: "document", year: 2025, composition: "none", objects: ["doctor note"], caption_en: "doctor note" }),
      photo("ph_122", { type: "document", year: 2025, composition: "none", objects: ["lab report"], caption_en: "lab report" }),
    ];
    const medicine: Intent = {
      ...intent,
      year_range: [2025, 2025],
      objects: ["medicine"],
      wanted_types: ["object", "document"],
    };
    const first = selectFollowUp({ candidates: meds, intent: medicine, askedFacets: [], constraints: [], round: 0, replyLanguage: "en" });
    expect(first?.facet).toBe("month");
    expect(first?.text).toBe("Do you remember the month?");
    expect(first?.options.map((option) => option.label).sort()).toEqual(["June", "March", "November"]);
    const march = meds.filter((item) => item.id === "ph_117" || item.id === "ph_118");
    const second = selectFollowUp({
      candidates: march,
      intent: medicine,
      askedFacets: ["month"],
      constraints: [{ facet: "month", value: "3" }],
      round: 1,
      replyLanguage: "en",
    });
    expect(second?.facet).toBe("object_kind");
    expect(second?.text).toBe("What do you remember seeing?");
    expect(second?.options.map((option) => option.label).sort()).toEqual(["Bottle", "Pill strip"]);
    const one = selectFollowUp({
      candidates: [march[0]],
      intent: medicine,
      askedFacets: ["month", "object_kind"],
      constraints: [
        { facet: "month", value: "3" },
        { facet: "object_kind", value: "pill_strip" },
      ],
      round: 2,
      replyLanguage: "en",
    });
    expect(one?.facet).toBe("confirm");
    expect(one?.text).toBe("Is this the one?");
    expect(one?.options.map((option) => option.label)).toEqual(["Yes, this is it", "No, keep looking"]);
    expect(one?.allowSkip).toBe(false);
    expect(isRejection("this is not he one")).toBe(true);
    expect(isRejection("this is not the one")).toBe(true);
  });

  it("normalizes a coin flip to 1 and a sure thing to 0", () => {
    expect(normalizedEntropy([5, 5])).toBeCloseTo(1);
    expect(normalizedEntropy([10, 0])).toBe(0);
  });
});
