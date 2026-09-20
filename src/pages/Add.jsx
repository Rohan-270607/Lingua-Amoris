import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import QuoteForm from '../components/QuoteForm'
import QuoteCard from '../components/QuoteCard'
import { useQuotes } from '../store/QuotesContext'
import { EASE_OUT } from '../lib/motion'

export default function Add() {
  const { addQuote, deleteQuote } = useQuotes()
  const [justAdded, setJustAdded] = useState([])
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const handleAdd = (draft) => {
    const quote = addQuote(draft)
    setJustAdded((prev) => [quote, ...prev].slice(0, 3))
    setToast(quote.language)
  }

  // Keep the on-page preview honest if something is deleted from it.
  const handleDelete = (id) => {
    deleteQuote(id)
    setJustAdded((prev) => prev.filter((q) => q.id !== id))
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
        className="flex flex-col items-center px-4 pt-10 pb-8 text-center sm:pt-14"
      >
        <p className="font-sans text-[7.5px] font-medium tracking-[0.34em] text-rosedust/40 uppercase">
          One more for the shelf
        </p>
        <h1 className="font-display mt-5 max-w-lg text-[clamp(1.15rem,3vw,1.6rem)] leading-[1.45] text-blush italic">
          &laquo; Any language. The verse matters more than the spelling. &raquo;
        </h1>
        <span className="mt-6 flex items-center gap-2">
          <span className="h-px w-8 bg-petal/25" />
          <span className="h-[5px] w-[5px] rotate-45 bg-petal/70" />
          <span className="h-px w-8 bg-petal/25" />
        </span>
      </motion.section>

      <QuoteForm onAdd={handleAdd} />

      <AnimatePresence>
        {justAdded.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="mx-auto mt-14 w-full max-w-6xl px-5 sm:px-8"
          >
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <h2 className="font-sans text-[7.5px] font-medium tracking-[0.3em] text-rosedust/40 uppercase">
                Added this visit
              </h2>
              <Link
                to="/archive"
                className="group font-sans text-[7.5px] font-medium tracking-[0.24em] text-petal/60 uppercase transition-colors duration-300 hover:text-champagne"
              >
                See all
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {justAdded.map((quote) => (
                  <QuoteCard key={quote.id} quote={quote} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Save confirmation */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="font-sans fixed inset-x-0 bottom-8 z-50 mx-auto w-fit rounded-full border border-[#332a2e] bg-[#181416] px-5 py-2.5 text-[8px] font-medium tracking-[0.22em] text-rosedust/70 uppercase shadow-[0_18px_44px_-20px_rgba(0,0,0,0.95)]"
          >
            <span className="mr-3">Kept in {toast}</span>
            <Link
              to="/archive"
              className="text-champagne underline-offset-4 transition-colors hover:underline"
            >
              View
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
