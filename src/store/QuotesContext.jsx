import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const STORAGE_KEY = 'lingua-amoris.quotes.v1'

// Shown only on a first visit to the *local* (unshared) mode, so a fresh
// browser never opens empty. All five are public domain; delete them and
// they stay gone. Shared (Supabase) mode never auto-seeds — an empty shared
// board just shows the real empty state until someone adds the first quote.
const SEED_BASE = Date.UTC(2024, 0, 1)
const SEED_QUOTES = [
  {
    id: 'seed-bronte',
    text: 'Whatever our souls are made of, his and mine are the same.',
    author: 'Emily Brontë',
    language: 'English',
    createdAt: SEED_BASE + 5000,
  },
  {
    id: 'seed-gerard',
    text: "Je t'aime plus qu'hier, moins que demain.",
    author: 'Rosemonde Gérard',
    language: 'French',
    createdAt: SEED_BASE + 4000,
  },
  {
    id: 'seed-dante',
    text: "L'amor che move il sole e l'altre stelle.",
    author: 'Dante Alighieri',
    language: 'Italian',
    createdAt: SEED_BASE + 3000,
  },
  {
    id: 'seed-ghalib',
    text: 'इश्क़ ने ग़ालिब निकम्मा कर दिया, वरना हम भी आदमी थे काम के।',
    author: 'Mirza Ghalib',
    language: 'Hindi',
    createdAt: SEED_BASE + 2000,
  },
  {
    id: 'seed-becquer',
    text: '¿Qué es poesía? Poesía... eres tú.',
    author: 'Gustavo Adolfo Bécquer',
    language: 'Spanish',
    createdAt: SEED_BASE + 1000,
  },
]

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'q-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)

const rowToQuote = (row) => ({
  id: row.id,
  text: row.text,
  author: row.author ?? '',
  language: row.language,
  createdAt: new Date(row.created_at).getTime(),
})

const QuotesContext = createContext(null)

/**
 * The collection, from whichever store is active. `isSupabaseConfigured` is
 * a build-time constant (baked in from `.env` by Vite), never a runtime
 * toggle — but rather than branch which *hooks* get called, every hook here
 * runs unconditionally on every render, and only the plain-JS logic inside
 * them (writes, the fetch/subscribe effect, which array wins) branches on
 * it. That keeps hook call order identical regardless of mode.
 *
 * Local mode: everything lives in this browser's `localStorage` — the
 * original, no-backend behavior.
 *
 * Shared mode: the collection lives in a Supabase Postgres table and syncs
 * live to every open tab, anywhere, via Realtime. Writes are optimistic —
 * the UI updates immediately, and an add rolls back if the server rejects
 * it. A delete never rolls back: a quote popping back in after it already
 * visibly vanished would be more jarring than an occasional failed delete
 * that a reload would reconcile anyway.
 */
function useQuotesStore() {
  const [localRaw, setLocalRaw] = useLocalStorage(STORAGE_KEY, SEED_QUOTES)
  const [sharedQuotes, setSharedQuotes] = useState([])
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false

    supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Failed to load shared quotes:', error)
        else setSharedQuotes(data.map(rowToQuote))
        setLoading(false)
      })

    const channel = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quotes' },
        ({ new: row }) => {
          setSharedQuotes((prev) =>
            prev.some((q) => q.id === row.id) ? prev : [rowToQuote(row), ...prev],
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'quotes' },
        ({ old: row }) => {
          setSharedQuotes((prev) => prev.filter((q) => q.id !== row.id))
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  const [writeError, setWriteError] = useState(null)

  const addQuote = useCallback(
    (draft) => {
      const quote = { ...draft, id: newId(), createdAt: Date.now() }

      if (!isSupabaseConfigured) {
        setLocalRaw((prev) => [quote, ...prev])
        return quote
      }

      setSharedQuotes((prev) => [quote, ...prev])
      supabase
        .from('quotes')
        .insert({ id: quote.id, text: quote.text, author: quote.author, language: quote.language })
        .then(({ error }) => {
          if (error) {
            console.error('Failed to save quote:', error)
            setSharedQuotes((prev) => prev.filter((q) => q.id !== quote.id))
            setWriteError('That verse could not be saved — it is not kept.')
          }
        })
      return quote
    },
    [setLocalRaw],
  )

  const deleteQuote = useCallback(
    (id) => {
      if (!isSupabaseConfigured) {
        setLocalRaw((prev) => prev.filter((q) => q.id !== id))
        return
      }

      setSharedQuotes((prev) => prev.filter((q) => q.id !== id))
      supabase
        .from('quotes')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to delete quote:', error)
            setWriteError('That verse could not be deleted — reload to see it again.')
          }
        })
    },
    [setLocalRaw],
  )

  const updateQuote = useCallback(
    (id, patch) => {
      const fields = {
        text: patch.text,
        author: patch.author,
        language: patch.language,
      }

      if (!isSupabaseConfigured) {
        setLocalRaw((prev) => prev.map((q) => (q.id === id ? { ...q, ...fields } : q)))
        return
      }

      // Optimistic, with the previous values kept so a failed write can
      // be put back the way it was.
      let previous = null
      setSharedQuotes((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q
          previous = q
          return { ...q, ...fields }
        }),
      )

      supabase
        .from('quotes')
        .update(fields)
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to update quote:', error)
            if (previous) setSharedQuotes((prev) => prev.map((q) => (q.id === id ? previous : q)))
            setWriteError('That change could not be saved — it has been put back.')
          }
        })
    },
    [setLocalRaw],
  )

  return {
    quotes: isSupabaseConfigured ? sharedQuotes : localRaw,
    loading: isSupabaseConfigured && loading,
    addQuote,
    deleteQuote,
    updateQuote,
    writeError,
    dismissWriteError: useCallback(() => setWriteError(null), []),
  }
}

/**
 * One source of truth for the collection, shared across every route so
 * navigating between pages never reloads or re-sorts anything.
 */
export function QuotesProvider({ children }) {
  const {
    quotes: rawQuotes,
    loading,
    addQuote,
    deleteQuote,
    updateQuote,
    writeError,
    dismissWriteError,
  } = useQuotesStore()

  // Newest first, always — regardless of how the list arrived.
  const quotes = useMemo(
    () => [...rawQuotes].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [rawQuotes],
  )

  const languages = useMemo(() => {
    const counts = new Map()
    for (const quote of quotes) {
      counts.set(quote.language, (counts.get(quote.language) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [quotes])

  const value = useMemo(
    () => ({
      quotes,
      languages,
      total: quotes.length,
      loading,
      isShared: isSupabaseConfigured,
      addQuote,
      deleteQuote,
      updateQuote,
      writeError,
      dismissWriteError,
    }),
    [quotes, languages, loading, addQuote, deleteQuote, updateQuote, writeError, dismissWriteError],
  )

  return <QuotesContext.Provider value={value}>{children}</QuotesContext.Provider>
}

export function useQuotes() {
  const context = useContext(QuotesContext)
  if (!context) throw new Error('useQuotes must be used inside <QuotesProvider>')
  return context
}
