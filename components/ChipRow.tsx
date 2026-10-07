"use client";

export function ChipRow({ chips, onRemove }: { chips: { facet: string; label: string }[]; onRemove: (facet: string) => void }) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.facet}
          type="button"
          onClick={() => onRemove(chip.facet)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-3 text-[15px] font-medium text-paper"
        >
          {chip.label}
          <span aria-hidden="true">✕</span>
          <span className="sr-only">Remove {chip.label}</span>
        </button>
      ))}
    </div>
  );
}
