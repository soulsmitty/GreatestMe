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

- **Onboarding:** welcome, your name, pick your look, Day 1, goals, habits, then press-and-hold to commit.
- **Calendar:** month view with mini progress rings, mood and habits per day, Day 1 and Day 91 markers, swipe between months; a 13-week heat map with milestone flags (overdue in amber) and weekly scores; tap any day for its summary.
- **Settings:** look, Partner, sounds and celebrations, handwriting, Siri and Shortcuts, journeys, backup, Help (replay the tour, show tips again).
- **First-run tour** (five steps, replayable) and dismissible tips. Tap the logo to return to Today.
- **Sync:** edits from two devices at the same moment are merged field by field, never overwritten.
- **Today:** time-of-day greeting and scene, three progress rings (morning, targets, evening), streak flame, this week's check-ins.
- **Guided rituals:** Morning (one-minute breathing, gratitude, intention, three targets) and Evening (wins, lessons, tomorrow, mood and energy), one prompt per screen.
- **Celebrations:** confetti and a soft chime for targets, all habits done, a full page, milestones and streaks (3, 7, 14, 21, 30, 45, 60, 75, 91 days). Both can be turned off in Settings.
- **Theme suites (Settings → Look, follows your account):** GreatestMe (house purple, light/dark), Synthwave (neon grid), Martin ('90s sitcom colour-blocking), Studio (minimal, light/dark).
- **iPhone:** floating tab bar, 16px inputs (no iOS zoom), safe areas, Home Screen badge.
- **iPhone Duo (foldable):** fluid layouts for the folded outer screen and the near-square inner screen, two-column cards when unfolded, rows that re-flow per card width, Ink available on the inner screen.
- **iOS Safari hardening:** date fields that stay in their box, no inner shadows, no sticky hover after a tap, overlays animate once.
- **iPad + Apple Pencil:** Ink tab with college-ruled, wide-ruled, dot, graph or blank paper; pressure, palm rejection, highlighter, eraser, undo/redo, multiple pages. Scribble works in every text field.
- **Siri & Shortcuts:** deep links (`#today`, `#morning`, `#evening`, `#habits`, `#week`, `#ink`, `#progress`, `#partner`, `#preferences`) for Open URLs shortcuts and time-of-day automations.

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
