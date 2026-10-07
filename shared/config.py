"""Discovery taxonomy + MVP paths. Secrets in .env."""

from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _env(name: str) -> str:
    val = (os.getenv(name) or "").strip()
    if val:
        return val
    try:
        import streamlit as st

        secret = st.secrets.get(name)
        if secret is not None:
            return str(secret).strip()
    except Exception:
        pass
    return ""


DISCOVERY_DATA = BASE_DIR / "discovery" / "data"
MVP_DATA = BASE_DIR / "mvp" / "data"
DATA_DIR = DISCOVERY_DATA

OUTPUT_CSV = DISCOVERY_DATA / "reviews.csv"
GOLD_CSV = DISCOVERY_DATA / "gold_reviews.csv"
GOLD_JSON = DISCOVERY_DATA / "gold_reviews.json"
GOLD_TAGGED_JSON = DISCOVERY_DATA / "gold_tagged_reviews.json"
TAGGED_JSON = DISCOVERY_DATA / "tagged_reviews.json"
OPPORTUNITY_JSON = DISCOVERY_DATA / "opportunity_table.json"
OPPORTUNITY_CSV = DISCOVERY_DATA / "opportunity_table.csv"
RAG_EXAMPLES = DISCOVERY_DATA / "rag_examples.json"

MVP_IMAGES = MVP_DATA / "images"
MVP_LIBRARY = MVP_DATA / "library.json"
MVP_INDEX = MVP_DATA / "index.json"
INTERVIEW_JSON = BASE_DIR / "survey" / "interview_tasks.json"
MVP_TEST_JSON = BASE_DIR / "docs" / "mvp_test_results.json"

ENABLE_PLAY_STORE = True
ENABLE_APP_STORE = True
ENABLE_YOUTUBE = True
ENABLE_REDDIT = True

TARGET_TOTAL = 900
GOLD_TARGET_TOTAL = 500

SOURCE_LABELS = {
    "play_store": "Google Play",
    "app_store": "App Store",
    "youtube": "YouTube",
    "reddit": "Reddit",
}

PLAY_STORE = {
    "app_id": "com.google.android.apps.photos",
    "lang": "en",
    "country": "in",
    "count": 400,
    "sort": "most_relevant",
}

APP_STORE = {
    "app_id": 962194608,
    "country": "us",
    "countries": ["us", "in", "gb", "au", "ca"],
    "count": 250,
}

YOUTUBE = {
    "api_key": _env("YOUTUBE_API_KEY"),
    "search_queries": [
        "google photos search can't find",
        "google photos find screenshot",
        "google photos search old photo",
        "google photos organize documents",
    ],
    "max_videos_per_query": 8,
    "max_comments_per_video": 40,
    "order": "relevance",
}

REDDIT = {
    "subreddits": ["googlephotos", "GooglePixel", "google", "android", "iphone"],
    "queries": [
        "can't find photo",
        "can't find screenshot",
        "search doesn't work",
        "lost photo",
        "find receipt",
        "old screenshot",
    ],
    "limit_per_query": 40,
}

LLM = {
    "provider": "groq",
    "batch_size": 8,
    "max_retries": 3,
    "retry_sleep_sec": 6,
    "temperature": 0.2,
    "max_tokens": 2200,
    "models": {
        "huggingface": "meta-llama/Llama-3.1-8B-Instruct",
        "groq": "llama-3.1-8b-instant",
        "gemini": "gemini-1.5-flash",
        "anthropic": "claude-sonnet-4-5",
    },
}

FUNNEL_STAGES = [
    "recall_trigger",
    "query_formulation",
    "system_interpretation",
    "result_relevance",
    "visual_evaluation",
    "refinement",
]

MEMORY_TYPES = [
    "functional_utility",
    "emotional_episodic",
    "people_anchored",
    "temporal_only",
    "unclear",
]

MEMORY_ANCHORS = [
    "approximate_time",
    "location",
    "who_was_present",
    "what_it_was_for",
    "device_used",
    "visual_appearance",
    "none",
]

WORKAROUNDS = [
    "manual_scroll",
    "asked_someone",
    "gave_up",
    "repeated_search_attempts",
    "used_album",
    "none_mentioned",
]

SEVERITIES = ["low", "medium", "high"]

QUERY = {
    "starter_questions": [
        {
            "label": "Type mix",
            "question": "When does Photos search mix camera photos with documents or screenshots on the same topic?",
        },
        {
            "label": "Evaluation",
            "question": "Do people fail to pick the right kind of result even when the item is in the grid?",
        },
        {
            "label": "College / documents",
            "question": "What complaints mention certificates, IDs, or papers showing up in photo search?",
        },
        {
            "label": "Workarounds",
            "question": "What workarounds do people use when they cannot tell photos from documents in results?",
        },
        {
            "label": "Screenshots",
            "question": "Where do screenshots get lost inside a mixed photo grid?",
        },
        {
            "label": "Out of scope",
            "question": "Which complaints are People-tab only or about deleting unused photos?",
        },
    ],
}


def preferred_review_csv() -> Path:
    return GOLD_CSV if GOLD_CSV.exists() else OUTPUT_CSV


def preferred_tagged_json() -> Path:
    return GOLD_TAGGED_JSON if GOLD_TAGGED_JSON.exists() else TAGGED_JSON
