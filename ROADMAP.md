# Lingua Amoris II: Roadmap

The same app, made safer, richer and worth sharing. This file is the single source of truth for the project.
The planning model wrote it. Implementation models follow it. A forced audit checks them.

---

## 0. How this file works

**Task states**

| Mark | Meaning |
|------|---------|
| `[ ]` | Not started |
| `[~]` | In progress (only one task at a time) |
| `[x]` | Done, with evidence |
| `[!]` | Blocked, needs a human |

**What an implementation model may edit in this file**

- The checkbox of a task.
- The text after `Evidence:` on a task.
- Anything between the `LIVING:START` and `LIVING:END` markers at the bottom.

Everything else is the spec and is locked by a hash in `.audit/spec.lock`. If the spec is
wrong, unclear or a threshold cannot be reached, do not edit it. Mark the task `[!]`, add an
entry under **Change requests**, and stop. A human decides and re-locks.

**Rules the audit enforces**

1. A task marked `[x]` must have non-empty `Evidence:`.
2. A newly completed task's `Verify:` command must exit 0. `manual:` verifies need written evidence.
3. Only one task may be `[~]`.
4. No task in phase N may be started until the phase N-1 gate is `[x]` (when the phase has a gate).
5. A gate may be `[x]` only if `audits/phase-N.md` exists and contains `VERDICT: PASS`.
6. The spec hash must match the lock. The lock also covers `CLAUDE.md`,
   `.claude/settings.json`, `.claude/agents/auditor.md` and `scripts/audit.mjs`.
7. The npm scripts `typecheck`, `lint` and `test` must pass whenever they exist. Projects that
   are not JavaScript keep a small root `package.json` whose scripts call their real tools.

**Model tiers.** Tasks tagged `(smart)` involve a design decision and should be done or
reviewed with the strongest model available. Untagged tasks are for the cheaper model.
Phase gates are audited by the `auditor` subagent in a fresh session.

---

## 1. Product

Lingua Amoris saves romantic verses in many languages. The interface says "verse"; the code
and the database say "quote". Both mean the same thing and neither is renamed.

**What exists today (the starting point)**

- A live site at https://lingua-amoris.vercel.app, built from the `main` branch of
  `Rohan-270607/Lingua-Amoris`.
- The look is "Velvet & Gilt": dark velvet, gold, four jewel colours, a cover you swipe up,
  an archive of cards, and a sealed letter that opens when a card's arrow is pressed.
- Verses are stored in a Supabase table named `quotes` (`id`, `text`, `author`, `language`,
  `created_at`), open to anyone with the link, with live updates. This is the real data.
- When no Supabase keys are configured, the same app stores verses in localStorage under
  `lingua-amoris.quotes.v1`. Bookmarks are always per browser, under `lingua-amoris.bookmarks`.
- A verse in the app has the shape `{ id, text, author, language, createdAt }`.
- JavaScript and JSX, not TypeScript. No tests and no lint setup yet.

This roadmap keeps that look and that shared board, and improves what is underneath and
around them: a data model that cannot lose a verse, correct type for every script, search
and collections, a way to hear a line and understand it word by word, a mode for learning
lines by heart, a passport of the languages you have collected, and share cards.

**Goals**

- G1. No verse saved in the old version is lost, in the database or in any browser.
- G2. Every script shows in a proper typeface, in the right direction.
- G3. The app installs on a phone and opens offline, showing the verses it last loaded.

**Not in scope**

- A redesign. The Velvet & Gilt look, the swipe cover and the sealed letter stay.
- Login or accounts. The shared board stays open to anyone with the link, as it is now.
- Replacing Supabase, or a new backend. The existing table is extended, never rebuilt.
- Writing while offline on the shared board, and merging edits made offline.
- A built-in library of quotes.

**Honest limits**

- Anyone with the link can still add, edit or delete on the shared board.
- The free Supabase tier pauses after about a week unused. The app then shows the verses it
  last loaded and says the archive cannot be reached. Nothing is lost.
- Favourites, collections and practice progress live on one device unless you export them.
- Spoken playback depends on the voices the device has, and some languages have none.

## 2. Stack and rules

**Stack already in the app:** React 19, React Router 7, Vite 8, Tailwind CSS v4, Framer
Motion, Supabase JS (optional at run time).

**Added by this roadmap:** Dexie (IndexedDB), zod, vite-plugin-pwa.

**For tests and checks only:** vitest, jsdom, @testing-library/react,
@testing-library/jest-dom, @testing-library/user-event, fake-indexeddb, eslint with the
React plugins, axe-core.

No other dependencies without a Change request.

**Language:** JavaScript and JSX. Test files are `.js` or `.jsx`. No TypeScript, so there is
no `typecheck` script.

**How it fits together:** Add a verse -> shared Supabase table (or the local store when no
keys are set) -> local IndexedDB copy for offline reading and per-device extras -> Find ->
Understand -> Learn by heart -> Passport -> Share card

**Where each piece of data lives**

| Data | Lives in | Shared? |
|------|----------|---------|
| Text, author, language, date, transliteration, translation, source, tags, word meanings | Supabase `quotes` row, mirrored in IndexedDB | Yes |
| Favourites, collections, practice progress | IndexedDB only | No, per device |
| Everything, when no Supabase keys are set | IndexedDB only | No |

**Project rules**

1. No saved verse may ever be lost. Every storage change ships with a migration test and keeps a backup of the old data.
2. Keep the existing Velvet & Gilt look, the swipe cover and the sealed letter. Improve, do not redesign.
3. Never invent quotes, authors or translations. Test data uses short everyday phrases, not real quotations.
4. This is an existing app. Read before you change, and do not move or rewrite files a task does not need.
5. Tests never touch the live Supabase project. They use a mocked client and fixtures.
6. Database changes are additive only: new nullable columns and new policies. Never drop or rename a column, never delete or bulk-update rows. A human applies each database change after reading it.
7. The `test` script must be `vitest run`, not watch mode, so the audit cannot hang.

## 3. Phases

### Phase 0: Foundations

Goal: the existing app on a `v2` branch, with tests, lint and the audit all running.

- [x] **P0-T1** Set up the v2 branch
  - Do: In the existing repo, create a branch named `v2` from `main`. Copy this kit into the repo root (`ROADMAP.md`, `CLAUDE.md`, `scripts/audit.mjs`, `.audit/spec.lock`, `audits/`, `.claude/settings.json`, `.claude/agents/auditor.md`), merging with the `.claude` folder that is already there. Add eslint (flat config) and vitest with jsdom and Testing Library. Add root scripts `lint` and `test`. Fix lint errors only where a rule is clearly right; otherwise relax the rule and say so in Evidence. No existing file is moved or rewritten.
  - Accept: `npm run lint`, `npm test` and `npm run build` pass on the repo with one trivial test, and the app looks and behaves as before.
  - Verify: `npm run lint && npm test && npm run build`
  - Evidence: `npm run lint && npm test && npm run build` exit 0 on branch `v2` (lint clean; 1 test passed; build ok). No file under `src/` changed (`git status` shows only new config, kit files and package.json/lock). ESLint 9 used because eslint-plugin-react does not support ESLint 10. Relaxed in eslint.config.js: react/prop-types, react-hooks/refs, react-hooks/set-state-in-effect (53 + 2 findings in untouched working code). Commit: see git log `P0-T1`.
- [x] **P0-T2** Wire the audit
  - Do: Confirm the Stop hook in `.claude/settings.json` really runs `scripts/audit.mjs` at the end of a turn (check that `.audit/last-report.md` gets a new time). Add `.audit/state.json` and `.audit/last-report.md` to `.gitignore`.
  - Accept: `node scripts/audit.mjs --check` prints PASS, and Evidence quotes the time from a report the hook wrote.
  - Verify: `node scripts/audit.mjs --check`
  - Evidence: The Stop hook fired on its own at the end of the P0-T1 turn: `.audit/last-report.md` says `Time: 2026-11-14T10:22:54Z`, 14 s after commit 4402380 (`10:22:40Z`), with no manual audit run in between. `node scripts/audit.mjs --check` prints `AUDIT PASS`. `.audit/state.json` and `.audit/last-report.md` are in .gitignore and no longer show in `git status`.
- [x] **P0-T3** Continuous integration
  - Do: A GitHub Actions workflow runs lint, tests, build and `node scripts/audit.mjs --check` on every push. It needs no Supabase keys.
  - Accept: The workflow file exists and its commands match the root scripts.
  - Verify: manual: the latest Actions run is green
  - Evidence: Workflow `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, `npm test`, `npm run build`, `node scripts/audit.mjs --check` on every push, no Supabase keys. GitHub Actions run for commit 1db514c on branch v2: completed, success, https://github.com/Rohan-270607/Lingua-Amoris/actions/runs/43585526396
- [x] **P0-T4** (smart) Map the existing app
  - Do: Read the whole codebase. Write `docs/current-state.md`: the screens, the components, the store and its two modes, the exact shape of a row in Supabase and of the data in localStorage, the row-level policies, and any bugs found. List every task in this roadmap that clashes with what exists.
  - Accept: The document exists, and each clash has a Change request.
  - Verify: manual: docs/current-state.md exists and Change requests are filed
  - Evidence: `docs/current-state.md` written from a full read of src/, the SQL, index.html and vercel.json (screens, components, both data shapes, policies, build-time mode switch, 8 bugs). Five clashes filed as CR-001 to CR-005 in the Change requests list below; CR-001, CR-002 and CR-004 affect Phase 1 and need a human decision before those tasks.
- [x] **P0-T5** Safety net
  - Do: Add tests that pin down how add, view, edit and delete work today in both modes (local, and shared with a mocked Supabase client). Add an "export my verses" control that downloads every loaded verse and the bookmarks as JSON.
  - Accept: The tests pass on the unchanged app, an exported file re-imports to identical data in a test, and a real export of the live verses is saved outside the repo with its verse count written in Evidence.
  - Verify: `npx vitest run test/current-behaviour.test.jsx`
  - Evidence: `npx vitest run test/current-behaviour.test.jsx` exit 0, 22 tests: local store (first-visit seeds, newest first, language merge, add, edit, delete, persistence), shared store with a mocked Supabase client (load mapping, load error, insert/update/delete calls, rollbacks, live events), Archive page (list, filters, open only from the arrow, delete with confirm, edit, bookmarks), and export (round-trip to identical data, damaged files rejected, the button downloads every verse and the bookmarks). The pinning tests passed on unchanged app code before the export button was added (21 of 22 ran green; the 22nd was the export button itself); one test caught that shared mode still writes the seeds to localStorage and pins it. Vitest blanks VITE_SUPABASE_URL/KEY (vitest.config.js) so tests cannot reach the live project. New: `src/lib/backup.js` and an "Export my verses (n)" button at the foot of the Archive page. Real export of the live table: 7 verses, saved outside the repo at `T:\Lingua_Amoris_backups\live-quotes-2026-11-14.json` (bookmarks are browser-only, so that file has none).
- [ ] **P0-GATE** Phase 0 audit
  - Accept: The auditor confirms every task above against the code and writes `audits/phase-0.md`.
  - Verify: manual: audits/phase-0.md ends with VERDICT: PASS
  - Evidence:

### Phase 1: A stronger foundation

Goal: data that can grow without losing a verse.

- [ ] **P1-T1** (smart) Versioned data model
  - Do: A zod schema for a verse: id, original text, language, script direction, transliteration, translation, author, source, tags, word meanings, created date, plus a schema version. Write one upgrade function that accepts both old shapes: an item from the old localStorage array and a row from the old Supabase table. Separate small schemas for the per-device records: favourite, collection, practice state.
  - Accept: On fixtures of both old shapes no verse is lost and no field is changed, and running the upgrade twice changes nothing.
  - Verify: `npx vitest run test/migration.test.js`
  - Evidence:
- [ ] **P1-T2** (smart) Extend the shared table
  - Do: Write a SQL migration that adds nullable columns to `quotes` for transliteration, translation, source, tags and word meanings, plus a schema version with a default. Update `supabase-setup.sql` so a fresh project matches. Update the row-to-verse and verse-to-row mapping. A human applies the migration to the live project after an export from P0-T5 is in hand.
  - Accept: Old rows and new rows both round-trip through the mapping in tests. After the human applies the migration, the live row count is the same as before, and both counts are written in Evidence.
  - Verify: `npx vitest run test/rows.test.js`
  - Evidence:
- [ ] **P1-T3** Local store in IndexedDB
  - Do: Add a Dexie database. With no Supabase keys, verses move from localStorage to IndexedDB once, automatically, and the old key is left in place as a backup. With keys, every successful load is mirrored into IndexedDB so the archive can be read offline; Supabase stays the source of truth. Bookmarks move into a favourites table and the old bookmarks key is left in place.
  - Accept: One test starts from old localStorage data and ends with the same verses in IndexedDB and the backup intact. One test shows a failed load falling back to the mirrored verses. One test shows bookmarks arriving as favourites.
  - Verify: `npx vitest run test/storage.test.js`
  - Evidence:
- [ ] **P1-T4** Type for every script
  - Do: Load open-licence Noto faces for Devanagari, Tamil, Arabic and Urdu only when a verse in that script is present, and cache them for offline use. Chinese, Japanese and Korean use the device's own fonts, because those files are too large to ship. Choose direction from the text itself, not only from the language name.
  - Accept: Direction and font are chosen correctly for Tamil, Hindi, Urdu, Japanese and French samples, checked by tests and by eye.
  - Verify: `npx vitest run test/scripts.test.jsx`
  - Evidence:
- [ ] **P1-T5** Honest sources
  - Do: Add a source field to the composer and the letter's edit mode. Show a small "source not checked" mark when the source is empty.
  - Accept: The mark appears and disappears correctly in tests.
  - Verify: `npx vitest run test/source.test.jsx`
  - Evidence:
- [ ] **P1-GATE** Phase 1 audit
  - Accept: The auditor confirms every task above against the code and writes `audits/phase-1.md`.
  - Verify: manual: audits/phase-1.md ends with VERDICT: PASS
  - Evidence:

### Phase 2: Find and feel

Goal: the right line, when you want it.

- [ ] **P2-T1** Search and filters
  - Do: Extend the existing search to cover the original, the transliteration and the translation. Filter by language, tag and favourite.
  - Accept: Search ignores case everywhere and ignores accents on Latin, Greek and Cyrillic letters. Vowel signs and marks in Indic and Arabic scripts are never stripped. Tested on mixed-script samples.
  - Verify: `npx vitest run test/search.test.js`
  - Evidence:
- [ ] **P2-T2** Collections
  - Do: Let me group verses into named, ordered sets, stored on this device.
  - Accept: Add, remove, reorder and delete are tested, and deleting a set never deletes its verses.
  - Verify: `npx vitest run test/collections.test.js`
  - Evidence:
- [ ] **P2-T3** Hear it
  - Do: A button in the opened letter speaks the verse using the browser's speech voices in the right language. Hide the button when the device has no voice for that language.
  - Accept: Tested with mocked voices for a language that has a voice and one that does not.
  - Verify: `npx vitest run test/speech.test.jsx`
  - Evidence:
- [ ] **P2-T4** Word by word
  - Do: Let me add a meaning for each word of a verse. Tapping a word in the opened letter shows its meaning. Meanings are part of the shared row.
  - Accept: Word splitting is tested for space-separated scripts, and the feature is hidden for scripts without spaces.
  - Verify: `npx vitest run test/gloss.test.jsx`
  - Evidence:
- [ ] **P2-GATE** Phase 2 audit
  - Accept: The auditor confirms every task above against the code and writes `audits/phase-2.md`.
  - Verify: manual: audits/phase-2.md ends with VERDICT: PASS
  - Evidence:

### Phase 3: Keep and learn

Goal: reasons to open it every day.

- [ ] **P3-T1** Verse of the day
  - Do: A daily pick, the same all day, shown after the swipe cover.
  - Accept: With a fixed date and a fixed set of verses the pick is fixed, and it changes the next day.
  - Verify: `npx vitest run test/daily.test.js`
  - Evidence:
- [ ] **P3-T2** (smart) Learn by heart
  - Do: A practice mode that hides some words of a verse for me to fill in, scheduled with SM-2 spaced repetition. Progress is stored on this device.
  - Accept: The scheduler is a pure function, tested against 12 review histories.
  - Verify: `npx vitest run test/learn.test.js`
  - Evidence:
- [ ] **P3-T3** Language passport
  - Do: A page of stamps, one per language collected, with a count. The first verse in a new language adds a stamp with a small animation.
  - Accept: Stamp logic is tested, and the animation has a reduced-motion version.
  - Verify: `npx vitest run test/passport.test.jsx`
  - Evidence:
- [ ] **P3-T4** Install and offline
  - Do: Make the app an installable PWA. With no connection it opens and shows the verses it last loaded. On the shared board, adding, editing or deleting while offline is refused with a clear message. If vite-plugin-pwa does not support the installed Vite version, file a Change request instead of pinning or forcing versions.
  - Accept: The app is installed on my phone, opens in flight mode with my verses visible, and refuses an offline add without losing what I typed.
  - Verify: manual: screenshot of the installed app working offline
  - Evidence:
- [ ] **P3-GATE** Phase 3 audit
  - Accept: The auditor confirms every task above against the code and writes `audits/phase-3.md`.
  - Verify: manual: audits/phase-3.md ends with VERDICT: PASS
  - Evidence:

### Phase 4: Share and ship

Goal: out of the app and into a message.

- [ ] **P4-T1** (smart) Share cards
  - Do: Draw a verse as a 1080 by 1350 card on canvas in four Velvet & Gilt styles, with the original script, the transliteration and the translation. Keep the layout a pure function that is given a text-measuring function, so it can be tested without a real canvas.
  - Accept: The layout function never cuts text, tested with short, long, Tamil, Hindi and Urdu samples.
  - Verify: `npx vitest run test/share-card.test.js`
  - Evidence:
- [ ] **P4-T2** Share sheet
  - Do: On phones the share button opens the native share sheet with the image. On desktop it downloads.
  - Accept: Both paths are tested with the share API mocked.
  - Verify: `npx vitest run test/share.test.js`
  - Evidence:
- [ ] **P4-T3** Backup and restore
  - Do: Extend the export from P0-T5 to the full v2 data, including favourites, collections and practice progress. Import merges by id and skips duplicates. Import never deletes or overwrites a verse that is already there.
  - Accept: Importing the same file twice adds nothing, and a damaged file is rejected with a clear message.
  - Verify: `npx vitest run test/backup.test.js`
  - Evidence:
- [ ] **P4-T4** Polish and ship
  - Do: Run an accessibility check, fix what it finds, update the README with screenshots, merge `v2` into `main` and deploy.
  - Accept: An automated axe check passes on the main screens, the new version is live, and the live verse count matches the count before the merge.
  - Verify: manual: live URL noted
  - Evidence:
- [ ] **P4-GATE** Phase 4 audit
  - Accept: The auditor confirms every task above against the code and writes `audits/phase-4.md`.
  - Verify: manual: audits/phase-4.md ends with VERDICT: PASS
  - Evidence:

---

<!-- LIVING:START -->

## Status board

| Phase | State | Gate |
|-------|-------|------|
| 0 Foundations | not started | |
| 1 A stronger foundation | not started | |
| 2 Find and feel | not started | |
| 3 Keep and learn | not started | |
| 4 Share and ship | not started | |

## Decision log

Format: `D-00N | date | decision | why | alternatives rejected`

- D-001 | 2026-11-14 | Supabase stays the source of truth; IndexedDB is an offline copy plus per-device extras. | The real verses already live in Supabase and are shared by link. | Moving everything to IndexedDB (would strand the live verses and end the shared board).
- D-002 | 2026-11-14 | Stay on JavaScript and JSX; test files are `.js`/`.jsx`. | The app is JSX today and rule 4 says not to rewrite files a task does not need. | Converting to TypeScript.
- D-003 | 2026-11-14 | Test and lint packages added to the allowed stack (jsdom, Testing Library, fake-indexeddb, eslint, axe-core). | The Verify commands cannot run without them. | A Change request per task.
- D-004 | 2026-11-14 | New content fields are shared columns; favourites, collections and practice progress are per device. | There are no accounts, so personal state cannot be shared safely. | Storing favourites in the shared table.
- D-005 | 2026-11-14 | Chinese, Japanese and Korean use device fonts. | Each bundled face is several megabytes. | Bundling Noto CJK.
- D-006 | 2026-11-14 | The lock now also covers CLAUDE.md, the hook settings, the auditor and the audit script. | Before, only ROADMAP.md was hashed. | Leaving those on trust.

## Change requests

Format: `CR-00N | date | task | what is wrong with the spec | proposed change | status`

- CR-001 | 2026-11-14 | P0-T5, P1-T1, P1-T3 | The app's local mode ships five built-in real quotations (`seed-*` in `QuotesContext.jsx`). Section 1 says there is no built-in library and rule 3 says test data must not be real quotations. | Leave the seeds in the app. Treat them as ordinary rows in migration (never dropped), and write every fixture from invented everyday phrases. | open
- CR-002 | 2026-11-14 | P1-T1 | Ids in local data are not always UUIDs (`seed-*`, `q-…`), while the shared table's `id` is a `uuid`. A zod schema that requires a UUID would reject real data. Also `createdAt` is milliseconds in the app and `created_at` is a timestamp in the table, and the app picks direction from the language name, not the text. | The schema accepts any non-empty string id, keeps ids unchanged, stores the created date as milliseconds, and direction is derived by one function from the text and the language. | open
- CR-003 | 2026-11-14 | P1-T2 | `supabase-setup.sql` cannot be run twice (policies and the realtime publication fail on a second run), so "a fresh project matches" cannot be tested by re-running it. | Make the setup file re-runnable (`drop policy if exists`, guarded publication add) as part of P1-T2. | open
- CR-004 | 2026-11-14 | P1-T3 | "Mirror every successful load into IndexedDB" is incomplete. The app also receives live inserts, updates and deletes, and deletes never roll back. A mirror that only takes full loads would bring deleted verses back when offline. Bookmarks are never pruned either, so migrating them as favourites would carry ids of verses that no longer exist. | The mirror is replaced as a whole on each successful load and also applies live events; it is never a source of writes. Favourites for ids with no verse are kept but not counted or shown. Shared-mode browsers also hold the five `seed-*` verses in localStorage (docs/current-state.md bug 9); the local-to-IndexedDB move must not treat those as user data when Supabase is configured. | open
- CR-005 | 2026-11-14 | P3-T4 | Offline "opens and shows my verses" is not enough: the display fonts (Bodoni Moda, Cormorant Garamond, Comfortaa) come from the Google Fonts CDN, so offline the look would silently change. | Cache those font files at run time in the service worker (no new dependency), and add "the display fonts still render offline" to the Accept line. | open

## Session notes

Newest first. One short entry per working session: what was done, what is next, anything surprising.

- 2026-11-14 | P0-T5 done: 22 behaviour tests, export button, real backup of the 7 live verses. Surprise: shared mode still writes the seeds into localStorage (doc bug 9, added to CR-004). All Phase 0 tasks are done: STOP and run the auditor for P0-GATE in a fresh session. Next after PASS: P1-T1, but CR-001, CR-002 and CR-004 need a human decision first.
- 2026-11-14 | P0-T4 done: current-state.md written, CR-001..005 filed. Surprise: local mode ships five real quotations; Vitest would read the live .env, so P0-T5 must blank the Supabase variables for tests. Next: P0-T5.
- 2026-11-14 | P0-T3 done: CI workflow added; pushed branch v2 (not main) and the run is green. Next: P0-T4 (read the whole app and write docs/current-state.md).
- 2026-11-14 | P0-T2 done: hook confirmed firing from the report timestamp; audit scratch files git-ignored. Next: P0-T3.
- 2026-11-14 | P0-T1 done: created `v2` from `main` (includes the unpushed polish commit), copied the kit in, added eslint 9 + vitest/jsdom/Testing Library, scripts `lint` and `test`, one smoke test. Three lint rules relaxed (see Evidence). Surprise: ESLint 10 is not supported by eslint-plugin-react. Next: P0-T2.
- 2026-11-14 | Spec rewritten to match the real app (Supabase, JSX, Velvet & Gilt) before any task started. Needs a human re-lock. Next: P0-T1.

<!-- LIVING:END -->
