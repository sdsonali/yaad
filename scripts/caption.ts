/**
 * Draft metadata for a raster image using Claude vision.
 * Prints JSON to stdout. Does not write data/photos.json.
 * A person must review every draft before it is added to the library.
 *
 * Usage: npx tsx scripts/caption.ts public/photos/example.jpg
 */
import { readFile } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const file = process.argv[2];
if (!file) {
  console.error("Pass an image path. SVG is not sent to vision; export a PNG first.");
  process.exit(1);
}

const ext = path.extname(file).toLowerCase();
const media: Record<string, "image/jpeg" | "image/png" | "image/webp" | "image/gif"> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
if (!media[ext]) {
  console.error("Vision drafts need jpeg, png, webp or gif. Refusing to overwrite the reviewed library.");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Set ANTHROPIC_API_KEY. This script only drafts captions for human review.");
  process.exit(1);
}

const bytes = await readFile(file);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const message = await client.messages.create({
  model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
  max_tokens: 500,
  temperature: 0,
  messages: [
    {
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: media[ext], data: bytes.toString("base64") } },
        {
          type: "text",
          text: "Draft metadata for this sample photo of a fictional library. Do not invent names that are not visually obvious. Output JSON only with keys caption_en, tags, people, person_count, composition, occasion, place, year, objects, text_in_image, sensory_notes. Use null when unknown.",
        },
      ],
    },
  ],
});
const block = message.content.find((part) => part.type === "text");
console.log(block && block.type === "text" ? block.text : "");
console.error("\nReview this draft. Do not ship unreviewed captions.");
