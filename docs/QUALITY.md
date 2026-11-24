# GreatestMe quality bar

The standard we hold the app to, what is in place, the numbers we measured, and what comes next.
It covers the frontend, the backend, the UX, and stability, not just looks.

## What "top level" means here

These are lessons from the best apps in the category: Headspace and Calm for calm onboarding, Duolingo for streaks and delight, Things 3 for speed and quiet, Apple Fitness for rings, Day One for trust in your data, and Gmail for Undo.

1. **Instant.** Every tap answers within one frame, and the app opens before the network does.
2. **Never lose a word.** Local first, synced in the background, and conflicts merged instead of overwritten.
3. **Never a dead end.** No blank screens, Undo instead of "are you sure?", and a page guide on every page.
4. **One thing at a time.** Sections fold away when they're done, and the next step is always obvious.
5. **Feels alive, never noisy.** Motion with purpose, respect for Reduce Motion, sound only if you turn it on.

## In place

| Area | What we do |
|---|---|
| Load | One self-contained page (≈275 KB, ≈79 KB gzipped). Fonts load without blocking the first paint. The account library loads only when accounts are configured. |
| Offline / caching | Service worker: the page is network-first, but falls back to the saved copy after 2.5 s on a slow network. Icons, fonts and the library come from cache first and refresh in the background. Updates apply on the next open. |
| Data safety | Local mirror of every document, pending changes survive closing the app, three-way merge for edits from two devices, conditional writes with retry, and handwriting snapshots flushed before you switch days. |
| Stability | Error boundary: if a page fails to draw, the app returns to Today, and if that fails too it shows a Reload card. It never shows a blank screen. Sync redraws wait while you type or press. |
| Undo | Removing a goal, milestone or habit happens immediately and shows **Undo** for 5 seconds. |
| Quality gate | Real-user journeys in Playwright (phone, folded/unfolded Duo, iPad, desktop; local and account modes; two devices editing at once) must pass before every deploy. |
| Accessibility | 44 px tap targets, focus rings, ARIA on rings/toasts/sheets, Reduce Motion respected, labels on every field. |
| Themes | Each theme sets its own icon, tab icon, home screen icon and status bar color. |

## Measured (Nov 24, 2026, iPhone 15 Pro emulation, 81 days of data, 8 habits, 3 goals × 13 milestones)

| Moment | Time |
|---|---|
| Reload to Today | 97 ms (local) |
| Draw Today / Week / Goals / Habits / Progress | 8.8 / 3.3 / 2.7 / 6.4 / 2.5 ms |
| Per keystroke | 0.02 ms |

Every page draws well inside a 16 ms frame.

## Next, in priority order

1. **Error reporting you can see:** a small private log in Supabase of client errors (message + page, no journal text), so problems are fixed before anyone reports them.
2. **Sync status you can trust at a glance:** a quiet "Saved · Offline · Syncing" dot in the header, with the last-synced time on tap.
3. **Performance budget in the gate:** fail the deploy if Today takes more than 50 ms to draw or the page goes over 120 KB gzipped.
4. **Lighthouse-style checks in CI:** contrast, labels and tap sizes in every theme.
5. **Haptics and widgets:** these need the native app. They are already listed in `docs/NATIVE_APP.md`.
