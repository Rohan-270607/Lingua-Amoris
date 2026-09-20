// The dropdown list. "Other…" unlocks a free-text field, so the collection is
// never limited to what is hard-coded here.
export const LANGUAGES = [
  'English',
  'French',
  'Spanish',
  'Italian',
  'Portuguese',
  'German',
  'Dutch',
  'Hindi',
  'Urdu',
  'Bengali',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Marathi',
  'Punjabi',
  'Arabic',
  'Persian',
  'Turkish',
  'Greek',
  'Latin',
  'Russian',
  'Polish',
  'Swedish',
  'Japanese',
  'Korean',
  'Mandarin',
  'Vietnamese',
  'Thai',
  'Hebrew',
  'Irish',
  'Welsh',
  'Swahili',
]

const RTL = new Set(['Arabic', 'Urdu', 'Persian', 'Hebrew', 'Farsi', 'Pashto', 'Sindhi'])

export const isRTL = (language) => RTL.has((language || '').trim())

/**
 * Deterministic accent per language, so "French" is always the same shade
 * wherever it appears. Solid, fully opaque chips — a deep matte fill behind
 * light text, never tinted glass. Hues run a 345 to 125 degree arc (through
 * zero): rose red, through amber and rustic gold, to leaf green — the
 * colors of the flower itself, so nothing strays outside the palette.
 */
// The house jewels: ruby, burnt orange, gold, yellow. All warm — no
// green, no cool tones — so the page reads as a tray of gold and garnet.
// `dl` lifts the light-on-dark roles so gold and yellow read as leaf
// rather than olive; the paper ink is left alone so it stays legible.
const JEWELS = [
  { h: 348, dl: 0 }, // ruby
  { h: 20, dl: 0 }, // burnt orange
  { h: 40, dl: 2 }, // gold
  { h: 52, dl: 5 }, // yellow
]

function accentAt({ h, dl }) {
  return {
    text: `hsl(${h} 88% ${80 + dl}%)`,
    lift: `hsl(${h} 48% 16%)`,
    tint: `hsl(${h} 58% ${24 + dl}%)`,
    background: `hsl(${h} 42% 9%)`,
    border: `hsl(${h} 62% ${37 + dl}%)`,
    glow: `hsl(${h} 72% 50% / 0.35)`,
    // Cut and polished: a facet running across the stone, lit along its
    // top edge and shaded under the bottom, with a little of its own
    // colour thrown beneath it.
    face: `linear-gradient(145deg, hsl(${h} 66% ${35 + dl}%) 0%, hsl(${h} 58% ${24 + dl}%) 48%, hsl(${h} 54% ${15 + dl}%) 100%)`,
    sheen: `inset 0 1px 0 hsl(${h} 95% ${76 + dl}% / 0.55), inset 0 -1px 0 hsl(${h} 60% 6% / 0.6), 0 2px 8px hsl(${h} 75% 45% / 0.3)`,
    // For the opened letter: the same jewel, dark enough to read on paper.
    ink: `hsl(${h} 68% 29%)`,
    inkSoft: `hsl(${h} 36% 45%)`,
  }
}

function hashOf(seed) {
  // FNV-1a with an avalanche finalizer. The old `hash * 31` mix left
  // near-identical inputs — UUIDs share most of their shape — landing in
  // the same bucket, which is how a "random" colour ended up looking
  // like one colour. The finalizer spreads single-character differences
  // across the whole word.
  const key = String(seed ?? 'unknown')
  let h = 2166136261 >>> 0
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  h ^= h >>> 16
  h = Math.imul(h, 2246822507) >>> 0
  h ^= h >>> 13
  h = Math.imul(h, 3266489909) >>> 0
  h ^= h >>> 16
  return h >>> 0
}

/** The language's own jewel — for anywhere colour should group by tongue. */
export function accentFor(language) {
  return accentAt(JEWELS[hashOf(language || 'Unknown') % JEWELS.length])
}

/**
 * A jewel of this line's own, stable to its id. Used where there is no
 * position to rotate through, such as a card shown on its own.
 */
export function accentForQuote(quote) {
  return accentAt(JEWELS[hashOf(quote?.id || quote?.language) % JEWELS.length])
}
