import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SPRING_SNAP } from '../../lib/motion'

const MotionLink = motion.create(Link)

const base =
  'group/btn relative inline-flex shrink-0 items-center justify-center gap-2.5 overflow-hidden ' +
  'rounded-full px-8 py-3.5 font-sans text-[10.5px] font-semibold tracking-[0.28em] uppercase ' +
  'outline-none transition-[box-shadow,background-color,border-color,color,filter] duration-500 ease-out ' +
  'focus-visible:ring-2 focus-visible:ring-champagne/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950'

const variants = {
  /* Struck gold with dark ink on it. The only genuinely bright thing on
     the page, so it always reads as the primary act. */
  primary: base + ' gild-face text-[#2b1d06] hover:brightness-[1.08]',
  /* Garnet velvet, for the one ceremonial action. */
  rose:
    base +
    ' border border-petal/45 bg-gradient-to-br from-crimson to-rose-deep text-ivory ' +
    'shadow-[0_16px_38px_-16px_rgba(168,30,60,0.8)] hover:border-champagne/70',
  /* Quiet: a gilt outline on velvet. */
  ghost:
    base +
    ' border border-petal/40 bg-maroon-900 text-champagne ' +
    'hover:border-champagne/80 hover:bg-maroon-800 hover:text-sheen',
}

/**
 * One button for the whole site. Renders a router Link when given `to`,
 * otherwise a real <button>. Every variant catches a band of light
 * travelling across its face on hover.
 */
export default function Button({ children, to, variant = 'primary', className = '', ...rest }) {
  const motionProps = {
    whileHover: { y: -2 },
    whileTap: { scale: 0.98, y: 0 },
    transition: SPRING_SNAP,
    className: (variants[variant] ?? variants.primary) + (className ? ' ' + className : ''),
  }

  const content = (
    <>
      {/* Specular band, travelling left to right on hover */}
      <span
        aria-hidden="true"
        className={
          'pointer-events-none absolute inset-0 -translate-x-full skew-x-[-18deg] ' +
          'transition-transform duration-700 ease-out group-hover/btn:translate-x-full ' +
          (variant === 'primary'
            ? 'bg-gradient-to-r from-transparent via-white/55 to-transparent'
            : 'bg-gradient-to-r from-transparent via-champagne/22 to-transparent')
        }
      />
      <span className="relative flex items-center gap-2.5">{children}</span>
    </>
  )

  if (to) {
    return (
      <MotionLink to={to} {...motionProps} {...rest}>
        {content}
      </MotionLink>
    )
  }

  return (
    <motion.button {...motionProps} {...rest}>
      {content}
    </motion.button>
  )
}
