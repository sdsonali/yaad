"""Part 6: type-mix tasks against the demo library (college + saved kinds)."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

os.environ.setdefault("PYTHONIOENCODING", "utf-8")

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from mvp.agent import PROMPT_CARDS, next_question, rank, should_ask
from shared import config


def answers_for(card: dict) -> list[str]:
    intent = card.get("intent")
    if intent == "memory":
        return ["a memory (personal photos)"]
    if intent == "saved":
        return ["something I saved to use later (document / screenshot)", "a document"]
    if intent == "screenshot":
        return ["something I saved to use later (document / screenshot)", "a screenshot"]
    return ["not sure"]


def run_card(card: dict) -> dict:
    q = card["prompt"]
    r0 = rank(q, [])
    answers: list[str] = []
    asked = 0
    planned = answers_for(card)
    if should_ask(r0, []):
        nq = next_question(0, r0, [])
        if nq:
            asked = 1
            answers = planned[:1]
            r1 = rank(q, answers)
            if asked < 2 and should_ask(r1, answers):
                nq2 = next_question(1, r1, answers)
                if nq2 and len(planned) > 1:
                    asked = 2
                    answers = planned[:2]
                    r1 = rank(q, answers)
        else:
            r1 = r0
    else:
        r1 = r0
    ids = [x["id"] for x in r1[:5]]
    hit = any(t in ids for t in card["target_ids"])
    kinds = sorted({x.get("media_kind") for x in r1[:8]})
    return {
        "card": card["id"],
        "original_query": q,
        "clarifying_turns": asked,
        "found_in_top5": hit,
        "top_ids": ids,
        "kinds_in_top": kinds,
        "outcome": "success" if hit else "miss",
    }


def main() -> None:
    if not config.MVP_INDEX.exists():
        print("Run generate_library.py then index_library.py")
        sys.exit(1)
    cards = [c for c in PROMPT_CARDS if c["id"] != "personal_vs_docs"][:3]
    tasks = [run_card(c) for c in cards]
    found = sum(1 for t in tasks if t["found_in_top5"])
    payload = {
        "n": len(tasks),
        "found": found,
        "miss": len(tasks) - found,
        "tasks": tasks,
        "what_we_would_change": (
            "Ask the type-mix question only when the first grid mixes kinds; "
            "then sequence personal / document / screenshot. Cap remains 2."
        ),
        "reaction_note": (
            "Evaluation fails when certificates sit in the same pile as college photos. "
            "Date fields and delete are the wrong product."
        ),
    }
    config.MVP_TEST_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
