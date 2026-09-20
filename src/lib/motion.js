// Shared motion vocabulary. Every transition in the site pulls from here so
// the whole thing moves with one personality instead of five.

/** Decelerating ease — the default for anything entering. */
export const EASE_OUT = [0.16, 1, 0.3, 1]

/** Symmetric ease for loops and reversible states. */
export const EASE_SOFT = [0.4, 0, 0.2, 1]

/** Springs, from snappiest to loosest. */
export const SPRING_SNAP = { type: 'spring', stiffness: 420, damping: 26 }
export const SPRING = { type: 'spring', stiffness: 380, damping: 32, mass: 0.7 }
export const SPRING_SOFT = { type: 'spring', stiffness: 260, damping: 28, mass: 0.85 }

/** Whole-page enter/exit, used by the route transition wrapper. */
export const pageVariants = {
  initial: { opacity: 0, y: 22, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: EASE_OUT, when: 'beforeChildren' },
  },
  exit: {
    opacity: 0,
    y: -14,
    filter: 'blur(8px)',
    transition: { duration: 0.3, ease: 'easeIn' },
  },
}

/** Parent/child pair for staggered lists and stacked sections. */
export const staggerParent = (stagger = 0.08, delayChildren = 0.05) => ({
  animate: { transition: { staggerChildren: stagger, delayChildren } },
})

export const staggerChild = {
  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE_OUT },
  },
}

/** Standard viewport config for scroll-triggered reveals. */
export const inView = { once: true, margin: '-70px 0px -70px 0px' }
