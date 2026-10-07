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
