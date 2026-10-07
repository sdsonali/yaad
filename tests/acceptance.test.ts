import { describe, expect, it } from "vitest";
import photosJson from "../data/photos.json";
import { fallbackIntent } from "../lib/fallbackIntent";
import { selectFacet } from "../lib/facets";
import { replyLanguageFor } from "../lib/language";
import { retrieve } from "../lib/retrieve";
import type { Photo } from "../lib/types";

const photos = photosJson as Photo[];
const byId = new Map(photos.map((photo) => [photo.id, photo]));

function candidates(ids: { id: string }[]) {
  return ids.map((row) => byId.get(row.id)!);
}

describe("acceptance on the sample library", () => {
  it("shows papa, asks solo versus others, and keeps 7 solos", () => {
    const intent = fallbackIntent("papa ki photos dikhao");
    const first = retrieve(photos, intent, []);
    expect(first.results).toHaveLength(20);
    const question = selectFacet({
      candidates: candidates(first.results),
      intent,
      askedFacets: [],
      constraints: [],
      round: 0,
      replyLanguage: "hinglish_roman",
    });
    expect(question?.facet).toBe("composition");
    expect(question?.options.find((option) => option.value === "solo")).toMatchObject({ label: "Sirf papa", count: 7 });
    const second = retrieve(photos, intent, [{ facet: "composition", value: "solo" }]);
    expect(second.results).toHaveLength(7);
    expect(second.results.every((row) => byId.get(row.id)?.composition === "solo")).toBe(true);
    expect(
      selectFacet({
        candidates: candidates(second.results),
        intent,
        askedFacets: ["composition"],
        constraints: [{ facet: "composition", value: "solo" }],
        round: 1,
        replyLanguage: "hinglish_roman",
      }),
    ).toBeNull();
  });

  it("limits childhood to ages 3–14 and asks in Devanagari", () => {
    const query = "मुझे मेरी childhood की photos दिखाओ";
    const intent = fallbackIntent(query);
    expect(replyLanguageFor(query, intent.language)).toBe("hi_deva");
    const got = retrieve(photos, intent, []);
    expect(got.results.length).toBeGreaterThan(8);
    for (const row of got.results) {
      const photo = byId.get(row.id)!;
      expect(photo.type).toBe("memory");
      expect(photo.user_age).toBeGreaterThanOrEqual(2);
      expect(photo.user_age).toBeLessThanOrEqual(15);
    }
    const question = selectFacet({
      candidates: candidates(got.results),
      intent,
      askedFacets: [],
      constraints: [],
      round: 0,
      replyLanguage: "hi_deva",
    });
    expect(question?.facet).toBe("occasion");
    expect(question?.options.map((option) => option.value)).toEqual(expect.arrayContaining(["birthday", "school_event", "trip", "festival"]));
    expect(question?.text).toMatch(/[\u0900-\u097F]/);
  });

  it("hides college documents and screenshots until show", () => {
    const got = retrieve(photos, fallbackIntent("college photos"), []);
    expect(got.results.every((row) => byId.get(row.id)?.type === "memory")).toBe(true);
    expect(got.hidden.byType.document).toBeGreaterThan(0);
    expect(got.hidden.byType.screenshot).toBeGreaterThan(0);
    expect(got.hidden.count).toBe((got.hidden.byType.document ?? 0) + (got.hidden.byType.screenshot ?? 0));
  });

  it("shows certificates, not screenshots, and asks school / college / work", () => {
    const intent = fallbackIntent("certificates dikhao");
    const got = retrieve(photos, intent, []);
    expect(got.results.length).toBeGreaterThan(8);
    expect(got.results.every((row) => byId.get(row.id)?.type === "document")).toBe(true);
    const question = selectFacet({
      candidates: candidates(got.results),
      intent,
      askedFacets: [],
      constraints: [],
      round: 0,
      replyLanguage: "hinglish_roman",
    });
    expect(question?.facet).toBe("institution");
    expect(question?.options.map((option) => option.value).sort()).toEqual(["college", "school", "work"]);
  });

  it("ranks the blue-door cafe in the top 3", () => {
    const got = retrieve(photos, fallbackIntent("Goa wala small cafe blue door"), []);
    const blue = photos.find((photo) => photo.sensory_notes?.includes("blue door"));
    expect(got.results.slice(0, 3).map((row) => row.id)).toContain(blue?.id);
  });

  it("ranks health objects before health documents", () => {
    const got = retrieve(photos, fallbackIntent("medicine photo last year"), []);
    const objectAt = got.results.map((row, index) => (byId.get(row.id)?.type === "object" ? index : -1)).filter((index) => index >= 0);
    const docs = new Set(photos.filter((photo) => photo.type === "document" && photo.year === 2025).map((photo) => photo.id));
    const docAt = got.results.map((row, index) => (docs.has(row.id) ? index : -1)).filter((index) => index >= 0);
    expect(objectAt.length).toBeGreaterThan(0);
    expect(docAt.length).toBeGreaterThan(0);
    expect(Math.max(...objectAt)).toBeLessThan(Math.min(...docAt));
  });

  it("is deterministic for the same query", () => {
    const intent = fallbackIntent("papa ki photos dikhao");
    expect(retrieve(photos, intent, [])).toEqual(retrieve(photos, intent, []));
  });

  it("answers a chip without needing another parse, quickly", () => {
    const intent = fallbackIntent("papa ki photos dikhao");
    const started = performance.now();
    retrieve(photos, intent, [{ facet: "composition", value: "solo" }]);
    expect(performance.now() - started).toBeLessThan(300);
  });
});
