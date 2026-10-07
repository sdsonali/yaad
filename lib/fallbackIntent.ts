import { detectLanguage } from "./language";
import { unique } from "./text";
import type { Intent, PhotoType } from "./types";

const STOP = new Set([
  "the", "a", "an", "of", "to", "for", "in", "on", "at", "and", "or", "with", "from", "your", "you",
  "me", "find", "show", "photos", "photo", "pics", "pic", "image", "images", "please", "plz",
  "dikhao", "dikha", "dikhado", "do", "ki", "ke", "ka", "ko", "mein", "main", "se", "aur", "wala",
  "wali", "wale", "hai", "hain", "nahi", "bhi", "wo", "woh", "yeh", "ye", "this", "that", "when",
  "just", "had", "have", "was", "were", "into", "about", "some", "my",
  "की", "के", "का", "को", "में", "से", "और", "दिखाओ", "दिखा", "वाला", "वाली", "वाले", "है", "हैं",
  "भी", "यह", "ये", "वो", "नहीं",
]);

type Patch = Partial<{
  person: string;
  self: true;
  life: Intent["life_stage"];
  occasion: string;
  place: string;
  object: string;
  wanted: PhotoType[];
  solo: true;
  stop: true;
}>;

const DICT: Record<string, Patch> = {
  papa: { person: "papa" },
  pitaji: { person: "papa" },
  father: { person: "papa" },
  dad: { person: "papa" },
  पापा: { person: "papa" },
  mummy: { person: "mummy" },
  mama: { person: "mummy" },
  maa: { person: "mummy" },
  mom: { person: "mummy" },
  mother: { person: "mummy" },
  मम्मी: { person: "mummy" },
  behen: { person: "sister" },
  sister: { person: "sister" },
  diya: { person: "sister" },
  दीया: { person: "sister" },
  karan: { person: "karan" },
  neha: { person: "neha" },
  rohit: { person: "rohit" },
  dost: { person: "friends" },
  dosto: { person: "friends" },
  friend: { person: "friends" },
  friends: { person: "friends" },
  दोस्त: { person: "friends" },
  meri: { self: true },
  mera: { self: true },
  mere: { self: true },
  mujhe: { self: true },
  apni: { self: true },
  apna: { self: true },
  apne: { self: true },
  मेरी: { self: true },
  मेरा: { self: true },
  मेरे: { self: true },
  मुझे: { self: true },
  अपनी: { self: true },
  अपना: { self: true },
  childhood: { life: "childhood" },
  bachpan: { life: "childhood" },
  बचपन: { life: "childhood" },
  school: { life: "school" },
  स्कूल: { life: "school" },
  college: { life: "college" },
  कॉलेज: { life: "college" },
  recent: { life: "recent" },
  haal: { life: "recent" },
  birthday: { occasion: "birthday" },
  janmdin: { occasion: "birthday" },
  जन्मदिन: { occasion: "birthday" },
  diwali: { occasion: "diwali" },
  दिवाली: { occasion: "diwali" },
  holi: { occasion: "holi" },
  होली: { occasion: "holi" },
  farewell: { occasion: "farewell" },
  vidaai: { occasion: "farewell" },
  विदाई: { occasion: "farewell" },
  trip: { occasion: "trip" },
  trips: { occasion: "trip" },
  ghumna: { occasion: "trip" },
  wedding: { occasion: "wedding" },
  shaadi: { occasion: "wedding" },
  शादी: { occasion: "wedding" },
  goa: { place: "goa" },
  गोवा: { place: "goa" },
  shimla: { place: "shimla" },
  शिमला: { place: "shimla" },
  jaipur: { place: "jaipur" },
  जयपुर: { place: "jaipur" },
  certificate: { wanted: ["document"] },
  certificates: { wanted: ["document"] },
  प्रमाणपत्र: { wanted: ["document"] },
  marksheet: { wanted: ["document"] },
  marksheets: { wanted: ["document"] },
  screenshot: { wanted: ["screenshot"] },
  screenshots: { wanted: ["screenshot"] },
  medicine: { object: "medicine", wanted: ["object", "document"] },
  medicines: { object: "medicine", wanted: ["object", "document"] },
  pill: { object: "medicine", wanted: ["object", "document"] },
  pills: { object: "medicine", wanted: ["object", "document"] },
  tablet: { object: "medicine", wanted: ["object", "document"] },
  tablets: { object: "medicine", wanted: ["object", "document"] },
  dawai: { object: "medicine", wanted: ["object", "document"] },
  dawa: { object: "medicine", wanted: ["object", "document"] },
  दवा: { object: "medicine", wanted: ["object", "document"] },
  दवाई: { object: "medicine", wanted: ["object", "document"] },
  prescription: { object: "prescription", wanted: ["document", "object"] },
  sirf: { solo: true },
  only: { solo: true },
  alone: { solo: true },
  akela: { solo: true },
  akele: { solo: true },
  सिर्फ: { solo: true },
  सिर्फ़: { solo: true },
  अकेले: { solo: true },
  my: { self: true },
  café: { stop: true },
  cafe: { stop: true },
};

const LIFE_AGE: Record<Exclude<Intent["life_stage"], null>, [number, number] | null> = {
  childhood: [3, 14],
  school: [5, 17],
  college: [18, 22],
  recent: null,
};

function gloss(intent: Intent): string {
  const bits = [
    ...intent.people,
    intent.life_stage ?? "",
    ...intent.occasions,
    ...intent.places,
    ...intent.objects,
    ...intent.keywords,
  ].filter(Boolean);
  return bits.join(" ") || "photo search";
}

export function normalizeIntent(input: Intent, raw = ""): Intent {
  const people = unique(
    input.people.map((p) => {
      const key = p.toLowerCase();
      return DICT[key]?.person ?? (DICT[key]?.self ? "self" : key);
    }),
  );
  const life = input.life_stage;
  let age = input.age_range;
  let year = input.year_range;
  if (life && !age && LIFE_AGE[life]) age = LIFE_AGE[life];
  if (life === "recent" && !year) year = [2024, 2026];
  const wanted = input.wanted_types?.length ? unique(input.wanted_types) : ["memory"];
  const intent: Intent = {
    language: input.language || detectLanguage(raw),
    normalized_query_en: input.normalized_query_en || "",
    people,
    life_stage: life ?? null,
    age_range: age,
    year_range: year,
    places: unique(input.places),
    occasions: unique(input.occasions),
    objects: unique(input.objects),
    wanted_types: wanted as PhotoType[],
    excluded_types: unique(input.excluded_types ?? []) as PhotoType[],
    solo_only: input.solo_only ?? null,
    keywords: unique(input.keywords).filter((k) => !STOP.has(k) && !DICT[k]?.person && !DICT[k]?.occasion),
    confidence: Math.min(1, Math.max(0, input.confidence ?? 0.5)),
  };
  if (!intent.normalized_query_en) intent.normalized_query_en = gloss(intent);
  return intent;
}

export function fallbackIntent(raw: string): Intent {
  const original = raw.trim();
  const lower = original.toLowerCase();
  const people: string[] = [];
  const places: string[] = [];
  const occasions: string[] = [];
  const objects: string[] = [];
  const keywords: string[] = [];
  let life: Intent["life_stage"] = null;
  let age: [number, number] | null = null;
  let year: [number, number] | null = null;
  let solo: boolean | null = null;
  let wanted: PhotoType[] | null = null;
  const consumed = new Set<string>();

  if (/new house|naya ghar|नया घर|नये घर/.test(lower)) {
    places.push("delhi_home");
    ["new", "house", "naya", "ghar"].forEach((w) => consumed.add(w));
  }
  if (/last year|pichle saal|pichhle saal|पिछले साल|पिछला साल/.test(lower)) {
    year = [2025, 2025];
    ["last", "year", "pichle", "pichhle", "saal"].forEach((w) => consumed.add(w));
  }
  const birthdayAge = lower.match(/(\d+)\s*(st|nd|rd|th)?\s*(birthday|janmdin)/);
  if (birthdayAge) {
    occasions.push("birthday");
    const n = Number(birthdayAge[1]);
    if (n > 0 && n < 80) age = [n, n];
  }
  if (/\bcollege fest\b/.test(lower)) occasions.push("college_fest");
  else if (/\bfest\b/.test(lower) && /\bcollege\b/.test(lower)) occasions.push("college_fest");

  const tokens = original.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
  for (const tok of tokens) {
    const t = tok.toLowerCase();
    if (consumed.has(t)) continue;
    const patch = DICT[t] ?? DICT[tok];
    if (!patch) {
      if (!STOP.has(t) && !STOP.has(tok) && t.length > 1) keywords.push(t);
      continue;
    }
    if (patch.stop) {
      keywords.push(t === "café" ? "cafe" : t);
      continue;
    }
    if (patch.person) people.push(patch.person);
    if (patch.self) people.push("self");
    if (patch.life) life = patch.life;
    if (patch.occasion) occasions.push(patch.occasion);
    if (patch.place) places.push(patch.place);
    if (patch.object) {
      objects.push(patch.object);
      keywords.push(patch.object);
    }
    if (patch.wanted) wanted = patch.wanted;
    if (patch.solo) solo = true;
    if (patch.wanted?.includes("document") && (t.startsWith("certificate") || tok === "प्रमाणपत्र")) {
      keywords.push("certificate");
    }
  }

  const known = people.length + places.length + occasions.length + objects.length + (life ? 1 : 0);
  return normalizeIntent(
    {
      language: detectLanguage(original),
      normalized_query_en: "",
      people,
      life_stage: life,
      age_range: age,
      year_range: year,
      places,
      occasions,
      objects,
      wanted_types: wanted ?? ["memory"],
      excluded_types: [],
      solo_only: solo,
      keywords,
      confidence: known ? 0.84 : keywords.length ? 0.5 : 0.35,
    },
    original,
  );
}
