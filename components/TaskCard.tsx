"use client";

export function TaskCard({ prompt, onStart }: { prompt: string; onStart: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center bg-paper px-5 py-8">
      <p className="font-display text-3xl text-ink">Yaad</p>
      <p className="mt-6 text-sm uppercase tracking-wide text-muted">Your task</p>
      <h1 className="mt-2 text-xl font-semibold leading-snug">{prompt}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">Search the sample library the way you would talk. The timer starts when you press Start.</p>
      <button type="button" onClick={onStart} className="mt-8 min-h-11 rounded-full bg-terracotta px-5 text-[15px] font-semibold text-white">
        Start
      </button>
      <p className="mt-8 text-center text-[11px] text-muted">Sample library · simulated face groups</p>
    </div>
  );
}
