# Before anything ships

Every change to GreatestMe passes two gates.

## 1. Automated journeys (blocks the deploy)

`tests/journeys.js` runs in GitHub Actions before every deploy. It plays real people:

- A first visit in an iPhone browser is told to use the Home Screen before creating an on-device account.
- Onboarding finishes on Today; morning and evening rituals save; habit checks stick.
- Opening GreatestMe from a different place explains where the account lives instead of blaming the password.
- A transfer code moves a journal, the same passcode works afterwards, and a wrong passcode gets its own message.
- Account mode (against a stand-in for Supabase): email sign-in, a wrong password, a pasted password with a trailing space, the same journal when signing in somewhere else, live sync, staying signed in, partner invite codes.
- Typing stays in order when the screen refreshes.
- Every screen fits at folded (360), iPhone (393), unfolded (744) and iPad (834) widths in every theme, with no script errors.

Add a journey here whenever a real person hits a problem.

## 2. Persona review (before a change is called done)

A reviewer pass walks the change as:

- **Lyllian** — non-technical, iPhone Duo (5.4" folded, 7.6" unfolded), never touches GitHub.
- **Dalton** — iPhone 15 Pro + iPad with Apple Pencil, Chrome + Google Password Manager, Home Screen apps.

Questions it must answer:

1. Where does this data live, and what happens when the same person opens the app from Safari, Chrome, the Home Screen, or another device?
2. What does someone see when they forget a password, lose signal, or switch phones?
3. Is there any word a non-technical person wouldn't understand?
4. Does every error say what happened and what to do next?
5. Does it fit and feel right folded, unfolded, on iPhone and on iPad, in every theme?
6. On repeat daily use, does anything nag, interrupt, or slow down a habit?
