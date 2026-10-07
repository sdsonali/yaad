"""Type-mix retrieval: one kind question when the grid mixes personal / document / screenshot."""

from __future__ import annotations

import json
import re

from shared import config

TOKEN = re.compile(r"[a-z0-9]+")

PROMPT_CARDS = [
    {
        "id": "college_photos",
        "prompt": "College photos — the memories, not the certificates.",
        "target_ids": ["img_050", "img_051", "img_052"],
        "intent": "memory",
    },
    {
        "id": "college_certificate",
        "prompt": "My college degree certificate I saved for later.",
        "target_ids": ["img_053", "img_054", "img_055"],
        "intent": "saved",
    },
    {
        "id": "saved_screenshot",
        "prompt": "The WiFi password screenshot I saved to use later.",
        "target_ids": ["img_006", "img_016"],
        "intent": "screenshot",
    },
    {
        "id": "personal_vs_docs",
        "prompt": "Something from college — I am not sure if it was a photo or a document.",
        "target_ids": ["img_050", "img_051", "img_053"],
        "intent": "unsure",
    },
]

Q_TYPE_MIX = (
    "were you looking for a memory or something you saved to use later (document/screenshot)?",
    [
        "a memory (personal photos)",
        "something I saved to use later (document / screenshot)",
        "not sure",
    ],
)

Q_SAVED_SPLIT = (
    "was it a document you photographed or a screenshot?",
    ["a document", "a screenshot", "not sure"],
)

MEMORY_ANSWERS = {"a memory (personal photos)", "a memory"}
SAVED_ANSWERS = {
    "something i saved to use later (document / screenshot)",
    "something i saved to use later",
}
DOC_ANSWERS = {"a document", "a document you photographed"}
SHOT_ANSWERS = {"a screenshot"}


def load_index() -> list[dict]:
    if not config.MVP_INDEX.exists():
        return []
    return json.loads(config.MVP_INDEX.read_text(encoding="utf-8"))


def _tok(text: str) -> set[str]:
    return {t for t in TOKEN.findall((text or "").lower()) if len(t) > 2}


def media_kind(item: dict) -> str:
    return item.get("media_kind") or "document"


def kinds_in(results: list[dict], limit: int = 8) -> set[str]:
    return {media_kind(r) for r in results[:limit]}


def _intent_from_answers(answers: list[str]) -> str:
    joined = " ".join(answers).lower()
    if any(a.lower() in MEMORY_ANSWERS or a.lower() == "a memory (personal photos)" for a in answers):
        return "memory"
    if any(a.lower() in SHOT_ANSWERS for a in answers):
        return "screenshot"
    if any(a.lower() in DOC_ANSWERS for a in answers):
        return "document"
    if "memory" in joined and "saved" not in joined:
        return "memory"
    if "screenshot" in joined and "document" not in joined:
        return "screenshot"
    if "document" in joined and "screenshot" not in joined:
        return "document"
    if "saved" in joined or "use later" in joined:
        return "saved"
    return "any"


def score_item(query: str, answers: list[str], item: dict) -> float:
    hay = " ".join(
        [
            item.get("object_type") or "",
            item.get("visible_text_summary") or "",
            item.get("likely_context_of_use") or "",
            item.get("scene_cues") or "",
            item.get("approximate_timeframe_signal") or "",
            item.get("file_type") or "",
            media_kind(item),
        ]
    )
    q = _tok(query + " " + " ".join(answers))
    h = _tok(hay)
    overlap = float(len(q & h))
    kind = media_kind(item)
    intent = _intent_from_answers(answers)
    if intent == "memory":
        overlap += 6 if kind == "personal" else -8
    elif intent == "saved":
        overlap += 5 if kind in ("document", "screenshot") else -8
    elif intent == "document":
        overlap += 6 if kind == "document" else -8
    elif intent == "screenshot":
        overlap += 6 if kind == "screenshot" else -8
    qlow = (query or "").lower()
    if "certificate" in qlow and item.get("object_type") == "certificate":
        overlap += 3
    if "wifi" in qlow and ("wifi" in hay.lower() or "password" in hay.lower()):
        overlap += 3
    if "college" in qlow and any(w in hay.lower() for w in ("college", "campus", "hostel", "fest", "degree", "semester")):
        overlap += 1
    return overlap


def rank(query: str, answers: list[str], limit: int = 12) -> list[dict]:
    scored = []
    for item in load_index():
        s = score_item(query, answers, item)
        row = dict(item)
        row["score"] = s
        row["image_path"] = str(config.MVP_IMAGES / item["filename"])
        scored.append(row)
    scored.sort(key=lambda r: (-r["score"], r["id"]))
    positive = [r for r in scored if r["score"] > 0]
    return (positive or scored)[:limit]


def group_by_kind(results: list[dict]) -> dict[str, list[dict]]:
    buckets = {"personal": [], "document": [], "screenshot": []}
    for row in results:
        buckets.setdefault(media_kind(row), []).append(row)
    return buckets


def results_mix_types(results: list[dict]) -> bool:
    return len(kinds_in(results)) >= 2


def should_ask(results: list[dict], answers: list[str] | None = None) -> bool:
    answers = answers or []
    if not results:
        return True
    if not answers:
        return results_mix_types(results)
    intent = _intent_from_answers(answers)
    kinds = kinds_in(results)
    if intent == "saved" and kinds >= {"document", "screenshot"}:
        return True
    if intent == "any" and results_mix_types(results):
        return True
    return False


def next_question(turn: int, results: list[dict] | None = None, answers: list[str] | None = None) -> tuple[str, list[str]] | None:
    if turn >= 2:
        return None
    answers = answers or []
    results = results or []
    if turn == 0:
        return Q_TYPE_MIX
    intent = _intent_from_answers(answers)
    kinds = kinds_in(results)
    if intent in ("saved", "any") and kinds >= {"document", "screenshot"}:
        return Q_SAVED_SPLIT
    if intent == "any" and results_mix_types(results):
        return Q_TYPE_MIX
    return None
