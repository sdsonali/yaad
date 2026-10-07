import { timingSafeEqual } from "crypto";
import { readEvents } from "@/lib/logging";
import { summarize } from "@/lib/stats";

export const dynamic = "force-dynamic";

type SP = { key?: string };

function allowed(key: string | undefined): boolean {
  const expected = process.env.ADMIN_KEY || "change-me";
  if (!key) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function pct(value: number | null): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

function seconds(value: number | null): string {
  if (value == null) return "—";
  return `${(value / 1000).toFixed(1)}s`;
}

export default async function AdminPage({ searchParams }: { searchParams: SP | Promise<SP> }) {
  const sp = await searchParams;
  if (!allowed(sp.key)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-3xl">Yaad admin</h1>
        <p className="mt-3 text-sm">Add the admin key to open this page.</p>
      </main>
    );
  }
  const rows = summarize(await readEvents());
  const key = encodeURIComponent(sp.key || "");
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">Session results</h1>
            <p className="mt-1 text-sm text-muted">Success rate uses correct finds over tasks started. Time and interactions are medians of correct finds.</p>
          </div>
          <a href={`/api/log?format=csv&key=${key}`} className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white">
            Download CSV
          </a>
        </div>
        {rows.length === 0 ? (
          <p className="mt-8 text-sm">No sessions yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  {["Task", "Mode", "Started", "Correct", "Gave up", "Success", "Median time", "Median taps", "Answer rate", "Skip rate", "Voice", "Fallback"].map((heading) => (
                    <th key={heading} className="px-2 py-2 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.taskId}-${row.mode}`} className="border-b border-line">
                    <td className="px-2 py-3 font-medium">{row.taskId}</td>
                    <td className="px-2 py-3">{row.mode === "classic" ? "Keyword" : "Yaad"}</td>
                    <td className="px-2 py-3">{row.started}</td>
                    <td className="px-2 py-3">{row.correct}</td>
                    <td className="px-2 py-3">{row.abandoned}</td>
                    <td className="px-2 py-3">{pct(row.successRate)}</td>
                    <td className="px-2 py-3">{seconds(row.medianTimeMs)}</td>
                    <td className="px-2 py-3">{row.medianInteractions ?? "—"}</td>
                    <td className="px-2 py-3">{pct(row.questionAnswerRate)}</td>
                    <td className="px-2 py-3">{pct(row.skipRate)}</td>
                    <td className="px-2 py-3">{pct(row.voiceRate)}</td>
                    <td className="px-2 py-3">{pct(row.fallbackRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
