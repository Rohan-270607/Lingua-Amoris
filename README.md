# Lingua Amoris

A private archive of verses — lines worth keeping, in every language you love.

It opens on a cover bearing nothing but the name. Swipe up and the archive
appears: a catalogue of plates, each one a verse, each in one of four jewels.
Open a plate and it does not navigate anywhere — the card morphs into a sealed
envelope with a rose pressed into the flap, the rose comes loose, the flap
folds back, and the letter rises out of it, written in the card's own colour.
Closing folds the whole thing back in.

No accounts. By default everything lives in `localStorage` and never leaves the
browser. Point it at a Supabase project and it becomes a shared board instead:
anyone with the link reads and writes the same collection, live.

## Running it

Requires Node.js 20.19+ (or 22+).

```bash
npm install
npm run dev
```

| Script            | What it does                      |
| ----------------- | --------------------------------- |
| `npm run dev`     | Dev server with hot reload        |
| `npm run build`   | Production build into `dist/`     |
| `npm run preview` | Serve the production build        |

## The pages

| Route      | What it is                                                     |
| ---------- | -------------------------------------------------------------- |
| `/`        | The cover. The name, and a way in. Outside the layout chrome.   |
| `/archive` | The index: search, language chips, and the catalogue of plates. |
| `/add`     | The composer, plus whatever you added this visit.               |

Swiping up on the cover — trackpad, touch, a dragged mouse, `↑`/`↓`/`PageDown`/
`Enter`/`Space`, or the hint itself — lifts it away and opens the archive.

## Stack

- **React 19**, **React Router 7**, **Vite 8**
- **Tailwind CSS v4** via `@tailwindcss/vite`. No config file — the design
  tokens live in the `@theme` block at the top of `src/index.css`.
- **Framer Motion 13** for the page transitions, the card-to-envelope morph
  (a shared `layoutId`), and the letter's opening sequence
- **Supabase** (optional) for shared, realtime storage

Three typefaces, each with a job: **Bodoni Moda** for the wordmark and display
numerals, **Cormorant Garamond** for anything you actually read, **Comfortaa**
for the tracked micro-labels.

## Shared storage (optional)

Without a `.env`, verses live only in the browser that added them. To make it a
shared board:

1. Create a free project at [supabase.com](https://supabase.com).
2. Run [`supabase-setup.sql`](supabase-setup.sql) in the SQL editor. It creates
   the `quotes` table, opens it to public read/insert/update/delete, and turns
   on Realtime.
3. `cp .env.example .env` and fill in your project URL and publishable key
   (**Project Settings → API**).
4. Restart the dev server. The app detects the vars and switches over on its
   own — `isSupabaseConfigured` in `src/lib/supabase.js` is the whole switch.

There is no login, so anyone with the link can add, edit or delete anything.
That is the intended shape of it, not an oversight.

Delete `.env` at any point to fall back to local-only.

## Deploying

It builds to static files, so any host works. SPA rewrites for Vercel and
Netlify are already in place (`vercel.json`, `public/_redirects`) so a direct
load of `/archive` doesn't 404.

```bash
npm run build
```

If you are using shared storage, set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` in the host's project settings too — Vite inlines them
at build time, so they must exist wherever the build runs.

## Layout

```
src/
  App.jsx                   route table
  main.jsx                  entry: router + QuotesProvider
  index.css                 design tokens (@theme), surfaces, vignette keyframes

  pages/
    Cover.jsx               the name, and the swipe that opens the archive
    Archive.jsx             hero, filter bar, the catalogue grid
    Add.jsx                 the composer + this-visit plates + toast
    NotFound.jsx            404

  components/
    SealedLetter.jsx        the envelope, the rose, the fold, the sheet;
                            edit and delete live here. Portalled to <body>.
    QuoteVignette.jsx       ten little engraved scenes, picked per verse id
    QuoteForm.jsx           composer with autogrow + shake validation
    QuoteCard.jsx           the plates on the Add page, with delete
    AnimatedBackground.jsx  the velvet ground, one warm source, grain
    archive/
      ArchiveCard.jsx       a catalogue plate; its chevron opens the letter
    layout/
      RootLayout.jsx        title strip, perforated margins, panel, register
      NavBar.jsx            wordmark, index, the one crimson action
      PageTransition.jsx    per-route enter/exit
      RouteProgress.jsx     hairline sweep on navigation
    ui/
      Button.jsx, Ornaments.jsx

  store/
    QuotesContext.jsx       local or shared, picked automatically — one API
                            either way. Optimistic writes, each with rollback.

  lib/
    archive.js              folio refs, initials, relative provenance
    languages.js            language list, RTL set, the four jewels
    motion.js               shared easing and variants
    nav.js                  the register's links
    random.js               seeded PRNG
    supabase.js             client + isSupabaseConfigured

  hooks/
    useLocalStorage.js      persistence (+ cross-tab sync)
```

## Notes

- **Colour** is drawn from a verse's id, not its position, so a line keeps its
  jewel for good. The four — ruby, burnt orange, gold, yellow — are chosen from
  a short curated ring rather than a continuous hue arc: hashing into an arc
  looked random in code but read as one colour on screen.
- **The letter can be skipped.** The opening runs about five seconds, attribute
  by attribute. Click it and the whole sequence collapses to its end.
- **Accession numbers** (`SP / 003 / III`) come from a verse's place in the
  whole archive, so filtering the view never renumbers the plates.
- **Bookmarks** are per-browser, in `localStorage`, and the *Kept* chip filters
  to them.
- Arabic, Urdu, Persian and Hebrew lay out right-to-left automatically.
  **Other…** in the language dropdown opens a free-text field.
- `Ctrl`/`Cmd` + `Enter` saves from the composer.
- Every animation is skipped under `prefers-reduced-motion: reduce` — the
  letter simply appears, already open.
- A failed write rolls itself back and says so, rather than letting a verse
  vanish quietly.

`CHANGES.txt` is a running log of how the design got here, round by round.
