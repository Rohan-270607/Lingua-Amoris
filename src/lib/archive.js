/**
 * Catalogue furniture for the archive view.
 *
 * The reference design shows folio references, provenance lines and
 * plate numbers. A quote only carries {id, text, author, language,
 * createdAt}, so everything here is derived from those — deterministic,
 * so a given quote always wears the same catalogue number.
 */

const ROMAN_PAIRS = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

export function roman(n) {
  let left = Math.max(0, Math.floor(n))
  let out = ''
  for (const [value, numeral] of ROMAN_PAIRS) {
    while (left >= value) {
      out += numeral
      left -= value
    }
  }
  return out || '—'
}

/** Two-letter language code, falling back to the first letters it has. */
export function languageCode(language) {
  const letters = (language || '').replace(/[^A-Za-z]/g, '')
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase()
  // Scripts with no Latin letters (日本語, فارسی) borrow the first glyph.
  const first = (language || '?').trim().slice(0, 2)
  return first.toUpperCase()
}

/** "IT / 018 / XI" — code, accession number, folio. */
export function folioRef(language, index) {
  const n = String(index + 1).padStart(3, '0')
  return languageCode(language) + ' / ' + n + ' / ' + roman(index + 1)
}

/** Up to two initials for the little author medallion. */
export function initials(name) {
  if (!name) return '·'
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '·'
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

const DAY_MS = 86400000

/**
 * When it was kept, said the way a person would. Everything added in one
 * sitting used to carry the identical date line, which read as noise
 * rather than provenance; recent entries are relative and only older
 * ones fall back to a date.
 */
export function provenance(createdAt, now = Date.now()) {
  if (!createdAt) return 'PROVENANCE UNRECORDED'
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return 'PROVENANCE UNRECORDED'

  const days = Math.floor((now - d.getTime()) / DAY_MS)
  if (days <= 0) return 'KEPT TODAY'
  if (days === 1) return 'KEPT YESTERDAY'
  if (days < 7) return 'KEPT ' + days + ' DAYS AGO'
  if (days < 14) return 'KEPT LAST WEEK'
  if (days < 60) return 'KEPT ' + Math.floor(days / 7) + ' WEEKS AGO'
  return 'KEPT ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
}
