import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Photo } from "./types";

const root = path.join(process.cwd(), "data", "phone");

export function safeSession(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80);
  if (clean.length < 8) throw new Error("bad session");
  return clean;
}

export async function loadPhonePhotos(sessionId: string): Promise<Photo[]> {
  try {
    const raw = await readFile(path.join(root, `${safeSession(sessionId)}.json`), "utf8");
    const parsed = JSON.parse(raw) as Photo[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePhonePhotos(sessionId: string, photos: Photo[]): Promise<void> {
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, `${safeSession(sessionId)}.json`), JSON.stringify(photos));
}
