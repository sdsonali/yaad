import { TestSession } from "@/components/TestSession";
import tasksJson from "@/data/tasks.json";
import { sessionPlan } from "@/lib/plan";

type Task = { id: string; prompt: string; target_id: string };
type SP = { p?: string; task?: string; mode?: string };

export default async function TestPage({ searchParams }: { searchParams: SP | Promise<SP> }) {
  const sp = await searchParams;
  const participantId = sp.p || "P01";
  const taskId = (sp.task || "T1").toUpperCase();
  const task = (tasksJson as Task[]).find((item) => item.id === taskId);
  const plan = sessionPlan(participantId);
  const step = plan.find((item) => item.taskId === taskId);
  const mode = sp.mode === "classic" || sp.mode === "assist" ? sp.mode : step?.mode ?? "assist";
  if (!task) {
    return (
      <div className="mx-auto max-w-[430px] px-4 py-10">
        <p className="text-[15px]">That task is not in the plan.</p>
        <a className="mt-4 inline-block underline" href={`/test/plan?p=${encodeURIComponent(participantId)}`}>
          See the session plan
        </a>
      </div>
    );
  }
  return <TestSession participantId={participantId} taskId={task.id} prompt={task.prompt} mode={mode} plan={plan} />;
}
