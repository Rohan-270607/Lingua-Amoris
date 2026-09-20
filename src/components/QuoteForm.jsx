import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { LANGUAGES, isRTL } from '../lib/languages'

const EASE_OUT = [0.16, 1, 0.3, 1]
const OTHER = '__other__'

// The archive's own surfaces, so the form is plainly part of it.
const PLATE = '#181416'
const FIELD = '#120f11'
const EDGE = '#2b2327'

const fieldBase =
  'font-sans w-full rounded-[8px] border bg-[#120f11] px-4 py-2.5 text-[11px] tracking-[0.08em] text-blush ' +
  'outline-none transition-colors duration-300 placeholder:text-rosedust/30 ' +
  'hover:border-[#3a3035] focus:border-petal/50'

export default function QuoteForm({ onAdd }) {
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [language, setLanguage] = useState('English')
  const [customLanguage, setCustomLanguage] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  const textareaRef = useRef(null)
  const customRef = useRef(null)
  // Imperative, so a second failed submit shakes again instead of being
  // skipped as "already at this value".
  const shake = useAnimationControls()

  // Grow the textarea with its content instead of showing a scrollbar.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.max(el.scrollHeight, 88) + 'px'
  }, [text])

  useEffect(() => {
    if (language === OTHER) customRef.current?.focus()
  }, [language])

  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => setJustSaved(false), 1900)
    return () => clearTimeout(t)
  }, [justSaved])

  const resolvedLanguage = language === OTHER ? customLanguage.trim() : language

  const handleSubmit = (event) => {
    event.preventDefault()
    const quote = text.trim()

    if (!quote || !resolvedLanguage) {
      shake.start({
        x: [0, -9, 8, -6, 4, 0],
        transition: { duration: 0.42, ease: 'easeInOut' },
      })
      if (!quote) textareaRef.current?.focus()
      else customRef.current?.focus()
      return
    }

    onAdd({ text: quote, author: author.trim(), language: resolvedLanguage })

    setText('')
    setAuthor('')
    setCustomLanguage('')
    setJustSaved(true)
    textareaRef.current?.focus()
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: EASE_OUT }}
      className="mx-auto w-full max-w-2xl px-5 sm:px-8"
    >
      <motion.form
        onSubmit={handleSubmit}
        animate={shake}
        style={{ backgroundColor: PLATE, borderColor: EDGE }}
        className="rounded-[12px] border p-5 transition-colors duration-500 focus-within:border-[#473a3f] sm:p-7"
      >
        <label htmlFor="quote-text" className="sr-only">
          Verse
        </label>
        <textarea
          id="quote-text"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e)
          }}
          rows={2}
          dir={isRTL(resolvedLanguage) ? 'rtl' : 'ltr'}
          placeholder="Write something worth keeping..."
          className="font-display w-full resize-none bg-transparent text-[1.25rem] leading-[1.5] text-blush italic outline-none placeholder:text-rosedust/30 placeholder:not-italic sm:text-[1.4rem]"
        />

        <div
          className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center"
          style={{ borderColor: EDGE }}
        >
          <div className="flex-1">
            <label htmlFor="quote-author" className="sr-only">
              Author
            </label>
            <input
              id="quote-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author — optional"
              className={fieldBase}
              style={{ borderColor: EDGE, backgroundColor: FIELD }}
            />
          </div>

          <div className="flex-1">
            <label htmlFor="quote-language" className="sr-only">
              Language
            </label>
            <div className="relative">
              <select
                id="quote-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={fieldBase + ' cursor-pointer appearance-none pr-10'}
                style={{ borderColor: EDGE, backgroundColor: FIELD }}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
                <option value={OTHER}>Other…</option>
              </select>
              <svg
                viewBox="0 0 12 8"
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-4 w-2.5 -translate-y-1/2 text-rosedust/45"
              >
                <path
                  d="M1 1.5 6 6.5 11 1.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {language === OTHER && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.34, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <label htmlFor="quote-language-custom" className="sr-only">
                Custom language
              </label>
              <input
                id="quote-language-custom"
                ref={customRef}
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                placeholder="Name the language..."
                className={fieldBase}
                style={{ borderColor: EDGE, backgroundColor: FIELD }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between gap-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={justSaved ? 'saved' : 'hint'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className={
                'font-sans text-[7.5px] font-medium tracking-[0.24em] uppercase ' +
                (justSaved ? 'text-champagne' : 'text-rosedust/35')
              }
            >
              {justSaved ? 'Kept' : 'Ctrl + Enter to save'}
            </motion.span>
          </AnimatePresence>

          <motion.button
            type="submit"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="font-sans shrink-0 rounded-full border border-crimson/60 bg-crimson px-6 py-2.5 text-[7.5px] font-semibold tracking-[0.22em] text-ivory uppercase shadow-[0_6px_18px_-8px_rgba(168,30,60,0.9)] transition-colors duration-300 hover:bg-[#bd2544]"
          >
            Keep it
          </motion.button>
        </div>
      </motion.form>
    </motion.section>
  )
}
