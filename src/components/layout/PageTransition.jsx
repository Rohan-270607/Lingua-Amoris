import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { pageVariants } from '../../lib/motion'

/**
 * Wraps whichever page is currently routed. AnimatePresence in RootLayout runs
 * this in `wait` mode, so the outgoing page finishes leaving before the next
 * one mounts — which is also why resetting scroll on mount doesn't make the
 * departing page jump.
 */
export default function PageTransition({ children }) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative"
    >
      {children}
    </motion.main>
  )
}
