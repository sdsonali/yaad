import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { fallbackIntent, normalizeIntent } from "./fallbackIntent";
import type { Intent } from "./types";

const PhotoTypeSchema = z.enum(["memory", "document", "screenshot", "object"]);

export const IntentSchema = z.object({
  language: z.enum(["en", "hi_deva", "hinglish_roman", "mixed"]).default("mixed"),
  normalized_query_en: z.string().default(""),
  people: z.array(z.string()).default([]),
  life_stage: z.enum(["childhood", "school", "college", "recent"]).nullable().default(null),
  age_range: z.tuple([z.number(), z.number()]).nullable().default(null),
  year_range: z.tuple([z.number(), z.number()]).nullable().default(null),
  places: z.array(z.string()).default([]),
  occasions: z.array(z.string()).default([]),
  objects: z.array(z.string()).default([]),
  wanted_types: z.array(PhotoTypeSchema).default(["memory"]),
  excluded_types: z.array(PhotoTypeSchema).default([]),
  solo_only: z.boolean().nullable().default(null),
  keywords: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});

export const INTENT_SYSTEM_PROMPT = `You convert a photo-search request into JSON. The request may be English, Hindi (Devanagari),
Romanized Hinglish, or a mix. Users are searching their own photo library.

Output ONLY a JSON object matching the schema. No prose, no markdown fences.

Rules:
- "my / meri / mera / मेरी / मेरा" means the user themself: add "self" to people when the
  request is about the user's own photos.
- Map family terms to roles: papa/pitaji/पापा→"papa", mummy/maa/मम्मी→"mummy", behen→"sister",
  dost/friends/दोस्त→"friends".
- "childhood/bachpan/बचपन" → life_stage "childhood", age_range [3,14].
  "school" → "school", [5,17]. "college" → "college", [18,22]. "recent/haal ki" → "recent".
- Occasions: birthday/janmdin, diwali, holi, farewell, fest, shaadi/wedding, trip/ghumna.
- If the request mentions certificate/marksheet/ID/receipt/prescription/medicine/report,
  put "document" (and "object" for medicine/pills) in wanted_types. If it mentions screenshot,
  put "screenshot". Otherwise wanted_types = ["memory"].
- If the user says "only / sirf / सिर्फ़" about a person or "alone/akele", set solo_only true.
- Put words describing ambience or appearance (e.g. "blue door", "small cafe") in keywords.
- Never invent facts. Use null or [] when unknown. Set confidence lower when the request is vague.
- "last year / pichle saal / पिछले साल" relative to 2026 means year_range [2025, 2025].
- "new house / naya ghar / नया घर" means places ["delhi_home"].
- A phrase like "7th birthday" sets occasions ["birthday"] and age_range [7, 7].

Schema fields: language (en|hi_deva|hinglish_roman|mixed), normalized_query_en, people[],
life_stage (childhood|school|college|recent|null), age_range ([number,number]|null),
year_range ([number,number]|null), places[], occasions[], objects[],
wanted_types[] (memory|document|screenshot|object), excluded_types[], solo_only (boolean|null),
keywords[], confidence (0..1).`;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function defaultComplete(user: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 500,
    temperature: 0,
    system: INTENT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: user }],
  });
  const block = message.content.find((part) => part.type === "text");
  return block && block.type === "text" ? block.text : "";
}

export type ParseResult = { intent: Intent; usedFallback: boolean; reason: string | null };

export async function parseIntent(
  query: string,
  opts?: { complete?: (prompt: string) => Promise<string> },
): Promise<ParseResult> {
  const fallback = (reason: string): ParseResult => ({
    intent: fallbackIntent(query),
    usedFallback: true,
    reason,
  });

  if (!opts?.complete && !process.env.ANTHROPIC_API_KEY) return fallback("no_api_key");
  const complete = opts?.complete ?? defaultComplete;

  const attempt = async (extra: string) => {
    const text = await withTimeout(complete(extra ? `${query}\n\n${extra}` : query), 4000);
    const parsed = IntentSchema.parse(extractJson(text));
    return normalizeIntent(parsed as Intent, query);
  };

  try {
    return { intent: await attempt(""), usedFallback: false, reason: null };
  } catch (first) {
    const message = first instanceof Error ? first.message : "llm_error";
    if (message === "timeout") return fallback("timeout");
    try {
      return {
        intent: await attempt(`Your previous output failed validation (${message}). Return only corrected JSON.`),
        usedFallback: false,
        reason: null,
      };
    } catch (second) {
      const reason = second instanceof Error && second.message === "timeout" ? "timeout" : "invalid_json";
      return fallback(reason);
    }
  }
}

export async function maybeRephrase(text: string, lang: string): Promise<string> {
  if (process.env.PHRASE_WITH_LLM !== "true" || !process.env.ANTHROPIC_API_KEY) return text;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await withTimeout(
      client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 80,
        temperature: 0,
        system:
          "Rewrite the photo-search question in the same language style. Max 15 words. Do not change the meaning or add options. Return only the sentence.",
        messages: [{ role: "user", content: `Language style: ${lang}\nQuestion: ${text}` }],
      }),
      4000,
    );
    const block = message.content.find((part) => part.type === "text");
    const next = block && block.type === "text" ? block.text.trim().replace(/^"|"$/g, "") : "";
    if (!next || next.split(/\s+/).length > 15) return text;
    return next;
  } catch {
    return text;
  }
}
