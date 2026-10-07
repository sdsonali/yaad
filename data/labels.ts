import type { Intent, ReplyLang } from "../lib/types";

type Trio = Record<ReplyLang, string>;

function t(en: string, hi_deva: string, hinglish_roman: string): Trio {
  return { en, hi_deva, hinglish_roman };
}

export const labels = {
  occasion: {
    birthday: t("Birthdays", "जन्मदिन", "Birthdays"),
    school_event: t("School events", "स्कूल के कार्यक्रम", "School ke events"),
    trip: t("Family trips", "घूमना-फिरना", "Trips"),
    festival: t("Festivals", "त्योहार", "Festivals"),
    diwali: t("Diwali", "दिवाली", "Diwali"),
    holi: t("Holi", "होली", "Holi"),
    college_fest: t("College fest", "कॉलेज फेस्ट", "College fest"),
    farewell: t("Farewell", "विदाई", "Farewell"),
    hostel: t("Hostel", "हॉस्टल", "Hostel"),
    canteen: t("Canteen", "कैंटीन", "Canteen"),
    beach: t("Beach", "बीच", "Beach"),
    food: t("Food", "खाना", "Khaana"),
    cafe: t("Cafés", "कैफ़े", "Cafe"),
    certificate: t("Certificates", "प्रमाणपत्र", "Certificates"),
    medical: t("Medical", "मेडिकल", "Medical"),
    outing: t("Outings", "बाहर घूमना", "Outings"),
  } as Record<string, Trio>,
  composition: {
    solo: t("Just them", "सिर्फ़ वही", "Sirf wahi"),
    duo: t("Two of us", "हम दोनों", "Hum dono"),
    group: t("With others", "और लोगों के साथ", "Aur logon ke saath"),
  } as Record<string, Trio>,
  place: {
    goa: t("Goa", "गोवा", "Goa"),
    shimla: t("Shimla", "शिमला", "Shimla"),
    jaipur: t("Jaipur", "जयपुर", "Jaipur"),
    delhi_home: t("New house", "नया घर", "Naya ghar"),
    campus: t("Campus", "कैंपस", "Campus"),
    office: t("Office", "ऑफिस", "Office"),
    delhi: t("Delhi", "दिल्ली", "Delhi"),
  } as Record<string, Trio>,
  institution: {
    school: t("School", "स्कूल", "School"),
    college: t("College", "कॉलेज", "College"),
    work: t("Work", "काम", "Work"),
  } as Record<string, Trio>,
  era_bucket: {
    age_3_6: t("Ages 3–6", "उम्र 3–6", "Umar 3–6"),
    age_7_10: t("Ages 7–10", "उम्र 7–10", "Umar 7–10"),
    age_11_14: t("Ages 11–14", "उम्र 11–14", "Umar 11–14"),
    decade_1990: t("1990s", "1990 का दशक", "1990s"),
    decade_2000: t("2000s", "2000 का दशक", "2000s"),
    decade_2010: t("2010s", "2010 का दशक", "2010s"),
    decade_2020: t("2020s", "2020 का दशक", "2020s"),
  } as Record<string, Trio>,
  question: {
    occasion: t("Which of these are you looking for?", "इनमें कौन सी चाहिए?", "Inmein kaun si chahiye?"),
    composition: t(
      "Just {person}, or with others too?",
      "सिर्फ़ {person}, या दूसरों के साथ भी?",
      "Sirf {person}, ya doosron ke saath bhi?",
    ),
    institution: t("Which kind?", "कौन सा वाला?", "Kaun sa wala?"),
    place: t("Which place?", "कौन सी जगह?", "Kaun si jagah?"),
    era_bucket: t("Around what time?", "किस समय के आसपास?", "Kis time ke aaspaas?"),
    people_present: t("Who is in it?", "इसमें कौन है?", "Ismein kaun hai?"),
  } as Record<string, Trio>,
  skip: t("Not sure", "पक्का नहीं पता", "Pata nahi"),
  hiddenBanner: t(
    "{n} documents & screenshots hidden",
    "{n} दस्तावेज़ और स्क्रीनशॉट छिपे हैं",
    "{n} documents aur screenshots chhupe hain",
  ),
  show: t("Show", "दिखाओ", "Dikhao"),
  showing: t(
    "Showing documents & screenshots",
    "दस्तावेज़ और स्क्रीनशॉट दिख रहे हैं",
    "Documents aur screenshots dikh rahe hain",
  ),
  here: t("Here are the closest photos.", "ये रही सबसे करीबी फ़ोटो।", "Yeh rahi sabse kareeb photos."),
  zero: t("No photos matched.", "कोई फ़ोटो नहीं मिली।", "Koi photo nahi mili."),
  removeFilters: t("Remove filters", "फ़िल्टर हटाओ", "Filters hatao"),
  loadMore: t("Load more", "और दिखाओ", "Aur dikhao"),
  thisOne: t("This is the one", "यही वाली है", "Yahi wali hai"),
  notThis: t("Not this", "यह नहीं", "Yeh nahi"),
  searching: t("Searching…", "ढूँढ रहे हैं…", "Dhundh rahe hain…"),
  typeBadge: {
    document: t("Document", "दस्तावेज़", "Document"),
    screenshot: t("Screenshot", "स्क्रीनशॉट", "Screenshot"),
    object: t("Object", "चीज़", "Object"),
  } as Record<string, Trio>,
};

const people: Record<string, Trio> = {
  papa: t("Papa", "पापा", "papa"),
  mummy: t("Mummy", "मम्मी", "mummy"),
  sister: t("Diya", "दीया", "Diya"),
  self: t("you", "आप", "tum"),
  karan: t("Karan", "करण", "Karan"),
  neha: t("Neha", "नेहा", "Neha"),
  rohit: t("Rohit", "रोहित", "Rohit"),
  friends: t("Friends", "दोस्त", "dost"),
};

export function personName(id: string, lang: ReplyLang): string {
  return people[id]?.[lang] ?? id;
}

function namedPeople(intent: Intent): string[] {
  return intent.people.filter((p) => p !== "self" && p !== "friends");
}

export function compositionPerson(intent: Intent, lang: ReplyLang): string {
  const named = namedPeople(intent);
  if (named.length === 1) return personName(named[0], lang);
  if (lang === "hi_deva") return "वही";
  if (lang === "hinglish_roman") return "wahi";
  return "them";
}

export function optionLabel(facet: string, value: string, lang: ReplyLang, intent: Intent): string {
  if (facet === "composition" && value === "solo") {
    const named = namedPeople(intent);
    if (named.length === 1) {
      const name = personName(named[0], lang);
      if (lang === "hi_deva") return `सिर्फ़ ${name}`;
      if (lang === "hinglish_roman") return `Sirf ${name}`;
      return `Just ${name}`;
    }
  }
  if (facet === "people_present") {
    const joiner = lang === "hi_deva" ? " + " : ", ";
    return value
      .split("+")
      .map((part) => personName(part, lang))
      .join(joiner);
  }
  const table = (labels as unknown as Record<string, Record<string, Trio>>)[facet];
  if (table?.[value]) return table[value][lang];
  return value.replace(/_/g, " ");
}

export function questionText(facet: string, lang: ReplyLang, intent: Intent): string {
  const template = labels.question[facet]?.[lang] ?? labels.question.occasion[lang];
  return template.replace("{person}", compositionPerson(intent, lang));
}

export function phrase(key: keyof Omit<typeof labels, "occasion" | "composition" | "place" | "institution" | "era_bucket" | "question" | "typeBadge">, lang: ReplyLang): string {
  const entry = labels[key];
  if (entry && "en" in entry) return entry[lang];
  return "";
}
