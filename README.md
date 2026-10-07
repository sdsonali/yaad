# Yaad

A mobile-first sample photo library you can search by talking or typing, in Hindi, Hinglish or English. Results show up immediately. If the set is too broad, Yaad asks **one short question** built from the differences in those photos — for example solo or with other people — and a tap narrows the grid.

The library belongs to a fictional person, Aarav Sharma. People in the pictures are **drawn and pre-labelled**. This does not test face recognition, and it does not connect to Google Photos.

## Run it

Install [Node.js 20+](https://nodejs.org/), then:

```powershell
cd C:\Users\itch\Desktop\google-photos-retrieval
copy .env.example .env.local
npm install
npm run generate
npm test
npm run dev
```

Open http://localhost:3000 on a phone-sized window (about 390px wide).

| Page | What it is |
|---|---|
| `/` | Yaad, the clarifying-question search |
| `/classic` | Keyword search baseline. No questions, no mic, no hiding |
| `/test/plan?p=P01` | Task order for a participant |
| `/test?p=P01&task=T1&mode=assist` | One timed task |
| `/admin?key=change-me` | Success rate, time, and a CSV download |

Odd participant numbers (P01, P03, …) do Yaad first. Even numbers do keyword search first. Each person gets three tasks in each mode.

## Environment

Put these in `.env.local`. Never expose the API key to the browser; search calls Claude only from `/api/search`.

```
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
PHRASE_WITH_LLM=false
ADMIN_KEY=change-me
```

If the key is missing, invalid, or the call takes longer than 4 seconds, search falls back to a small Hinglish/Hindi dictionary. The grid still appears. Chip taps never call the model.

`PHRASE_WITH_LLM=true` lets the model rewrite the question sentence. Leave it `false` unless you want that extra call. Options stay the same either way.

Change `ADMIN_KEY` before you share a deployed link.

## How a search works

1. One model call turns the sentence into a small JSON intent (people, age, place, occasion, words like "blue door").
2. Deterministic scoring ranks the library. Documents and screenshots are tucked behind a "hidden" banner on memory searches, not deleted.
3. If more than 8 photos remain, and some facet actually splits them, Yaad asks. At most 3 questions. Taps are filters, not new model calls.

## Add or change photos

The shipped library is 132 illustrated scenes in `public/photos`, described in `data/photos.json`. Regenerate both with:

```powershell
npm run generate
```

`scripts/generate-doc-cards.ts` builds the illustrations and the metadata together, including document, screenshot and health cards whose text is visible in the image.

`scripts/caption.ts` can draft metadata for a **jpeg/png** by sending it to Claude. It prints JSON and does **not** write `photos.json`. Read every draft before you keep it. Do not ship unreviewed captions, and do not put real people's photos in this demo.

After editing metadata, run `npm test`.

## Tests

```powershell
npm test
```

Vitest covers facet selection (including "don't ask when a bucket is too lopsided or mostly unknown"), ranking, the rule-based parser, and the six planted tasks against `data/photos.json`.

## Deploy

The app is a Next.js project and deploys on Vercel.

```powershell
npx vercel
```

Set `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `PHRASE_WITH_LLM` and `ADMIN_KEY` in the project settings.

Event logs are appended to `data/events.jsonl` on your machine. On Vercel the disk is ephemeral, so the file falls back to the instance temp folder and **will not survive a new deploy**. Export the CSV from `/admin` before you rely on it. For a lasting store, point `lib/logging.ts` at Vercel KV or Supabase; the event list in the admin page is the whole schema.

## Export results

Open `/admin?key=YOUR_ADMIN_KEY` and press **Download CSV**. The table shows, per task and mode: success rate, median time-to-find, median interactions, how often a question was answered, skip rate, voice use, and fallback rate.

Logged fields are only the ones in the study plan: session, participant id, task, mode, query text, and the interaction events. Nothing else is stored.

## Known limits

- People and tags are **pre-labelled**. The demo does not test face recognition or caption quality. The footer says so: "Sample library · simulated face groups".
- 132 photos is much easier than a real library of tens of thousands. Ranking and question quality at that scale are untested.
- Keyword search is a plain MiniSearch baseline over English captions and tags. It is not Google Photos. Hindi queries mostly miss there on purpose.
- Speech recognition uses the browser (`webkitSpeechRecognition`), defaults to `hi-IN`, and is unreliable on mixed Hindi-English. The transcript stays editable, and unsupported browsers hide the mic.
- Illustrations are original drawings for this fictional library, not stock photos, so the planted details (blue cake, blue door, a solo Papa) are actually in the picture.

## Earlier research prototype

This repo also contains a Python discovery prototype (Play Store reviews and a Streamlit app). That work is separate from Yaad:

```powershell
python -m venv pm-env
.\pm-env\Scripts\Activate.ps1
pip install -r requirements.txt
python discovery/run_pipeline.py
streamlit run app.py
```
