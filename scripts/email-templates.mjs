// Themed recap emails. Table layout + inline styles so they render in Apple Mail, Gmail and Outlook.
export const THEMES = {
  greatestme: { bg: "#0D0820", card: "#1A1233", ink: "#F3EEFF", muted: "#B4A9D6", acc: "#A78BFA", acc2: "#5B9CFF", good: "#34D399", line: "#2E2550", font: "'Plus Jakarta Sans',-apple-system,Segoe UI,Arial,sans-serif", head: "'Plus Jakarta Sans',-apple-system,Arial,sans-serif", caps: false },
  synthwave: { bg: "#03131D", card: "#072331", ink: "#EAFFFB", muted: "#A3CFCB", acc: "#2EF2D8", acc2: "#FF3EA5", good: "#C6FF3D", line: "#0F3B4C", font: "-apple-system,Segoe UI,Arial,sans-serif", head: "'Orbitron',Arial Black,Arial,sans-serif", caps: true },
  martin: { bg: "#FFF1D6", card: "#FFFFFF", ink: "#151515", muted: "#4A4036", acc: "#7B2CBF", acc2: "#E63946", good: "#1E9E4A", line: "#151515", font: "'Nunito',Segoe UI,Arial,sans-serif", head: "'Bungee',Arial Black,Arial,sans-serif", caps: true, border: "3px solid #151515" },
  studio: { bg: "#F2F4F7", card: "#FFFFFF", ink: "#0F1420", muted: "#6C7688", acc: "#4F46E5", acc2: "#0EA5E9", good: "#10B981", line: "#E5E8EE", font: "-apple-system,Segoe UI,Arial,sans-serif", head: "-apple-system,Segoe UI,Arial,sans-serif", caps: false },
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pct = v => Math.round(Math.max(0, Math.min(1, v || 0)) * 100);

function shell(t, { preheader, title, kicker, body, cta, ctaUrl, footer }) {
  const h = s => `font-family:${t.head};${t.caps ? "text-transform:uppercase;letter-spacing:.02em;" : "letter-spacing:-.02em;"}`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${t.bg};">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.bg};"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 6px 18px;font-family:${t.head};font-size:20px;font-weight:800;color:${t.ink};">Greatest<span style="color:${t.acc};">Me</span></td></tr>
<tr><td style="background:${t.card};border-radius:20px;${t.border ? `border:${t.border};box-shadow:6px 6px 0 #151515;` : `border:1px solid ${t.line};`}padding:26px 24px;">
  <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${t.acc};">${esc(kicker)}</div>
  <h1 style="margin:8px 0 14px;${h()}font-size:26px;line-height:1.2;color:${t.ink};font-weight:800;">${esc(title)}</h1>
  <div style="font-family:${t.font};font-size:16px;line-height:1.55;color:${t.ink};">${body}</div>
  ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;"><tr><td style="border-radius:14px;background:${t.acc};${t.border ? `border:${t.border};` : ""}"><a href="${esc(ctaUrl)}" style="display:inline-block;padding:14px 22px;font-family:${t.font};font-size:16px;font-weight:800;color:${t.bg === "#FFF1D6" || t.bg === "#F2F4F7" ? "#FFFFFF" : t.bg};text-decoration:none;">${esc(cta)}</a></td></tr></table>` : ""}
</td></tr>
<tr><td style="padding:16px 8px;font-family:${t.font};font-size:12px;line-height:1.5;color:${t.muted};text-align:center;">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}
function statRow(t, items) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;"><tr>${items.map(([v, l]) => `<td style="padding:12px 8px;text-align:center;border:1px solid ${t.line};border-radius:14px;"><div style="font-family:ui-monospace,Menlo,monospace;font-size:24px;font-weight:700;color:${t.ink};">${esc(v)}</div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${t.muted};">${esc(l)}</div></td><td style="width:8px"></td>`).join("")}</tr></table>`;
}
function bars(t, parts) {
  return parts.map(([label, v, col]) => `<div style="margin:8px 0;"><div style="font-size:13px;color:${t.muted};">${esc(label)} · ${pct(v)}%</div><div style="height:8px;background:${t.line};border-radius:8px;"><div style="height:8px;width:${pct(v)}%;background:${col};border-radius:8px;"></div></div></div>`).join("");
}
const quote = (t, text, who) => `<div style="margin:16px 0;padding:4px 0 4px 14px;border-left:3px solid ${t.acc2};font-style:italic;color:${t.ink};">${esc(text)}${who ? `<div style="font-style:normal;font-size:13px;color:${t.muted};margin-top:4px;">${esc(who)}</div>` : ""}</div>`;
const list = (t, xs) => `<ul style="margin:8px 0 0;padding-left:20px;">${xs.map(x => `<li style="margin:4px 0;">${esc(x)}</li>`).join("")}</ul>`;

export function render(kind, d) {
  const t = THEMES[d.suite] || THEMES.greatestme; const name = d.nick || "friend"; const app = d.appUrl;
  const footer = `You're getting this because you use GreatestMe. Change which recaps you get in <a href="${esc(app)}#preferences" style="color:${t.muted};">Settings → Reminders</a>.`;
  if (kind === "welcome") return { subject: `Welcome to GreatestMe, ${name}`, html: shell(t, { preheader: "Thirteen weeks to the greatest version of you.", kicker: "Welcome", title: `Your 13 weeks start here, ${name}.`, cta: "Open GreatestMe", ctaUrl: `${app}#today`, footer,
    body: `<p style="margin:0 0 12px">You just did the hardest part: you started. Here's how GreatestMe works:</p>${list(t, ["Morning ritual: breathe, three things you're grateful for, one intention, three targets.", "Evening ritual: wins, a lesson, one thing to do better tomorrow.", "Close all three rings and the day is complete. Keep the flame lit."])}<p style="margin:14px 0 0">One line a day counts. We'll be cheering you on.</p>` }) };
  if (kind === "goals") return { subject: `Your 13-week goals are set`, html: shell(t, { preheader: `Day 1 is ${d.day1}.`, kicker: "Goals locked in", title: "Here's what you committed to.", cta: "See your plan", ctaUrl: `${app}#today`, footer,
    body: `${d.goals.map((g, i) => `<div style="margin:10px 0;padding:12px 14px;border:1px solid ${t.line};border-radius:14px;"><div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.12em;color:${t.acc2};">GOAL ${i + 1}</div><div style="font-weight:800;font-size:17px;">${esc(g.title)}</div>${g.why ? `<div style="color:${t.muted};font-size:14px;margin-top:4px;">Why: ${esc(g.why)}</div>` : ""}</div>`).join("")}
      <p style="margin:12px 0 0"><b>Day 1:</b> ${esc(d.day1)} · <b>Day 91:</b> ${esc(d.day91)}</p>${d.habits.length ? `<p style="margin:8px 0 0"><b>Daily habits:</b> ${esc(d.habits.join(", "))}</p>` : ""}<p style="margin:12px 0 0">Break each goal into weekly milestones in the Goals tab. Small steps, every week.</p>` }) };
  if (kind === "daily") return { subject: d.yesterdayJournaled ? `Yesterday, recapped: ${d.score}% of your page` : `A fresh day, ${name}`, html: shell(t, { preheader: d.win ? `Your win: ${d.win}` : "Today's a new page.", kicker: `Day ${d.dayN} of 91`, title: d.yesterdayJournaled ? `Nice work yesterday, ${name}.` : `Today's a fresh page, ${name}.`, cta: "Start my morning ritual", ctaUrl: `${app}#morning`, footer,
    body: `${d.yesterdayJournaled ? `${statRow(t, [[`${d.streak}`, "day streak"], [`${d.habitsDone}/${d.habitsTotal}`, "habits"], [`${d.score}%`, "page"]])}${bars(t, [["Morning", d.parts.m, t.acc], ["Targets", d.parts.t, t.acc2], ["Evening", d.parts.e, t.good]])}${d.wins.length ? `<p style="margin:14px 0 0"><b>Your wins:</b></p>${list(t, d.wins)}` : ""}${d.lesson ? quote(t, d.lesson, "What you learned") : ""}${d.improve ? `<p style="margin:10px 0 0"><b>Today you said you'd:</b> ${esc(d.improve)}</p>` : ""}`
      : `<p style="margin:0">Yesterday got away from you. That's okay; streaks restart with a single line. Two minutes this morning is all it takes.</p>`}${quote(t, d.quote[0], d.quote[1])}` }) };
  if (kind === "weekly") return { subject: `Week ${d.week} recap: ${d.daysJournaled}/7 days`, html: shell(t, { preheader: d.bestWin ? `Best win: ${d.bestWin}` : "Time for your weekly review.", kicker: `Week ${d.week} of 13`, title: d.daysJournaled >= 5 ? `Strong week, ${name}.` : d.daysJournaled >= 3 ? `Solid week, ${name}. Let's build on it.` : `New week, fresh start, ${name}.`, cta: "Do my weekly review", ctaUrl: `${app}#review`, footer,
    body: `${statRow(t, [[`${d.daysJournaled}/7`, "days"], [`${d.habitPct}%`, "habits"], [`${d.targetPct}%`, "targets"]])}${d.wins.length ? `<p style="margin:14px 0 0"><b>Wins this week:</b></p>${list(t, d.wins)}` : ""}${d.moodAvg ? `<p style="margin:12px 0 0"><b>Average mood:</b> ${d.moodAvg.toFixed(1)} / 5${d.moodTrend ? ` (${esc(d.moodTrend)})` : ""}</p>` : ""}${d.nextMilestones.length ? `<p style="margin:12px 0 0"><b>Coming up next week:</b></p>${list(t, d.nextMilestones)}` : ""}<p style="margin:14px 0 0">Take five minutes for your review: what worked, what got in the way, and one change for next week.</p>` }) };
  if (kind === "final") return { subject: `91 days. Look what you built, ${name}.`, html: shell(t, { preheader: `${d.daysJournaled} days journaled, ${d.winsCount} wins.`, kicker: "Journey complete", title: `You did 13 weeks, ${name}.`, cta: "Start my next 13 weeks", ctaUrl: `${app}#preferences`, footer,
    body: `${statRow(t, [[d.daysJournaled, "days"], [d.bestStreak, "best streak"], [d.winsCount, "wins"]])}${statRow(t, [[`${d.habitPct}%`, "habits"], [`${d.msDone}/${d.msTotal}`, "milestones"], [d.badges, "badges"]])}${d.goals.map(g => bars(t, [[g.title, g.pct / 100, t.good]])).join("")}${d.topWins.length ? `<p style="margin:14px 0 0"><b>Some of your best moments:</b></p>${list(t, d.topWins)}` : ""}<p style="margin:14px 0 0">Take a breath and do your quarterly review. Then pick what the next 13 weeks are for.</p>` }) };
  throw new Error("unknown email kind " + kind);
}
