# Scholarship Autopilot — EvoHacks2026

AI-for-Automation: turns a student profile into eligible scholarship matches,
tailored essay drafts, and a deadline checklist — one automation instead of
weeks of scattered searching. One click exports the full application pack.

## Why this wins (judging map)
- **Impact & Utility:** real money problem for the exact audience (high school students).
- **Technical Execution:** live Gemini structured-output matching + drafting, with a
  transparent local fallback; clean, commented, zero-dependency codebase.
- **Creativity:** "Application Pack" export — profile summary, tailored essays,
  checklists, deadlines in one markdown file.
- **Presentation:** staged animated run (scan → match → draft), before/after framing,
  video walks through features + code.

## Run it (judges — 10 seconds, zero setup)
1. Download / clone this folder.
2. Double-click `index.html`. Done — no build step, no `npm install`, no server.
   (The dataset is embedded in `scholarships.js`, so it works straight from `file://`.)
3. Optional: paste a Gemini API key in the app's AI settings for live AI matching.
   The key stays in your browser (`localStorage`) — it never enters the repo.

## Architecture
- `index.html` — hero, profile form, AI settings, saved profiles, results shell.
- `styles.css` — premium dark theme: animated gradient orbs, glass panels,
  staggered card entrances, custom checkboxes, filter chips, responsive layout.
- `app.js` — `localMatch()` (rule-based, always works), `geminiMatch()` (live AI),
  staged `run()` with status animations, application tracker (`setTrack` + filters,
  localStorage), `exportPack()` (markdown download), `exportICS()` (calendar file),
  saved profiles (`saveProfile`/`loadProfile`, localStorage).
  Live AI fails soft to local matching — the demo never breaks.
- `scholarships.js` — curated dataset as an embedded const (verified entries).
- `DEVPOST.md` — copy-paste submission fields (title, tagline, description, setup).
- `README.md` — this file.

## Security note
API keys are entered at runtime in the demo UI and stored only in the user's
browser. **No key is ever in the repo.**

## Submission checklist (Devpost)
- [ ] Project description + setup instructions (this README)
- [ ] Public repo link (push this folder)
- [ ] 2–3 min video: problem → automation → code walkthrough
- [ ] Live demo link or local setup instructions

## Demo script (video, ~2:30)
1. The problem: scholarship hunting is scattered and slow (15s).
2. Enter profile → staged run → matches with "why you match" → essay drafts → interactive checklist (60s).
3. Paste key → live Gemini run → AI-drafted essays (30s).
4. Export application pack → open the markdown (20s).
5. Code walkthrough: `geminiMatch`, fallback, `exportPack`, embedded dataset (40s).
