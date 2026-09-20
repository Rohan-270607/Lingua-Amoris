import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { accentForQuote, isRTL } from '../lib/languages'
import { EASE_OUT } from '../lib/motion'
import QuoteVignette from './QuoteVignette'

/** Shared id for the morph between a catalogue card and its letter. */
export const letterLayoutId = (id) => 'quote-letter-' + id

// The line every envelope is sealed with. Virgil, Eclogues X.
export const LETTER_MOTTO = 'Omnia vincit amor'

// The envelope: the same stock as the sheet inside it, a shade deeper,
// so the letter reads as paper within paper rather than paper on velvet.
const ENVELOPE = '#ded2b8'
const ENVELOPE_EDGE = '#c2b191'

// When each part arrives, in seconds from the click. The sheet is read
// one attribute at a time rather than all at once.
const BEAT = {
  rose: 0.35,
  flap: 1.25,
  sheet: 1.65,
  quote: 2.3,
  rule: 2.95,
  author: 3.25,
  stamp: 3.45,
  scene: 3.75,
}

// How long the fold-back runs before the envelope morphs away again.
const CLOSE_MS = 900

/**
 * The rose pressed into the flap where a wax seal would be: two rings of
 * petals around a curled heart, with a pair of laurel leaves behind.
 * Ids are suffixed per quote so several gradients can coexist.
 */
function RoseSeal({ id }) {
  const petal = 'M32 33 C18 31 11 20 19 12 C26 5 38 5 45 12 C53 20 46 31 32 33 Z'
  const outer = 'rose-outer-' + id
  const inner = 'rose-inner-' + id

  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="h-full w-full drop-shadow-[0_5px_12px_rgba(0,0,0,0.6)]"
    >
      <defs>
        <radialGradient id={outer} cx="38%" cy="26%" r="80%">
          <stop offset="0%" stopColor="#d8485e" />
          <stop offset="52%" stopColor="#9c1b36" />
          <stop offset="100%" stopColor="#480c1b" />
        </radialGradient>
        <radialGradient id={inner} cx="40%" cy="28%" r="82%">
          <stop offset="0%" stopColor="#ec6f80" />
          <stop offset="58%" stopColor="#b02240" />
          <stop offset="100%" stopColor="#6b1026" />
        </radialGradient>
      </defs>

      {/* Laurel, tucked behind */}
      <g fill="#3a5c40">
        <path d="M15 45 C6 45 2 39 3 32 C11 32 17 38 17 45 Z" />
        <path d="M49 45 C58 45 62 39 61 32 C53 32 47 38 47 45 Z" />
      </g>

      {/* Outer ring */}
      <g fill={'url(#' + outer + ')'} stroke="#420d19" strokeOpacity="0.45" strokeWidth="1">
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d={petal} transform={'rotate(' + a + ' 32 32)'} />
        ))}
      </g>

      {/* Inner ring, offset and smaller */}
      <g
        fill={'url(#' + inner + ')'}
        stroke="#4a1020"
        strokeOpacity="0.4"
        strokeWidth="1.4"
        transform="rotate(36 32 32) translate(32 32) scale(0.6) translate(-32 -32)"
      >
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d={petal} transform={'rotate(' + a + ' 32 32)'} />
        ))}
      </g>

      {/* The curled heart of it */}
      <g fill="none" stroke="#f3aab4" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round">
        <path d="M32 25.5 C36.5 25.5 39 28.8 39 32.2 C39 36 36 38.5 32.3 38.5 C28.2 38.5 25.4 35.6 25.4 32" />
        <path d="M32 29 C34.3 29 35.6 30.7 35.6 32.4 C35.6 34.2 34.3 35.4 32.6 35.4" />
      </g>
    </svg>
  )
}

/** A button in ink, for the controls that sit on the sheet itself. */
function PaperButton({ children, accent, solid, danger, onClick }) {
  const tone = danger ? '#9c1b2c' : accent.ink
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'font-sans rounded-full border px-4 py-2.5 text-[9px] font-medium tracking-[0.22em] uppercase transition-opacity duration-300 outline-none hover:opacity-75 sm:py-1.5 ' +
        (solid ? 'text-[#faf6ec]' : '')
      }
      style={
        solid
          ? { backgroundColor: tone, borderColor: tone }
          : { color: tone, borderColor: tone, opacity: 0.85 }
      }
    >
      {children}
    </button>
  )
}

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

/**
 * A sealed letter that opens in place. The card morphs into the
 * envelope — motto on its face, rose on the point of the flap — the rose
 * comes loose, the flap folds back, and the sheet rises out of it: paper,
 * written in the card's own colour. Closing runs it all in reverse.
 */
export default function SealedLetter({ quote, onClose, onDelete, onUpdate }) {
  const accent = accentForQuote(quote)
  const reduceMotion = useReducedMotion()
  const [closing, setClosing] = useState(false)
  // The open is a ceremony the first time and a wait the tenth; clicking
  // the letter drops you straight to the end of it.
  const [skipped, setSkipped] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [draft, setDraft] = useState({
    text: quote.text,
    author: quote.author ?? '',
    language: quote.language,
  })
  const sheetRef = useRef(null)

  const beginClose = () => {
    if (closing) return
    if (reduceMotion) onClose()
    else setClosing(true)
  }

  // Once the sheet is back inside and the flap is down, let it go.
  useEffect(() => {
    if (!closing) return
    const t = setTimeout(onClose, CLOSE_MS)
    return () => clearTimeout(t)
  }, [closing, onClose])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') beginClose()
      if (e.key !== 'Tab') return

      // Keep Tab inside the letter while it is open.
      const focusable = sheetRef.current?.querySelectorAll(
        'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  })

  // Focus goes into the letter on open and back to whatever opened it on
  // close, so a keyboard is never left behind the dialog.
  useEffect(() => {
    const opener = document.activeElement
    sheetRef.current?.focus()
    return () => {
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus()
    }
  }, [])

  // Nothing folds or unseals for anyone who asked for less motion, or
  // for anyone who has clicked through — the sheet is simply there.
  const instant = reduceMotion || skipped
  const at = (beat) => (instant ? 0 : beat)
  const over = (seconds) => (instant ? 0.18 : seconds)
  const openDelay = at(BEAT.sheet)

  const saveEdit = () => {
    const text = draft.text.trim()
    const language = draft.language.trim()
    if (!text || !language) return
    onUpdate?.(quote.id, { text, author: draft.author.trim(), language })
    setEditing(false)
  }

  // Everything on the sheet arrives on its own beat, easing up out of a
  // blur. Closing takes it all away at once.
  const reveal = (beat, duration = 0.95) => ({
    initial: { opacity: 0, y: 12, filter: 'blur(7px)' },
    animate: closing
      ? { opacity: 0, transition: { duration: 0.2 } }
      : {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { delay: at(beat), duration: over(duration), ease: EASE_OUT },
        },
  })

  return createPortal(
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={
        closing ? { delay: 0.6, duration: 0.28, ease: 'easeIn' } : { duration: 0 }
      }
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-8"
    >
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        onClick={beginClose}
        className="absolute inset-0 bg-ink-950"
      />

      <motion.div
        layoutId={letterLayoutId(quote.id)}
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={'Verse' + (quote.author ? ' by ' + quote.author : '')}
        dir={isRTL(quote.language) ? 'rtl' : 'ltr'}
        initial={{ backgroundColor: accent.background, borderColor: accent.border }}
        animate={
          closing
            ? { backgroundColor: accent.background, borderColor: accent.border }
            : { backgroundColor: ENVELOPE, borderColor: accent.ink }
        }
        transition={{
          layout: { type: 'spring', stiffness: 190, damping: 28, mass: 1 },
          backgroundColor: closing
            ? { delay: 0.45, duration: 0.35 }
            : { delay: openDelay, duration: over(0.9) },
          borderColor: closing
            ? { delay: 0.45, duration: 0.35 }
            : { delay: openDelay, duration: over(0.9) },
        }}
        onClick={() => setSkipped(true)}
        style={{ perspective: 1500 }}
        className="relative w-full max-w-2xl rounded-[20px] border-[3px] p-3 shadow-[0_40px_90px_-28px_rgba(0,0,0,0.95)]"
      >
        {/* The flap, folding back off the top edge — and down again on close */}
        {!reduceMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-20 origin-top"
            style={{ height: '30%' }}
            initial={{ rotateX: 0 }}
            animate={{ rotateX: closing ? 0 : -170 }}
            transition={
              closing
                ? { delay: 0.34, duration: 0.48, ease: [0.4, 0, 0.25, 1] }
                : { delay: at(BEAT.flap), duration: over(1.25), ease: [0.22, 1, 0.3, 1] }
            }
          >
            <div
              className="h-full w-full"
              style={{
                background: 'linear-gradient(180deg, #efe6d2 0%, ' + ENVELOPE + ' 68%, #c9baa0 100%)',
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                // Matches the inside of the envelope's 20px radius, so the
                // flap tucks into the corner instead of squaring it off.
                borderRadius: '17px 17px 0 0',
                borderTop: '3px solid ' + ENVELOPE_EDGE,
                filter: 'drop-shadow(0 -12px 26px rgba(0,0,0,0.75))',
              }}
            />
          </motion.div>
        )}

        {/* The rose that holds the flap shut, sitting on its point */}
        {!instant && !closing && (
          <div className="pointer-events-none absolute top-[30%] left-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="h-14 w-14"
              initial={{ scale: 0.25, opacity: 0, rotate: -35 }}
              animate={{
                scale: [0.25, 1, 1, 1.2],
                opacity: [0, 1, 1, 0],
                rotate: [-35, 0, 0, 22],
                y: [0, 0, 0, 18],
              }}
              transition={{
                delay: at(BEAT.rose),
                duration: over(1.05),
                times: [0, 0.38, 0.7, 1],
                ease: 'easeOut',
              }}
            >
              <RoseSeal id={quote.id} />
            </motion.div>
          </div>
        )}

        {/* Inscribed on the face of the envelope, below the rose */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[30%] z-[15] px-8 pt-16 text-center sm:px-14"
          initial={{ opacity: 1 }}
          animate={{ opacity: closing ? 1 : 0 }}
          transition={
            closing
              ? { delay: 0.42, duration: 0.3 }
              : { delay: at(BEAT.sheet - 0.15), duration: over(0.5) }
          }
        >
          <p
            className="font-title text-[1.4rem] leading-none italic sm:text-[1.7rem]"
            style={{ color: accent.text }}
          >
            {LETTER_MOTTO}
          </p>
          <span
            className="mx-auto mt-4 block h-px w-20"
            style={{
              background: 'linear-gradient(90deg, transparent, ' + accent.text + ', transparent)',
              opacity: 0.5,
            }}
          />
          <p
            className="font-sans mt-4 text-[8px] font-medium tracking-[0.34em] uppercase opacity-60"
            style={{ color: accent.text }}
          >
            {quote.language}
          </p>
        </motion.div>

        <button
          type="button"
          onClick={beginClose}
          aria-label="Close"
          className="absolute -top-4 -right-4 z-40 grid h-10 w-10 place-items-center rounded-full border border-petal/60 bg-ink-950 text-champagne/85 shadow-[0_6px_18px_rgba(0,0,0,0.8)] transition-colors duration-300 hover:border-champagne hover:text-sheen"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* The sheet, rising out of the envelope and sliding back in */}
        <div className="relative z-10 overflow-hidden rounded-[13px]">
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { y: '22%', opacity: 0 }}
            animate={closing ? { y: '24%', opacity: 0 } : { y: 0, opacity: 1 }}
            transition={
              closing
                ? { delay: 0.06, duration: 0.34, ease: 'easeIn' }
                : { delay: openDelay, duration: over(1.15), ease: EASE_OUT }
            }
            className="paper-sheet relative px-7 py-10 sm:px-14 sm:py-12"
          >
            {/* The creases it was folded along */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-[rgba(120,98,64,0.13)]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-[rgba(120,98,64,0.1)]"
            />

            <div className="relative">
              {editing ? (
                <textarea
                  value={draft.text}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  rows={3}
                  aria-label="Verse"
                  className="font-display w-full resize-none rounded-[6px] border bg-[rgba(255,255,255,0.45)] px-3 py-2 text-[1.7rem] leading-[1.45] italic outline-none sm:text-[2.05rem] sm:leading-[1.4]"
                  style={{ color: accent.ink, borderColor: accent.inkSoft }}
                />
              ) : (
                <motion.blockquote
                  {...reveal(BEAT.quote, 1.35)}
                  className="font-display text-[1.7rem] leading-[1.45] italic sm:text-[2.05rem] sm:leading-[1.4]"
                  style={{ color: accent.ink }}
                >
                  {quote.text}
                </motion.blockquote>
              )}

              <motion.div
                {...reveal(BEAT.rule, 0.85)}
                className="mx-auto mt-9 h-px w-24"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, ' + accent.inkSoft + ', transparent)',
                }}
              />

              <footer className="mt-7 flex flex-wrap items-center justify-between gap-4">
                {editing ? (
                  <input
                    value={draft.author}
                    onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                    placeholder="Author — optional"
                    aria-label="Author"
                    className="font-sans min-w-0 flex-1 rounded-full border bg-[rgba(255,255,255,0.45)] px-3.5 py-1.5 text-[10px] tracking-[0.18em] uppercase outline-none"
                    style={{ color: accent.ink, borderColor: accent.inkSoft }}
                  />
                ) : (
                  <motion.cite
                    {...reveal(BEAT.author)}
                    className="font-sans text-[10px] tracking-[0.24em] uppercase not-italic"
                    style={{ color: accent.inkSoft }}
                  >
                    {quote.author ? '— ' + quote.author : '— Anonymous'}
                  </motion.cite>
                )}

                <div className="flex items-center gap-3">
                  {editing ? (
                    <input
                      value={draft.language}
                      onChange={(e) => setDraft({ ...draft, language: e.target.value })}
                      aria-label="Language"
                      className="font-sans w-32 rounded-full border bg-[rgba(255,255,255,0.45)] px-3.5 py-1.5 text-[9px] font-medium tracking-[0.24em] uppercase outline-none"
                      style={{ color: accent.ink, borderColor: accent.inkSoft }}
                    />
                  ) : (
                    <motion.span
                      {...reveal(BEAT.stamp)}
                      className="font-sans rounded-full border px-3.5 py-1.5 text-[9px] font-medium tracking-[0.24em] uppercase"
                      style={{ color: accent.ink, borderColor: accent.inkSoft }}
                    >
                      {quote.language}
                    </motion.span>
                  )}
                </div>
              </footer>

              {/* Amending and withdrawing an entry */}
              <motion.div
                {...reveal(BEAT.scene - 0.15, 0.8)}
                className="mt-7 flex flex-wrap items-center justify-end gap-2 border-t pt-4"
                style={{ borderColor: 'rgba(120,98,64,0.22)' }}
              >
                {editing ? (
                  <>
                    <PaperButton accent={accent} onClick={() => setEditing(false)}>
                      Cancel
                    </PaperButton>
                    <PaperButton accent={accent} solid onClick={saveEdit}>
                      Save
                    </PaperButton>
                  </>
                ) : confirmingDelete ? (
                  <>
                    <span
                      className="font-sans mr-auto text-[9px] tracking-[0.22em] uppercase"
                      style={{ color: accent.inkSoft }}
                    >
                      Withdraw this entry?
                    </span>
                    <PaperButton accent={accent} onClick={() => setConfirmingDelete(false)}>
                      Keep it
                    </PaperButton>
                    <PaperButton
                      accent={accent}
                      danger
                      onClick={() => {
                        onDelete?.(quote.id)
                        onClose()
                      }}
                    >
                      Delete
                    </PaperButton>
                  </>
                ) : (
                  <>
                    <PaperButton
                      accent={accent}
                      onClick={() => {
                        setDraft({
                          text: quote.text,
                          author: quote.author ?? '',
                          language: quote.language,
                        })
                        setEditing(true)
                      }}
                    >
                      Edit
                    </PaperButton>
                    <PaperButton accent={accent} onClick={() => setConfirmingDelete(true)}>
                      Delete
                    </PaperButton>
                  </>
                )}
              </motion.div>

              {/* One of ten little scenes, picked from the quote's own id,
                  drawn here in ink rather than gold */}
              <motion.div
                {...reveal(BEAT.scene, 1.15)}
                className="vg-paper"
                style={{ color: accent.inkSoft }}
              >
                <QuoteVignette seed={quote.id} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
