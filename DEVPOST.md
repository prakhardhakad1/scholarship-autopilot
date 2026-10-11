# Devpost submission — copy-paste fields

## Project name
Scholarship Autopilot

## Tagline
From student profile to scholarship application pack in 60 seconds — AI-matched, deadline-tracked, one click to export.

## Description (paste into Devpost "About")
**The problem.** High school students miss out on thousands of dollars in scholarships
because the information is scattered across dozens of sites, eligibility rules are
buried in PDFs, and every application needs a tailored essay from scratch. Weeks of
manual work — most students never start.

**The automation.** Scholarship Autopilot takes one student profile (grade, GPA, field
of interest, one achievement) and automates the entire top of the funnel:
1. **Match** — every scholarship in the curated dataset is checked against the
   profile (grade, GPA threshold, field). With a Gemini API key, matching and
   reasoning go through live AI with structured JSON output; without one, a
   transparent local matcher runs instead — the demo never breaks.
2. **Draft** — a tailored essay opening is generated for each match, seeded by the
   student's own achievement.
3. **Track** — each match gets honest deadline chips (open / closing soon / closed),
   an interactive checklist, and a per-scholarship application tracker
   (Want to apply → Applied → Won) with filter views.
4. **Export** — one click downloads the full application pack as Markdown, or all
   open deadlines as an `.ics` calendar file.

**How AI is used.** Gemini (`gemini-2.0-flash`) receives the profile plus the
scholarship dataset and returns structured JSON: eligible IDs, one-sentence
match reasoning, and tailored essay drafts. If the API is unreachable, the app
fails soft to the local matcher — resilience is a feature, not an afterthought.

**Data integrity.** Every scholarship in the dataset was verified against its
official program page — award amount and deadline confirmed, official links only.
Unverifiable programs were dropped, not fudged. Closed deadlines are flagged
openly in the UI.

## Built with
JavaScript, Gemini API, HTML/CSS (zero dependencies, zero build step)

## Try it out links
- Live demo: _(paste deployed URL or "open index.html locally — zero setup")_
- Video: _(paste YouTube/unlisted link, 2–3 min)_

## Setup instructions (for "How to run")
1. Download the repo (or unzip).
2. Double-click `index.html` — no build step, no server, no install.
3. Fill the profile, click "Find my scholarships".
4. Optional: paste a Gemini API key in AI settings for live AI matching
   (the key stays in your browser only — never in the repo).
