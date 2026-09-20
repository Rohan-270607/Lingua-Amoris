/**
 * The small gilt ornaments: four-point glints, a lit diamond, and the
 * hairline rules that separate one thought from the next.
 */

const STAR_PATH = 'M12 0L13.8 9L24 12L13.8 15L12 24L10.2 15L0 12L10.2 9z'

/** A four-point specular glint. `delayed` offsets it so pairs don't sync. */
export function Sparkle({ className = '', delayed = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={
        'pointer-events-none text-sheen ' +
        (delayed ? 'jewel-sparkle-delayed ' : 'jewel-sparkle ') +
        className
      }
    >
      <path d={STAR_PATH} />
    </svg>
  )
}

/** A lit diamond, small enough to punctuate a line of small caps. */
export function Pip({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={
        'inline-block h-1 w-1 rotate-45 bg-petal/70 shadow-[0_0_5px_rgba(233,201,114,0.5)] ' + className
      }
    />
  )
}

/**
 * A gilt hairline with a lit diamond at its centre — the separator the
 * whole site is ruled with.
 */
export function Rule({ className = '', width = 'w-32' }) {
  return (
    <div
      aria-hidden="true"
      className={'relative flex h-2 items-center justify-center ' + width + ' ' + className}
    >
      <span className="gild-rule h-px w-full" />
      <span className="absolute h-[5px] w-[5px] rotate-45 bg-sheen shadow-[0_0_9px_rgba(255,246,218,0.95)]" />
    </div>
  )
}
