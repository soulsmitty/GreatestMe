# GreatestMe

A 13-week goal journal app, built on the quarterly method popularized by paper
planners like the SELF Journal: set up to three 13-week goals, map them into
weekly milestones, execute daily, review weekly, and close with a quarterly
review. Built for two people (Dalton and Lyllian) to use independently, with an
opt-in Partner board for accountability.

## What's inside

| Area | What it does |
| --- | --- |
| Accounts | Inside Claude: your Claude sign-in is your account; your journal lives in a private per-user store nobody else can read, the owner included. Standalone: on-device accounts with name + passcode (SHA-256 salted). |
| Onboarding | Name, Day 1 date, 1–3 goals, daily habits. |
| Today | Rotating quote, page-complete meter, morning gratitude x3, "Today I will be", 3+ targets linked to goals, habit check-offs, hourly schedule (6am–10pm), evening wins x3, lessons, tomorrow's improvement, PM gratitude, mood and energy 1–5. Browse any day. |
| Week | Weekly target per goal, top 3 priorities, milestones due this week, 7-day habit grid, weekly review (wins, lessons, obstacles, adjustments, 1–10 score). |
| Goals | Why it matters, how it's measured, reward, milestones assigned to weeks 1–13, progress bars. |
| Habits | Up to 8 habits, presets, current and best streaks, 13-week heatmap per habit. |
| Progress | Journey strip, journal streak, consistency, habit hit rate, targets hit, goal progress, mood and energy trend lines, weekly score bars, quarterly review, "start my next 13 weeks". |
| Partner | Opt-in. Partners see only streak, habit/target rates, goal titles with %, today's page %, and one win you choose to share. Send cheers. |
| Journeys | Unlimited consecutive 13-week journeys; habits carry over. |
| Backup | Export / import JSON. |

## Experience

- **Onboarding:** welcome, your name, pick your look, Day 1 (Today / Next Monday / any date), SMART goals, habits, reminder times (added to your iPhone Calendar as real alerts), your reward, then press-and-hold to commit.
- **Ten looks, grouped:** Everyday (GreatestMe, Coastal, Midnight, Studio), Bold (Synthwave in SOLEN neon: Miami-night blue #00D9F5, hot pink, purple, sunset orange; Martin; Different World in Hillman crimson and gold) and Seasons & heritage (Heritage for Black History Month, Pumpkin Spice, Christmas). **Surprise me** in Settings → Look gives you a new random look each time you open the app or come back after a minute away; **Shuffle now** changes it on the spot. Each look has its own icon, tab icon and email style.
- **Calendar that unfolds:** folded, it's this week's strip. Unfold it and the strip turns into the month, opening outward from the current week (header first, then this week, then the rest); fold it and it settles back into this week. Reduce Motion skips the animation.
- **GM icon that follows your theme:** the logo mark, the browser tab icon and the home screen icon all switch with your theme (GreatestMe, Synthwave, Martin, Studio). Pick the theme first, then Share → Add to Home Screen. An icon already on the home screen stays as it was saved, so to change it, remove it and add it again. Icons are generated from the one monogram in app.html with `node scripts/icons.mjs`.
- **The research, built for phones:** time blocks on Today go straight into Calendar with an alert five minutes before; the weekly review has **Send my weekly update** (a progress note for your accountability partner, from the Matthews written-goals study); each habit shows progress toward the ~66 days research says a habit takes to feel automatic; Settings → The GreatestMe Method explains the science.
- **Guides instead of a printed companion booklet:** the first visit to Today, Week, Goals, Habits and Progress explains why the page exists, how to use it in three steps, and a tip, with "Show me around" spotlighting the real controls; the **?** button reopens it. Settings → Help → **The GreatestMe Method**: eleven short chapters (why 13 weeks, SMART goals with a why, key actions, accountability and a reward, the roadmap, morning, evening with Win the Day and Plan to Reality scores, weekly plan with key dates and review, habits, the 20-mile march, the science, missed days, the quarterly review).
- **Today, top to bottom:** greeting with three progress rings (morning, targets, evening) and your streak; the Morning and Evening guided rituals; a **Smart Stack** of highlights (quote, streak, habits left, water, a past win, mindful minutes; swipe up/down, turns every 8 seconds, pauses while you touch it); collapsible **Morning, Targets, Habits, Evening** sections that show done / partly done / not started and open the next thing you need; the **Calendar**, folded to this week (tap a day to see it) and unfolding to Month and 13-week views.
- **Guided rituals:** one prompt per screen. Morning: one-minute breathing (saved as mindful minutes), gratitude, intention, three targets. Evening: wins, lessons, tomorrow, mood and energy.
- **Celebrations and badges:** confetti for checked targets and habits; full-screen moments for a complete day (all three rings closed), streak milestones and the journey start, once each per day; 13 badges arrive as a small banner. Sound is off until you turn it on.
- **Week, Goals, Habits, Progress:** weekly plan and review, goals with milestones by week, habit streaks and heatmaps, journey stats, badges, mindful minutes, quarterly review.
- **Settings:** profile, Look (four themes), Reminders, Partner, Help, and More settings (feel, water goal, Siri & Shortcuts links, journeys, backup and move, ideas).
- **Themes (follow your account):** GreatestMe (house purple, light/dark), Synthwave (electric teal and neon pink over the grid), Martin ('90s sitcom colour-blocking), Studio (minimal, light/dark).
- **Accounts and sync:** email or Google sign-in (Supabase). Live sync across devices; saves only overwrite the version they last saw, otherwise the other device's changes are merged in field by field. Unsynced edits survive reloads and offline use.
- **iPhone, iPhone Duo, iPad:** floating tab bar, safe areas, 16px inputs (no zoom), layouts for the Duo's folded and unfolded screens, Ink handwriting pages with Apple Pencil on iPad, offline Home Screen app that updates itself when online.
- **Apple-only features** (notifications, Siri/App Intents, HealthKit, widgets, Watch) are kept out of the web app and specified in `docs/NATIVE_APP.md`.

## Email recaps

A GitHub Actions job (`.github/workflows/recaps.yml`, every 15 minutes) reads each journal from Supabase and sends themed emails from `hello@teamsolen.com` through Namecheap SMTP (`mail.privateemail.com:465`):

- **Welcome** on sign-up and **Goals** once a journey's goals are set.
- **Daily recap** each morning at the person's morning reminder time (their own time zone): yesterday's rings, wins, lesson, streak, plus a quote.
- **Weekly recap** on their review day: days journaled, habit and target rates, wins, mood trend, next week's milestones.
- **Finale** after Day 91: the full 13-week picture.

Each person can turn daily, weekly and journey emails off in Settings → Reminders. `email_log` makes sure nothing is sent twice. Templates live in `scripts/email-templates.mjs`; the job in `scripts/recaps.mjs`. It needs two repository secrets: `SUPABASE_SECRET_KEY` and `SMTP_PASSWORD`. Until they're set, the job skips quietly.

## Accounts that work on every device (Supabase)

The web version signs you in with email and password and syncs your journal live across every browser, Home Screen app and device. Until it's configured, it runs with on-device accounts.

1. Create a free project at supabase.com (name it `greatestme`).
2. **SQL Editor → New query**: paste all of `supabase/schema.sql`, then **Run**.
3. **Authentication → URL Configuration**: set Site URL to `https://soulsmitty.github.io/GreatestMe/` and add it under Redirect URLs.
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key into `config.js`, then push. GitHub Pages redeploys on its own.

Row Level Security limits every journal row to its owner; partners can read only the one summary row the other person chose to share, after both accepted an invite code.

## Files

- `app.html` — the app (single file, no build step). This is what is published as the Claude artifact.
- `build.sh` — wraps `app.html` into `index.html` for any static host.
- `config.js` — the account service address and public key (empty = on-device accounts).
- `supabase/schema.sql` — tables, access rules, partner invites and live-update setup.
- `index.html`, `manifest.webmanifest`, `icon.svg` — standalone build, installable to a phone home screen.

## Deploy

- **Claude (synced accounts):** published as a private artifact. Share it from the Share menu with your partner at **Contributor** access so they can save.
- **Static host (on-device accounts):** run `./build.sh` and serve this folder (GitHub Pages, Netlify, Vercel static). Data stays in that browser; use Export for backups.

## Links

- **Claude version (synced accounts):** https://claude.ai/artifact/RJPQtHABp9CxhXiWbFcWZn
- **Web version (on-device accounts):** https://soulsmitty.github.io/GreatestMe/ — deployed by `.github/workflows/pages.yml` to GitHub Pages on every push to `main`. (Pages source is set to **GitHub Actions**.)

## Develop

Edit `app.html`, then `./build.sh` and open `index.html` in a browser. No dependencies.

## Quality

See [docs/QUALITY.md](docs/QUALITY.md) for the quality bar, measured speed, and what comes next. Native-only features are in [docs/NATIVE_APP.md](docs/NATIVE_APP.md).
