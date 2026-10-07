export type StatRow = {
  taskId: string;
  mode: string;
  started: number;
  completed: number;
  correct: number;
  abandoned: number;
  successRate: number | null;
  medianTimeMs: number | null;
  medianInteractions: number | null;
  questionAnswerRate: number | null;
  skipRate: number | null;
  voiceRate: number | null;
  fallbackRate: number | null;
};

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function summarize(events: Record<string, unknown>[]): StatRow[] {
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const event of events) {
    const taskId = String(event.taskId || "—");
    const mode = String(event.mode || "—");
    if (taskId === "—" && mode === "—") continue;
    const key = `${taskId}||${mode}`;
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  const rows: StatRow[] = [];
  for (const [key, list] of groups) {
    const [taskId, mode] = key.split("||");
    const of = (name: string) => list.filter((event) => event.event === name);
    const started = of("task_started").length;
    const completed = of("task_completed");
    const correctOnes = completed.filter((event) => event.correct === true);
    const abandoned = of("task_abandoned").length;
    const denom = started || completed.length + abandoned;
    const questions = of("question_shown").length;
    const chips = of("chip_tapped").length;
    const skips = of("question_skipped").length;
    const queries = of("query_submitted");
    const voice = queries.filter((event) => event.inputMethod === "voice").length;
    const fallbacks = of("fallback_used").length;
    const times = correctOnes.map((event) => num(event.timeMs)).filter((n): n is number => n != null);
    const interactions = correctOnes.map((event) => num(event.interactionCount)).filter((n): n is number => n != null);
    rows.push({
      taskId,
      mode,
      started,
      completed: completed.length,
      correct: correctOnes.length,
      abandoned,
      successRate: denom ? correctOnes.length / denom : null,
      medianTimeMs: median(times),
      medianInteractions: median(interactions),
      questionAnswerRate: questions ? chips / questions : null,
      skipRate: questions ? skips / questions : null,
      voiceRate: queries.length ? voice / queries.length : null,
      fallbackRate: queries.length ? fallbacks / queries.length : null,
    });
  }
  return rows.sort((a, b) => a.taskId.localeCompare(b.taskId) || a.mode.localeCompare(b.mode));
}

const CSV_COLUMNS = [
  "ts", "event", "sessionId", "participantId", "taskId", "mode", "text", "inputMethod",
  "detectedLanguage", "original", "edited", "facet", "value", "optionCount", "candidateCount",
  "candidateCountAfter", "count", "photoId", "rank", "correct", "timeMs", "interactionCount",
  "ease", "confidence", "reason",
];

function csvCell(value: unknown): string {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function eventsToCsv(events: Record<string, unknown>[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const event of events) {
    lines.push(CSV_COLUMNS.map((column) => csvCell(event[column])).join(","));
  }
  return lines.join("\n");
}
