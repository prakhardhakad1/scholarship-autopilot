/* Vercel serverless function: POST /api/match
 * The Gemini API key lives ONLY in the Vercel env var GEMINI_API_KEY.
 * It is never in the repo, never in the client bundle.
 * Deploy: `vercel` then `vercel env add GEMINI_API_KEY` (or dashboard).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "AI not configured on server" });
  }
  const { profile, scholarships } = req.body || {};
  if (!profile || !Array.isArray(scholarships) || scholarships.length > 60) {
    return res.status(400).json({ error: "bad request" });
  }

  const slim = scholarships.map(s => ({
    id: s.id, name: s.name, grades: s.grades, minGpa: s.minGpa,
    fields: s.fields, award: s.award, deadline: s.deadline, country: s.country || null, intl: !!s.intl
  }));
  const prompt =
`You are a scholarship matching assistant. Student profile: ${JSON.stringify(profile)}.
Scholarships: ${JSON.stringify(slim)}.
Eligibility rules: the student's grade must be in the scholarship's grades; GPA must meet minGpa when set;
their field must fit (Any = all fields); and the scholarship's country must equal the student's country
OR the scholarship must be marked intl (open internationally).
Return ONLY valid JSON — an array of objects for scholarships the student is ELIGIBLE for, each shaped:
{"id":"<scholarship id>","why":"<one sentence on why they match>","essay":"<3-4 sentence tailored essay draft opening>"}.
No markdown, no explanation, just the JSON array.`;

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        encodeURIComponent(key),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    if (!r.ok) throw new Error("Gemini HTTP " + r.status);
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const arr = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
    return res.status(200).json(arr);
  } catch (e) {
    return res.status(502).json({ error: "AI request failed" });
  }
}
