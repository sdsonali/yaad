"""Memory Clues: dump fragments → ≤2 facet questions → ranked demo grid."""

from __future__ import annotations

import json
import re
from pathlib import Path

from shared import config

PROMPT_CARDS = [
    {
        "id": "goa_cafe",
        "prompt": "Find the small cafe from the Goa trip. You remember the vibe, not the date or album.",
        "target_ids": ["goa_cafe_01", "goa_cafe_02"],
        "remembered": "small cafe, Goa trip, maybe near the beach",
    },
    {
        "id": "medicine",
        "prompt": "Find the picture of the medicine you photographed when you were sick last year.",
        "target_ids": ["med_box_cold", "med_box_fever", "med_screenshot"],
        "remembered": "medicine box, when I was sick last year",
    },
    {
        "id": "wifi",
        "prompt": "Find the screenshot of the WiFi password you saved for later.",
        "target_ids": ["wifi_screenshot"],
        "remembered": "screenshot of wifi password",
    },
]


def load_catalog() -> list[dict]:
    if not config.MVP_CATALOG.exists():
        return []
    return json.loads(config.MVP_CATALOG.read_text(encoding="utf-8"))


def _tokens(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]+", (text or "").lower()) if len(t) > 2}


def missing_facets(query: str, answers: dict) -> list[str]:
    q = (query or "").lower()
    missing = []
    if not answers.get("kind") and not any(k in q for k in ("screenshot", "document", "scan", "photo", "picture")):
        missing.append("kind")
    if not answers.get("time_ish") and not any(
        k in q for k in ("year", "month", "summer", "last", "ago", "diwali")
    ):
        missing.append("time_ish")
    return missing[:2]


def ask_facet_question(facet: str) -> tuple[str, list[str]]:
    if facet == "kind":
        return "Was this a camera photo, a screenshot, or a document/scan?", [
            "photo",
            "screenshot",
            "document",
            "not sure",
        ]
    if facet == "time_ish":
        return "About when do you think this was?", [
            "last month",
            "last year",
            "two years ago",
            "not sure",
        ]
    return "Any extra clue?", ["not sure"]


def rank_library(query: str, answers: dict, chips: list[str] | None = None, limit: int = 8) -> list[dict]:
    catalog = load_catalog()
    blob = " ".join(
        [
            query or "",
            answers.get("kind") or "",
            answers.get("time_ish") or "",
            " ".join(chips or []),
        ]
    )
    qtok = _tokens(blob)
    scored = []
    for item in catalog:
        hay = _tokens(
            " ".join(
                [
                    item.get("title", ""),
                    item.get("tags", ""),
                    item.get("place", ""),
                    item.get("place_vibe", ""),
                    item.get("event", ""),
                    item.get("object", ""),
                    item.get("kind", ""),
                    item.get("time_ish", ""),
                ]
            )
        )
        overlap = len(qtok & hay)
        if answers.get("kind") and answers["kind"] != "not sure":
            if item.get("kind") == answers["kind"]:
                overlap += 2
            else:
                overlap -= 1
        if answers.get("time_ish") and answers["time_ish"] != "not sure":
            if answers["time_ish"] in (item.get("time_ish") or ""):
                overlap += 1
        reasons = sorted(qtok & hay)
        scored.append((overlap, item, reasons[:6]))
    scored.sort(key=lambda x: (-x[0], x[1]["id"]))
    out = []
    for score, item, reasons in scored[:limit]:
        row = dict(item)
        row["score"] = score
        if score <= 0:
            row["match_reason"] = "Weak match — not likely. Try a clue chip."
        else:
            row["match_reason"] = "Matched because: " + ", ".join(reasons) if reasons else "Partial overlap with your clues."
        row["image_path"] = str(config.MVP_IMAGES / item["image"])
        out.append(row)
    return out
