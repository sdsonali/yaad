"""Aggregate funnel_stage × memory_type × severity for the deck."""

from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import pandas as pd

from shared import config
from discovery.tagger import parse_tagged_payload

SEV_SCORE = {"low": 1, "medium": 2, "high": 3}


def _top(counter: Counter, n: int = 8) -> list[dict]:
    total = sum(counter.values()) or 1
    return [
        {"label": k, "count": v, "pct_of_mentions": round(100.0 * v / total, 1)}
        for k, v in counter.most_common(n)
    ]


def aggregate(tagged_path: Path | None = None) -> dict:
    path = tagged_path or config.preferred_tagged_json()
    _, rows = parse_tagged_payload(json.loads(path.read_text(encoding="utf-8")))
    n = len(rows)
    stages, types, works, sevs, anchors = Counter(), Counter(), Counter(), Counter(), Counter()
    cross = defaultdict(lambda: {"count": 0, "sev_sum": 0})
    for row in rows:
        st = row.get("funnel_stage_failure") or "unclear"
        mt = row.get("memory_type") or "unclear"
        sv = row.get("severity") or "medium"
        stages[st] += 1
        types[mt] += 1
        sevs[sv] += 1
        works[row.get("workaround_used") or "none_mentioned"] += 1
        for a in row.get("memory_anchors_mentioned") or ["none"]:
            anchors[a] += 1
        key = (st, mt)
        cross[key]["count"] += 1
        cross[key]["sev_sum"] += SEV_SCORE.get(sv, 2)

    matrix = []
    for (st, mt), val in sorted(cross.items(), key=lambda kv: -kv[1]["count"]):
        c = val["count"]
        matrix.append(
            {
                "funnel_stage_failure": st,
                "memory_type": mt,
                "count": c,
                "pct": round(100.0 * c / n, 1) if n else 0,
                "avg_severity": round(val["sev_sum"] / c, 2) if c else 0,
            }
        )

    top_stage = _top(stages)[0] if stages else {"label": "query_formulation", "pct_of_mentions": 0}
    headline = (
        f"{top_stage['label'].replace('_', ' ')} leads failure-stage mentions "
        f"({top_stage['pct_of_mentions']}%). Functional/utility vs episodic compared in the matrix."
    )
    return {
        "total_reviews": n,
        "source_corpus": "gold",
        "headline": headline,
        "top_funnel_stages": _top(stages),
        "top_memory_types": _top(types),
        "top_workarounds": _top(works),
        "top_anchors": _top(anchors),
        "severity_mix": _top(sevs),
        "matrix": matrix[:20],
        "by_source": {
            src: sum(1 for r in rows if r.get("source") == src)
            for src in sorted({str(r.get("source")) for r in rows})
        },
        "locked_stage": "query_formulation",
        "locked_memory_type": "functional_utility",
    }


def save_opportunity(result: dict) -> tuple[Path, Path]:
    config.OPPORTUNITY_JSON.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    rows = []
    for item in result.get("matrix") or []:
        rows.append(item)
    pd.DataFrame(rows).to_csv(config.OPPORTUNITY_CSV, index=False, encoding="utf-8")
    return config.OPPORTUNITY_JSON, config.OPPORTUNITY_CSV


def main() -> None:
    result = aggregate()
    save_opportunity(result)
    print(result["headline"])
    print(f"n={result['total_reviews']}")
    for row in result["top_funnel_stages"]:
        print(f"  {row['label']}: {row['pct_of_mentions']}%")


if __name__ == "__main__":
    main()
