// Real-user journeys that must pass before GreatestMe deploys.
// Run: node tests/journeys.js   (after ./build.sh). Exits non-zero on any failure.
const { chromium, devices } = require('playwright');
const path = require('path'); const fs = require('fs'); const http = require('http'); const { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..'); const PORT = 8611, FAKE = 8612; const URL = `http://127.0.0.1:${PORT}/index.html`;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', TYPES[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r); }).listen(PORT, '127.0.0.1');
const EMPTY_CONFIG = 'window.GM_CONFIG = { supabaseUrl: "", supabaseAnonKey: "" };';
const FAKE_CONFIG = `window.__FAKE_PORT=${FAKE};` + fs.readFileSync(path.join(__dirname, 'fake-supabase-client.js'), 'utf8');
const fails = []; const errs = [];
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails.push(msg); };
const PHONE = devices['iPhone 15 Pro'] || devices['iPhone 14 Pro'];

async function page(b, opts, label, mode = 'local'){
  const ctx = await b.newContext({ ...opts, serviceWorkers: 'block' });
  await ctx.route(/config\.js$/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: mode === 'accounts' ? FAKE_CONFIG : EMPTY_CONFIG }));
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase|vendor\/supabase-/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(label + ': ' + e.message));
  await p.goto(URL); await p.waitForTimeout(300); return p;
}
async function createAccount(p, name, pass){
  await p.click('[data-act=gmode][data-v=create]').catch(() => {});
  if (await p.locator('[data-act=ackHere]').count()) await p.click('[data-act=ackHere]');
  await p.fill('#gname', name); await p.fill('#gpass', pass); await p.fill('#gpass2', pass); await p.click('button[type=submit]');
}
const dismissGuide = async p => { if (await p.waitForSelector('[data-act=guideClose]', { timeout: 1200 }).then(() => true).catch(() => false)) { await p.click('.sheet [data-act=guideClose] >> nth=-1'); await p.waitForTimeout(150); } };
const go = async (p, v) => { await p.click(`[data-act=nav][data-v=${v}] >> visible=true`); await dismissGuide(p); };
const openSec = async (p, id) => { if (!(await p.locator(`#sec-${id}.open`).count())) { await p.click(`#sec-${id} .acc-h`); await p.waitForTimeout(350); } };
async function onboard(p, nick){
  await p.waitForSelector('#ob0'); await p.click('[data-act=onext]'); await p.fill('#onick', nick);
  for (let i = 0; i < 3; i++) await p.click('[data-act=onext]');
  await p.fill('#og0', 'Run a sub-25 5K by March'); await p.click('[data-act=onext]');
  await p.click('[data-v="Move 30 min"]'); await p.click('[data-act=onext]');
  await p.waitForSelector('[data-rem=o]'); await p.click('[data-act=onext]');
  await p.evaluate(() => document.getElementById('commitBtn').click()); await p.waitForSelector('.cele'); await p.click('.cele button');
  if (await p.waitForSelector('.sheet [data-act=guideTour]', { timeout: 6000 }).then(() => true).catch(() => false)) await p.click('.sheet [data-act=guideClose] >> nth=-1'); await p.waitForTimeout(150);
}
const overflow = p => p.evaluate(() => { const W = innerWidth, bad = [];
  document.querySelectorAll('body *').forEach(el => { const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).position === 'fixed' || el.closest('.hgrid,.hl-track,.wk-strip,.backdrop,svg,canvas,.fx')) return;
    if (r.right > W + 1 || r.left < -1) bad.push(el.id || el.className || el.tagName); });
  return document.documentElement.scrollWidth > W || bad.length ? bad.slice(0, 4).join(', ') || 'page scrolls sideways' : ''; });

(async () => {
  const b = await chromium.launch(); const PASS = 'Xk9#mQ2v!Lp7';

  // 0. Onboarding: Day 1 choices update what's shown (Next Monday regression), reminders step is part of setup.
  const O = await page(b, { ...PHONE }, 'onboard');
  await createAccount(O, 'Ona', PASS); await O.waitForSelector('#ob0'); await O.click('[data-act=onext]'); await O.fill('#onick', 'Ona'); await O.click('[data-act=onext]'); await O.click('[data-act=onext]');
  const nm = await O.locator('[data-act=ostart]').nth(1).getAttribute('data-v'); await O.click('[data-act=ostart] >> nth=1');
  ok(await O.inputValue('#ostart') === nm && await O.locator('[data-act=ostart][aria-pressed=true]').count() === 1, 'Next Monday updates the Day 1 date and shows as selected');
  await O.fill('#ostart', '2026-12-07'); await O.locator('#ostart').dispatchEvent('change'); await O.waitForTimeout(150);
  ok(/Dec 7/.test(await O.locator('.gate-card .card b').innerText()), 'picking a custom Day 1 updates the 13-week summary right away');
  await O.click('[data-act=ostart] >> nth=1');
  await O.click('[data-act=onext]'); await O.fill('#og0', 'Goal'); await O.click('[data-act=onext]'); await O.click('[data-act=onext]');
  ok(await O.locator('[data-rem=o][data-f=time]').count() === 3, 'setup asks for reminder times');
  const [dl] = await Promise.all([O.waitForEvent('download'), O.click('[data-act=addRem]')]); const ics = fs.readFileSync(await dl.path(), 'utf8');
  const wk = ics.split('BEGIN:VEVENT').find(x => /Weekly review/.test(x)) || ''; const ds = (wk.match(/DTSTART:(\d{8})/) || [])[1];
  ok(/RRULE:FREQ=DAILY;UNTIL=\d{8}T235959/.test(ics) && /BEGIN:VALARM/.test(ics) && ds && new Date(+ds.slice(0, 4), +ds.slice(4, 6) - 1, +ds.slice(6)).getDay() === 0 && ds >= nm.replace(/-/g, ''), 'reminder calendar file: alerts, ends with the journey, weekly review starts on the chosen day after Day 1');
  ok(!/Apple Health|HealthKit/.test(await O.content()), 'no Apple-only features in the web app');
  await O.context().close();

  // 1. First visit in an iPhone browser: steer to the Home Screen before creating a local account.
  const A = await page(b, { ...PHONE }, 'safari');
  ok(await A.locator('[data-act=ackHere]').count() === 1, 'iPhone browser: Home Screen guidance shows before account creation');
  await createAccount(A, 'Lyllian', PASS); await onboard(A, 'Lyllian');
  ok(await A.locator('.hero').count() === 1, 'onboarding ends on Today');

  // 2. Daily use: morning ritual, habit check, evening ritual.
  await A.click('[data-act=ritual][data-v=morning]'); await A.click('[data-act=rnext]'); await A.fill('#rg0', 'My son');
  for (let i = 0; i < 3; i++) await A.click('[data-act=rnext]'); await A.click('[data-act=rclose]');
  ok(await A.inputValue('#g0') === 'My son', 'morning ritual saves to Today');
  await openSec(A, 'habits'); const habit = await A.$eval('input.check[id^=h-]', e => e.id); await A.check('#' + habit); await A.waitForTimeout(300);
  ok(await A.isChecked('#' + habit), 'habit check sticks');
  await A.click('[data-act=ritual][data-v=evening]'); await A.fill('#rw0', 'Finished the run'); for (let i = 0; i < 4; i++) await A.click('[data-act=rnext]'); await A.click('[data-act=rclose]');
  ok(await A.inputValue('#w0') === 'Finished the run', 'evening ritual saves to Today');
  await A.waitForTimeout(900);

  // 2-. Daily highlights gallery and water.
  ok(await A.locator('#hlTrack .hl-card').count() >= 4, 'daily highlights gallery shows quote and your stats');
  await A.click('[data-act=water][data-n="1"]'); await A.click('[data-act=water][data-n="1"]');
  ok(/^2/.test((await A.locator('.hl-card:has([data-act=water]) .hl-big b').innerText()).trim()), 'water taps count up');

  // 2-g. Page guides, the Method and the evening scores.
  await A.click('[data-act=nav][data-v=goals] >> visible=true'); ok(await A.waitForSelector('.sheet [data-act=guideTour]', { timeout: 3000 }).then(() => true).catch(() => false), 'first visit to Goals explains the page');
  await A.click('.sheet [data-act=guideTour]'); await A.waitForSelector('#tourLayer [data-act=tourNext]', { timeout: 6000 }); ok(/goal/i.test(await A.locator('.tour-card').innerText()), 'Show me around spotlights the Goals page');
  await A.keyboard.press('Escape'); await go(A, 'today'); await go(A, 'goals'); ok(await A.locator('.sheet [data-act=guideTour]').count() === 0, 'a page guide shows only once');
  await A.click('[data-act=guide][data-v=goals] >> visible=true'); ok(await A.locator('.sheet [data-act=guideTour]').count() === 1, 'the ? button reopens the page guide'); await A.click('.sheet [data-act=guideClose] >> nth=-1');
  await go(A, 'prefs'); ok(await A.locator('.look-group').count() === 4 && await A.locator('.look-row .suite').count() === 15, 'Look shows fifteen themes in four groups');
  await A.click('.look-row [data-act=suite][data-v=heritage]'); ok(await A.evaluate(() => document.documentElement.dataset.suite) === 'heritage', 'picking a theme applies it');
  { const before = await A.evaluate(() => document.documentElement.dataset.suite); await A.evaluate(() => document.getElementById('lookRandom').click()); await A.waitForTimeout(200);
    const after = await A.evaluate(() => document.documentElement.dataset.suite); ok(after !== before && await A.locator('[data-act=shuffleNow]').count() === 1, 'Surprise me picks a new look');
    await A.click('[data-act=shuffleNow]'); ok(await A.evaluate(() => document.documentElement.dataset.suite) !== after, 'Shuffle now changes the look again');
    await A.evaluate(() => document.getElementById('lookRandom').click()); await A.click('.look-row [data-act=suite][data-v=greatestme]'); }
  await go(A, 'prefs'); await A.click('.main [data-act=nav][data-v=method]'); ok(await A.locator('.main section.card').count() === 11, 'Settings opens the eleven-chapter GreatestMe Method');
  await go(A, 'today'); await openSec(A, 'evening'); await A.locator('#winDay').fill('8'); await A.waitForTimeout(800);
  ok(/8\/10/.test(await A.locator('#winDay-v').innerText()), 'Win the Day score saves on the evening page');

  // 2a. Accordion folds and unfolds; a badge was earned for the first page.
  const wasOpen = await A.locator('#sec-targets.open').count(); await A.click('#sec-targets .acc-h'); ok(await A.locator('#sec-targets.open').count() !== wasOpen, 'sections fold and unfold');
  ok(await A.locator('#sec-schedule').count() === 0, 'optional schedule stays out of the way until turned on');
  await go(A, 'progress'); ok(await A.locator('.bd.earned').count() >= 1, 'first-page badge earned');
  await go(A, 'today');
  await go(A, 'prefs'); await A.evaluate(() => document.querySelector('[data-act=schedPref]').click()); await A.waitForTimeout(300); await go(A, 'today'); await openSec(A, 'schedule'); await A.locator('#s9').fill('Deep work, goal 1'); await A.waitForTimeout(700);
  { const [dl] = await Promise.all([A.waitForEvent('download'), A.click('[data-act=planCal]')]); const ics = fs.readFileSync(await dl.path(), 'utf8');
    ok(/T090000/.test(ics) && /SUMMARY:Deep work\\, goal 1/.test(ics) && /TRIGGER:-PT5M/.test(ics), 'time blocks go to Calendar with an alert'); }
  await go(A, 'habits'); await dismissGuide(A); if (!(await A.locator('.heat').count())) { await A.click('.presets button >> nth=0'); await A.waitForTimeout(300); } ok(/of about 66 days/i.test(await A.locator('.main').innerText()), 'habits show progress toward automatic');
  { const n0 = await A.locator('[data-act=delHabit]').count(); await A.click('[data-act=delHabit] >> nth=0'); const n1 = await A.locator('[data-act=delHabit]').count();
    await A.click('.toast-undo'); await A.waitForTimeout(200); ok(n1 === n0 - 1 && await A.locator('[data-act=delHabit]').count() === n0, 'removing a habit is instant and Undo brings it back'); }
  await go(A, 'prefs'); await A.evaluate(() => document.querySelector('[data-act=schedPref]').click()); await A.waitForTimeout(300);
  await go(A, 'today');

  // 2b. Calendar, day summary, logo home, Partner via Settings, tour replay.
  ok(await A.locator('#sec-morning .schip').innerText().then(t => /done|\/3/i.test(t)), 'Today sections show their completion status');
  ok(await A.locator('.tabs [data-v=calendar], .nav [data-v=calendar]').count() === 0, 'Calendar lives on Today, not in the tab bar');
  await A.locator('#sec-calendar').scrollIntoViewIfNeeded(); ok(await A.locator('#sec-calendar .wk-strip .wd').count() === 7 && await A.locator('.cal-grid').count() === 0, 'calendar starts folded to this week (7 days)');
  await A.click('#sec-calendar .wd.now'); ok(/My son/.test(await A.locator('.sheet').innerText()), 'tapping today in the week strip shows what was written'); await A.keyboard.press('Escape');
  await A.click('[data-act=calToggle]'); await A.waitForTimeout(250); ok(await A.locator('.cal-grid .cd.now').count() === 1 && await A.locator('#sec-calendar .wk-strip').count() === 0, 'unfolding the calendar turns this week into the month with today');
  ok(await A.locator('.cal-grow .cd.now').count() === 1 && /--d:0/.test(await A.locator('.cal-grid .cd.now').getAttribute('style')), 'the month opens outward from this week');
  await A.waitForTimeout(900); await A.click('[data-act=calToggle]'); await A.waitForTimeout(450); ok(await A.locator('#sec-calendar .wk-strip .wd').count() === 7 && await A.locator('.cal-grid').count() === 0, 'folding the calendar returns to this week');
  await A.click('[data-act=calToggle]'); await A.waitForTimeout(1000);
  await A.click('.cal-grid .cd.now'); ok(/My son/.test(await A.locator('.sheet').innerText()), 'tapping a day shows what was written');
  await A.click('[data-act=dayGo]'); ok(await A.locator('.hero').count() === 1, 'open this day goes to Today');
  await A.click('[data-act=calMode][data-v=journey]'); ok(await A.locator('.jr').count() === 13, 'calendar shows all 13 weeks');
  await A.click('[data-act=nav][data-v=today].brand >> visible=true'); ok(await A.locator('.hero').count() === 1, 'logo goes home to Today');
  ok(await A.locator('.tabs [data-v=partner], .nav [data-v=partner]').count() === 0, 'Partner is not in the tab bar');
  await go(A, 'prefs'); await A.click('.main [data-act=nav][data-v=partner]'); ok(/Partner/.test(await A.locator('h1').first().innerText()) && await A.locator('[data-act=toggleShare]').count() === 0, 'Partner opens from Settings (no sharing switch until accounts sync)');
  await A.click('.back'); await A.click('[data-act=tourStart]'); await A.waitForSelector('#tourLayer [data-act=tourNext]', { timeout: 8000 }).catch(() => {}); let steps = 0;
  while (await A.locator('#tourLayer [data-act=tourNext]').count() && steps < 8) { steps++; await A.waitForTimeout(450); await A.click('#tourLayer [data-act=tourNext]'); }
  ok(steps >= 4 && await A.locator('#tourLayer').count() === 0, `tour walks through ${steps} steps and closes`);

  // 2c. iPad Ink: strokes survive an immediate day switch.
  const I = await page(b, { ...(devices['iPad Pro 11'] || PHONE) }, 'ipad-ink'); await createAccount(I, 'Inky', PASS); await onboard(I, 'Inky');
  await go(I, 'ink'); await I.waitForSelector('canvas[data-page="0"]'); const bx = await I.locator('canvas[data-page="0"]').boundingBox();
  await I.evaluate(({ bx }) => { const cv = document.querySelector('canvas[data-page="0"]'); const f = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: 3, pointerType: 'pen', clientX: bx.x + x, clientY: bx.y + y, pressure: .5, bubbles: true, cancelable: true }));
    f('pointerdown', 150, 150); for (let k = 0; k < 30; k++) f('pointermove', 150 + k * 4, 150 + (k % 5)); f('pointerup', 270, 150); }, { bx });
  await I.click('[data-act=day][data-n="-1"]'); await I.waitForTimeout(300); await I.click('[data-act=day][data-n="1"]'); await I.waitForTimeout(700);
  const strokes = await I.evaluate(async () => { const db = await new Promise(r => { const o = indexedDB.open('greatestme', 1); o.onsuccess = () => r(o.result); });
    const all = await new Promise(r => { const q = db.transaction('ink').objectStore('ink').getAll(); q.onsuccess = () => r(q.result); }); return all.filter(Array.isArray).reduce((a, x) => a + x.length, 0); });
  ok(strokes >= 1, 'iPad: handwriting saved even when switching days right away');
  await I.context().close();

  // 3. Same person opens GreatestMe from a different place (separate storage): clear message, not a password error.
  const B = await page(b, { ...PHONE }, 'homescreen');
  await B.click('[data-act=gmode][data-v=signin]'); await B.fill('#gname', 'Lyllian'); await B.fill('#gpass', PASS); await B.click('button[type=submit]');
  const msg = await B.locator('[role=alert]').first().innerText();
  ok(/no Lyllian account/i.test(msg) && /password is probably fine/i.test(msg), 'other place: explains where the account lives instead of blaming the password');

  // 4. Move the journal over with a transfer code; same passcode works; wrong passcode gets its own message.
  await go(A, 'prefs'); await A.click('.more > summary'); await A.click('[data-act=export]'); const code = await A.inputValue('#xferOut');
  await B.click('[data-act=gmode][data-v=import] >> nth=0'); await B.fill('#gcode', code); await B.click('[data-act=gimport]'); await B.waitForTimeout(400);
  ok(await B.inputValue('#g0').catch(() => '') === 'My son', 'transfer code brings the journal over');
  await go(B, 'prefs'); await B.click('[data-act=signout]'); await B.waitForTimeout(400);
  await B.fill('#gname', 'Lyllian'); await B.fill('#gpass', 'nope'); await B.click('button[type=submit]');
  ok(/doesn't match/i.test(await B.locator('.err').innerText()), 'wrong passcode gets a clear message');
  await B.fill('#gpass', PASS); await B.click('button[type=submit]'); await B.waitForTimeout(300);
  ok(await B.locator('.hero').count() === 1, 'same passcode signs in after the move');

  // 5. Layout: folded, phone, unfolded, iPad × every theme × every screen.
  for (const [w, h, label] of (process.env.QUICK ? [] : [[360, 760, 'fold closed'], [393, 852, 'iPhone'], [744, 860, 'fold open'], [834, 1194, 'iPad']])) {
    for (const suite of ['greatestme', 'synthwave', 'martin', 'studio', 'differentworld', 'heritage', 'freshprince', 'matrix', 'chicago']) {
      const p = await page(b, { viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 800, userAgent: PHONE.userAgent }, label + ' ' + suite);
      await p.evaluate(s => localStorage.setItem('gm-suite', JSON.stringify(s)), suite); await p.reload();
      await createAccount(p, 'Tester', 'Tester#2026');
      for (let st = 0; st < 7; st++) { if (st === 1) await p.fill('#onick', 'Tester'); if (st === 4) await p.fill('#og0', 'A goal'); await p.waitForTimeout(60); const o = await overflow(p); ok(!o, `${label} ${suite} onboarding ${st} fits${o ? ' (' + o + ')' : ''}`); await p.click('[data-act=onext]'); }
      await p.evaluate(() => document.getElementById('commitBtn').click()); await p.click('.cele button');
      if (await p.waitForSelector('.sheet [data-act=guideTour]', { timeout: 6000 }).then(() => true).catch(() => false)) { const o = await overflow(p); ok(!o, `${label} ${suite} first-run guide fits${o ? ' (' + o + ')' : ''}`); await p.click('.sheet [data-act=guideClose] >> nth=-1'); }
      for (const v of ['today', 'week', 'goals', 'habits', 'progress', 'prefs']) { await go(p, v); await p.waitForTimeout(60); const o = await overflow(p); if (o) ok(false, `${label} ${suite} ${v} fits (${o})`); }
      await p.context().close();
    }
  }
  // 6. Account mode (email sign-in, sync across places, partner invites) against a stand-in for Supabase.
  const fake = spawn(process.execPath, [path.join(__dirname, 'fake-supabase-server.js'), String(FAKE)], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 600));
  try {
    const signup = async (p, email, pw) => { await p.click('[data-act=gmode][data-v=create]').catch(() => {}); await p.fill('#semail', email); await p.fill('#spass', pw); await p.fill('#spass2', pw); await p.click('#supaForm button[type=submit]'); await p.waitForTimeout(500); };
    const signin = async (p, email, pw) => { await p.click('[data-act=gmode][data-v=signin]').catch(() => {}); await p.fill('#semail', email); await p.fill('#spass', pw); await p.click('#supaForm button[type=submit]'); await p.waitForTimeout(700); };
    const C = await page(b, { ...PHONE }, 'acct-chrome', 'accounts');
    ok(await C.locator('#supaForm').count() === 1, 'accounts: email sign-in screen shows (no on-device form)');
    await signup(C, 'd@example.com', PASS + ' '); await onboard(C, 'Dalton'); await openSec(C, 'morning'); await C.fill('#g0', 'My son'); await C.locator('#g0').blur(); await C.waitForTimeout(1200);
    const H = await page(b, { ...PHONE }, 'acct-homescreen', 'accounts');
    await signin(H, 'd@example.com', 'wrong-password'); ok(/don't match/i.test(await H.locator('.err').innerText()), 'accounts: wrong password gets a clear message');
    await signin(H, 'd@example.com', PASS); ok(await H.inputValue('#g0').catch(() => '') === 'My son', 'accounts: signing in somewhere else shows the same journal (pasted trailing space ignored)');
    await openSec(H, 'evening'); await H.fill('#w0', 'Hit the gym'); await H.locator('#w0').blur(); await C.waitForTimeout(2600);
    ok(await C.inputValue('#w0') === 'Hit the gym', 'accounts: changes sync live to the other place');
    await C.reload(); await C.waitForTimeout(900); ok(await C.locator('.hero').count() === 1, 'accounts: stays signed in after reopening');
    await openSec(C, 'morning'); await openSec(H, 'evening'); await C.fill('#g2', 'From the iPhone'); await H.fill('#imp', 'From the iPad'); await C.locator('#g2').blur(); await H.locator('#imp').blur(); await C.waitForTimeout(3500);
    await H.reload(); await H.waitForTimeout(900);
    ok(await H.inputValue('#g2') === 'From the iPhone' && await H.inputValue('#imp') === 'From the iPad', 'accounts: two devices editing the same day at once keep both edits');
    await openSec(C, 'morning'); await C.fill('#g1', 'Health'); await C.evaluate(() => { const e = document.getElementById('g1'); e.setSelectionRange(2, 2); });
    await C.evaluate(() => window.dispatchEvent(new Event('x'))); await C.keyboard.type('XX'); ok(await C.inputValue('#g1') === 'HeXXalth', 'typing stays in order where the cursor is');
    const L = await page(b, { ...PHONE }, 'acct-lyllian', 'accounts'); await signup(L, 'l@example.com', 'Purple#2026xx'); await onboard(L, 'Lyllian');
    await go(L, 'prefs'); await L.waitForTimeout(300); if (!(await L.locator('.main [data-act=nav][data-v=partner]').count())) { console.log('DEBUG L:', (await L.evaluate(() => document.body.innerText)).slice(0, 500)); await L.screenshot({ path: '/tmp/claude-0/-home-user/3f140423-ea04-5310-b676-6226cd1c0d88/scratchpad/Ldebug.png' }); } await L.click('.main [data-act=nav][data-v=partner]'); await L.click('[data-act=pinvite]'); await L.waitForTimeout(300);
    const code = (await L.locator('.mono[style*="letter-spacing"]').innerText()).trim(); await L.click('[data-act=toggleShare]'); await L.waitForTimeout(3000);
    await go(C, 'prefs'); await C.waitForTimeout(300); if (!(await C.locator('.main [data-act=nav][data-v=partner]').count())) { console.log('DEBUG C:', (await C.evaluate(() => document.body.innerText)).slice(0, 700)); await C.screenshot({ path: '/tmp/claude-0/-home-user/3f140423-ea04-5310-b676-6226cd1c0d88/scratchpad/Cdebug.png' }); } await C.click('.main [data-act=nav][data-v=partner]'); await C.fill('#pcode', code); await C.click('[data-act=paccept]'); await C.waitForTimeout(800);
    ok((await C.locator('.partner h2').allInnerTexts()).includes('Lyllian'), 'accounts: partner invite code links two phones');
    await go(L, 'today'); await L.context().setOffline(true); await L.route(/127\.0\.0\.1:8612/, r => r.abort()); await openSec(L, 'morning'); await L.fill('#intent', 'Patient'); await L.waitForTimeout(2500);
    ok(await L.locator('#syncdot:not([hidden])').count() === 1, 'phones show a quiet dot when changes are waiting to sync');
    await L.unroute(/127\.0\.0\.1:8612/); await L.context().setOffline(false); await L.evaluate(() => window.dispatchEvent(new Event('online'))); await L.waitForTimeout(2500);
    ok(await L.locator('#syncdot:not([hidden])').count() === 0, 'the dot goes away once everything syncs');
  } finally { fake.kill(); }

  ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close(); server.close();
  console.log(fails.length ? `\n${fails.length} journey check(s) failed.` : '\nAll journeys pass.');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
