// Export and re-import of the whole collection as one JSON file. Kept free of
// React and the browser so it can be tested on its own.

export const EXPORT_FORMAT = 1

/** What gets written: every loaded verse and the bookmarked ids, with a stamp. */
export function buildExport(quotes, bookmarks, now = Date.now()) {
  return {
    app: 'lingua-amoris',
    format: EXPORT_FORMAT,
    exportedAt: new Date(now).toISOString(),
    quotes: quotes.map((q) => ({
      id: q.id,
      text: q.text,
      author: q.author ?? '',
      language: q.language,
      createdAt: q.createdAt,
    })),
    bookmarks: [...bookmarks],
  }
}

/**
 * Read a file produced by buildExport. Anything that is not exactly that shape
 * is rejected with a plain message, so a damaged file never half-imports.
 */
export function parseExport(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (!data || data.app !== 'lingua-amoris' || !Array.isArray(data.quotes)) {
    throw new Error('This is not a Lingua Amoris export.')
  }
  if (data.format !== EXPORT_FORMAT) {
    throw new Error('This export was made by a different version.')
  }
  const quotes = data.quotes.map((q, i) => {
    const ok =
      q &&
      typeof q.id === 'string' &&
      q.id !== '' &&
      typeof q.text === 'string' &&
      q.text !== '' &&
      typeof q.language === 'string' &&
      q.language !== '' &&
      typeof q.createdAt === 'number'
    if (!ok) throw new Error('Verse number ' + (i + 1) + ' in this file is damaged.')
    return {
      id: q.id,
      text: q.text,
      author: typeof q.author === 'string' ? q.author : '',
      language: q.language,
      createdAt: q.createdAt,
    }
  })
  const bookmarks = Array.isArray(data.bookmarks)
    ? data.bookmarks.filter((b) => typeof b === 'string')
    : []
  return { quotes, bookmarks }
}

/** Hand the browser a file to save. Not tested in jsdom beyond the call shape. */
export function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
