import { timingSafeEqual } from "crypto";
import tasksJson from "@/data/tasks.json";
import { appendEvent, readEvents, sanitizeEvent } from "@/lib/logging";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { eventsToCsv } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Task = { id: string; prompt: string; target_id: string };

function adminOk(key: string | null): boolean {
  const expected = process.env.ADMIN_KEY || "change-me";
  if (!key) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request.headers.get("x-forwarded-for")), 120)) {
    return Response.json({ error: "Too many events." }, { status: 429 });
  }
  const text = await request.text();
  if (text.length > 4000) return Response.json({ error: "Event too large." }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Bad event." }, { status: 400 });
  }
  const row = sanitizeEvent(body);
  if (!row) return Response.json({ error: "Bad event." }, { status: 400 });
  if (row.event === "task_completed") {
    const task = (tasksJson as Task[]).find((item) => item.id === row.taskId);
    row.correct = Boolean(task && row.photoId === task.target_id);
  }
  await appendEvent(row);
  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!adminOk(url.searchParams.get("key"))) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const events = await readEvents();
  if (url.searchParams.get("format") === "csv") {
    return new Response(eventsToCsv(events), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=yaad-events.csv",
      },
    });
  }
  return Response.json({ events });
}
