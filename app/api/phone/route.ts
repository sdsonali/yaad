import { mkdir, writeFile } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { loadPhonePhotos, safeSession, savePhonePhotos } from "@/lib/phoneLibrary";
import { rateLimited, clientIp } from "@/lib/rateLimit";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DraftSchema = z.object({
  caption_en: z.string().default("Photo from this phone"),
  tags: z.array(z.string()).default([]),
  people: z.array(z.string()).default([]),
  person_count: z.number().int().min(0).max(40).default(0),
  composition: z.enum(["solo", "duo", "group", "none"]).default("group"),
  occasion: z.string().nullable().default(null),
  place: z.string().nullable().default(null),
  year: z.number().int().nullable().default(null),
  objects: z.array(z.string()).default([]),
  text_in_image: z.string().nullable().default(null),
  sensory_notes: z.string().nullable().default(null),
  type: z.enum(["memory", "document", "screenshot", "object"]).default("memory"),
});

function publicCard(photo: Photo) {
  return { id: photo.id, file: photo.file, type: photo.type };
}

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId") ?? "";
  try {
    const photos = await loadPhonePhotos(sessionId);
    return Response.json({ photos: photos.map(publicCard) });
  } catch {
    return Response.json({ photos: [] });
  }
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

async function describe(bytes: Buffer): Promise<z.infer<typeof DraftSchema>> {
  if (!process.env.ANTHROPIC_API_KEY) return DraftSchema.parse({});
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const call = client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 400,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: bytes.toString("base64") } },
          {
            type: "text",
            text: `This is a personal photo from someone's phone. Describe only what is visible.
Output JSON only with keys caption_en, tags, people, person_count, composition (solo|duo|group|none), occasion, place, year, objects, text_in_image, sensory_notes, type (memory|document|screenshot|object).
people may use papa, mummy, sister, self, friends only when that role is obvious; otherwise []. Use null when unknown. Do not invent names.`,
          },
        ],
      },
    ],
  });
  const message = await Promise.race([
    call,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
  ]);
  const block = message.content.find((part) => part.type === "text");
  const text = block && block.type === "text" ? block.text : "{}";
  return DraftSchema.parse(extractJson(text));
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request.headers.get("x-forwarded-for")), 40)) {
    return Response.json({ error: "Too many photos. Wait a moment." }, { status: 429 });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Couldn't read that photo." }, { status: 400 });
  }
  const sessionRaw = String(form.get("sessionId") ?? "");
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a photo from this phone." }, { status: 400 });
  if (file.size > 5_000_000) return Response.json({ error: "That photo is too large." }, { status: 400 });
  let sessionId: string;
  try {
    sessionId = safeSession(sessionRaw);
  } catch {
    return Response.json({ error: "Search failed. Try again." }, { status: 400 });
  }
  const existing = await loadPhonePhotos(sessionId);
  if (existing.length >= 24) return Response.json({ error: "24 photos is the limit for this demo." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const id = `up_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const dir = path.join(process.cwd(), "public", "phone", sessionId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${id}.jpg`), bytes);

  let draft = DraftSchema.parse({});
  try {
    draft = await describe(bytes);
  } catch {
    draft = DraftSchema.parse({ caption_en: "Photo from this phone", tags: ["phone"] });
  }
  const photo: Photo = {
    id,
    file: `/phone/${sessionId}/${id}.jpg`,
    type: draft.type,
    caption_en: draft.caption_en.slice(0, 240),
    tags: draft.tags.slice(0, 12).map((tag) => tag.slice(0, 40)),
    people: draft.people.map((person) => person.toLowerCase()).slice(0, 8),
    person_count: draft.person_count,
    composition: draft.composition,
    occasion: draft.occasion,
    place: draft.place,
    year: draft.year,
    user_age: null,
    source: "camera",
    objects: draft.objects.slice(0, 8),
    text_in_image: draft.text_in_image,
    institution: null,
    sensory_notes: draft.sensory_notes,
  };
  await savePhonePhotos(sessionId, [...existing, photo]);
  return Response.json({ photo: publicCard(photo) });
}
