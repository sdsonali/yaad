"""Offline index: read image metadata (OCR stand-in / vision). Not hand-authored into library.json."""

from __future__ import annotations

import json
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from PIL import Image

from shared import config


def index_one(item: dict) -> dict:
    path = config.MVP_IMAGES / item["filename"]
    img = Image.open(path)
    info = {k: str(v) for k, v in (img.info or {}).items()}
    y, m = (item.get("rough_date") or "2024-01").split("-")[:2]
    season = {"01": "winter", "02": "winter", "03": "spring", "06": "summer", "08": "monsoon", "11": "winter"}.get(m, "unknown")
    object_type = info.get("object_type", "other")
    return {
        "id": item["id"],
        "filename": item["filename"],
        "rough_date": item["rough_date"],
        "file_type": item["file_type"],
        "object_type": object_type,
        "media_kind": classify_kind(object_type, item.get("file_type") or "", info.get("scene_cues", "")),
        "visible_text_summary": info.get("visible_text_summary", ""),
        "likely_context_of_use": info.get("likely_context_of_use", ""),
        "scene_cues": info.get("scene_cues", ""),
        "approximate_timeframe_signal": f"file date suggests {season} {y}",
    }


PERSONAL_TYPES = {"college_memory", "personal_photo"}
DOCUMENT_TYPES = {
    "certificate",
    "id_card",
    "receipt",
    "medicine_label",
    "boarding_pass",
}


def classify_kind(object_type: str, file_type: str, scene: str) -> str:
    ot = (object_type or "").lower()
    scene_l = (scene or "").lower()
    if ot in PERSONAL_TYPES:
        return "personal"
    if ot == "certificate":
        return "document"
    if file_type == "screenshot" or ot == "document_screenshot" or "screenshot" in scene_l:
        return "screenshot"
    if ot in DOCUMENT_TYPES:
        return "document"
    return "document"


def main() -> None:
    if not config.MVP_LIBRARY.exists():
        print("Run mvp/generate_library.py first")
        sys.exit(1)
    library = json.loads(config.MVP_LIBRARY.read_text(encoding="utf-8"))
    index = [index_one(item) for item in library]
    config.MVP_INDEX.write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"Indexed {len(index)} -> {config.MVP_INDEX}")


if __name__ == "__main__":
    main()
