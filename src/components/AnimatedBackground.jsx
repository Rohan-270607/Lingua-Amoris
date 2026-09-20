import { useReducedMotion } from 'framer-motion'

/**
 * The room. Plum-black velvet lit by a single warm source above the
 * centre, a garnet pool low-left and a laurel whisper low-right, all
 * falling away into vignette. The lantern layer swells over fourteen
 * seconds — slow enough that it reads as light in a room rather than
 * as an animation on a page.
 */
export default function AnimatedBackground() {
  const reduceMotion = useReducedMotion()

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-velvet absolute inset-0" />
      <div className="velvet-nap absolute inset-0" />

      {/* The overhead source */}
      <div
        className={
          'absolute -top-[30%] left-1/2 h-[80vh] w-[140vw] -translate-x-1/2 rounded-[50%] blur-[100px] ' +
          (reduceMotion ? 'opacity-80' : 'lantern-glow')
        }
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(233,201,114,0.045) 0%, rgba(168,30,60,0.022) 44%, transparent 72%)',
        }}
      />

      <div className="grain" />
    </div>
  )
}
