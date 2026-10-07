import { describe, expect, it } from "vitest";
import { fallbackIntent } from "../lib/fallbackIntent";
import { parseIntent } from "../lib/parseIntent";
import { isSpeechSupported } from "../lib/speech";
import { median } from "../lib/stats";

describe("fallback intent", () => {
  it("reads romanized hinglish for papa", () => {
    const intent = fallbackIntent("papa ki photos dikhao");
    expect(intent.language).toBe("hinglish_roman");
    expect(intent.people).toEqual(["papa"]);
    expect(intent.wanted_types).toEqual(["memory"]);
    expect(intent.solo_only).toBeNull();
  });

  it("reads a Devanagari childhood request", () => {
    const intent = fallbackIntent("मुझे मेरी childhood की photos दिखाओ");
    expect(intent.language).toBe("hi_deva");
    expect(intent.people).toContain("self");
    expect(intent.life_stage).toBe("childhood");
    expect(intent.age_range).toEqual([3, 14]);
  });

  it("treats certificates as documents only", () => {
    const intent = fallbackIntent("certificates dikhao");
    expect(intent.wanted_types).toEqual(["document"]);
    expect(intent.keywords).toContain("certificate");
  });

  it("keeps ambience words for the Goa cafe", () => {
    const intent = fallbackIntent("Goa wala small cafe blue door");
    expect(intent.places).toContain("goa");
    expect(intent.keywords).toEqual(expect.arrayContaining(["small", "cafe", "blue", "door"]));
  });

  it("maps medicine last year onto 2025 objects and documents", () => {
    const intent = fallbackIntent("medicine photo last year");
    expect(intent.objects).toContain("medicine");
    expect(intent.wanted_types).toEqual(["object", "document"]);
    expect(intent.year_range).toEqual([2025, 2025]);
    expect(intent.language).toBe("en");
  });
});

describe("parseIntent fallback", () => {
  it("still searches when the model times out", async () => {
    const result = await parseIntent("papa ki photos dikhao", {
      complete: async () => {
        throw new Error("timeout");
      },
    });
    expect(result.usedFallback).toBe(true);
    expect(result.reason).toBe("timeout");
    expect(result.intent.people).toContain("papa");
  });

  it("retries once on invalid JSON and then falls back", async () => {
    let calls = 0;
    const result = await parseIntent("college photos", {
      complete: async () => {
        calls += 1;
        return "not json";
      },
    });
    expect(calls).toBe(2);
    expect(result.usedFallback).toBe(true);
    expect(result.intent.life_stage).toBe("college");
  });
});

describe("speech support", () => {
  it("hides the mic when the browser has no recognition API", () => {
    expect(isSpeechSupported(undefined)).toBe(false);
    expect(isSpeechSupported({} as Window)).toBe(false);
  });
});

describe("stats", () => {
  it("computes a median", () => {
    expect(median([4, 1, 9])).toBe(4);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});
