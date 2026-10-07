"""Tag gold items with the memory-to-retrieval funnel schema."""

from __future__ import annotations

import json
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import pandas as pd

from shared import config

STAGE_RULES = [
    ("query_formulation", ["don't know what to search", "what to type", "can't describe", "how do i search", "keywords"]),
    ("refinement", ["tried again", "another search", "keep searching", "still can't", "refine"]),
    ("visual_evaluation", ["too many", "looks the same", "duplicates", "which one", "can't tell"]),
    ("result_relevance", ["wrong results", "irrelevant", "not what i", "unrelated"]),
    ("system_interpretation", ["doesn't understand", "doesn't recognize", "search doesn't", "search is useless", "can't find by"]),
    ("recall_trigger", ["remember", "know i have", "i took a photo", "i screenshotted"]),
]

TYPE_RULES = [
    ("functional_utility", ["screenshot", "receipt", "document", "pdf", "id card", "passport", "bill", "invoice", "medicine", "prescription", "boarding", "wifi", "form", "scan"]),
    ("people_anchored", ["face", "people", "person", "who is", "my kid", "wife", "husband"]),
    ("emotional_episodic", ["trip", "vacation", "wedding", "birthday", "holiday", "cafe", "memory"]),
    ("temporal_only", ["last year", "years ago", "last month", "when i"]),
]

ANCHOR_RULES = [
    ("approximate_time", ["last year", "last month", "years ago", "around", "summer"]),
    ("location", ["at the", "in goa", "hotel", "airport", "home", "where"]),
    ("who_was_present", ["with my", "friend", "family", "kid"]),
    ("what_it_was_for", ["for the", "needed", "to apply", "when i was sick", "password", "form"]),
    ("device_used", ["screenshot", "from my phone", "whatsapp"]),
    ("visual_appearance", ["white box", "blue", "label", "small", "looked like"]),
]

WORK_RULES = [
    ("manual_scroll", ["scroll", "manually", "swipe through", "go through all"]),
    ("asked_someone", ["asked my", "ask my", "family sent"]),
    ("gave_up", ["gave up", "uninstalled", "switched"]),
    ("repeated_search_attempts", ["tried again", "searched again", "multiple times"]),
    ("used_album", ["album"]),
]


def _hit(text: str, needles: list[str]) -> bool:
    low = text.lower()
    return any(n in low for n in needles)


def heuristic_tag(text: str, source: str, source_url: str) -> dict:
    stage = "query_formulation"
    for label, needles in STAGE_RULES:
        if _hit(text, needles):
            stage = label
            break
    memory_type = "unclear"
    for label, needles in TYPE_RULES:
        if _hit(text, needles):
            memory_type = label
            break
    anchors = [a for a, needles in ANCHOR_RULES if _hit(text, needles)]
    if not anchors:
        anchors = ["none"]
    workaround = "none_mentioned"
    for label, needles in WORK_RULES:
        if _hit(text, needles):
            workaround = label
            break
    severity = "medium"
    if _hit(text, ["gave up", "uninstalled", "can't find", "lost", "important"]):
        severity = "high"
    elif _hit(text, ["wish", "would be nice", "sometimes"]):
        severity = "low"
    paraphrase = " ".join(str(text).split())[:180]
    return {
        "is_retrieval_related": True,
        "funnel_stage_failure": stage,
        "memory_type": memory_type,
        "memory_anchors_mentioned": anchors,
        "workaround_used": workaround,
        "severity": severity,
        "verbatim_quote_summary": paraphrase,
        "source": source,
        "source_url": source_url or "",
    }


def parse_tagged_payload(data) -> tuple[int | None, list[dict]]:
    if isinstance(data, dict):
        return data.get("tag_schema_version"), data.get("reviews") or []
    if isinstance(data, list):
        return None, data
    return None, []


def tag_frame(df: pd.DataFrame) -> list[dict]:
    rows = []
    for i, rec in enumerate(df.to_dict(orient="records")):
        tags = heuristic_tag(
            str(rec.get("text") or ""),
            str(rec.get("source") or "other"),
            str(rec.get("source_url") or ""),
        )
        tags["id"] = i
        tags["text"] = rec.get("text")
        tags["date"] = rec.get("date")
        rows.append(tags)
    return rows


def main() -> None:
    src = config.preferred_review_csv()
    if not src.exists():
        print(f"Missing {src}")
        sys.exit(1)
    df = pd.read_csv(src)
    tagged = tag_frame(df)
    payload = {"tag_schema_version": 3, "reviews": tagged}
    out = config.GOLD_TAGGED_JSON if src == config.GOLD_CSV else config.TAGGED_JSON
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Tagged {len(tagged)} -> {out}")


if __name__ == "__main__":
    main()
