import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import AnimatedBackground from '../components/AnimatedBackground'
import { EASE_OUT } from '../lib/motion'

// How far a gesture has to travel before it counts as "open it".
const TOUCH_PX = 50
const DRAG_PX = 70
const WHEEL_PX = 90
// A trackpad sends wheel events in a burst; anything slower than this is a
// new gesture rather than a continuation of the last one.
const WHEEL_WINDOW_MS = 400
// Long enough for the cover to clear the screen before the route changes.
const LEAVE_MS = 620

function ChevronUp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The front door: the name, and nothing else. A swipe up — trackpad, touch,
 * a dragged mouse, an arrow key or the hint itself — lifts the cover away
 * and opens the archive beneath it.
 */
export default function Cover() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [leaving, setLeaving] = useState(false)

  const open = useCallback(() => setLeaving((already) => already || true), [])

  // The cover finishes lifting before the route swaps, so the archive is
  // never revealed mid-slide.
  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => navigate('/archive'), reduceMotion ? 0 : LEAVE_MS)
    return () => clearTimeout(t)
  }, [leaving, navigate, reduceMotion])

  useEffect(() => {
    if (leaving) return

    let touchStart = null
    let dragStart = null
    let wheelTravel = 0
    let wheelReset

    // Either direction counts. There is nothing to scroll here, so any
    // deliberate vertical gesture means "go in" — and trackpads disagree
    // about which way is up depending on the machine's scroll setting.
    const onWheel = (e) => {
      wheelTravel += Math.abs(e.deltaY)
      clearTimeout(wheelReset)
      wheelReset = setTimeout(() => {
        wheelTravel = 0
      }, WHEEL_WINDOW_MS)
      if (wheelTravel > WHEEL_PX) open()
    }

    const onTouchStart = (e) => {
      touchStart = e.touches[0].clientY
    }
    const onTouchEnd = (e) => {
      if (touchStart == null) return
      const dy = e.changedTouches[0].clientY - touchStart
      touchStart = null
      if (dy < -TOUCH_PX) open()
    }

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse') dragStart = e.clientY
    }
    const onPointerUp = (e) => {
      if (dragStart == null) return
      const dy = e.clientY - dragStart
      dragStart = null
      if (dy < -DRAG_PX) open()
    }

    const onKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageDown', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        open()
      }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('keydown', onKey)

    return () => {
      clearTimeout(wheelReset)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [leaving, open])

  return (
    <>
      <AnimatedBackground />

      <motion.div
        initial={false}
        animate={leaving ? { y: '-100%', opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.76, 0, 0.24, 1] }}
        className="fixed inset-0 z-50 flex touch-none flex-col items-center justify-center overflow-hidden px-6"
      >
        {/* The light the name sits in */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-[60vh] w-[130vw] -translate-x-1/2 -translate-y-1/2 blur-[90px]"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(233,201,114,0.13) 0%, rgba(168,30,60,0.06) 46%, transparent 72%)',
          }}
        />

        <motion.h1
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, letterSpacing: '0.3em', filter: 'blur(16px)', y: 18 }
          }
          animate={{ opacity: 1, letterSpacing: '-0.02em', filter: 'blur(0px)', y: 0 }}
          transition={{ duration: reduceMotion ? 0.4 : 2, ease: EASE_OUT }}
          className="gild-text font-title relative text-center text-[clamp(2.75rem,11vw,6.5rem)] leading-[0.95] font-medium italic select-none"
        >
          Lingua Amoris
        </motion.h1>

        {/* The way in */}
        <motion.button
          type="button"
          onClick={open}
          initial={{ opacity: 0 }}
          animate={{ opacity: leaving ? 0 : 1 }}
          transition={{ delay: reduceMotion ? 0 : 1.4, duration: 0.9 }}
          className="group font-sans absolute bottom-14 flex flex-col items-center gap-3 rounded-full px-6 py-3 text-rosedust/45 outline-none transition-colors duration-300 hover:text-champagne focus-visible:ring-1 focus-visible:ring-champagne"
        >
          <motion.span
            animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronUp className="h-4 w-4" />
          </motion.span>
          <span className="text-[7.5px] font-medium tracking-[0.34em] uppercase">
            Swipe up to open
          </span>
        </motion.button>
      </motion.div>
    </>
  )
}
