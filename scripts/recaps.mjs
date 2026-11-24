// GreatestMe email recaps. Runs on a GitHub schedule (see .github/workflows/recaps.yml).
// Reads each person's journal from Supabase with the secret key, decides which recaps are due
// in their own time zone, sends them through SMTP, and logs each one so nothing is sent twice.
import nodemailer from "nodemailer";
import { render } from "./email-templates.mjs";

const URL_ = (process.env.SUPABASE_URL || "").replace(/\/+$/, ""), KEY = process.env.SUPABASE_SECRET_KEY;
const APP = process.env.APP_URL || "https://soulsmitty.github.io/GreatestMe/";
const DRY = process.env.DRY_RUN === "1";
if (!URL_ || !KEY) { console.log("Recaps are not configured yet (missing SUPABASE_URL or SUPABASE_SECRET_KEY). Skipping."); process.exit(0); }
if (!DRY && !process.env.SMTP_PASSWORD) { console.log("Recaps are not configured yet (missing SMTP_PASSWORD). Skipping."); process.exit(0); }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const api = async (path, opts = {}) => { const r = await fetch(`${URL_}${path}`, { ...opts, headers: { ...H, ...(opts.headers || {}) } }); if (!r.ok) throw new Error(`${r.status} ${path}: ${(await r.text()).slice(0, 200)}`); const body = await r.text(); return body ? JSON.parse(body) : null; }; // inserts answer 201 with an empty body
const mailer = DRY ? null : nodemailer.createTransport({ host: process.env.SMTP_HOST || "mail.privateemail.com", port: +(process.env.SMTP_PORT || 465), secure: (process.env.SMTP_PORT || "465") === "465", auth: { user: process.env.SMTP_USER || "hello@teamsolen.com", pass: process.env.SMTP_PASSWORD } });
const FROM = process.env.EMAIL_FROM || "GreatestMe <hello@teamsolen.com>";

// ---- journal math (mirrors the app) ----
const TOTAL = 91, WEEKS = 13;
const ymd = s => s.split("-").map(Number);
const addDays = (s, n) => { const [y, m, d] = ymd(s); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); };
const diff = (a, b) => Math.round((Date.UTC(...ymd(b).map((v, i) => i === 1 ? v - 1 : v)) - Date.UTC(...ymd(a).map((v, i) => i === 1 ? v - 1 : v))) / 864e5);
const fmt = (s, o) => { const [y, m, d] = ymd(s); return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", { timeZone: "UTC", ...o }); };
function local(tz){ const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, mins: +p.hour * 60 + +p.minute, dow: p.weekday.slice(0, 2).toUpperCase() }; }
const toMins = t => { const [h, m] = String(t || "07:00").split(":").map(Number); return h * 60 + (m || 0); };
const parts = dd => { if (!dd) return { m: 0, t: 0, e: 0 }; const g = (dd.gratitude || []).filter(x => (x || "").trim()).length; const m = Math.min(1, g / 3 * .6 + ((dd.intention || "").trim() ? .4 : 0));
  const set = (dd.targets || []).filter(x => (x.t || "").trim()); const t = set.length ? set.filter(x => x.done).length / set.length : 0;
  const e = Math.min(1, ((dd.wins || []).some(x => (x || "").trim()) ? .4 : 0) + ((dd.lessons || "").trim() ? .3 : 0) + (dd.mood > 0 ? .3 : 0)); return { m, t, e }; };
const score = dd => { const p = parts(dd); return Math.round((p.m + p.t + p.e) / 3 * 100); };
const journaled = dd => !!dd && ([...(dd.gratitude || []), ...(dd.wins || []), dd.intention, dd.lessons, dd.improve].some(x => (x || "").trim()) || (dd.targets || []).some(t => (t.t || "").trim()));
const QUOTES = [["We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "Will Durant, on Aristotle"], ["It does not matter how slowly you go as long as you do not stop.", "Confucius"], ["Well begun is half done.", "Aristotle"], ["Discipline is the bridge between goals and accomplishment.", "Jim Rohn"], ["Do what you can, with what you have, where you are.", "Theodore Roosevelt"], ["Little by little, one travels far.", "J.R.R. Tolkien"], ["Either you run the day or the day runs you.", "Jim Rohn"], ["Nothing will work unless you do.", "Maya Angelou"], ["Begin at once to live.", "Seneca"]];

async function main(){
  const users = []; for (let page = 1; ; page++) { const r = await api(`/auth/v1/admin/users?page=${page}&per_page=200`); users.push(...(r.users || [])); if (!r.users || r.users.length < 200) break; }
  const emailOf = Object.fromEntries(users.filter(u => u.email).map(u => [u.id, u.email]));
  const profiles = await api(`/rest/v1/docs?select=user_id,data&key=eq.profile`);
  let sent = 0;
  for (const { user_id: uid, data: p } of profiles) {
    const to = emailOf[uid]; if (!to || !p || !p.active) continue;
    const prefs = { daily: true, weekly: true, journey: true, ...(p.emails || {}) }; const tz = p.tz || "America/New_York"; const now = local(tz);
    const docs = Object.fromEntries((await api(`/rest/v1/docs?select=key,data&user_id=eq.${uid}&key=not.like.ink*`)).map(r => [r.key, r.data]));
    const j = docs["journey-" + p.active]; if (!j) continue;
    const logRows = await api(`/rest/v1/email_log?select=kind,ref&user_id=eq.${uid}`); const logged = new Set(logRows.map(r => r.kind + "|" + r.ref));
    const day = d => docs[`day-${j.id}-${d}`]; const n = diff(j.start, now.date) + 1;
    const base = { nick: (p.nick || "").split(" ")[0], suite: p.suite || "greatestme", appUrl: APP };
    const due = [];
    if (prefs.journey && !logged.has("welcome|1")) due.push(["welcome", "1", base]);
    if (prefs.journey && (j.goals || []).length && !logged.has(`goals|${j.id}`)) due.push(["goals", j.id, { ...base, goals: j.goals, habits: (j.habits || []).map(h => h.name), day1: fmt(j.start, { weekday: "long", month: "long", day: "numeric" }), day91: fmt(addDays(j.start, TOTAL - 1), { weekday: "long", month: "long", day: "numeric" }) }]);
    const rem = p.reminders || {}; const mornAt = toMins((rem.morning || {}).time || "07:00");
    if (prefs.daily && n >= 2 && n <= TOTAL && now.mins >= mornAt && !logged.has(`daily|${now.date}`)) {
      const y = addDays(now.date, -1), dd = day(y); let streak = 0; for (let i = 1; i <= TOTAL; i++) { if (journaled(day(addDays(now.date, -i)))) streak++; else break; }
      due.push(["daily", now.date, { ...base, dayN: n, yesterdayJournaled: journaled(dd), score: score(dd), parts: parts(dd), streak, habitsDone: dd ? (j.habits || []).filter(h => (dd.habits || {})[h.id]).length : 0, habitsTotal: (j.habits || []).length,
        wins: dd ? (dd.wins || []).filter(x => (x || "").trim()) : [], win: dd ? (dd.wins || []).find(x => (x || "").trim()) : "", lesson: dd ? (dd.lessons || "").trim() : "", improve: dd ? (dd.improve || "").trim() : "", quote: QUOTES[(diff("2026-01-01", now.date) % QUOTES.length + QUOTES.length) % QUOTES.length] }]);
    }
    const wk = rem.weekly || { day: "SU", time: "18:00" }; const week = Math.ceil(n / 7);
    if (prefs.weekly && n >= 7 && n <= TOTAL + 1 && now.dow === wk.day && now.mins >= toMins(wk.time) && !logged.has(`weekly|${j.id}-${now.date}`)) {
      const days = Array.from({ length: 7 }, (_, i) => day(addDays(now.date, -6 + i))); const prev = Array.from({ length: 7 }, (_, i) => day(addDays(now.date, -13 + i)));
      const hPoss = days.length * (j.habits || []).length, hDone = days.reduce((a, dd) => a + (dd ? (j.habits || []).filter(h => (dd.habits || {})[h.id]).length : 0), 0);
      const tSet = days.flatMap(dd => dd ? (dd.targets || []).filter(x => (x.t || "").trim()) : []); const moods = days.map(dd => dd && dd.mood).filter(Boolean), pm = prev.map(dd => dd && dd.mood).filter(Boolean);
      const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
      due.push(["weekly", `${j.id}-${now.date}`, { ...base, week: Math.min(WEEKS, week), daysJournaled: days.filter(journaled).length, habitPct: hPoss ? Math.round(hDone / hPoss * 100) : 0, targetPct: tSet.length ? Math.round(tSet.filter(x => x.done).length / tSet.length * 100) : 0,
        wins: days.flatMap(dd => dd ? (dd.wins || []).filter(x => (x || "").trim()) : []).slice(0, 5), bestWin: days.flatMap(dd => dd ? (dd.wins || []).filter(x => (x || "").trim()) : [])[0] || "",
        moodAvg: avg(moods), moodTrend: moods.length && pm.length ? (avg(moods) > avg(pm) + .2 ? "up from last week" : avg(moods) < avg(pm) - .2 ? "a little lower than last week" : "steady") : "",
        nextMilestones: (j.goals || []).flatMap(g => (g.milestones || []).filter(m => +m.week === Math.min(WEEKS, week + 1) && !m.done).map(m => `${m.text} (${g.title})`)) }]);
    }
    if (prefs.journey && n > TOTAL && !logged.has(`final|${j.id}`)) {
      const all = Array.from({ length: TOTAL }, (_, i) => day(addDays(j.start, i))); let best = 0, run = 0; all.forEach(dd => { if (journaled(dd)) { run++; best = Math.max(best, run); } else run = 0; });
      const wins = all.flatMap(dd => dd ? (dd.wins || []).filter(x => (x || "").trim()) : []); const hPoss = TOTAL * (j.habits || []).length, hDone = all.reduce((a, dd) => a + (dd ? (j.habits || []).filter(h => (dd.habits || {})[h.id]).length : 0), 0);
      const ms = (j.goals || []).flatMap(g => g.milestones || []);
      due.push(["final", j.id, { ...base, daysJournaled: all.filter(journaled).length, bestStreak: best, winsCount: wins.length, topWins: wins.filter((_, i) => i % Math.max(1, Math.floor(wins.length / 5)) === 0).slice(0, 5),
        habitPct: hPoss ? Math.round(hDone / hPoss * 100) : 0, msDone: ms.filter(m => m.done).length, msTotal: ms.length, badges: Object.keys(p.badges || {}).length,
        goals: (j.goals || []).map(g => ({ title: g.title, pct: (g.milestones || []).length ? Math.round(g.milestones.filter(m => m.done).length / g.milestones.length * 100) : 0 })) }]);
    }
    for (const [kind, ref, data] of due.slice(0, 2)) { // at most two per run, so nobody gets a pile at once
      const { subject, html } = render(kind, data);
      if (DRY) { console.log(`[dry run] would send ${kind} to user ${uid.slice(0, 8)}…: ${subject}`); continue; }
      await mailer.sendMail({ from: FROM, to, subject, html, text: subject + "\n\nOpen GreatestMe: " + APP });
      await api(`/rest/v1/email_log`, { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ user_id: uid, kind, ref }) });
      sent++; console.log(`sent ${kind} to user ${uid.slice(0, 8)}…`);
    }
  }
  console.log(`done: ${sent} email(s) sent, ${profiles.length} journal(s) checked`);
}
main().catch(e => {
  if (/42501|permission denied/.test(e.message)) { console.log("Recaps are waiting on one database permission. Run the last three lines of supabase/schema.sql (the service_role grants) in Supabase → SQL Editor. Skipping until then."); process.exit(0); }
  console.error("Recap run failed:", e.message); process.exit(1);
});
