import { describe, expect, it } from "vitest";
import { fallbackIntent } from "../lib/fallbackIntent";
import { retrieve } from "../lib/retrieve";
import type { Photo } from "../lib/types";

function photo(id: string, over: Partial<Photo> = {}): Photo {
  return {
    id,
    file: `/photos/${id}.svg`,
    type: "memory",
    caption_en: id,
    tags: [],
    people: [],
    person_count: 0,
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

describe("retrieve", () => {
  const photos: Photo[] = [
    photo("solo", { people: ["papa"], composition: "solo", person_count: 1, caption_en: "Papa alone" }),
    photo("group", { people: ["papa", "mummy"], composition: "group", person_count: 2, caption_en: "Papa with family" }),
    photo("child", { people: ["self"], user_age: 8, type: "memory", caption_en: "childhood" }),
    photo("adult", { people: ["self"], user_age: 26, caption_en: "recent" }),
    photo("cert", { type: "document", text_in_image: "Certificate of Merit", tags: ["certificate"], institution: "DPS Delhi", year: 2008, user_age: 10 }),
    photo("shot", { type: "screenshot", text_in_image: "College notice", user_age: 20, year: 2018 }),
    photo("door", { place: "goa", tags: ["cafe", "blue", "door", "small"], sensory_notes: "small cafe, blue door, string lights", caption_en: "Small cafe blue door" }),
    photo("beach", { place: "goa", tags: ["beach"], caption_en: "Goa beach" }),
    photo("pills", { type: "object", year: 2025, objects: ["pill strip", "medicine"], tags: ["medicine"], caption_en: "medicine strip" }),
    photo("rx", { type: "document", year: 2025, objects: ["prescription"], tags: ["medicine"], text_in_image: "medicine for fever", caption_en: "prescription" }),
  ];

  it("keeps papa photos and hard-filters solo", () => {
    const intent = fallbackIntent("papa ki photos dikhao");
    const all = retrieve(photos, intent, []);
    expect(all.results.map((row) => row.id).sort()).toEqual(["group", "solo"]);
    const solo = retrieve(photos, intent, [{ facet: "composition", value: "solo" }]);
    expect(solo.results.map((row) => row.id)).toEqual(["solo"]);
  });

  it("keeps only childhood ages inside the soft margin", () => {
    const got = retrieve(photos, fallbackIntent("मुझे मेरी childhood की photos दिखाओ"), []);
    expect(got.results.map((row) => row.id)).toEqual(["child"]);
  });

  it("hides documents and screenshots on a memory query", () => {
    const got = retrieve(photos, fallbackIntent("college photos"), []);
    expect(got.results.find((row) => row.id === "shot")).toBeUndefined();
    expect(got.hidden.byType.screenshot).toBe(1);
  });

  it("ranks the blue door cafe above the beach", () => {
    const got = retrieve(photos, fallbackIntent("Goa wala small cafe blue door"), []);
    expect(got.results[0]?.id).toBe("door");
  });

  it("ranks health objects ahead of health documents", () => {
    const got = retrieve(photos, fallbackIntent("medicine photo last year"), []);
    const ids = got.results.map((row) => row.id);
    expect(ids.indexOf("pills")).toBeLessThan(ids.indexOf("rx"));
  });
});
