"""Tab 1: Discovery (funnel tags + RAG). Tab 2: typed-grid retrieval for mixed results."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import streamlit as st

from discovery.aggregate import aggregate, save_opportunity
from discovery.rag import answer_corpus
from mvp.agent import PROMPT_CARDS, group_by_kind, next_question, rank, should_ask
from shared import config

st.set_page_config(page_title="Typed results — Google Photos", layout="wide")

KIND_LABELS = {
    "personal": "Personal photos (memories)",
    "document": "Documents",
    "screenshot": "Screenshots",
}


@st.cache_data(show_spinner=False)
def load_opp() -> dict:
    if config.OPPORTUNITY_JSON.exists():
        return json.loads(config.OPPORTUNITY_JSON.read_text(encoding="utf-8"))
    if config.preferred_tagged_json().exists():
        result = aggregate()
        save_opportunity(result)
        return result
    return {}


@st.cache_data(show_spinner=False)
def load_tagged() -> list:
    path = config.preferred_tagged_json()
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("reviews") or []


def tab_discovery() -> None:
    st.subheader("Discovery engine")
    st.caption(
        "Public Photos talk → keep retrieval + vague-memory items → tag funnel stage, "
        "memory type, anchors, workaround, severity → compare. Not sentiment."
    )
    opp = load_opp()
    rows = load_tagged()
    if not rows:
        st.warning("Run `python discovery/run_pipeline.py` from the project root.")
        return

    left, right = st.columns([1.4, 1])
    with left:
        starters = {s["label"]: s["question"] for s in config.QUERY["starter_questions"]}
        pick = st.radio("Theme", list(starters), horizontal=True)
        q = st.text_input("Ask the corpus", value=starters[pick])
        if st.button("Get grounded answer"):
            ans = answer_corpus(q)
            for i, f in enumerate(ans["findings"], 1):
                st.markdown(f"{i}. {f}")
            with st.expander("Retrieved items (paraphrased)"):
                st.json(ans["excerpts"][:8])
        st.markdown("**Example RAG queries (assignment 1.5)**")
        st.code(
            "\n".join(
                [
                    "show me complaints about search mixing photos with documents",
                    "where do people fail to pick the right kind of result",
                    "what workarounds do users mention when certificates show up in photo search",
                ]
            )
        )
    with right:
        st.markdown("**Opportunity comparison**")
        st.write(opp.get("headline", ""))
        st.caption(f"Gold n={opp.get('total_reviews')} · sources {opp.get('by_source')}")
        stages = opp.get("top_funnel_stages") or []
        if stages:
            st.bar_chart(
                pd.DataFrame({"stage": [r["label"] for r in stages], "pct": [r["pct_of_mentions"] for r in stages]}),
                x="stage",
                y="pct",
            )
        st.markdown("**funnel × memory type (top)**")
        mx = pd.DataFrame(opp.get("matrix") or [])
        if not mx.empty:
            st.dataframe(mx.head(10), hide_index=True, use_container_width=True)
        st.caption("IN: topic search + type mix. OUT: crash/storage/backup-only (dropped in filter).")


def _render_typed_grid(results: list[dict]) -> None:
    st.markdown("**Typed grid — personal / document / screenshot (not one mixed pile)**")
    buckets = group_by_kind(results)
    for kind in ("personal", "document", "screenshot"):
        items = buckets.get(kind) or []
        st.markdown(f"**{KIND_LABELS[kind]}** · {len(items)}")
        if not items:
            st.caption("None in this slice.")
            continue
        cols = st.columns(min(4, len(items)))
        for col, row in zip(cols, items[:4]):
            p = Path(row["image_path"])
            if p.exists():
                col.image(str(p), use_container_width=True)
            col.caption(f"{row.get('object_type')} · {row.get('media_kind')}")
            col.write((row.get("likely_context_of_use") or "")[:80])


def tab_mvp() -> None:
    st.subheader("Typed retrieval — evaluate the kind you meant")
    st.caption(
        "When a topic search mixes memories with papers and screenshots, ask once: "
        "memory vs saved-to-use-later — then show a typed thumbnail grid. "
        "Max two questions. Demo library only. Ritu (college + certificates) is the prompt-card task."
    )
    if "agent" not in st.session_state:
        st.session_state.agent = {"query": "", "answers": [], "turn": 0, "results": [], "log": []}

    card = st.selectbox("Prompt card (or type your own below)", ["(free text)"] + [c["prompt"] for c in PROMPT_CARDS])
    default = "" if card == "(free text)" else card
    query = st.text_input("Topic you remember", value=default, key="qbox")

    c1, c2, c3 = st.columns(3)
    if c1.button("Start retrieval"):
        st.session_state.agent = {"query": query, "answers": [], "turn": 0, "results": [], "log": [{"role": "user", "text": query}]}
        results = rank(query, [])
        st.session_state.agent["results"] = results
        if should_ask(results, []):
            nq = next_question(0, results, [])
            st.session_state.agent["pending"] = nq
        else:
            st.session_state.agent["pending"] = None
    if c2.button("Reset / try another topic"):
        st.session_state.agent = {"query": "", "answers": [], "turn": 0, "results": [], "log": []}
        st.rerun()

    ag = st.session_state.agent
    pending = ag.get("pending")
    if pending:
        qtext, opts = pending
        st.markdown(f"**Clarifying question ({ag['turn'] + 1}/2)** — type mix, not a date field")
        choice = st.radio(qtext, opts, key=f"cq_{ag['turn']}")
        if st.button("Answer"):
            ag["answers"].append(choice)
            ag["log"].append({"role": "assistant", "text": qtext})
            ag["log"].append({"role": "user", "text": choice})
            ag["turn"] += 1
            results = rank(ag["query"], ag["answers"])
            ag["results"] = results
            if ag["turn"] < 2 and should_ask(results, ag["answers"]):
                ag["pending"] = next_question(ag["turn"], results, ag["answers"])
            else:
                ag["pending"] = None
            st.rerun()

    results = ag.get("results") or []
    if results and not pending:
        _render_typed_grid(results)
        if st.button("None of these — try a different kind"):
            ag["pending"] = next_question(min(ag["turn"], 1), results, ag.get("answers") or [])
            if ag["pending"] is None:
                st.info("Clarification cap reached. Reword the topic and press Start retrieval.")
            st.rerun()

    st.markdown(
        "Deliberately not built: open chatbot, date picker, auto-delete, father-only People filter, fake match %."
    )


d, m = st.tabs(["Discovery engine", "Retrieval MVP"])
with d:
    tab_discovery()
with m:
    tab_mvp()
