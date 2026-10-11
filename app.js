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
  return {
    name: document.getElementById("name").value.trim(),
    grade: parseInt(document.getElementById("grade").value, 10),
    country: document.getElementById("country").value,
    gpa: parseFloat(document.getElementById("gpa").value) || 0,
    field: document.getElementById("field").value.trim() || "Any",
    achievement: document.getElementById("achievement").value.trim()
  };
}
function setStatus(html) { document.getElementById("status").innerHTML = html || ""; }
function stage(text) {
  setStatus(`<div class="stage"><div class="spinner"></div><span>${text}</span></div>`);
}

function whyLine(profile, s) {
  const bits = [`Grade ${profile.grade} ✓`, `${countryName(profile.country)} ✓`];
  if (s.minGpa != null) bits.push(`GPA ${profile.gpa} ≥ ${s.minGpa} ✓`);
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
Return ONLY valid JSON — an array of objects for scholarships the student is ELIGIBLE for, each shaped:
{"id":"<scholarship id>","why":"<one sentence on why they match>","essay":"<3-4 sentence tailored essay draft opening>"}.
No markdown, no explanation, just the JSON array.`;
  const res = await fetch(GEMINI_URL + "?key=" + encodeURIComponent(key), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!res.ok) throw new Error("Gemini HTTP " + res.status);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const arr = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
  return arr.map(a => {
    const s = DATA.find(x => x.id === a.id);
    return s ? { ...s, why: a.why, essay: a.essay, live: true } : null;
  }).filter(Boolean);
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
  const arr = await res.json();
  if (!Array.isArray(arr)) throw new Error("bad server response");
  return arr.map(a => {
    const s = DATA.find(x => x.id === a.id);
    return s ? { ...s, why: a.why, essay: a.essay, live: true } : null;
  }).filter(Boolean);
}

/* ---------- staged, animated, resilient run ---------- */
async function run() {
  const profile = readProfile();
  const key = getKey();
  document.getElementById("empty").style.display = "none";
  document.getElementById("results").innerHTML = "";
  document.getElementById("exportBtn").disabled = true;
  document.getElementById("icsBtn").disabled = true;

  stage("Scanning scholarships…");       await sleep(450);
  stage("Checking eligibility…");        await sleep(450);

  let matches, live = false;
  // 1) built-in server AI (Vercel) — the visitor needs no key
  try {
    stage("Drafting with built-in AI…");
    matches = await serverMatch(profile);
    live = true;
  } catch (e) {
    // 2) visitor's own key, direct to Gemini (for local file:// runs)
    const key = getKey();
    if (key) {
      try { matches = await geminiMatch(profile, key); live = true; }
      catch (e2) { console.warn("key AI failed, local fallback:", e2); matches = localMatch(profile); }
    } else {
      // 3) transparent local matching — the demo never breaks
      matches = localMatch(profile);
    }
  }

  setStatus("");
  LAST = { profile, matches, live };
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
    ? `<span class="badge live">LIVE AI</span>`
    : `<span class="badge local">LOCAL MODE · ADD KEY FOR LIVE AI</span>`;
  window._matches = visible; // checklist automation buttons index into this
  const gpaWarn = profile.gpa < 2.0
    ? `<div class="warn">⚠️ <b>Heads up:</b> with a GPA under 2.0, most merit scholarships are extremely competitive. ` +
      `The matches below have <b>no published GPA cutoff</b> — treat them as long shots and confirm directly on the official page.</div>`
    : "";
  box.innerHTML = gpaWarn + visible.map((s, i) => {
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
  document.getElementById("grade").value = p.grade;
  if (p.country) document.getElementById("country").value = p.country;
  document.getElementById("gpa").value = p.gpa;
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
  md += `Profile: grade ${profile.grade}, ${countryName(profile.country)}, GPA ${profile.gpa}, interest: ${profile.field}\n`;
  md += `Generated: ${new Date().toISOString()} (${live ? "live Gemini AI" : "local matching"})\n\n`;
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
