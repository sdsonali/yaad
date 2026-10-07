"""Filter pass: keep retrieval + vague-memory items (drop 'search is slow' / backup-only)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import pandas as pd

from shared import config

RETRIEVAL = re.compile(
    r"search|find|retriev|can't find|cant find|couldn.?t find|lost photo|"
    r"screenshot|old photo|remember|document|receipt|medicine|id card",
    re.I,
)
VAGUE = re.compile(
    r"remember|old|years ago|last year|screenshot|don't know|dont know|"
    r"can't find|cant find|what to (type|search)|describe|sick|receipt|"
    r"document|medicine|password|boarding|scroll",
    re.I,
)
NOISE = re.compile(
    r"crash|force close|storage full|backup failed|upload stuck|slow app|battery",
    re.I,
)


def keep_row(text: str) -> bool:
    text = str(text or "").strip()
    if len(text) < 40:
        return False
    if not RETRIEVAL.search(text):
        return False
    if NOISE.search(text) and not VAGUE.search(text):
        return False
    return True


def main() -> None:
    src = config.OUTPUT_CSV
    if not src.exists():
        print(f"Missing {src}")
        sys.exit(1)
    df = pd.read_csv(src)
    seed_path = config.DISCOVERY_DATA / "manual_seed.jsonl"
    if seed_path.exists():
        extra = []
        for line in seed_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            extra.append(json.loads(line))
        if extra:
            df = pd.concat([df, pd.DataFrame(extra)], ignore_index=True)
    kept = df[df["text"].map(keep_row)].drop_duplicates(subset=["text"])
    if len(kept) > config.GOLD_TARGET_TOTAL:
        kept = kept.sample(n=config.GOLD_TARGET_TOTAL, random_state=11)
    kept = kept.reset_index(drop=True)
    kept.to_csv(config.GOLD_CSV, index=False, encoding="utf-8")
    config.GOLD_JSON.write_text(
        json.dumps(kept.to_dict(orient="records"), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Gold {len(kept)} / {len(df)} (retrieval + vague-memory filter)")


if __name__ == "__main__":
    main()
