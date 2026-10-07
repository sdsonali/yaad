"""scrape → gold → tag → aggregate"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]

STEPS = (
    ("scrape", "discovery/scraper.py"),
    ("curate", "discovery/curate_gold.py"),
    ("tag", "discovery/tagger.py"),
    ("aggregate", "discovery/aggregate.py"),
    ("rag", "discovery/rag.py"),
)


def _run_step(name: str, script: str) -> bool:
    print(f"=== {name}: {script} ===", flush=True)
    proc = subprocess.run([sys.executable, str(_ROOT / script)], cwd=_ROOT)
    if proc.returncode != 0:
        print(f"Step {name} failed (exit {proc.returncode})")
        return False
    return True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-scrape", action="store_true")
    parser.add_argument("--skip-curate", action="store_true")
    parser.add_argument("--skip-tag", action="store_true")
    parser.add_argument("--skip-aggregate", action="store_true")
    args = parser.parse_args()
    skip = {
        "scrape": args.skip_scrape,
        "curate": args.skip_curate,
        "tag": args.skip_tag,
        "aggregate": args.skip_aggregate,
    }
    for name, script in STEPS:
        if skip.get(name):
            print(f"  skip {name}")
            continue
        if not _run_step(name, script):
            sys.exit(1)
    print("=== Pipeline complete ===")


if __name__ == "__main__":
    main()
