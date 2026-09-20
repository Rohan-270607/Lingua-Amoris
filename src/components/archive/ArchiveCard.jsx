import { motion } from 'framer-motion'
import { accentForQuote, isRTL } from '../../lib/languages'
import { folioRef, initials, provenance } from '../../lib/archive'
import { letterLayoutId } from '../SealedLetter'

const CARD_BG = '#181416'
const CARD_EDGE = '#2b2327'

function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BookmarkIcon({ filled, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <path d="M6 4h12v17l-6-4.2L6 21z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * One entry in the catalogue: the line, and the catalogue furniture the
 * record can actually support — folio reference, medallion initials,
 * provenance date — all derived, so a plate stays stable per quote.
 *
 * Deliberately text only. The little engraved scene belongs to the
 * letter you open, not to the index. The chevron is the only thing that
 * opens a letter — the plate itself is not a button.
 */
export default function ArchiveCard({ quote, index, bookmarked, onToggleBookmark, onOpen }) {
  const accent = accentForQuote(quote)
  const rtl = isRTL(quote.language)

  return (
    <motion.article
      layoutId={letterLayoutId(quote.id)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        layout: { type: 'spring', stiffness: 190, damping: 28, mass: 1 },
        duration: 0.7,
        delay: Math.min(index * 0.04, 0.5),
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ backgroundColor: CARD_BG, borderColor: CARD_EDGE }}
      className="group relative mb-4 break-inside-avoid rounded-[10px] border p-4 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-0.5 hover:border-[#473a3f] hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]"
    >
      {/* Register: accession tag, language, and the open affordance */}
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
          {folioRef(quote.language, index)}
        </span>
        <span className="font-sans truncate text-[7.5px] font-medium tracking-[0.22em] text-rosedust/45 uppercase">
          {quote.language}
        </span>
        <button
          type="button"
          onClick={() => onOpen(quote.id)}
          aria-haspopup="dialog"
          aria-label={
            'Open ' + (quote.author ? 'the ' + quote.author + ' verse' : 'this verse') +
            ', ' + quote.language
          }
          style={{ '--jewel': accent.text, '--jewel-edge': accent.border }}
          className="-my-1 -mr-1 ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-[6px] sm:h-7 sm:w-7 border border-transparent text-rosedust/35 outline-none transition-[color,border-color,background-color] duration-300 hover:border-[var(--jewel-edge)] hover:bg-[#221c1f] hover:text-[var(--jewel)] focus-visible:border-[var(--jewel-edge)] focus-visible:text-[var(--jewel)]"
        >
          <ChevronIcon className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </header>

      {/* The line itself */}
      <blockquote
        dir={rtl ? 'rtl' : 'ltr'}
        className={
          'font-display mt-4 text-[1.05rem] leading-[1.5] text-blush italic ' +
          (rtl ? 'text-right' : 'text-left')
        }
      >
        &laquo; {quote.text} &raquo;
      </blockquote>

      {/* Attribution */}
      <footer className="mt-5 flex items-end gap-2.5">
        <span
          className="font-sans grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[8px] font-semibold tracking-[0.04em]"
          style={{
            color: accent.text,
            backgroundImage: accent.face,
            borderColor: accent.border,
            boxShadow: accent.sheen,
          }}
        >
          {initials(quote.author)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display truncate text-[0.95rem] leading-tight text-ivory">
            {quote.author || 'Anonymous'}
          </p>
          <p className="font-sans mt-0.5 truncate text-[6.5px] tracking-[0.2em] text-rosedust/35 uppercase">
            {provenance(quote.createdAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleBookmark(quote.id)}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this'}
          className={
            'grid h-9 w-9 shrink-0 place-items-center rounded-[6px] transition-colors duration-300 sm:h-7 sm:w-7 ' +
            (bookmarked ? 'text-champagne' : 'text-rosedust/30 hover:text-champagne/80')
          }
        >
          <BookmarkIcon filled={bookmarked} className="h-3.5 w-3.5" />
        </button>
      </footer>
    </motion.article>
  )
}
