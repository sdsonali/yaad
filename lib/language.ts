import type { Intent, ReplyLang } from "./types";

const HINGLISH =
  /\b(ki|ke|ka|ko|mein|wala|wali|wale|dikhao|dikha|meri|mera|mere|hai|hain|nahi|sirf|akela|akele|bachpan|mujhe|chahiye|ghar|saal|dawai|dawa)\b/i;

export function detectLanguage(raw: string): Intent["language"] {
  if (/[\u0900-\u097F]/.test(raw)) return "hi_deva";
  if (HINGLISH.test(raw)) return "hinglish_roman";
  return "en";
}

export function replyLanguageFor(query: string, modelLang: Intent["language"]): ReplyLang {
  const detected = detectLanguage(query);
  if (detected === "hi_deva" || detected === "hinglish_roman") return detected;
  if (modelLang === "hi_deva" || modelLang === "hinglish_roman" || modelLang === "en") return modelLang;
  return "en";
}

export function isRejection(text: string): boolean {
  const raw = text.toLowerCase().replace(/[’']/g, "");
  if (/यह नहीं|ये नहीं|नहीं चाहिए|यह वाली नहीं|ये वाली नहीं|गलत/.test(raw)) return true;
  const normalized = raw.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  if (normalized === "no" || normalized === "nope" || normalized === "nahi" || normalized === "nahin") return true;
  return /\bnot\b.{0,16}\b(one|it|this)\b/.test(normalized) || /\b(wrong|incorrect|galat)\b/.test(normalized);
}
