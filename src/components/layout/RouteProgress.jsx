import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT } from '../../lib/motion'

/**
 * A hairline that sweeps across the top of the viewport on every navigation.
 * Purely a sense-of-motion cue — nothing here is actually loading.
 */
export default function RouteProgress() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 640)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={pathname}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            scaleX: { duration: 0.58, ease: EASE_OUT },
            opacity: { duration: 0.3 },
          }}
          className="gild-rule pointer-events-none fixed inset-x-0 top-0 z-60 h-[2px] origin-left shadow-[0_0_16px_rgba(233,201,114,0.55)]"
        />
      )}
    </AnimatePresence>
  )
}
