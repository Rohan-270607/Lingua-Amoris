import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TOP_NAV_LINKS } from '../../lib/nav'
import { EASE_OUT } from '../../lib/motion'

function DiamondIcon(props) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6 0.5 11.5 6 6 11.5 0.5 6z" />
    </svg>
  )
}

/**
 * The archive's register: the imprint on the left, the index, the one
 * crimson action, and the curator's medallion — over a hairline rule.
 */
export default function NavBar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
      className="relative border-b border-[#241d21]"
    >
      <nav className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        {/* Imprint */}
        <Link to="/" className="group -my-2 min-w-0 shrink py-2" aria-label="Lingua Amoris — home">
          <span className="font-title block truncate text-[1rem] leading-none text-champagne italic transition-colors duration-300 group-hover:text-sheen sm:text-[1.15rem]">
            Lingua Amoris
          </span>
          <span className="font-sans mt-1.5 hidden truncate text-[6px] font-medium tracking-[0.3em] text-rosedust/35 uppercase sm:block sm:text-[6.5px]">
            Archivum Privatum &middot; Curated
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
          {/* Index */}
          <ul className="hidden items-center gap-1 sm:flex">
            {TOP_NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className="group relative block px-2.5 py-2 font-sans text-[7.5px] font-medium tracking-[0.26em] uppercase outline-none focus-visible:ring-1 focus-visible:ring-champagne"
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          'relative transition-colors duration-300 ' +
                          (isActive ? 'text-blush' : 'text-rosedust/45 group-hover:text-blush/80')
                        }
                      >
                        {link.label}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="nav-underline"
                          transition={{ duration: 0.4, ease: EASE_OUT }}
                          className="absolute inset-x-2 -bottom-0.5 h-[1.5px] bg-crimson"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* The one action */}
          <Link
            to="/add"
            className="font-sans flex items-center gap-1.5 rounded-full border border-crimson/60 bg-crimson px-3.5 py-2.5 text-[7px] font-semibold tracking-[0.22em] whitespace-nowrap text-ivory uppercase shadow-[0_6px_18px_-8px_rgba(168,30,60,0.9)] transition-colors duration-300 hover:bg-[#bd2544] sm:px-4 sm:text-[7.5px]"
          >
            <DiamondIcon className="h-2 w-2" />
            Add a Verse
          </Link>

          {/* Curator's medallion */}
          <span
            aria-hidden="true"
            className="font-sans grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#3a2a30] bg-[#241a1e] text-[7.5px] font-semibold text-rosedust/70"
          >
            LA
          </span>
        </div>
      </nav>
    </motion.header>
  )
}
