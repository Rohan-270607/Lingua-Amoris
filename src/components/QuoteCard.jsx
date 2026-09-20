import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { accentForQuote, isRTL } from '../lib/languages'
import { initials } from '../lib/archive'

const EASE_OUT = [0.16, 1, 0.3, 1]
const CONFIRM_TIMEOUT = 3200
const CARD_BG = '#181416'
const CARD_EDGE = '#2b2327'

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M4 7h16M10 11v6M14 11v6" strokeLinecap="round" />
      <path
        d="M6 7l1 12.2A1.8 1.8 0 0 0 8.8 21h6.4a1.8 1.8 0 0 0 1.8-1.8L18 7M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * A plate for the entries added this visit. Same stock as the catalogue
 * plates on the index, with a withdraw control where their chevron sits.
 */
export default function QuoteCard({ quote, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const accent = accentForQuote(quote)
  const rtl = isRTL(quote.language)

  // A confirm state that quietly gives up rather than nagging.
  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT)
    return () => clearTimeout(t)
  }, [confirming])

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.28, ease: 'easeIn' } }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.85 }}
      onHoverEnd={() => setConfirming(false)}
      style={{ backgroundColor: CARD_BG, borderColor: CARD_EDGE }}
      className="group relative flex h-full flex-col rounded-[10px] border p-4 transition-colors duration-500 hover:border-[#473a3f]"
    >
      <header className="flex items-center gap-2.5">
        <span
          className="font-sans shrink-0 rounded-[4px] border px-2 py-[3px] text-[7px] font-medium tracking-[0.16em] whitespace-nowrap uppercase"
          style={{
            color: accent.text,
            backgroundImage: accent.face,
            borderColor: accent.border,
            boxShadow: accent.sheen,
          }}
        >
          {quote.language}
        </span>

        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.span
              key="confirm"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="ml-auto flex items-center gap-2"
            >
              <span className="font-sans text-[7px] tracking-[0.18em] text-rosedust/55 uppercase">
                Sure?
              </span>
              <button
                type="button"
                onClick={() => onDelete(quote.id)}
                className="font-sans rounded-full border border-crimson/70 px-2.5 py-1 text-[7px] font-medium tracking-[0.18em] text-ember uppercase transition-colors duration-300 hover:bg-crimson hover:text-ivory"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="font-sans rounded-full border border-[#3a3035] px-2.5 py-1 text-[7px] font-medium tracking-[0.18em] text-rosedust/60 uppercase transition-colors duration-300 hover:text-blush"
              >
                No
              </button>
            </motion.span>
          ) : (
            <motion.button
              key="trash"
              type="button"
              onClick={() => setConfirming(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              aria-label={'Delete verse' + (quote.author ? ' by ' + quote.author : '')}
              className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-[6px] border border-transparent text-rosedust/35 transition-colors duration-300 hover:border-crimson/60 hover:text-ember"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </header>

      <blockquote
        dir={rtl ? 'rtl' : 'ltr'}
        className={
          'font-display mt-4 flex-1 text-[1.05rem] leading-[1.5] text-blush italic ' +
          (rtl ? 'text-right' : 'text-left')
        }
      >
        &laquo; {quote.text} &raquo;
      </blockquote>

      <footer className="mt-5 flex items-center gap-2.5">
        <span
          className="font-sans grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[8px] font-semibold"
          style={{
            color: accent.text,
            backgroundImage: accent.face,
            borderColor: accent.border,
            boxShadow: accent.sheen,
          }}
        >
          {initials(quote.author)}
        </span>
        <p className="font-display min-w-0 truncate text-[0.95rem] leading-tight text-ivory">
          {quote.author || 'Anonymous'}
        </p>
      </footer>
    </motion.article>
  )
}
