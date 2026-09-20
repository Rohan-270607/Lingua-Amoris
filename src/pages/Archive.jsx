import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ArchiveCard from '../components/archive/ArchiveCard'
import SealedLetter from '../components/SealedLetter'
import { useQuotes } from '../store/QuotesContext'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { EASE_OUT } from '../lib/motion'

// The epigraph, and what it says for anyone who wants it plainly.
const EPIGRAPH_TRANSLATION = 'There is only one happiness in this life: to love and be loved.'
const EPIGRAPH_SOURCE = 'George Sand'

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

/** One heading in the rail. The chosen one wears the archive's crimson. */
function Chip({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'font-sans rounded-full border px-3.5 py-2.5 text-[7.5px] font-medium tracking-[0.2em] whitespace-nowrap uppercase transition-colors duration-300 outline-none focus-visible:ring-1 focus-visible:ring-champagne sm:py-1.5 ' +
        (active
          ? 'border-crimson bg-crimson text-ivory'
          : 'border-[#332a2e] text-rosedust/55 hover:border-[#4a3c42] hover:text-blush')
      }
    >
      {children}
    </button>
  )
}

function CodexIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.6 1.6 0 0 0-1.6-1.6H4z" strokeLinejoin="round" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.6 1.6 0 0 1 1.6-1.6H20z" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The archive itself: a curated index laid out as catalogue plates.
 * Clicking a plate opens it as a sealed letter rather than navigating
 * away. Reached by swiping up off the cover at "/".
 */
export default function Archive() {
  const { quotes, languages, loading, deleteQuote, updateQuote } = useQuotes()

  const [showTranslation, setShowTranslation] = useState(false)
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('All')
  const [onlyKept, setOnlyKept] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [bookmarks, setBookmarks] = useLocalStorage('lingua-amoris.bookmarks', [])

  const toggleBookmark = (id) =>
    setBookmarks((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )

  // Accession numbers come from a quote's place in the whole archive, so
  // filtering the view never renumbers the plates.
  const accession = useMemo(() => {
    const map = new Map()
    quotes.forEach((q, i) => map.set(q.id, i))
    return map
  }, [quotes])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return quotes.filter((quote) => {
      if (language !== 'All' && quote.language !== language) return false
      if (onlyKept && !bookmarks.includes(quote.id)) return false
      if (!q) return true
      return (
        quote.text.toLowerCase().includes(q) ||
        (quote.author || '').toLowerCase().includes(q) ||
        quote.language.toLowerCase().includes(q)
      )
    })
  }, [quotes, query, language, onlyKept, bookmarks])

  const filtering = query.trim() !== '' || language !== 'All' || onlyKept

  const openQuote = quotes.find((q) => q.id === openId) ?? null
  const closeLetter = useCallback(() => setOpenId(null), [])

  return (
    <div className="px-5 pb-4 sm:px-8">
      {/* ---------------------------------------------------- hero ---- */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
        className="flex flex-col items-center px-4 pt-10 pb-8 text-center sm:pt-14"
      >
        <span
          className="grid h-8 w-8 place-items-center rounded-[7px] border text-champagne"
          style={{ borderColor: '#3a2f22', backgroundColor: '#1d1712' }}
        >
          <CodexIcon className="h-4 w-4" />
        </span>

        <h1 className="font-display mt-7 max-w-2xl text-[clamp(1.3rem,3.6vw,1.95rem)] leading-[1.45] text-blush italic">
          &laquo; Il n&rsquo;y a qu&rsquo;un bonheur dans la vie, c&rsquo;est
          d&rsquo;aimer et d&rsquo;&ecirc;tre aim&eacute;. &raquo;
        </h1>

        <button
          type="button"
          onClick={() => setShowTranslation((v) => !v)}
          aria-expanded={showTranslation}
          className="font-sans mt-5 rounded-full border border-[#2e2529] px-3.5 py-2.5 text-[6.5px] sm:py-1.5 font-medium tracking-[0.26em] text-rosedust/45 uppercase transition-colors duration-300 outline-none hover:border-[#463940] hover:text-champagne focus-visible:ring-1 focus-visible:ring-champagne"
        >
          {showTranslation ? 'Hide translation' : 'See translation'}
        </button>

        <AnimatePresence initial={false}>
          {showTranslation && (
            <motion.div
              key="epigraph-translation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <p className="font-display mt-5 max-w-lg text-[0.95rem] leading-relaxed text-rosedust/65 italic">
                &ldquo;{EPIGRAPH_TRANSLATION}&rdquo;
              </p>
              <p className="font-sans mt-2.5 text-[6.5px] tracking-[0.26em] text-rosedust/35 uppercase">
                &mdash; {EPIGRAPH_SOURCE}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <span className="mt-6 flex items-center gap-2">
          <span className="h-px w-8 bg-petal/25" />
          <span className="h-[5px] w-[5px] rotate-45 bg-petal/70" />
          <span className="h-px w-8 bg-petal/25" />
        </span>
      </motion.section>

      {/* --------------------------------------------------- filter ---- */}
      {quotes.length > 0 && (
        <div className="mb-8 flex flex-col items-center gap-4">
          <label className="relative block w-full max-w-sm">
            <span className="sr-only">Search the archive</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 text-rosedust/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a verse, a name, a language…"
              className="font-sans w-full rounded-full border border-[#2b2327] bg-[#181416] py-2.5 pr-9 pl-10 text-[10px] tracking-[0.12em] text-blush outline-none transition-colors duration-300 placeholder:text-rosedust/30 hover:border-[#3a3035] focus:border-petal/50"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center text-rosedust/40 transition-colors duration-300 hover:text-champagne"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            )}
          </label>

          <div className="flex flex-wrap justify-center gap-2">
            <Chip active={language === 'All'} onClick={() => setLanguage('All')}>
              All ({quotes.length})
            </Chip>
            {languages.map((lang) => (
              <Chip
                key={lang.name}
                active={language === lang.name}
                onClick={() => setLanguage(lang.name)}
              >
                {lang.name} ({lang.count})
              </Chip>
            ))}
            {bookmarks.length > 0 && (
              <Chip active={onlyKept} onClick={() => setOnlyKept((v) => !v)}>
                &#9733; Kept ({bookmarks.length})
              </Chip>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- grid ---- */}
      {loading ? (
        <p className="font-sans py-16 text-center text-[9px] tracking-[0.3em] text-rosedust/40 uppercase">
          Retrieving the folios…
        </p>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-sans text-[9px] tracking-[0.3em] text-rosedust/40 uppercase">
            {filtering ? 'Nothing under that heading' : 'Nothing kept yet'}
          </p>
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setLanguage('All')
                setOnlyKept(false)
              }}
              className="font-sans mt-4 text-[9px] tracking-[0.24em] text-petal/70 uppercase transition-colors duration-300 hover:text-champagne"
            >
              Clear the filters
            </button>
          )}
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {visible.map((quote) => (
            <ArchiveCard
              key={quote.id}
              quote={quote}
              index={accession.get(quote.id) ?? 0}
              bookmarked={bookmarks.includes(quote.id)}
              onToggleBookmark={toggleBookmark}
              onOpen={setOpenId}
            />
          ))}
        </div>
      )}

      {openQuote && (
        <SealedLetter
          key={openQuote.id}
          quote={openQuote}
          onClose={closeLetter}
          onDelete={deleteQuote}
          onUpdate={updateQuote}
        />
      )}
    </div>
  )
}
