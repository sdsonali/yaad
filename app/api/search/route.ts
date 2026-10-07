import { z } from "zod";
import { IntentSchema, maybeRephrase, parseIntent } from "@/lib/parseIntent";
import { currentQuestionFacet, reduceState, viewFor, type RetrievalView } from "@/lib/pipeline";
import { loadPhonePhotos } from "@/lib/phoneLibrary";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import type { Photo, SearchState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const StateSchema = z.object({
  query: z.string().max(200),
  intent: IntentSchema.nullable(),
  constraints: z.array(z.object({ facet: z.string().max(40), value: z.string().max(80) })).max(8),
  askedFacets: z.array(z.string().max(40)).max(8),
  round: z.number().int().min(0).max(6),
  showHidden: z.boolean(),
});

const BodySchema = z.object({
  sessionId: z.string().min(1).max(80),
  mode: z.enum(["assist", "classic"]),
  query: z.string().max(200).optional(),
  action: z
    .union([
      z.object({ type: z.literal("answer"), facet: z.string().max(40), value: z.string().max(80) }),
      z.object({ type: z.literal("skip"), facet: z.string().max(40).optional() }),
      z.object({ type: z.literal("remove"), facet: z.string().max(40) }),
      z.object({ type: z.literal("showHidden") }),
    ])
    .optional(),
  state: StateSchema.nullish(),
});

function payload(state: SearchState, mode: "assist" | "classic", usedFallback: boolean, reason: string | null, started: number, extra: Photo[]) {
  const view: RetrievalView = viewFor(state, mode, extra);
  return {
    state,
    results: view.results,
    hidden: view.hidden,
    question: view.question,
    assistantText: view.assistantText,
    replyLanguage: view.replyLanguage,
    latencyMs: Date.now() - started,
    usedFallback,
    fallbackReason: reason,
  };
}

export async function POST(request: Request) {
  const started = Date.now();
  if (rateLimited(clientIp(request.headers.get("x-forwarded-for")))) {
    return Response.json({ error: "Too many searches. Wait a moment." }, { status: 429 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Search failed. Try again." }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const tooLong = typeof (json as { query?: unknown })?.query === "string" && ((json as { query: string }).query.length > 200);
    return Response.json({ error: tooLong ? "Keep it under 200 characters." : "Search failed. Try again." }, { status: 400 });
  }
  const body = parsed.data;
  const extra = await loadPhonePhotos(body.sessionId).catch(() => []);
  try {
    if (body.mode === "classic") {
      const state = reduceState(null, undefined, undefined, body.query ?? "");
      return Response.json(payload(state, "classic", false, null, started, extra));
    }
    if (body.query && body.query.trim()) {
      const intentResult = await parseIntent(body.query.trim());
      let state = reduceState(null, undefined, intentResult.intent, body.query.trim());
      let view = viewFor(state, "assist", extra);
      if (view.question && process.env.PHRASE_WITH_LLM === "true") {
        const text = await maybeRephrase(view.question.text, view.replyLanguage);
        view = { ...view, question: { ...view.question, text }, assistantText: text };
      }
      return Response.json({
        state,
        results: view.results,
        hidden: view.hidden,
        question: view.question,
        assistantText: view.assistantText,
        replyLanguage: view.replyLanguage,
        latencyMs: Date.now() - started,
        usedFallback: intentResult.usedFallback,
        fallbackReason: intentResult.reason,
      });
    }
    const prev = (body.state as SearchState | undefined) ?? null;
    let action = body.action;
    if (action?.type === "skip" && !action.facet && prev) {
      const facet = currentQuestionFacet(prev, extra);
      action = facet ? { type: "skip", facet } : undefined;
    }
    const state = reduceState(prev, action);
    return Response.json(payload(state, "assist", false, null, started, extra));
  } catch {
    return Response.json({ error: "Search failed. Try again." }, { status: 500 });
  }
}
