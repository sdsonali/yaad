export type TaskStep = { taskId: string; mode: "assist" | "classic"; index: number };

const TASKS = ["T1", "T2", "T3", "T4", "T5", "T6"];

export function participantNumber(id: string): number {
  const n = parseInt(id.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 1;
}

/** Odd participant numbers start in assist mode; even numbers start with keyword search. */
export function sessionPlan(participantId: string): TaskStep[] {
  const assistFirst = participantNumber(participantId) % 2 === 1;
  const first: TaskStep["mode"] = assistFirst ? "assist" : "classic";
  const second: TaskStep["mode"] = assistFirst ? "classic" : "assist";
  return TASKS.map((taskId, index) => ({
    taskId,
    mode: index < 3 ? first : second,
    index,
  }));
}
