import { useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuotes } from '../../store/QuotesContext'
import AnimatedBackground from '../AnimatedBackground'
import NavBar from './NavBar'
import RouteProgress from './RouteProgress'
import PageTransition from './PageTransition'

function CodexGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.6 1.6 0 0 0-1.6-1.6H4z" strokeLinejoin="round" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.6 1.6 0 0 1 1.6-1.6H20z" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The persistent shell: a title strip, then the archive panel held
 * between two perforated margins. Background and register sit outside
 * the AnimatePresence boundary so they never remount between routes —
 * only the page inside the panel animates.
 *
 * `useOutlet()` (rather than <Outlet />) is what makes the exit animation
 * work: it captures the matched element at render time, so the outgoing
 * page keeps rendering its own content while it leaves instead of
 * instantly swapping to the incoming route.
 */
export default function RootLayout() {
  const location = useLocation()
  const outlet = useOutlet()

  // Every page opens at its masthead, not at the previous page's offset.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      <AnimatedBackground />
      <RouteProgress />

      <div className="relative flex min-h-dvh flex-col">
        {/* Title strip */}
        <div className="relative flex h-9 shrink-0 items-center border-b border-[#1a1618] px-4">
          <CodexGlyph className="h-3.5 w-3.5 text-rosedust/50" />
          <span className="font-sans absolute inset-x-0 text-center text-[8px] font-medium tracking-[0.2em] text-rosedust/55 sm:text-[9px]">
            Lingua Amoris &mdash; Curated Archive Collection
          </span>
        </div>

        {/* The panel, between two perforated margins */}
        <div className="relative mx-auto w-full max-w-[1160px] flex-1 px-7 py-5 sm:px-10">
          <Perforation className="left-2 sm:left-3" />
          <Perforation className="right-2 sm:right-3" />

          <div className="overflow-hidden rounded-[14px] border border-[#241d21] bg-[#131011]">
            <NavBar />

            <div className="relative">
              <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>{outlet}</PageTransition>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <WriteFailureNotice />
    </>
  )
}

/**
 * A failed write already rolls itself back; this is the part that says
 * so, rather than leaving a verse to vanish without explanation.
 */
function WriteFailureNotice() {
  const { writeError, dismissWriteError } = useQuotes()

  useEffect(() => {
    if (!writeError) return
    const t = setTimeout(dismissWriteError, 7000)
    return () => clearTimeout(t)
  }, [writeError, dismissWriteError])

  return (
    <AnimatePresence>
      {writeError && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="font-sans fixed inset-x-0 bottom-8 z-[120] mx-auto flex w-fit max-w-[92vw] items-center gap-4 rounded-full border border-crimson/50 bg-[#1d1218] px-5 py-3 text-[8.5px] font-medium tracking-[0.18em] text-blush uppercase shadow-[0_18px_44px_-18px_rgba(0,0,0,0.95)]"
        >
          <span>{writeError}</span>
          <button
            type="button"
            onClick={dismissWriteError}
            className="shrink-0 text-rosedust/50 transition-colors duration-300 hover:text-champagne"
            aria-label="Dismiss"
          >
            &#10005;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** A column of binder perforations down one margin of the page. */
function Perforation({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={'pointer-events-none absolute inset-y-6 w-1.5 ' + className}
      style={{
        backgroundImage: 'radial-gradient(circle, #33292d 1.6px, transparent 1.7px)',
        backgroundSize: '6px 26px',
        backgroundRepeat: 'repeat-y',
      }}
    />
  )
}
