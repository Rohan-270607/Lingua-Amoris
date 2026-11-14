# Current state of Lingua Amoris (before v2)

Written for task P0-T4 from a full read of `src/`, `supabase-setup.sql`, `index.html`,
`vercel.json` and `.env.example` on branch `v2`, which starts at the polish commit `db98035` on `main`.
Nothing here was changed; this is a description.

## 1. What it is

A single-page React app (React 19, React Router 7, Vite 8, Tailwind v4, Framer Motion 13).
Live at https://lingua-amoris.vercel.app, deployed by Vercel from `main`. Plain JavaScript
and JSX, no TypeScript, no tests, no lint before P0-T1.

## 2. Screens (routes in `src/App.jsx`)

| Route | File | What it does |
|-------|------|--------------|
| `/` | `pages/Cover.jsx` | Outside the layout. The name on velvet. Swipe up (wheel, touch, drag, arrow keys, or the hint) lifts the cover and navigates to `/archive`. |
| `/archive` | `pages/Archive.jsx` | Epigraph with a translation toggle, search box, language chips with counts, a "Kept" chip for bookmarks, and a masonry of cards. Shows a retryable error if the load fails and skeleton text while loading. |
| `/add` | `pages/Add.jsx` | The composer, up to three "added this visit" cards with delete, and a "Kept in {language}" toast. |
| `*` | `pages/NotFound.jsx` | 404. |

Opening a verse: the arrow on a card (the only thing that opens it) morphs the card into a
sealed letter (`SealedLetter.jsx`, portalled to `<body>`), which also holds Edit and Delete.

## 3. Components

- Layout: `RootLayout` (title strip, perforated margins, panel, write-failure notice), `NavBar`, `PageTransition`, `RouteProgress`, `AnimatedBackground`.
- Verse: `archive/ArchiveCard` (card, bookmark toggle, open arrow), `SealedLetter` (envelope, rose seal, sheet, edit, delete, focus trap), `QuoteVignette` (ten small scenes picked from the id), `QuoteCard` (add-page card), `QuoteForm` (composer).
- UI: `ui/Button`, `ui/Ornaments`.
- Libraries: `lib/languages.js` (language list, RTL set, jewel colours, `canonicalLanguage`), `lib/archive.js` (folio refs, initials, relative date text), `lib/motion.js`, `lib/nav.js`, `lib/random.js` (unused), `lib/supabase.js`.
- State: `store/QuotesContext.jsx`, one provider, exposes `quotes, languages, total, loading, isShared, addQuote, deleteQuote, updateQuote, writeError, dismissWriteError, loadError, retryLoad`.
- Hook: `hooks/useLocalStorage.js`.

## 4. The data

### In the app
A verse is `{ id, text, author, language, createdAt }`. `createdAt` is milliseconds since 1970.
`author` is `''` when empty. Everything is sorted newest first on the way out of the store,
and `language` is passed through `canonicalLanguage` so "hindi" and "Hindi" are one language.
The interface says "verse"; identifiers and the table say "quote".

### Shared mode (Supabase) — used on the live site
Chosen at build time by `isSupabaseConfigured` (both `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` present). Table `public.quotes`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` primary key | |
| `text` | `text not null` | |
| `author` | `text not null default ''` | |
| `language` | `text not null` | |
| `created_at` | `timestamptz not null default now()` | |

Row-level security is on, with four open policies: anyone with the site address can read,
insert, update and delete. Realtime is on: inserts, updates and deletes reach every open tab.
(Policies as in `supabase-setup.sql`; the update policy was added to the live project by a
migration in an earlier round. They were not re-read from the live project for this task.)
At the time of writing the live table held 7 rows in three spellings of two languages.

Writes are optimistic. Insert and update roll back and show a notice if no row comes back.
A delete does **not** roll back; it shows a notice that says to reload.

### Local mode (no keys)
All verses live in `localStorage` under `lingua-amoris.quotes.v1`, as a JSON array of the shape
above. On a first visit the array is seeded with five built-in verses (ids `seed-bronte`,
`seed-gerard`, `seed-dante`, `seed-ghalib`, `seed-becquer`), which are real public-domain
quotations with named authors. They are ordinary entries after that; deleting them is permanent.

### Always local
Bookmarks: `lingua-amoris.bookmarks`, a JSON array of verse ids. Per browser, in both modes.

## 5. Behaviour worth pinning in tests (for P0-T5)

- Add: trims nothing itself (the form trims), assigns a UUID (or `q-…` if `crypto.randomUUID` is missing), a canonical language, and `createdAt = Date.now()`.
- Edit (`updateQuote`): changes text, author and language only.
- Delete: removes by id; bookmarks are not touched.
- Search: lower-cased substring over text, author and language. Language chips and "Kept" combine with it.
- `isSupabaseConfigured` is a build-time constant, so one test file can test only one mode unless the module is mocked or re-imported.
- **Test hazard:** Vitest reads the repo's `.env`, so a shared-mode test would build a client pointed at the live project. P0-T5 must blank those two variables for tests (project rule 5).

## 6. Hosting

Vercel, from `main`, SPA rewrite in `vercel.json`. Pushing any other branch (including `v2`)
produces a Vercel *preview* build, not a production deploy. Fonts (Bodoni Moda, Cormorant
Garamond, Comfortaa, Noto Serif Devanagari) load from the Google Fonts CDN in `index.html`.

## 7. Bugs and rough edges found

1. **"Kept" count can be wrong.** `Archive.jsx` shows `bookmarks.length`, but bookmarks are never pruned when a verse is deleted, so the chip can count verses that no longer exist.
2. **Cross-tab removal is ignored.** `useLocalStorage` skips `storage` events whose `newValue` is `null`, so clearing the key in another tab does not propagate.
3. **`supabase-setup.sql` is not re-runnable.** `create policy` and `alter publication … add table` fail on a second run.
4. **Delete in shared mode never rolls back** (deliberate, see above), so a failed delete leaves the verse hidden until reload.
5. **Non-UUID ids can exist in local data** (`seed-*`, `q-…`). The shared table's `id` is a `uuid`, so such a verse could not be inserted there unchanged.
6. **Anyone can edit or delete anything** on the shared board. That is the intended shape, and it is listed under the roadmap's honest limits.
7. **A free Supabase project pauses after about a week idle.** The app now says so instead of showing an empty list (fixed earlier), but it is still an outage.
8. `lib/random.js` is unused.

## 8. Roadmap tasks that clash with what exists

Each has a Change request in `ROADMAP.md`: CR-001 to CR-005.
