import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fallbackIntent } from "../lib/fallbackIntent";
import { selectFacet } from "../lib/facets";
import { replyLanguageFor } from "../lib/language";
import { retrieve } from "../lib/retrieve";
import type { Photo } from "../lib/types";
import {
  collegeGroup,
  family,
  papaFamily,
  papaFriends,
  papaSolo,
  renderScene,
  type Scene,
} from "./renderScene";

const root = path.join(__dirname, "..");
const photos: Photo[] = [];
const scenes: Scene[] = [];
const targets: Record<string, string> = {};

function add(photo: Omit<Photo, "id" | "file">, scene: Scene, target?: string) {
  const id = `ph_${String(photos.length + 1).padStart(3, "0")}`;
  photos.push({ ...photo, id, file: `/photos/${id}.svg` });
  scenes.push(scene);
  if (target) targets[target] = id;
}

function mem(partial: Partial<Photo> & { caption_en: string }, scene: Scene, target?: string) {
  add(
    {
      type: "memory",
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
      ...partial,
    },
    scene,
    target,
  );
}

const childPeople = ["self", "mummy", "sister"];

const birthdays: { age: number; cake: string; target?: string; sensory?: string; tag?: string }[] = [
  { age: 3, cake: "#d4534a" },
  { age: 5, cake: "#e2a23a" },
  { age: 7, cake: "#2563eb", target: "T3", sensory: "blue cake, candles, 7th birthday", tag: "blue" },
  { age: 7, cake: "#e36aa2", sensory: "pink cake, 7th birthday, candles", tag: "pink" },
  { age: 8, cake: "#16a34a" },
  { age: 10, cake: "#7c3aed" },
  { age: 9, cake: "#ea580c" },
  { age: 8, cake: "#0f766e" },
  { age: 10, cake: "#b45309" },
  { age: 9, cake: "#be185d" },
];

birthdays.forEach((item, index) => {
  mem(
    {
      caption_en: `Aarav's ${item.age}th birthday, ${item.tag ?? "colourful"} cake and candles`,
      tags: ["birthday", "cake", "candles", String(item.age), ...(item.tag ? [item.tag] : [])],
      people: childPeople,
      person_count: 3,
      composition: "group",
      occasion: "birthday",
      user_age: item.age,
      source: "scan",
      sensory_notes: item.sensory ?? null,
    },
    { kind: "memory", motif: "birthday", scan: true, people: family(true), cake: item.cake, age: item.age, seed: index },
    item.target,
  );
});

[8, 9, 10, 8, 9, 10].forEach((age, index) => {
  mem(
    {
      caption_en: `School annual day when Aarav was ${age}, on stage with Mummy and Diya`,
      tags: ["school", "annual", "stage", "childhood"],
      people: childPeople,
      person_count: 3,
      composition: "group",
      occasion: "school_event",
      user_age: age,
      source: "scan",
    },
    { kind: "memory", motif: "school", scan: true, people: family(true), seed: index },
  );
});

[
  { age: 8, motif: "diwali", occasion: "diwali" },
  { age: 9, motif: "diwali", occasion: "diwali" },
  { age: 7, motif: "diwali", occasion: "diwali" },
  { age: 10, motif: "holi", occasion: "holi" },
  { age: 8, motif: "holi", occasion: "holi" },
  { age: 4, motif: "holi", occasion: "holi" },
].forEach((item, index) => {
  mem(
    {
      caption_en: item.occasion === "diwali" ? `Childhood Diwali at the old house, diyas and rangoli, age ${item.age}` : `Holi in the courtyard when Aarav was ${item.age}`,
      tags: [item.occasion, "festival", "childhood", "family"],
      people: childPeople,
      person_count: 3,
      composition: "group",
      occasion: item.occasion,
      user_age: item.age,
      source: "scan",
    },
    { kind: "memory", motif: item.motif, scan: true, people: family(true), seed: index },
  );
});

[
  { age: 9, place: "shimla", motif: "shimla" },
  { age: 8, place: "shimla", motif: "shimla" },
  { age: 10, place: "shimla", motif: "shimla" },
  { age: 7, place: "jaipur", motif: "jaipur" },
  { age: 6, place: "jaipur", motif: "jaipur" },
].forEach((item, index) => {
  mem(
    {
      caption_en: `Family trip to ${item.place === "shimla" ? "Shimla" : "Jaipur"} when Aarav was ${item.age}`,
      tags: ["trip", item.place, "family", "childhood"],
      people: childPeople,
      person_count: 3,
      composition: "group",
      occasion: "trip",
      place: item.place,
      user_age: item.age,
      source: "scan",
    },
    { kind: "memory", motif: item.motif, scan: true, people: family(true), seed: index },
  );
});

[
  { age: 8, motif: "park", caption: "Aarav at a neighbourhood park with Mummy and Diya" },
  { age: 9, motif: "home", caption: "Afternoon at the old Delhi house, Aarav with Mummy and Diya" },
  { age: 5, motif: "rain", caption: "Rainy day on the balcony when Aarav was little" },
].forEach((item, index) => {
  mem(
    {
      caption_en: item.caption,
      tags: ["childhood", "family", "home"],
      people: childPeople,
      person_count: 3,
      composition: "group",
      user_age: item.age,
      source: "scan",
    },
    { kind: "memory", motif: item.motif, scan: true, people: family(true), seed: index },
  );
});

const solos: { motif: string; caption: string; tags: string[]; sensory?: string; target?: string }[] = [
  { motif: "papa_function", caption: "Papa alone at a family function, marigold garlands and diyas behind him", tags: ["papa", "solo", "family", "function", "garland"], sensory: "family function, garlands, diyas, papa alone", target: "T1" },
  { motif: "papa_news", caption: "Papa alone in an armchair reading the newspaper", tags: ["papa", "solo", "newspaper"] },
  { motif: "papa_office", caption: "Papa alone at his office desk", tags: ["papa", "solo", "office"] },
  { motif: "papa_park", caption: "Papa alone on a morning walk in the park", tags: ["papa", "solo", "park"] },
  { motif: "papa_cook", caption: "Papa alone cooking in the kitchen", tags: ["papa", "solo", "kitchen"] },
  { motif: "papa_car", caption: "Papa alone in the driver seat of the car", tags: ["papa", "solo", "car"] },
  { motif: "papa_balcony", caption: "Papa alone on the balcony with a cup of tea", tags: ["papa", "solo", "tea", "balcony"] },
];
solos.forEach((item, index) => {
  mem(
    {
      caption_en: item.caption,
      tags: item.tags,
      people: ["papa"],
      person_count: 1,
      composition: "solo",
      source: "camera",
      sensory_notes: item.sensory ?? null,
    },
    { kind: "memory", motif: item.motif, people: papaSolo(), seed: index },
    item.target,
  );
});

for (let i = 0; i < 6; i += 1) {
  mem(
    {
      caption_en: "Papa with Mummy, Aarav and Diya together at home",
      tags: ["papa", "family", "group", "mummy", "diya"],
      people: ["papa", "mummy", "self", "sister"],
      person_count: 4,
      composition: "group",
      source: "camera",
    },
    { kind: "memory", motif: "papa_family", people: papaFamily(), seed: i },
  );
}

for (let i = 0; i < 7; i += 1) {
  mem(
    {
      caption_en: "Papa in a large group with his friends Karan and Rohit's uncle's circle",
      tags: ["papa", "friends", "group"],
      people: ["papa", "friends", "karan", "rohit"],
      person_count: 6,
      composition: "group",
      source: "camera",
    },
    { kind: "memory", motif: "papa_friends", people: papaFriends(), seed: i },
  );
}

const collegePeople = ["self", "karan", "neha", "rohit", "friends"];
const collegePlan: { occasion: string | null; motif: string; caption: string; group?: boolean; target?: string }[] = [
  ...Array.from({ length: 6 }, () => ({ occasion: "college_fest", motif: "college_fest", caption: "College fest night, Aarav with Karan, Neha and Rohit", group: true })),
  ...Array.from({ length: 5 }, () => ({ occasion: "hostel", motif: "hostel", caption: "Hostel corridor during college, Aarav and friends", group: true })),
  ...Array.from({ length: 4 }, () => ({ occasion: "canteen", motif: "canteen", caption: "College canteen lunch with friends", group: true })),
  { occasion: "farewell", motif: "farewell", caption: "Group photo from the college farewell, Aarav with Karan, Neha and Rohit", group: true, target: "T2" },
  { occasion: "farewell", motif: "farewell", caption: "Aarav alone at the microphone during college farewell", group: false },
  { occasion: "farewell", motif: "farewell", caption: "Aarav and Neha at the college farewell cake table", group: false },
  { occasion: "farewell", motif: "farewell", caption: "Aarav giving the farewell speech alone on stage", group: false },
  { occasion: "farewell", motif: "farewell", caption: "Aarav and Karan after the college farewell", group: false },
  ...Array.from({ length: 4 }, () => ({ occasion: null, motif: "hangout", caption: "Weekend hangout during college with friends", group: true })),
];

collegePlan.forEach((item, index) => {
  const year = item.target ? 2020 : [2016, 2017, 2018, 2019, 2020][index % 5];
  const group = item.group !== false;
  mem(
    {
      caption_en: item.caption,
      tags: ["college", "campus", "friends", ...(item.occasion ? [item.occasion] : ["hangout"])],
      people: group ? collegePeople : index % 2 ? ["self", "neha"] : ["self"],
      person_count: group ? 4 : index % 2 ? 2 : 1,
      composition: group ? "group" : index % 2 ? "duo" : "solo",
      occasion: item.occasion,
      place: "campus",
      year,
      user_age: year - 1998,
      source: "camera",
    },
    { kind: "memory", motif: item.motif, people: group ? collegeGroup() : index % 2 ? [{ role: "self", x: 150, h: 240 }, { role: "neha", x: 250, h: 220 }] : [{ role: "self", x: 200, h: 280 }], seed: index },
    item.target,
  );
});

function paperDoc(input: {
  caption: string;
  tags: string[];
  institution: string | null;
  year: number;
  age: number;
  kicker: string;
  lines: string[];
  objects?: string[];
}) {
  const text = [input.kicker, ...input.lines].join("\n");
  add(
    {
      type: "document",
      caption_en: input.caption,
      tags: input.tags,
      people: [],
      person_count: 0,
      composition: "none",
      occasion: input.tags.includes("certificate") ? "certificate" : input.tags.includes("medical") ? "medical" : null,
      place: null,
      year: input.year,
      user_age: input.age,
      source: "scan",
      objects: input.objects ?? [],
      text_in_image: text,
      institution: input.institution,
      sensory_notes: null,
    },
    { kind: "paper", variant: "doc", kicker: input.kicker, lines: input.lines },
  );
}

[
  ["Sports Day award", 2004, 6],
  ["Science fair prize", 2006, 8],
  ["Class monitor honour", 2008, 10],
  ["Annual merit certificate", 2009, 11],
].forEach(([title, year, age]) => {
  paperDoc({
    caption: `School certificate for Aarav Sharma, ${title}, DPS Delhi`,
    tags: ["certificate", "school", "dps"],
    institution: "DPS Delhi",
    year: year as number,
    age: age as number,
    kicker: "DPS Delhi",
    lines: ["SCHOOL", "Certificate of Merit", "Aarav Sharma", String(title), String(year)],
  });
});

[
  ["Fest volunteer", 2017, 19],
  ["Dean's list", 2018, 20],
  ["Seminar completion", 2019, 21],
].forEach(([title, year, age]) => {
  paperDoc({
    caption: `College certificate for Aarav Sharma, ${title}, Delhi University`,
    tags: ["certificate", "college", "university"],
    institution: "Delhi University",
    year: year as number,
    age: age as number,
    kicker: "Delhi University",
    lines: ["COLLEGE", "Certificate", "Aarav Sharma", String(title), String(year)],
  });
});

[
  ["Onboarding completion", 2023, 25],
  ["Cloud course completion", 2024, 26],
].forEach(([title, year, age]) => {
  paperDoc({
    caption: `Work certificate for Aarav Sharma, ${title}, TCS Delhi`,
    tags: ["certificate", "work", "course"],
    institution: "TCS Delhi",
    year: year as number,
    age: age as number,
    kicker: "TCS Delhi",
    lines: ["WORK", "Certificate of Completion", "Aarav Sharma", String(title), String(year)],
  });
});

paperDoc({
  caption: "School marksheet for Aarav Sharma, DPS Delhi",
  tags: ["marksheet", "school", "dps"],
  institution: "DPS Delhi",
  year: 2007,
  age: 9,
  kicker: "DPS Delhi",
  lines: ["MARKSHEET", "Class 6 result", "Aarav Sharma", "DPS Delhi", "2007"],
});
paperDoc({
  caption: "College marksheet for Aarav Sharma, Delhi University",
  tags: ["marksheet", "college"],
  institution: "Delhi University",
  year: 2019,
  age: 21,
  kicker: "Delhi University",
  lines: ["MARKSHEET", "Semester result", "Aarav Sharma", "Delhi University", "2019"],
});
paperDoc({
  caption: "School identity card for Aarav Sharma, DPS Delhi",
  tags: ["id", "school", "dps"],
  institution: "DPS Delhi",
  year: 2012,
  age: 14,
  kicker: "DPS Delhi",
  lines: ["IDENTITY CARD", "Student", "Aarav Sharma", "DPS Delhi", "2012"],
});

function phoneShot(input: { caption: string; tags: string[]; lines: string[]; year: number; age: number; place?: string | null; variant: string }) {
  add(
    {
      type: "screenshot",
      caption_en: input.caption,
      tags: input.tags,
      people: [],
      person_count: 0,
      composition: "none",
      occasion: null,
      place: input.place ?? null,
      year: input.year,
      user_age: input.age,
      source: "screenshot",
      objects: [],
      text_in_image: input.lines.join("\n"),
      institution: null,
      sensory_notes: null,
    },
    { kind: "phone", variant: input.variant, lines: input.lines },
  );
}

[
  ["Annual fest schedule", 2017, 19],
  ["Exam seating plan", 2018, 20],
  ["Hostel allotment", 2018, 20],
  ["Workshop signup", 2019, 21],
].forEach(([title, year, age]) => {
  phoneShot({
    caption: `Screenshot of a college notice: ${title}`,
    tags: ["screenshot", "college", "notice"],
    lines: ["COLLEGE NOTICE", String(title), "Delhi University", String(year)],
    year: year as number,
    age: age as number,
    variant: "notice",
  });
});

phoneShot({ caption: "WhatsApp chat with Karan about reaching the hostel", tags: ["screenshot", "whatsapp", "chat"], lines: ["WhatsApp", "Karan: reaching hostel", "Neha: on my way"], year: 2021, age: 23, variant: "chat" });
phoneShot({ caption: "WhatsApp chat planning a Sunday outing", tags: ["screenshot", "whatsapp", "chat"], lines: ["WhatsApp", "Rohit: Sunday plan?", "Aarav: let's go"], year: 2022, age: 24, variant: "chat" });
phoneShot({ caption: "WhatsApp chat with a forwarded joke", tags: ["screenshot", "whatsapp", "chat"], lines: ["WhatsApp", "Forwarded", "Did you see this?"], year: 2023, age: 25, variant: "chat" });
phoneShot({ caption: "Screenshot of a masala chai recipe", tags: ["screenshot", "recipe"], lines: ["Recipe", "Masala chai", "Milk, ginger, tea"], year: 2021, age: 23, variant: "recipe" });
phoneShot({ caption: "Screenshot of a pasta recipe", tags: ["screenshot", "recipe"], lines: ["Recipe", "Tomato pasta", "Garlic and basil"], year: 2022, age: 24, variant: "recipe" });
phoneShot({ caption: "Screenshot of a train ticket from Delhi to Goa", tags: ["screenshot", "ticket", "goa"], lines: ["TRAIN TICKET", "Delhi to Goa", "March 2023"], year: 2023, age: 25, place: "goa", variant: "ticket" });
phoneShot({ caption: "Screenshot of a movie ticket", tags: ["screenshot", "ticket"], lines: ["MOVIE TICKET", "Evening show", "PVR Delhi"], year: 2022, age: 24, variant: "ticket" });
phoneShot({ caption: "Screenshot of a college meme about assignments", tags: ["screenshot", "meme"], lines: ["When the assignment", "is due tomorrow"], year: 2020, age: 22, variant: "meme" });
phoneShot({ caption: "Screenshot of a meme about Monday mornings", tags: ["screenshot", "meme"], lines: ["Monday morning", "again"], year: 2021, age: 23, variant: "meme" });
phoneShot({ caption: "Screenshot of a meme Neha sent", tags: ["screenshot", "meme"], lines: ["Neha sent this", "too real"], year: 2022, age: 24, variant: "meme" });

const goaPeople = ["self", "karan", "neha", "friends"];
for (let i = 0; i < 5; i += 1) {
  mem(
    {
      caption_en: "Aarav with Karan and Neha on a Goa beach",
      tags: ["goa", "beach", "sea", "trip"],
      people: goaPeople,
      person_count: 3,
      composition: "group",
      occasion: "beach",
      place: "goa",
      year: 2023,
      user_age: 25,
      source: "camera",
      sensory_notes: "wide beach, sand, sea",
    },
    { kind: "memory", motif: "beach", people: collegeGroup().slice(0, 3), seed: i },
  );
}
for (let i = 0; i < 4; i += 1) {
  mem(
    {
      caption_en: "Sunset over the sea on the Goa trip",
      tags: ["goa", "sunset", "beach", "trip"],
      people: goaPeople,
      person_count: 3,
      composition: "group",
      occasion: "beach",
      place: "goa",
      year: 2023,
      user_age: 25,
      source: "camera",
      sensory_notes: "orange sunset, sea horizon",
    },
    { kind: "memory", motif: "sunset", people: collegeGroup().slice(0, 3), seed: i },
  );
}
for (let i = 0; i < 4; i += 1) {
  mem(
    {
      caption_en: "Dinner on the Goa trip, thali and cold drinks",
      tags: ["goa", "food", "dinner", "trip"],
      people: goaPeople,
      person_count: 3,
      composition: "group",
      occasion: "food",
      place: "goa",
      year: 2023,
      user_age: 25,
      source: "camera",
      sensory_notes: "thali, dinner table",
    },
    { kind: "memory", motif: "food", people: collegeGroup().slice(0, 3), seed: i },
  );
}

mem(
  {
    caption_en: "Small cafe in Goa with a blue door and string lights",
    tags: ["goa", "cafe", "blue", "door", "small", "trip"],
    people: goaPeople,
    person_count: 3,
    composition: "group",
    occasion: "cafe",
    place: "goa",
    year: 2023,
    user_age: 25,
    source: "camera",
    sensory_notes: "small cafe, blue door, string lights",
  },
  { kind: "memory", motif: "cafe_blue", people: collegeGroup().slice(0, 3), seed: 1 },
  "T4",
);
mem(
  {
    caption_en: "Rooftop cafe in Goa with a city view",
    tags: ["goa", "cafe", "rooftop", "trip"],
    people: goaPeople,
    person_count: 3,
    composition: "group",
    occasion: "cafe",
    place: "goa",
    year: 2023,
    user_age: 25,
    source: "camera",
    sensory_notes: "rooftop cafe, city view, evening",
  },
  { kind: "memory", motif: "cafe_roof", people: collegeGroup().slice(0, 3), seed: 2 },
);
mem(
  {
    caption_en: "Beach shack cafe in Goa with a thatched roof",
    tags: ["goa", "cafe", "shack", "beach", "trip"],
    people: goaPeople,
    person_count: 3,
    composition: "group",
    occasion: "cafe",
    place: "goa",
    year: 2023,
    user_age: 25,
    source: "camera",
    sensory_notes: "beach shack, thatched roof, sand",
  },
  { kind: "memory", motif: "cafe_shack", people: collegeGroup().slice(0, 3), seed: 3 },
);

function healthObject(variant: "pills" | "bottle" | "thermo", caption: string, objects: string[], tags: string[], target?: string) {
  add(
    {
      type: "object",
      caption_en: caption,
      tags,
      people: [],
      person_count: 0,
      composition: "none",
      occasion: "medical",
      place: null,
      year: 2025,
      user_age: 27,
      source: "camera",
      objects,
      text_in_image: variant === "pills" ? "PARACETAMOL 500 medicine strip" : caption,
      institution: null,
      sensory_notes: null,
    },
    { kind: "object", variant },
    target,
  );
}

healthObject("pills", "Blister strip of paracetamol Aarav took while ill", ["pill strip", "medicine"], ["medicine", "pill", "paracetamol", "illness"], "T5");
healthObject("bottle", "Vitamin bottle from the same illness, not the fever medicine", ["pill bottle", "medicine"], ["medicine", "bottle", "vitamin"]);
healthObject("thermo", "Thermometer used while Aarav was ill", ["thermometer", "medicine"], ["medicine", "thermometer", "fever"]);

paperDoc({
  caption: "Prescription slip for fever medicine, Dr Mehta, 2025",
  tags: ["prescription", "medicine", "fever"],
  institution: null,
  year: 2025,
  age: 27,
  kicker: "City Clinic",
  lines: ["PRESCRIPTION", "Paracetamol 500mg", "medicine for fever", "Aarav Sharma", "2025"],
  objects: ["prescription"],
});
paperDoc({
  caption: "Doctor's note advising rest and medicine, 2025",
  tags: ["doctor", "medicine", "note"],
  institution: null,
  year: 2025,
  age: 27,
  kicker: "City Clinic",
  lines: ["DOCTOR NOTE", "Aarav Sharma was ill", "medicine advised", "Rest for 3 days", "2025"],
  objects: ["doctor note"],
});
paperDoc({
  caption: "Lab report after the fever, medicine follow-up, 2025",
  tags: ["lab", "report", "medicine"],
  institution: null,
  year: 2025,
  age: 27,
  kicker: "Path Lab",
  lines: ["LAB REPORT", "Blood test", "medicine follow-up", "Aarav Sharma", "2025"],
  objects: ["lab report"],
});

[2024, 2025, 2025, 2026].forEach((year, index) => {
  mem(
    {
      caption_en: "Aarav at his office desk",
      tags: ["office", "work", "desk"],
      people: ["self"],
      person_count: 1,
      composition: "solo",
      place: "office",
      year,
      user_age: year - 1998,
      source: "camera",
    },
    { kind: "memory", motif: "office", people: [{ role: "self", x: 200, h: 260 }], seed: index },
  );
});

mem(
  {
    caption_en: "Diwali in the new Delhi house, diyas in the living room",
    tags: ["diwali", "festival", "home", "new", "house"],
    people: ["self", "mummy", "sister"],
    person_count: 3,
    composition: "group",
    occasion: "diwali",
    place: "delhi_home",
    year: 2024,
    user_age: 26,
    source: "camera",
    sensory_notes: "new house, diwali, modern living room, diyas",
  },
  { kind: "memory", motif: "new_house", people: family(false), seed: 1 },
  "T6",
);

[2024, 2024, 2025, 2025, 2026].forEach((year, index) => {
  mem(
    {
      caption_en: "Weekend outing in Delhi with friends",
      tags: ["outing", "weekend", "delhi", "friends"],
      people: ["self", "friends", "karan"],
      person_count: 3,
      composition: "group",
      occasion: "outing",
      place: "delhi",
      year,
      user_age: year - 1998,
      source: "camera",
    },
    { kind: "memory", motif: "outing", people: collegeGroup().slice(0, 3), seed: index },
  );
});

function fail(message: string): never {
  throw new Error(message);
}

function check() {
  if (photos.length !== 132) fail(`expected 132 photos, got ${photos.length}`);
  const papa = photos.filter((p) => p.people.includes("papa"));
  if (papa.length !== 20) fail(`papa ${papa.length}`);
  if (papa.filter((p) => p.composition === "solo").length !== 7) fail("solo papa");
  const childhood = photos.filter((p) => p.source === "scan" && p.type === "memory");
  if (childhood.length !== 30) fail(`childhood ${childhood.length}`);
  if (childhood.filter((p) => p.user_age === 7 && p.occasion === "birthday").length !== 2) fail("two 7th birthdays");

  const byId = new Map(photos.map((p) => [p.id, p]));
  const papaIntent = fallbackIntent("papa ki photos dikhao");
  const papaGot = retrieve(photos, papaIntent, []);
  if (papaGot.results.length !== 20) fail(`papa results ${papaGot.results.length}`);
  const papaQ = selectFacet({
    candidates: papaGot.results.map((r) => byId.get(r.id)!),
    intent: papaIntent,
    askedFacets: [],
    constraints: [],
    round: 0,
    replyLanguage: "hinglish_roman",
  });
  if (papaQ?.facet !== "composition") fail(`papa facet ${papaQ?.facet}`);
  const solo = papaQ?.options.find((o) => o.value === "solo");
  if (solo?.label !== "Sirf papa" || solo.count !== 7) fail(`solo chip ${solo?.label} ${solo?.count}`);
  const onlySolo = retrieve(photos, papaIntent, [{ facet: "composition", value: "solo" }]);
  if (onlySolo.results.length !== 7) fail("solo filter");
  if (selectFacet({ candidates: onlySolo.results.map((r) => byId.get(r.id)!), intent: papaIntent, askedFacets: ["composition"], constraints: [{ facet: "composition", value: "solo" }], round: 1, replyLanguage: "hinglish_roman" })) {
    fail("question after solo");
  }

  const hi = "मुझे मेरी childhood की photos दिखाओ";
  const hiIntent = fallbackIntent(hi);
  if (replyLanguageFor(hi, hiIntent.language) !== "hi_deva") fail("language");
  const hiGot = retrieve(photos, hiIntent, []);
  if (hiGot.results.length !== 30) fail(`childhood ${hiGot.results.length}`);
  for (const row of hiGot.results) {
    const photo = byId.get(row.id)!;
    if (photo.type !== "memory" || photo.user_age == null || photo.user_age < 2 || photo.user_age > 15) fail(`bad childhood ${photo.id}`);
  }
  const hiQ = selectFacet({
    candidates: hiGot.results.map((r) => byId.get(r.id)!),
    intent: hiIntent,
    askedFacets: [],
    constraints: [],
    round: 0,
    replyLanguage: "hi_deva",
  });
  if (hiQ?.facet !== "occasion") fail(`child facet ${hiQ?.facet} ${JSON.stringify(hiQ)}`);
  const values = hiQ.options.map((o) => o.value);
  for (const value of ["birthday", "school_event", "trip", "festival"]) {
    if (!values.includes(value)) fail(`missing ${value}`);
  }
  if (!/[\u0900-\u097F]/.test(hiQ.text)) fail("not devanagari");

  const college = retrieve(photos, fallbackIntent("college photos"), []);
  if (!college.results.every((r) => byId.get(r.id)?.type === "memory")) fail("college types");
  if ((college.hidden.byType.document ?? 0) < 1 || (college.hidden.byType.screenshot ?? 0) < 1) fail(`college hidden ${JSON.stringify(college.hidden.byType)}`);

  const certIntent = fallbackIntent("certificates dikhao");
  const certs = retrieve(photos, certIntent, []);
  if (certs.results.length !== 9) fail(`certs ${certs.results.length}`);
  if (certs.results.some((r) => byId.get(r.id)?.type !== "document")) fail("cert type");
  const certQ = selectFacet({
    candidates: certs.results.map((r) => byId.get(r.id)!),
    intent: certIntent,
    askedFacets: [],
    constraints: [],
    round: 0,
    replyLanguage: "hinglish_roman",
  });
  if (certQ?.facet !== "institution") fail(`cert facet ${certQ?.facet}`);

  const goa = retrieve(photos, fallbackIntent("Goa wala small cafe blue door"), []);
  const blue = photos.find((p) => p.sensory_notes?.includes("blue door"));
  if (!blue || !goa.results.slice(0, 3).some((r) => r.id === blue.id)) fail(`blue door rank ${goa.results.slice(0, 5).map((r) => r.id)}`);

  const med = retrieve(photos, fallbackIntent("medicine photo last year"), []);
  const objectIdx = med.results.map((r, i) => (byId.get(r.id)?.type === "object" ? i : -1)).filter((i) => i >= 0);
  const healthDocs = new Set(photos.filter((p) => p.type === "document" && p.year === 2025).map((p) => p.id));
  const docIdx = med.results.map((r, i) => (healthDocs.has(r.id) ? i : -1)).filter((i) => i >= 0);
  if (!objectIdx.length || !docIdx.length || Math.max(...objectIdx) >= Math.min(...docIdx)) {
    fail(`medicine order ${med.results.slice(0, 12).map((r) => `${r.id}:${byId.get(r.id)?.type}:${r.score.toFixed(2)}`).join(" ")}`);
  }

  for (const id of ["T1", "T2", "T3", "T4", "T5", "T6"]) if (!targets[id]) fail(`missing ${id}`);
}

async function main() {
  check();
  const photoDir = path.join(root, "public", "photos");
  await mkdir(photoDir, { recursive: true });
  await Promise.all(photos.map((photo, i) => writeFile(path.join(photoDir, `${photo.id}.svg`), renderScene(scenes[i]), "utf8")));
  await writeFile(path.join(root, "data", "photos.json"), JSON.stringify(photos, null, 2), "utf8");
  await writeFile(
    path.join(root, "data", "catalog.public.json"),
    JSON.stringify(photos.map((p) => ({ id: p.id, file: p.file, type: p.type })), null, 2),
    "utf8",
  );
  const tasks = [
    { id: "T1", prompt: "Find a photo of just your father, no one else in it, at a family function.", target_id: targets.T1 },
    { id: "T2", prompt: "Find the group photo from your college farewell.", target_id: targets.T2 },
    { id: "T3", prompt: "Find the photo of your 7th birthday, the one with the blue cake.", target_id: targets.T3 },
    { id: "T4", prompt: "Find the small café in Goa with the blue door.", target_id: targets.T4 },
    { id: "T5", prompt: "Find the photo of the medicine you took when you were ill last year.", target_id: targets.T5 },
    { id: "T6", prompt: "Find the Diwali photo from when you had just moved into the new house.", target_id: targets.T6 },
  ];
  await writeFile(path.join(root, "data", "tasks.json"), JSON.stringify(tasks, null, 2), "utf8");
  await writeFile(
    path.join(photoDir, "CREDITS.md"),
    `# Photo credits

These are original illustrations generated for the fictional sample library of **Aarav Sharma** (born 1998, Delhi). They are not photographs of real people, and they are not private user photos.

Face groups are **simulated**: the same drawn characters (Papa, Mummy, Diya, Aarav, Karan, Neha, Rohit) are reused so a study participant can recognise who is in a frame. The app does not run face recognition.

Documents, screenshots and health objects are generated cards with visible text so \`text_in_image\` matches what is drawn. No Unsplash or Pexels files are shipped; the planted tasks need exact visuals (a blue cake, a blue door, a solo Papa) that stock photos would not guarantee.

Do not replace these with real personal photos.
`,
    "utf8",
  );
  console.log(`Wrote ${photos.length} photos. Targets: ${JSON.stringify(targets)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
