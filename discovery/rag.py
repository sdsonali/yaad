"""Lightweight corpus Q&A (TF-IDF cosine, no extra vector DB)."""

from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from discovery.tagger import parse_tagged_payload
from shared import config

TOKEN = re.compile(r"[a-z0-9]+")


def _tok(text: str) -> list[str]:
    return [t for t in TOKEN.findall((text or "").lower()) if len(t) > 2]


def _load_rows() -> list[dict]:
    path = config.preferred_tagged_json()
    if not path.exists():
        return []
    _, rows = parse_tagged_payload(json.loads(path.read_text(encoding="utf-8")))
    return rows


def _vectorize(docs: list[list[str]]) -> tuple[list[str], list[dict[str, float]]]:
    df = Counter()
    for d in docs:
        df.update(set(d))
    vocab = [w for w, c in df.most_common(4000)]
    n = len(docs) or 1
    idf = {w: math.log((n + 1) / (df[w] + 1)) + 1 for w in vocab}
    vecs = []
    for d in docs:
        tf = Counter(d)
        vecs.append({w: (tf[w] / (len(d) or 1)) * idf[w] for w in vocab if tf[w]})
    return vocab, vecs


def _cos(a: dict[str, float], b: dict[str, float]) -> float:
    keys = set(a) | set(b)
    num = sum(a.get(k, 0) * b.get(k, 0) for k in keys)
    da = math.sqrt(sum(v * v for v in a.values())) or 1
    db = math.sqrt(sum(v * v for v in b.values())) or 1
    return num / (da * db)


def answer_corpus(question: str, k: int = 8) -> dict:
    rows = _load_rows()
    if not rows:
        return {"question": question, "findings": ["No tagged corpus yet."], "excerpts": []}
    docs = [_tok(str(r.get("text") or "") + " " + str(r.get("verbatim_quote_summary") or "")) for r in rows]
    vocab, vecs = _vectorize(docs)
    idf_q = Counter()
    # reuse doc idf approx via first vec keys
    qtok = _tok(question)
    qvec = Counter(qtok)
    # simple overlap ranking
    scored = []
    qset = set(qtok)
    for i, d in enumerate(docs):
        overlap = len(qset & set(d))
        if overlap:
            scored.append((overlap, i))
    scored.sort(reverse=True)
    picks = [rows[i] for _, i in scored[:k]]
    stage_c = Counter(r.get("funnel_stage_failure") for r in picks if r.get("funnel_stage_failure"))
    type_c = Counter(r.get("memory_type") for r in picks if r.get("memory_type"))
    work_c = Counter(r.get("workaround_used") for r in picks if r.get("workaround_used"))
    findings = []
    if stage_c:
        lab, c = stage_c.most_common(1)[0]
        findings.append(f"Among the {len(picks)} closest items, funnel stage **{lab}** appears {c} times.")
    if type_c:
        lab, c = type_c.most_common(1)[0]
        findings.append(f"Memory type **{lab}** appears {c} times in that slice.")
    if work_c:
        lab, c = work_c.most_common(1)[0]
        findings.append(f"Top workaround in slice: **{lab}** ({c}).")
    findings.append("Counts are from retrieved items, not the full corpus — compare with the opportunity matrix.")
    return {
        "question": question,
        "findings": findings,
        "excerpts": [
            {
                "summary": r.get("verbatim_quote_summary"),
                "stage": r.get("funnel_stage_failure"),
                "memory_type": r.get("memory_type"),
                "workaround": r.get("workaround_used"),
                "source": r.get("source"),
            }
            for r in picks
        ],
    }


DEMO_QUERIES = [
    "show me complaints about searching by object without a date",
    "what workarounds do users mention most for medicine or document photos",
    "where does retrieval fail after the first search miss",
    "do people remember why they took a screenshot but not what to type",
]


def write_demo() -> Path:
    out = []
    for q in DEMO_QUERIES:
        out.append(answer_corpus(q))
    config.RAG_EXAMPLES.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    return config.RAG_EXAMPLES


if __name__ == "__main__":
    p = write_demo()
    print(f"Wrote {p}")
