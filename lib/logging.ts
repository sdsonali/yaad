import { promises as fs } from "fs";
import path from "path";

export const EVENT_NAMES = [
  "task_started",
  "query_submitted",
  "voice_transcript_edited",
  "question_shown",
  "chip_tapped",
  "question_skipped",
  "constraint_removed",
  "hidden_shown",
  "photo_opened",
  "photo_rejected",
  "task_completed",
  "task_abandoned",
  "survey_answered",
  "fallback_used",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

const EXTRA: Record<EventName, string[]> = {
  task_started: [],
  query_submitted: ["text", "inputMethod", "detectedLanguage"],
  voice_transcript_edited: ["original", "edited"],
  question_shown: ["facet", "optionCount", "candidateCount"],
  chip_tapped: ["facet", "value", "candidateCountAfter"],
  question_skipped: ["facet"],
  constraint_removed: ["facet"],
  hidden_shown: ["count"],
  photo_opened: ["photoId", "rank"],
  photo_rejected: ["photoId"],
  task_completed: ["photoId", "correct", "timeMs", "interactionCount"],
  task_abandoned: ["timeMs", "interactionCount"],
  survey_answered: ["ease", "confidence"],
  fallback_used: ["reason"],
};

const primaryPath = path.join(process.cwd(), "data", "events.jsonl");
const tmpPath = path.join(process.env.TEMP || process.env.TMPDIR || "/tmp", "yaad-events.jsonl");

let chain: Promise<void> = Promise.resolve();

function clip(value: unknown, max: number): string | number | boolean | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  const text = String(value).slice(0, max);
  return text;
}

export function sanitizeEvent(input: Record<string, unknown>): Record<string, unknown> | null {
  const event = input.event;
  if (typeof event !== "string" || !EVENT_NAMES.includes(event as EventName)) return null;
  const name = event as EventName;
  const row: Record<string, unknown> = {
    event: name,
    sessionId: clip(input.sessionId, 80) || "anon",
    participantId: clip(input.participantId, 40),
    taskId: clip(input.taskId, 20),
    mode: input.mode === "classic" ? "classic" : input.mode === "assist" ? "assist" : null,
    ts: Date.now(),
  };
  for (const key of EXTRA[name]) {
    if (key === "timeMs" || key === "interactionCount" || key === "optionCount" || key === "candidateCount" || key === "candidateCountAfter" || key === "count" || key === "rank" || key === "ease" || key === "confidence") {
      const n = Number(input[key]);
      row[key] = Number.isFinite(n) ? Math.max(0, Math.min(n, key === "timeMs" ? 7_200_000 : 10_000)) : null;
    } else if (key === "correct") {
      row[key] = typeof input[key] === "boolean" ? input[key] : null;
    } else {
      row[key] = clip(input[key], 200);
    }
  }
  return row;
}

async function appendLine(line: string) {
  try {
    await fs.appendFile(primaryPath, line, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EROFS" || code === "EPERM" || code === "EACCES" || code === "ENOENT") {
      if (code === "ENOENT") {
        try {
          await fs.mkdir(path.dirname(primaryPath), { recursive: true });
          await fs.appendFile(primaryPath, line, "utf8");
          return;
        } catch {
          /* fall through to tmp */
        }
      }
      await fs.appendFile(tmpPath, line, "utf8");
      return;
    }
    throw error;
  }
}

export function appendEvent(row: Record<string, unknown>): Promise<void> {
  const line = `${JSON.stringify(row)}\n`;
  const job = chain.then(() => appendLine(line));
  chain = job.catch(() => undefined);
  return job;
}

async function readFileSafe(file: string): Promise<string> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return "";
  }
}

export async function readEvents(): Promise<Record<string, unknown>[]> {
  const text = `${await readFileSafe(primaryPath)}\n${await readFileSafe(tmpPath)}`;
  const rows: Record<string, unknown>[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line) as Record<string, unknown>);
    } catch {
      /* skip a torn line */
    }
  }
  return rows;
}
