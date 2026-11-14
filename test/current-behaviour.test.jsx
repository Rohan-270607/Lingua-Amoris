// Pins down how the app behaves today, so later phases can change what is underneath
// without changing what people see. Fixtures are invented everyday phrases.
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

// Which store the app is in is a build-time constant in production. Here a mutable
// object stands in for it, so one file can test both modes. Neither mode ever sees
// the real Supabase project.
const mode = vi.hoisted(() => ({ shared: false, client: null }))
vi.mock('../src/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mode.shared
  },
  get supabase() {
    return mode.client
  },
}))

import { QuotesProvider, useQuotes } from '../src/store/QuotesContext'
import Archive from '../src/pages/Archive'
import { buildExport, parseExport } from '../src/lib/backup'

const KEY = 'lingua-amoris.quotes.v1'
const BOOKMARKS = 'lingua-amoris.bookmarks'

const FIXTURE = [
  { id: 'a1', text: 'Good morning, sunshine', author: 'Asha', language: 'English', createdAt: 3000 },
  { id: 'a2', text: 'Subah bakhair', author: '', language: 'hindi', createdAt: 2000 },
  { id: 'a3', text: 'Bonne nuit, mon ami', author: 'Luc', language: 'French', createdAt: 1000 },
]

const seedLocal = (quotes = FIXTURE) => {
  mode.shared = false
  mode.client = null
  window.localStorage.setItem(KEY, JSON.stringify(quotes))
}

/** Renders the real provider and hands back the latest context value. */
function mountStore() {
  const latest = { current: null }
  function Probe() {
    latest.current = useQuotes()
    return null
  }
  render(
    <QuotesProvider>
      <Probe />
    </QuotesProvider>,
  )
  return latest
}

function mountArchive() {
  render(
    <MemoryRouter>
      <QuotesProvider>
        <Archive />
      </QuotesProvider>
    </MemoryRouter>,
  )
}

const stored = () => JSON.parse(window.localStorage.getItem(KEY))

describe('local mode: the store', () => {
  it('is local in tests, never pointed at the live project', async () => {
    mode.shared = false
    const { isSupabaseConfigured } = await import('../src/lib/supabase')
    expect(isSupabaseConfigured).toBe(false)
    expect(import.meta.env.VITE_SUPABASE_URL).toBe('')
  })

  it('opens a first visit with five built-in verses', () => {
    mode.shared = false
    const store = mountStore()
    expect(store.current.quotes.map((q) => q.id).sort()).toEqual([
      'seed-becquer',
      'seed-bronte',
      'seed-dante',
      'seed-gerard',
      'seed-ghalib',
    ])
  })

  it('lists newest first and counts languages, merging spellings', () => {
    seedLocal([
      FIXTURE[2],
      FIXTURE[0],
      { ...FIXTURE[1], language: 'Hindi' },
      { ...FIXTURE[1], id: 'a4', language: 'hindi', createdAt: 500 },
    ])
    const store = mountStore()
    expect(store.current.quotes.map((q) => q.id)).toEqual(['a1', 'a2', 'a3', 'a4'])
    expect(store.current.languages).toEqual([
      { name: 'Hindi', count: 2 },
      { name: 'English', count: 1 },
      { name: 'French', count: 1 },
    ])
  })

  it('adds a verse at the top, with an id, a date and a canonical language', () => {
    seedLocal()
    const store = mountStore()
    let added
    act(() => {
      added = store.current.addQuote({ text: 'See you soon', author: 'Mo', language: 'hindi' })
    })
    expect(added.language).toBe('Hindi')
    expect(typeof added.id).toBe('string')
    expect(added.id.length).toBeGreaterThan(0)
    expect(typeof added.createdAt).toBe('number')
    expect(store.current.quotes[0].text).toBe('See you soon')
    expect(stored()[0].id).toBe(added.id)
    expect(stored()).toHaveLength(4)
  })

  it('edits only text, author and language', () => {
    seedLocal()
    const store = mountStore()
    act(() =>
      store.current.updateQuote('a1', { text: 'Good evening', author: 'Bea', language: 'english' }),
    )
    const edited = stored().find((q) => q.id === 'a1')
    expect(edited).toMatchObject({
      text: 'Good evening',
      author: 'Bea',
      language: 'English',
      createdAt: 3000,
    })
  })

  it('deletes by id and keeps the rest', () => {
    seedLocal()
    const store = mountStore()
    act(() => store.current.deleteQuote('a2'))
    expect(stored().map((q) => q.id)).toEqual(['a1', 'a3'])
  })

  it('keeps what was saved across a reload', () => {
    seedLocal()
    const first = mountStore()
    act(() => {
      first.current.addQuote({ text: 'Stay a while', author: '', language: 'English' })
    })
    const savedText = first.current.quotes[0].text
    document.body.innerHTML = ''
    const second = mountStore()
    expect(second.current.quotes[0].text).toBe(savedText)
  })
})

describe('shared mode: the store, with a mocked Supabase client', () => {
  /** A stand-in for the client that records writes and lets a test push live events. */
  function makeClient({ rows = [], loadError = null, writeEmpty = false } = {}) {
    const calls = []
    const handlers = {}
    const result = (data) => Promise.resolve({ data: writeEmpty ? [] : data, error: null })
    return {
      calls,
      handlers,
      from: () => ({
        select: () => ({
          order: () =>
            Promise.resolve(
              loadError ? { data: null, error: loadError } : { data: rows, error: null },
            ),
        }),
        insert: (row) => {
          calls.push(['insert', row])
          return { select: () => result([row]) }
        },
        update: (fields) => ({
          eq: (col, id) => {
            calls.push(['update', fields, col, id])
            return { select: () => result([{ id }]) }
          },
        }),
        delete: () => ({
          eq: (col, id) => {
            calls.push(['delete', col, id])
            return { select: () => result([{ id }]) }
          },
        }),
      }),
      channel() {
        const chan = {
          on(_type, filter, cb) {
            handlers[filter.event] = cb
            return chan
          },
          subscribe: () => chan,
        }
        return chan
      },
      removeChannel() {},
    }
  }

  const ROWS = [
    { id: 'r1', text: 'Good morning, sunshine', author: 'Asha', language: 'English', created_at: '2026-01-02T00:00:00Z' },
    { id: 'r2', text: 'Subah bakhair', author: '', language: 'hindi', created_at: '2026-01-03T00:00:00Z' },
  ]

  async function mountShared(options) {
    mode.shared = true
    mode.client = makeClient(options)
    const store = mountStore()
    await waitFor(() => expect(store.current.loading).toBe(false))
    return store
  }

  it('loads rows, maps created_at to milliseconds, newest first, and ignores the local seeds', async () => {
    const store = await mountShared({ rows: ROWS })
    expect(store.current.isShared).toBe(true)
    expect(store.current.quotes.map((q) => q.id)).toEqual(['r2', 'r1'])
    expect(store.current.quotes[0]).toMatchObject({
      language: 'Hindi',
      author: '',
      createdAt: Date.parse('2026-01-03T00:00:00Z'),
    })
    // Today the local hook still runs in shared mode and writes the five built-in seeds into
    // localStorage. They are never shown, and a later migration must not treat them as the
    // user's verses (see docs/current-state.md, bug 9).
    expect(JSON.parse(window.localStorage.getItem(KEY)).every((q) => q.id.startsWith('seed-'))).toBe(true)
  })

  it('says the archive cannot be reached instead of showing an empty one', async () => {
    const store = await mountShared({ loadError: new Error('521') })
    expect(store.current.loadError).toBe('521')
    expect(store.current.quotes).toEqual([])
  })

  it('sends only id, text, author and language on add, and shows the verse at once', async () => {
    const store = await mountShared({ rows: ROWS })
    let added
    act(() => {
      added = store.current.addQuote({ text: 'See you soon', author: 'Mo', language: 'english' })
    })
    expect(store.current.quotes[0].id).toBe(added.id)
    expect(mode.client.calls[0]).toEqual([
      'insert',
      { id: added.id, text: 'See you soon', author: 'Mo', language: 'English' },
    ])
  })

  it('rolls an add back and says so when no row is written', async () => {
    const store = await mountShared({ rows: ROWS, writeEmpty: true })
    act(() => {
      store.current.addQuote({ text: 'Will not stick', author: '', language: 'English' })
    })
    await waitFor(() => expect(store.current.writeError).toMatch(/not kept/))
    expect(store.current.quotes.map((q) => q.id)).toEqual(['r2', 'r1'])
  })

  it('sends only text, author and language on edit, and rolls back when nothing changed', async () => {
    const store = await mountShared({ rows: ROWS, writeEmpty: true })
    act(() =>
      store.current.updateQuote('r1', { text: 'Changed', author: 'Z', language: 'English' }),
    )
    expect(mode.client.calls[0]).toEqual([
      'update',
      { text: 'Changed', author: 'Z', language: 'English' },
      'id',
      'r1',
    ])
    await waitFor(() => expect(store.current.writeError).toMatch(/put back/))
    expect(store.current.quotes.find((q) => q.id === 'r1').text).toBe('Good morning, sunshine')
  })

  it('deletes by id, and does not bring a verse back when the delete fails', async () => {
    const store = await mountShared({ rows: ROWS, writeEmpty: true })
    act(() => store.current.deleteQuote('r1'))
    expect(mode.client.calls[0]).toEqual(['delete', 'id', 'r1'])
    await waitFor(() => expect(store.current.writeError).toMatch(/could not be deleted/))
    expect(store.current.quotes.map((q) => q.id)).toEqual(['r2'])
  })

  it('applies live inserts, updates and deletes from other people', async () => {
    const store = await mountShared({ rows: ROWS })
    const row = { id: 'r3', text: 'New one', author: '', language: 'French', created_at: '2026-02-01T00:00:00Z' }
    act(() => mode.client.handlers.INSERT({ new: row }))
    expect(store.current.quotes[0].id).toBe('r3')
    act(() => mode.client.handlers.UPDATE({ new: { ...row, text: 'New one, edited' } }))
    expect(store.current.quotes[0].text).toBe('New one, edited')
    act(() => mode.client.handlers.DELETE({ old: { id: 'r3' } }))
    expect(store.current.quotes.map((q) => q.id)).toEqual(['r2', 'r1'])
  })
})

describe('the archive page, in local mode', () => {
  it('shows the verses newest first, with language chips and counts', () => {
    seedLocal()
    mountArchive()
    const cards = screen.getAllByText(/Good morning|Subah|Bonne nuit/).map((el) => el.textContent)
    expect(cards[0]).toContain('Good morning, sunshine')
    expect(cards[1]).toContain('Subah bakhair')
    expect(cards[2]).toContain('Bonne nuit, mon ami')
    expect(screen.getByRole('button', { name: /^all \(3\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^hindi \(1\)/i })).toBeInTheDocument()
  })

  it('filters by language and by search', () => {
    seedLocal()
    mountArchive()
    fireEvent.click(screen.getByRole('button', { name: /^french/i }))
    expect(screen.queryByText(/Good morning/)).not.toBeInTheDocument()
    expect(screen.getByText(/Bonne nuit/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^all/i }))
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'asha' } })
    expect(screen.getByText(/Good morning/)).toBeInTheDocument()
    expect(screen.queryByText(/Bonne nuit/)).not.toBeInTheDocument()
  })

  it('opens a verse only from its arrow, and deletes it after a confirm', async () => {
    seedLocal()
    mountArchive()
    fireEvent.click(screen.getByText(/Good morning/)) // clicking the card does nothing
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /open the asha verse/i }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }))
    expect(within(dialog).getByText(/withdraw this entry/i)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(stored().map((q) => q.id)).toEqual(['a2', 'a3']))
    expect(screen.queryByText(/Good morning/)).not.toBeInTheDocument()
  })

  it('edits a verse from the letter', async () => {
    seedLocal()
    mountArchive()
    fireEvent.click(screen.getByRole('button', { name: /open the asha verse/i }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^edit$/i }))
    fireEvent.change(within(dialog).getByLabelText('Verse'), {
      target: { value: 'Good evening, moon' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(stored().find((q) => q.id === 'a1').text).toBe('Good evening, moon'))
  })

  it('keeps bookmarks per browser and filters by them', () => {
    seedLocal()
    mountArchive()
    fireEvent.click(screen.getAllByRole('button', { name: /bookmark this/i })[0])
    expect(JSON.parse(window.localStorage.getItem(BOOKMARKS))).toEqual(['a1'])
    fireEvent.click(screen.getByRole('button', { name: /kept \(1\)/i }))
    expect(screen.getByText(/Good morning/)).toBeInTheDocument()
    expect(screen.queryByText(/Bonne nuit/)).not.toBeInTheDocument()
  })
})

describe('export my verses', () => {
  it('round-trips: an exported file reads back as identical data', () => {
    const file = JSON.stringify(buildExport(FIXTURE, ['a1', 'gone'], 1700000000000))
    expect(parseExport(file)).toEqual({ quotes: FIXTURE, bookmarks: ['a1', 'gone'] })
  })

  it('rejects damaged files with a clear message', () => {
    expect(() => parseExport('{nope')).toThrow(/not valid JSON/)
    expect(() => parseExport('{"app":"other"}')).toThrow(/not a Lingua Amoris export/)
    const bad = buildExport(FIXTURE, [])
    bad.quotes[1].text = ''
    expect(() => parseExport(JSON.stringify(bad))).toThrow(/Verse number 2/)
  })

  it('the Archive control downloads every verse and the bookmarks', async () => {
    seedLocal()
    window.localStorage.setItem(BOOKMARKS, JSON.stringify(['a3']))
    let blob
    let filename
    URL.createObjectURL = vi.fn((b) => {
      blob = b
      return 'blob:test'
    })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      filename = this.download
    })

    mountArchive()
    fireEvent.click(screen.getByRole('button', { name: /export my verses/i }))

    const text = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsText(blob)
    })
    expect(filename).toMatch(/^lingua-amoris-.*\.json$/)
    // The store shows languages in their canonical spelling, so "hindi" exports as "Hindi".
    const expected = FIXTURE.map((q) => (q.id === 'a2' ? { ...q, language: 'Hindi' } : q))
    expect(parseExport(text)).toEqual({ quotes: expected, bookmarks: ['a3'] })
  })
})
