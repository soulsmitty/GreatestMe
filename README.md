# GreatestMe

A 13-week goal journal app, built on the quarterly method popularized by paper
planners like the SELF Journal: set up to three 13-week goals, map them into
weekly milestones, execute daily, review weekly, and close with a quarterly
review. Built for two people (Dalton and Lyllian) to use independently, with an
opt-in "Duo" board for accountability.

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
| Duo | Opt-in. Partners see only streak, habit/target rates, goal titles with %, today's page %, and one win you choose to share. Send cheers. |
| Journeys | Unlimited consecutive 13-week journeys; habits carry over. |
| Backup | Export / import JSON. |

## Files

- `app.html` — the app (single file, no build step). This is what is published as the Claude artifact.
- `build.sh` — wraps `app.html` into `index.html` for any static host.
- `index.html`, `manifest.webmanifest`, `icon.svg` — standalone build, installable to a phone home screen.

## Deploy

- **Claude (synced accounts):** published as a private artifact. Share it from the Share menu with your partner at **Contributor** access so they can save.
- **Static host (on-device accounts):** run `./build.sh` and serve this folder (GitHub Pages, Netlify, Vercel static). Data stays in that browser; use Export for backups.

## Links

- **Claude version (synced accounts):** https://claude.ai/artifact/RJPQtHABp9CxhXiWbFcWZn
- **Web version (on-device accounts):** deployed by `.github/workflows/pages.yml` to GitHub Pages on every push to `main`. Turn it on once under Settings → Pages → Source: **GitHub Actions**.

## Develop

Edit `app.html`, then `./build.sh` and open `index.html` in a browser. No dependencies.
