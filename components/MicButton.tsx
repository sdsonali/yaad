"use client";

type Props = {
  listening: boolean;
  onClick: () => void;
};

export function MicButton({ listening, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={listening ? "Stop listening" : "Speak"}
      aria-pressed={listening}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="9" y="3" width="6" height="11" rx="3" fill={listening ? "currentColor" : "none"} />
        <path d="M6 11a6 6 0 0 0 12 0" />
        <path d="M12 17v4M8 21h8" />
      </svg>
    </button>
  );
}
