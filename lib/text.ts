/** Shared token normalizer for MiniSearch indexing and queries. */
export function processTerm(term: string): string | null {
  const t = term.toLowerCase().trim();
  if (!t || t.length < 2) return null;
  if (t.endsWith("s") && !t.endsWith("ss") && t.length > 3) return t.slice(0, -1);
  return t;
}

export function unique(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const v = value.trim().toLowerCase();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}
