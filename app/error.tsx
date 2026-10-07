"use client";

export default function ErrorScreen({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center bg-paper px-5">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <p className="mt-3 text-sm text-muted">The sample library is still here. Try that search again.</p>
      <button type="button" onClick={reset} className="mt-6 min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-paper">
        Try again
      </button>
    </div>
  );
}
