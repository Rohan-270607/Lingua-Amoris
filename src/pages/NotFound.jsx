import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import { Rule } from '../components/ui/Ornaments'
import { EASE_OUT, staggerChild, staggerParent } from '../lib/motion'

export default function NotFound() {
  return (
    <motion.section
      variants={staggerParent(0.12)}
      initial="initial"
      animate="animate"
      className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center"
    >
      <motion.p
        variants={staggerChild}
        className="font-sans mb-8 text-[9.5px] font-medium tracking-[0.46em] text-champagne/60 uppercase"
      >
        Nothing here
      </motion.p>

      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-12 -inset-y-8 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(233,201,114,0.14) 0%, rgba(168,30,60,0.07) 48%, transparent 72%)',
          }}
        />
        <motion.p
          variants={staggerChild}
          className="gild-text font-title relative text-[clamp(5rem,20vw,10rem)] leading-none font-medium italic"
        >
          404
        </motion.p>
      </div>

      <motion.div variants={staggerChild} className="mt-6 flex justify-center">
        <Rule width="w-36" />
      </motion.div>

      <motion.h1
        variants={staggerChild}
        className="font-title mt-8 text-3xl leading-tight text-ivory italic sm:text-4xl"
      >
        This page was never written.
      </motion.h1>

      <motion.p
        variants={staggerChild}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className="font-display mt-5 max-w-sm text-base leading-relaxed text-rosedust/60 italic sm:text-lg"
      >
        Some things get lost in translation. This one got lost before it had
        a language at all.
      </motion.p>

      <motion.div variants={staggerChild} className="mt-11 flex flex-wrap justify-center gap-4">
        <Button to="/">Back to the beginning</Button>
        <Button to="/archive" variant="ghost">
          The archive
        </Button>
      </motion.div>
    </motion.section>
  )
}
