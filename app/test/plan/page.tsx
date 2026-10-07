import tasksJson from "@/data/tasks.json";
import { participantNumber, sessionPlan } from "@/lib/plan";

type Task = { id: string; prompt: string; target_id: string };
type SP = { p?: string };

export default async function PlanPage({ searchParams }: { searchParams: SP | Promise<SP> }) {
  const sp = await searchParams;
  const participantId = sp.p || "P01";
  const plan = sessionPlan(participantId);
  const prompts = new Map((tasksJson as Task[]).map((task) => [task.id, task.prompt]));
  const odd = participantNumber(participantId) % 2 === 1;
  return (
    <main className="mx-auto min-h-screen max-w-xl bg-paper px-4 py-8 text-ink">
      <p className="font-display text-3xl">Session plan</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Participant {participantId} is {odd ? "odd, so Yaad comes first" : "even, so keyword search comes first"}. Three tasks in each mode. The target photo is never shown.
      </p>
      <ol className="mt-6 flex flex-col gap-3">
        {plan.map((step, index) => (
          <li key={step.taskId} className="rounded-2xl border border-line bg-white p-3">
            <p className="text-sm font-semibold">
              {index + 1}. {step.taskId} · {step.mode === "classic" ? "Keyword search" : "Yaad"}
            </p>
            <p className="mt-1 text-sm leading-snug">{prompts.get(step.taskId)}</p>
            <a className="mt-2 inline-flex min-h-11 items-center text-sm font-medium underline" href={`/test?p=${encodeURIComponent(participantId)}&task=${step.taskId}&mode=${step.mode}`}>
              Open this task
            </a>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-[11px] text-muted">Sample library · simulated face groups</p>
    </main>
  );
}
