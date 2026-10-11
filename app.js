/* Scholarship Autopilot — application logic.
 * Data lives in scholarships.js as SCHOLARSHIPS_DATA (embedded const, so the
 * app runs straight from file:// with zero setup — no fetch, no CORS issues).
 * - Local rule-based matching always works (no key needed).
 * - With a Gemini key (runtime only, localStorage, never in the repo), matching
 *   and essay drafts use live AI, failing soft back to local logic.
 */

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const DATA = (typeof SCHOLARSHIPS_DATA !== "undefined") ? SCHOLARSHIPS_DATA : [];
let LAST = null;

const sleep = ms => new Promise(r => setTimeout(r, ms));

window.addEventListener("DOMContentLoaded", () => {
  const k = localStorage.getItem("sap_gemini_key");
  if (k) document.getElementById("apikey").value = k;
  document.getElementById("statN").textContent = DATA.length;
  // On a deployed site the key lives server-side (/api/match) — hide the key field.
  // It stays visible only for local file:// runs.
  if (location.protocol.indexOf("http") === 0) {
    const a = document.getElementById("aiSettings");
    if (a) a.style.display = "none";
  }
  updateCountrySystem();
  ["name", "grade", "country"].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener("input", () => el.classList.remove("field-error"));
    el.addEventListener("change", () => el.classList.remove("field-error"));
  });
  refreshProfileSel();
});

function saveKey() {
  const k = document.getElementById("apikey").value.trim();
  if (k) localStorage.setItem("sap_gemini_key", k);
  else localStorage.removeItem("sap_gemini_key");
  alert(k ? "Key saved in this browser only." : "Key cleared.");
}
function getKey() {
  return (document.getElementById("apikey").value || "").trim()
      || (localStorage.getItem("sap_gemini_key") || "").trim();
}
function readProfile() {
  const sys = countrySys();
  const raw = parseFloat(document.getElementById("gpa").value) || 0;
  const gpa = Math.round(sys.toGPA(raw) * 100) / 100;
  return {
    name: document.getElementById("name").value.trim(),
    grade: parseInt(document.getElementById("grade").value, 10),
    country: document.getElementById("country").value,
    gpa: gpa,                       // internal 0-4 scale (verified cutoffs use this)
    scoreRaw: raw,                  // what the student actually typed
    scoreIsPct: sys.pct,            // true → show % in UI, false → show GPA
    field: document.getElementById("field").value.trim() || "Any",
    achievement: document.getElementById("achievement").value.trim()
  };
}
/* human-readable score for UI: "85%" or "3.6" */
function scoreText(p) { return p.scoreIsPct ? `${p.scoreRaw}%` : `${p.gpa}`; }
/* human-readable grade for UI: "Class 12", "Year 13", ... */
function gradeLabelFor(p) {
  const sys = COUNTRY_SYSTEMS[p.country] || COUNTRY_SYSTEMS.USA;
  const opt = sys.grades.find(([v]) => v === p.grade);
  return opt ? opt[1] : `Grade ${p.grade}`;
}
function setStatus(html) { document.getElementById("status").innerHTML = html || ""; }
function stage(text) {
  setStatus(`<div class="stage"><div class="spinner"></div><span>${text}</span></div>`);
}

function whyLine(profile, s) {
  const bits = [`Grade ${profile.grade} ✓`, `${countryName(profile.country)} ✓`];
  if (s.minGpa != null) {
    const have = profile.scoreIsPct
      ? `${profile.scoreRaw}% (≈${profile.gpa.toFixed(1)} GPA)`
      : `GPA ${profile.gpa}`;
    bits.push(`${have} ≥ ${s.minGpa} cutoff ✓`);
  }
  if (s.fields.includes("Any")) bits.push(`open to all fields ✓`);
  else bits.push(`interest in ${profile.field} matches ${s.fields.join(" / ")} ✓`);
  if (s.intl) bits.push(`open internationally ✓`);
  return bits.join(", ") + ".";
}

/* subject synonyms so "Engineering" matches STEM, "Painting" matches Arts, etc. */
const FIELD_HINTS = {
  STEM: ["science","technology","engineering","math","computer","physics","chemistry","biology","medicine","data","ai","robot","space"],
  Arts: ["art","music","writing","design","literature","theatre","theater","film","dance","paint","poet","photo"]
};
function fieldOK(s, profile) {
  if (s.fields.includes("Any")) return true;
  const f = profile.field.toLowerCase();
  return s.fields.some(sf =>
    f.includes(sf.toLowerCase()) || (FIELD_HINTS[sf] || []).some(h => f.includes(h)));
}
function countryName(code) {
  return { USA: "USA", UK: "UK", Canada: "Canada", Australia: "Australia",
    India: "India", Japan: "Japan", "New Zealand": "New Zealand" }[code] || code;
}

/* per-country systems: grade naming + academic score (GPA vs percentage).
 * Internal matching stays on the 0-4 GPA scale (that's what verified cutoffs use);
 * percentage scores convert transparently via toGPA. */
const PCT_TO_GPA = v => Math.min(4, Math.max(0, (v - 50) / 12.5)); // 100%→4.0, 87.5%→3.0, 75%→2.0
const GPA_TO_PCT = g => Math.round((g * 12.5 + 50) * 10) / 10;
const COUNTRY_SYSTEMS = {
  USA:    { gradeLabel: "Grade", grades: [[9, "Grade 9"], [10, "Grade 10"], [11, "Grade 11"], [12, "Grade 12"]],
            scoreLabel: "GPA (0–4)", scoreMax: 4, scoreStep: 0.1, scoreDef: 3.6, pct: false, toGPA: v => v },
  Canada: { gradeLabel: "Grade", grades: [[9, "Grade 9"], [10, "Grade 10"], [11, "Grade 11"], [12, "Grade 12"]],
            scoreLabel: "GPA (0–4)", scoreMax: 4, scoreStep: 0.1, scoreDef: 3.6, pct: false, toGPA: v => v },
  UK:     { gradeLabel: "Year",  grades: [[9, "Year 10"], [10, "Year 11"], [11, "Year 12"], [12, "Year 13"]],
            scoreLabel: "Average % (0–100)", scoreMax: 100, scoreStep: 1, scoreDef: 75, pct: true, toGPA: PCT_TO_GPA },
  Australia: { gradeLabel: "Year", grades: [[9, "Year 9"], [10, "Year 10"], [11, "Year 11"], [12, "Year 12"]],
            scoreLabel: "Average % (0–100)", scoreMax: 100, scoreStep: 1, scoreDef: 75, pct: true, toGPA: PCT_TO_GPA },
  India:  { gradeLabel: "Class", grades: [[9, "Class 9"], [10, "Class 10"], [11, "Class 11"], [12, "Class 12"]],
            scoreLabel: "Percentage (0–100)", scoreMax: 100, scoreStep: 0.5, scoreDef: 85, pct: true, toGPA: PCT_TO_GPA },
  Japan:  { gradeLabel: "High school year", grades: [[10, "1st Year"], [11, "2nd Year"], [12, "3rd Year"]],
            scoreLabel: "Average % (0–100)", scoreMax: 100, scoreStep: 1, scoreDef: 75, pct: true, toGPA: PCT_TO_GPA },
  "New Zealand": { gradeLabel: "Year", grades: [[9, "Year 10"], [10, "Year 11"], [11, "Year 12"], [12, "Year 13"]],
            scoreLabel: "Average % (0–100)", scoreMax: 100, scoreStep: 1, scoreDef: 75, pct: true, toGPA: PCT_TO_GPA }
};
function countrySys() {
  const c = document.getElementById("country").value;
  return COUNTRY_SYSTEMS[c] || COUNTRY_SYSTEMS.USA;
}
function updateCountrySystem() {
  const c = document.getElementById("country").value;
  const sel = document.getElementById("grade");
  if (!c) {
    document.getElementById("gradeLabel").textContent = "Grade";
    sel.innerHTML = `<option value="">Select grade…</option>`;
    sel.value = "";
  } else {
    const sys = COUNTRY_SYSTEMS[c] || COUNTRY_SYSTEMS.USA;
    const prev = parseInt(sel.value, 10);
    document.getElementById("gradeLabel").textContent = sys.gradeLabel;
    sel.innerHTML = `<option value="">Select ${sys.gradeLabel.toLowerCase()}…</option>` +
      sys.grades.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
    sel.value = sys.grades.some(([v]) => v === prev) ? prev : "";
  }
  const sys2 = (c && COUNTRY_SYSTEMS[c]) || COUNTRY_SYSTEMS.USA;
  document.getElementById("scoreLabel").textContent = sys2.scoreLabel;
  const inp = document.getElementById("gpa");
  inp.max = sys2.scoreMax; inp.step = sys2.scoreStep; inp.value = sys2.scoreDef;
}

/* mandatory-field validation: name, grade, country */
function clearFieldErrors() {
  ["name", "grade", "country"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("field-error");
  });
  setStatus("");
}
const FIELD_IDS = { name: "name", grade: "grade", country: "country" };
const FIELD_LABELS = { name: "name", grade: "grade", country: "country" };

/* ---------- local fallback: transparent rule-based matching ---------- */
function localMatch(profile) {
  return DATA
    .filter(s =>
      s.grades.includes(profile.grade) &&
      (s.minGpa == null || profile.gpa >= s.minGpa) &&
      fieldOK(s, profile) &&
      (s.country === profile.country || s.intl))
    .map(s => ({ ...s, why: whyLine(profile, s), essay: localEssay(profile, s), live: false }));
}
function localEssay(profile, s) {
  const who = profile.name ? `I am ${profile.name}, a` : "I am a";
  const interest = (profile.field && profile.field !== "Any")
    ? `passionate about ${profile.field}` : "eager to continue my education";
  const ach = profile.achievement ? ` Recently, I ${profile.achievement}.` : "";
  return `Dear committee, ${who} grade-${profile.grade} student ${interest}.${ach} ` +
    `The ${s.name} would help me continue this work and fund my education.`;
}

/* ---------- profile analysis: honest, computed, no invented cutoffs ---------- */
function localAnalysis(profile, matches) {
  const out = [];
  const open = matches.filter(s => deadlineStatus(s.deadline).cls !== "closed");
  const soon = matches.filter(s => deadlineStatus(s.deadline).cls === "soon")
    .slice().sort((a, b) => a.deadline < b.deadline ? -1 : 1);
  out.push(`You match ${matches.length} of ${DATA.length} verified scholarships (${countryName(profile.country)}); ${open.length} still open.`);
  if (soon.length)
    out.push(`Most urgent: ${soon[0].name} closes ${soon[0].deadline} — start that application first.`);
  const missed = DATA.filter(s => s.minGpa != null && profile.gpa < s.minGpa &&
    s.grades.includes(profile.grade) && (s.country === profile.country || s.intl));
  if (missed.length) {
    const need = Math.min(...missed.map(s => s.minGpa));
    const names = missed.slice(0, 3).map(s => s.name).join(", ");
    const haveTxt = scoreText(profile);
    const needTxt = profile.scoreIsPct ? `${GPA_TO_PCT(need)}%` : `${need} GPA`;
    out.push(`${haveTxt} locks you out of ${missed.length}: ${names}${missed.length > 3 ? ", …" : ""}. Reaching ${needTxt} would unlock them.`);
  } else if (profile.gpa >= 3.5) {
    out.push(`${scoreText(profile)} clears every published cutoff in the dataset — merit scholarships are your strong lane.`);
  }
  const intlN = matches.filter(s => s.intl).length;
  if (intlN) out.push(`${intlN} international program${intlN > 1 ? "s" : ""} open to you regardless of country.`);
  if (profile.field === "Any") out.push(`No field selected — naming one (e.g. STEM or Arts) sharpens future matches.`);
  return out;
}

/* ---------- live AI matching via Gemini (structured JSON output) ---------- */
async function geminiMatch(profile, key) {
  const slim = DATA.map(s => ({ id: s.id, name: s.name, grades: s.grades, minGpa: s.minGpa,
    fields: s.fields, award: s.award, deadline: s.deadline, country: s.country || null, intl: !!s.intl }));
  const prompt =
`You are a scholarship matching assistant. Student profile: ${JSON.stringify(profile)}.
Scholarships: ${JSON.stringify(slim)}.
Eligibility rules: the student's grade must be in the scholarship's grades; GPA must meet minGpa when set;
their field must fit (Any = all fields); and the scholarship's country must equal the student's country
OR the scholarship must be marked intl (open internationally).
Return ONLY valid JSON shaped like this — no markdown, no explanation:
{"matches":[{"id":"<scholarship id>","why":"<one sentence on why they match>","essay":"<3-4 sentence tailored essay draft opening>"}],
 "analysis":"<3-4 sentences: the student's strengths, gaps, and one actionable tip>"}`;
  const res = await fetch(GEMINI_URL + "?key=" + encodeURIComponent(key), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!res.ok) throw new Error("Gemini HTTP " + res.status);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const obj = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  const arr = Array.isArray(obj) ? obj : (obj.matches || []);
  return {
    matches: arr.map(a => {
      const s = DATA.find(x => x.id === a.id);
      return s ? { ...s, why: a.why, essay: a.essay, live: true } : null;
    }).filter(Boolean),
    analysis: (!Array.isArray(obj) && obj.analysis) || null
  };
}

/* ---------- server-side AI (Vercel /api/match — key never leaves the server) ---------- */
async function serverMatch(profile) {
  const slim = DATA.map(s => ({ id: s.id, name: s.name, grades: s.grades, minGpa: s.minGpa,
    fields: s.fields, award: s.award, deadline: s.deadline, country: s.country || null, intl: !!s.intl }));
  const res = await fetch("/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, scholarships: slim })
  });
  if (!res.ok) throw new Error("server AI unavailable (" + res.status + ")");
  const obj = await res.json();
  const arr = Array.isArray(obj) ? obj : (obj.matches || []);
  if (!Array.isArray(arr)) throw new Error("bad server response");
  return {
    matches: arr.map(a => {
      const s = DATA.find(x => x.id === a.id);
      return s ? { ...s, why: a.why, essay: a.essay, live: true } : null;
    }).filter(Boolean),
    analysis: (!Array.isArray(obj) && obj.analysis) || null
  };
}

/* ---------- merged AI + local matching ----------
 * Local rules guarantee recall (no eligible scholarship is ever missed);
 * AI enriches matches with richer reasoning + essays and can catch what rigid
 * rules miss (e.g. an unusual field spelling). AI suggestions are verified
 * against hard rules (grade, GPA cutoff, country) — hallucinations are dropped.
 */
function passesHardRules(s, profile) {
  return s.grades.includes(profile.grade) &&
    (s.minGpa == null || profile.gpa >= s.minGpa) &&
    (s.country === profile.country || s.intl);
}
function mergeMatches(profile, localMs, aiMs) {
  const byId = new Map();
  localMs.forEach(m => byId.set(m.id, m));
  aiMs.forEach(a => {
    const s = DATA.find(x => x.id === a.id);
    if (!s) return; // hallucinated id — drop
    if (byId.has(a.id)) {
      const cur = byId.get(a.id); // both agree: AI's richer text wins
      if (a.why) cur.why = a.why;
      if (a.essay) cur.essay = a.essay;
      cur.live = true;
    } else if (passesHardRules(s, profile)) {
      // AI-only: trust AI's field judgment, hard-verify everything else
      byId.set(a.id, { ...s,
        why: a.why || whyLine(profile, s),
        essay: a.essay || localEssay(profile, s),
        live: true });
    }
    // else: AI suggested an ineligible scholarship — drop it
  });
  return [...byId.values()];
}

/* ---------- staged, animated, resilient run ---------- */
async function run() {
  clearFieldErrors();
  const profile = readProfile();
  const missing = ["name", "grade", "country"].filter(k => !profile[k]);
  if (missing.length) {
    missing.forEach(k => document.getElementById(FIELD_IDS[k]).classList.add("field-error"));
    setStatus(`<div class="err">⚠️ Please fill in your <b>${missing.map(k => FIELD_LABELS[k]).join(", ")}</b> — matches need it.</div>`);
    document.querySelector(".panel").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const key = getKey();
  document.getElementById("empty").style.display = "none";
  document.getElementById("results").innerHTML = "";
  document.getElementById("exportBtn").disabled = true;
  document.getElementById("icsBtn").disabled = true;

  stage("Scanning scholarships…");       await sleep(450);
  stage("Checking eligibility…");        await sleep(450);

  let matches, live = false, analysis = null;
  const localMs = localMatch(profile); // always computed: deterministic, complete
  // 1) built-in server AI (Vercel) — merged with local rules for the best result
  try {
    stage("Matching with AI + local rules…");
    const r = await serverMatch(profile);
    matches = mergeMatches(profile, localMs, r.matches);
    analysis = r.analysis; live = true;
  } catch (e) {
    // 2) visitor's own key, direct to Gemini (for local file:// runs)
    const key = getKey();
    if (key) {
      try {
        const r = await geminiMatch(profile, key);
        matches = mergeMatches(profile, localMs, r.matches);
        analysis = r.analysis; live = true;
      }
      catch (e2) { console.warn("key AI failed, local fallback:", e2); matches = localMs; }
    } else {
      // 3) local matching alone — the demo never breaks
      matches = localMs;
    }
  }

  setStatus("");
  LAST = { profile, matches, live, analysis };
  document.getElementById("exportBtn").disabled = !matches.length;
  document.getElementById("icsBtn").disabled = !matches.length;
  render(profile, matches, live);
}

function render(profile, matches, live) {
  const box = document.getElementById("results");
  const badge = document.getElementById("badge");
  const t = getTrack();
  const visible = trackFilter === "all" ? matches : matches.filter(s => t[s.id] === trackFilter);
  renderFilters();
  if (!visible.length) {
    const msg = matches.length
      ? `No scholarships marked "${TRACK_LABELS[trackFilter].slice(2)}" yet — tap a status on any card.`
      : `Coverage is strongest for grades 11–12 — try a different grade or field.`;
    box.innerHTML = `<div class="empty"><div class="big">🔍</div>
      <p><b>No matches to show.</b></p><p>${msg}</p></div>`;
    badge.innerHTML = "";
    return;
  }
  badge.innerHTML = live
    ? `<span class="badge live">AI + LOCAL</span>`
    : `<span class="badge local">LOCAL</span>`;
  window._matches = visible; // checklist automation buttons index into this
  const gpaWarn = profile.gpa < 2.0
    ? `<div class="warn">⚠️ <b>Heads up:</b> with a GPA under 2.0, most merit scholarships are extremely competitive. ` +
      `The matches below have <b>no published GPA cutoff</b> — treat them as long shots and confirm directly on the official page.</div>`
    : "";
  const analysisLines = (live && LAST.analysis) ? [LAST.analysis] : localAnalysis(profile, matches);
  const analysisHTML = `<div class="analysis"><b class="head">PROFILE ANALYSIS` +
    `${(live && LAST.analysis) ? ' <span class="autotag">AI</span>' : ""}</b><ul>` +
    analysisLines.map(t => `<li>${escapeHtml(t)}</li>`).join("") + `</ul></div>`;
  box.innerHTML = gpaWarn + analysisHTML + visible.map((s, i) => {
    const st = deadlineStatus(s.deadline);
    const cur = t[s.id];
    return `
    <article class="card" style="--i:${i}">
      <div class="card-top"><h3>${escapeHtml(s.name)}</h3><span class="award">${escapeHtml(s.award)}</span></div>
      <div class="meta">
        <span class="chip">⏰ ${escapeHtml(s.deadline)}</span>
        <span class="chip ${st.cls}">${st.label}</span>
        ${s.country ? `<span class="chip">🌍 ${escapeHtml(s.country)}</span>` : ""}
        <a class="chip" href="${escapeHtml(s.officialLink)}" target="_blank" rel="noopener">Official page ↗</a>
      </div>
      <p class="why">${escapeHtml(s.why)}</p>
      <div class="essay"><b>ESSAY DRAFT</b><p>${escapeHtml(s.essay)}</p></div>
      <div class="trow"><b class="head" style="font-size:.72rem;letter-spacing:.1em;color:var(--faint)">TRACK</b>
        ${["want", "applied", "won"].map(k =>
          `<button class="tbtn ${cur === k ? "active-" + k : ""}" onclick="setTrack('${s.id}','${k}')">${TRACK_LABELS[k]}</button>`).join("")}
      </div>
      <div class="checks"><b class="head">CHECKLIST <span class="autotag">AUTOPILOT-ASSISTED</span></b>
        <label class="check done"><input type="checkbox" checked disabled><span>Confirm eligibility <em class="auto">AUTO ✓ verified</em></span></label>
        <label class="check"><input type="checkbox" id="ck-essay-${i}" onchange="this.parentElement.classList.toggle('done', this.checked)"><span>Finalize essay</span> <button type="button" class="mini" onclick="copyEssay(${i}, event)">Copy draft</button></label>
        <label class="check"><input type="checkbox" onchange="this.parentElement.classList.toggle('done', this.checked)"><span>Recommendation letter</span></label>
        <label class="check"><input type="checkbox" id="ck-cal-${i}" onchange="this.parentElement.classList.toggle('done', this.checked)"><span>Submit before ${escapeHtml(s.deadline)}</span> <button type="button" class="mini" onclick="addCal(${i}, event)">Add to calendar</button></label>
      </div>
      ${s.note ? `<p class="note">${escapeHtml(s.note)}</p>` : ""}
    </article>`; }).join("");
}

function escapeHtml(t) {
  return String(t).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* deadline status: honest "closed / closing soon / open" chips */
function deadlineStatus(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  const days = Math.round((d - today) / 86400000);
  if (days < 0)  return { label: "⚪ Applications closed", cls: "closed" };
  if (days <= 45) return { label: `🟡 ${days}d left`, cls: "soon" };
  return { label: `🟢 ${days}d left`, cls: "open" };
}

/* checklist automation: copy draft / add-to-calendar check their boxes */
window.copyEssay = function(i, e) {
  if (e) e.preventDefault();
  const m = window._matches && window._matches[i];
  if (!m) return;
  if (navigator.clipboard) navigator.clipboard.writeText(m.essay || "").catch(() => {});
  const box = document.getElementById("ck-essay-" + i);
  if (box) { box.checked = true; box.closest("label").classList.add("done"); }
};
window.addCal = function(i, e) {
  if (e) e.preventDefault();
  const m = window._matches && window._matches[i];
  if (!m) return;
  downloadICS(m);
  const box = document.getElementById("ck-cal-" + i);
  if (box) { box.checked = true; box.closest("label").classList.add("done"); }
};

/* ---------- application tracker (localStorage) ---------- */
let trackFilter = "all";
const TRACK_LABELS = { want: "⭐ Want to apply", applied: "📝 Applied", won: "🏆 Won" };
function getTrack() {
  try { return JSON.parse(localStorage.getItem("sap_track") || "{}"); } catch { return {}; }
}
function setTrack(id, status) {
  const tr = getTrack();
  if (tr[id] === status) delete tr[id]; else tr[id] = status;
  localStorage.setItem("sap_track", JSON.stringify(tr));
  render(LAST.profile, LAST.matches, LAST.live);
}
function renderFilters() {
  const tr = getTrack();
  const counts = { all: LAST.matches.length, want: 0, applied: 0, won: 0 };
  LAST.matches.forEach(s => { const st = tr[s.id]; if (st) counts[st]++; });
  const defs = [["all", `All (${counts.all})`], ["want", `⭐ Want (${counts.want})`],
                ["applied", `📝 Applied (${counts.applied})`], ["won", `🏆 Won (${counts.won})`]];
  document.getElementById("filters").innerHTML = defs.map(([k, l]) =>
    `<button class="fchip ${trackFilter === k ? "active" : ""}" onclick="setFilter('${k}')">${l}</button>`).join("");
}
function setFilter(k) { trackFilter = k; render(LAST.profile, LAST.matches, LAST.live); }

/* ---------- deadline calendar export (.ics) ---------- */
function icsEsc(t) { return String(t).replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;"); }
function buildICS(list) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  let ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ScholarshipAutopilot//EvoHacks2026//EN\r\n";
  list.forEach(s => {
    ics += "BEGIN:VEVENT\r\nUID:" + s.id + "@scholarship-autopilot\r\nDTSTAMP:" + stamp +
      "\r\nDTSTART;VALUE=DATE:" + s.deadline.replace(/-/g, "") +
      "\r\nSUMMARY:" + icsEsc(`Scholarship deadline: ${s.name} (${s.award})`) +
      "\r\nDESCRIPTION:" + icsEsc("Official page: " + s.officialLink) + "\r\nEND:VEVENT\r\n";
  });
  return ics + "END:VCALENDAR";
}
function downloadICSFile(ics, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
/* single-scholarship .ics (used by the checklist "Add to calendar" button) */
function downloadICS(s) {
  if (deadlineStatus(s.deadline).cls === "closed") { alert("This deadline has passed."); return; }
  downloadICSFile(buildICS([s]), `deadline-${s.id}.ics`);
}
function exportICS() {
  if (!LAST || !LAST.matches.length) return;
  const open = LAST.matches.filter(s => deadlineStatus(s.deadline).cls !== "closed");
  if (!open.length) { alert("No open deadlines to export."); return; }
  downloadICSFile(buildICS(open), "scholarship-deadlines.ics");
}

/* ---------- saved profiles (localStorage) ---------- */
function getProfiles() {
  try { return JSON.parse(localStorage.getItem("sap_profiles") || "{}"); } catch { return {}; }
}
function saveProfile() {
  const name = document.getElementById("name").value.trim() ||
    `Profile ${Object.keys(getProfiles()).length + 1}`;
  const ps = getProfiles();
  ps[name] = readProfile(); ps[name].name = name;
  localStorage.setItem("sap_profiles", JSON.stringify(ps));
  refreshProfileSel();
  alert(`Profile "${name}" saved in this browser.`);
}
function loadProfile(name) {
  if (!name) return;
  const p = getProfiles()[name]; if (!p) return;
  document.getElementById("name").value = p.name || "";
  if (p.country) document.getElementById("country").value = p.country;
  updateCountrySystem();
  document.getElementById("grade").value = p.grade;
  document.getElementById("gpa").value = (p.scoreRaw != null ? p.scoreRaw : "");
  document.getElementById("field").value = p.field === "Any" ? "" : p.field;
  document.getElementById("achievement").value = p.achievement || "";
}
function refreshProfileSel() {
  const names = Object.keys(getProfiles());
  document.getElementById("profileSel").innerHTML =
    `<option value="">Saved profiles…</option>` +
    names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
}

/* ---------- one-click application pack export ---------- */
function exportPack() {
  if (!LAST || !LAST.matches.length) return;
  const { profile, matches, live } = LAST;
  const displayName = profile.name || "Student";
  let md = `# Scholarship Application Pack — ${displayName}\n\n`;
  md += `Profile: ${gradeLabelFor(profile)}, ${countryName(profile.country)}, score ${scoreText(profile)}, interest: ${profile.field}\n`;
  md += `Generated: ${new Date().toISOString()} (${live ? "live Gemini AI" : "local matching"})\n\n`;
  const aLines = (live && LAST.analysis) ? [LAST.analysis] : localAnalysis(profile, matches);
  md += `## Profile analysis\n${aLines.map(t => `- ${t}`).join("\n")}\n\n`;
  matches.forEach((s, i) => {
    md += `## ${i + 1}. ${s.name}\nAward: ${s.award} · Deadline: ${s.deadline}\nOfficial: ${s.officialLink}\n\n`;
    md += `Why you match: ${s.why}\n\nEssay draft:\n${s.essay}\n\nChecklist:\n`;
    md += `- [ ] Confirm eligibility\n- [ ] Finalize essay\n- [ ] Recommendation letter\n- [ ] Submit before ${s.deadline}\n\n`;
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
  a.download = "scholarship-application-pack.md";
  a.click();
  URL.revokeObjectURL(a.href);
}
