import { motion } from 'framer-motion'
import { hashString } from '../lib/random'

/**
 * Ten small line-art scenes that sit at the foot of an opened quote. Which
 * one a quote gets is derived from its id, so a given quote always opens
 * with the same little scene — a quiet signature rather than a reshuffle.
 *
 * The motion is CSS (see the `vg-` keyframes in index.css), not Framer:
 * Framer maps x/y onto SVG attributes, which `circle` and `g` don't have,
 * so translation silently froze. CSS also keeps these looping smoothly
 * regardless of React re-renders, and honours reduced-motion in one rule.
 */

const STROKE = {
  fill: 'none',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

/** `vg` sets transform-box so SVG transform origins resolve correctly. */
const anim = (name, duration, delay = 0, ease = 'ease-in-out') => ({
  className: 'vg',
  style: { animation: `${name} ${duration}s ${ease} ${delay}s infinite` },
})

function Moonrise() {
  const stars = [
    { x: 42, y: 20, d: 0 },
    { x: 168, y: 16, d: 0.8 },
    { x: 148, y: 40, d: 1.6 },
    { x: 62, y: 44, d: 2.2 },
  ]
  return (
    <>
      <path d="M118 14a20 20 0 1 0 0 38 24 24 0 0 1 0-38Z" className="stroke-champagne" {...STROKE} />
      {stars.map((s) => {
        const a = anim('vg-twinkle', 3.2, s.d)
        return (
          <path
            key={`${s.x}-${s.y}`}
            d={`M${s.x} ${s.y - 4}v8M${s.x - 4} ${s.y}h8`}
            className={`stroke-crimson ${a.className}`}
            style={a.style}
            {...STROKE}
            strokeWidth={1.1}
          />
        )
      })}
    </>
  )
}

function PaperPlane() {
  const a = anim('vg-fly', 5.5, 0)
  return (
    <>
      <path
        d="M14 54C46 54 58 22 96 22s52 28 86 16"
        className="stroke-rosedust"
        {...STROKE}
        strokeDasharray="3 6"
      />
      <g className={`stroke-crimson ${a.className}`} style={a.style}>
        <path d="M30 46l22-8-22-8 4 8-4 8Z" {...STROKE} />
        <path d="M34 38h18" {...STROKE} strokeWidth={1} />
      </g>
    </>
  )
}

function BirdsOnAWire() {
  const birds = [
    { x: 78, d: 0 },
    { x: 132, d: 0.6 },
  ]
  return (
    <>
      <path d="M8 34C60 46 160 46 212 34" className="stroke-rosedust" {...STROKE} />
      {birds.map((b) => {
        const a = anim('vg-bob', 2.6, b.d)
        return (
          <g key={b.x} className={`stroke-crimson ${a.className}`} style={a.style}>
            <circle cx={b.x} cy={33} r={4.5} {...STROKE} />
            <path d={`M${b.x + 4} 31l6-3`} {...STROKE} strokeWidth={1.1} />
            <path d={`M${b.x - 2} 37v4M${b.x + 2} 37v4`} {...STROKE} strokeWidth={1.1} />
          </g>
        )
      })}
    </>
  )
}

function Horizon() {
  const sun = anim('vg-sunrise', 6, 0)
  const water = anim('vg-ripple', 5, 0)
  return (
    <>
      <circle
        cx={110}
        cy={38}
        r={15}
        className={`stroke-crimson ${sun.className}`}
        style={sun.style}
        {...STROKE}
      />
      <path d="M20 46h180" className="stroke-champagne" {...STROKE} />
      <g className={`stroke-wine-500 ${water.className}`} style={water.style}>
        <path d="M38 54h34M96 54h30M148 54h32" {...STROKE} strokeWidth={1.1} />
        <path d="M60 60h40M118 60h36" {...STROKE} strokeWidth={1.1} />
      </g>
    </>
  )
}

function SealedLetter() {
  const a = anim('vg-pulse', 2.4, 0)
  return (
    <>
      <path d="M72 26h76v32H72z" className="stroke-rosedust" {...STROKE} />
      <path d="M72 26l38 22 38-22" className="stroke-rosedust" {...STROKE} />
      <path
        d="M110 20c-3-5-11-4-11 2 0 5 7 8 11 12 4-4 11-7 11-12 0-6-8-7-11-2Z"
        className={`stroke-crimson fill-crimson/20 ${a.className}`}
        style={a.style}
        {...STROKE}
      />
    </>
  )
}

function Mountains() {
  const a = anim('vg-drift', 9, 0)
  return (
    <>
      <path d="M16 54l40-30 26 30" className="stroke-champagne" {...STROKE} />
      <path d="M68 54l44-34 48 34" className="stroke-wine-500" {...STROKE} />
      <path d="M16 54h188" className="stroke-rosedust" {...STROKE} />
      <path
        d="M140 20h22a7 7 0 0 0 0-12 10 10 0 0 0-18-2 6 6 0 0 0-4 14Z"
        className={`stroke-crimson ${a.className}`}
        style={a.style}
        {...STROKE}
        strokeWidth={1.1}
      />
    </>
  )
}

function Candle() {
  const a = anim('vg-flicker', 1.8, 0)
  return (
    <>
      <path d="M96 34h28v26H96z" className="stroke-rosedust" {...STROKE} />
      <path d="M88 60h44" className="stroke-rosedust" {...STROKE} />
      <path d="M110 34v-6" className="stroke-champagne" {...STROKE} strokeWidth={1.1} />
      <path
        d="M110 10c6 7 9 11 9 15a9 9 0 0 1-18 0c0-4 3-8 9-15Z"
        className={`stroke-crimson fill-crimson/15 ${a.className}`}
        style={a.style}
        {...STROKE}
      />
    </>
  )
}

function RainWindow() {
  const drops = [
    { x: 84, d: 0 },
    { x: 102, d: 0.7 },
    { x: 120, d: 1.3 },
    { x: 136, d: 0.35 },
  ]
  return (
    <>
      <rect x={72} y={12} width={76} height={48} rx={5} className="stroke-rosedust" {...STROKE} />
      <path d="M110 12v48M72 36h76" className="stroke-rosedust" {...STROKE} strokeWidth={1} />
      {drops.map((d) => {
        const a = anim('vg-fall', 2.6, d.d, 'ease-in')
        return (
          <circle
            key={d.x}
            cx={d.x}
            cy={18}
            r={1.8}
            className={`fill-wine-500 stroke-none ${a.className}`}
            style={a.style}
          />
        )
      })}
    </>
  )
}

function Bloom() {
  const petals = [0, 60, 120, 180, 240, 300]
  const a = anim('vg-sway', 4.5, 0)
  return (
    <>
      <path d="M110 60c0-14-6-20-6-20" className="stroke-wine-500" {...STROKE} />
      <path d="M104 48c-7-2-11-7-11-7s6-2 11 1" className="stroke-wine-500" {...STROKE} strokeWidth={1.1} />
      <g className={a.className} style={a.style}>
        {petals.map((angle) => (
          <ellipse
            key={angle}
            cx={110}
            cy={20}
            rx={4.5}
            ry={9}
            className="stroke-crimson"
            {...STROKE}
            strokeWidth={1.1}
            transform={`rotate(${angle} 110 29)`}
          />
        ))}
        <circle cx={110} cy={29} r={3.5} className="stroke-champagne" {...STROKE} />
      </g>
    </>
  )
}

function TwoCups() {
  const cups = [78, 130]
  return (
    <>
      {cups.map((x, i) => {
        const a = anim('vg-rise', 3.4, i * 0.9)
        return (
          <g key={x}>
            <path d={`M${x - 14} 38h28l-3 18h-22Z`} className="stroke-rosedust" {...STROKE} />
            <path d={`M${x + 14} 42c7 0 7 8 0 8`} className="stroke-rosedust" {...STROKE} strokeWidth={1.1} />
            <path
              d={`M${x - 4} 30c4-4-4-8 0-12M${x + 5} 30c4-4-4-8 0-12`}
              className={`stroke-crimson ${a.className}`}
              style={a.style}
              {...STROKE}
              strokeWidth={1.1}
            />
          </g>
        )
      })}
      <path d="M52 60h116" className="stroke-champagne" {...STROKE} strokeWidth={1.1} />
    </>
  )
}

const SCENES = [
  Moonrise,
  PaperPlane,
  BirdsOnAWire,
  Horizon,
  SealedLetter,
  Mountains,
  Candle,
  RainWindow,
  Bloom,
  TwoCups,
]

export default function QuoteVignette({ seed }) {
  const Scene = SCENES[hashString(String(seed)) % SCENES.length]

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.45, duration: 0.6 } }}
      className="mt-8 flex justify-center opacity-75"
    >
      <svg viewBox="0 0 220 70" className="h-[92px] w-[290px]">
        <Scene />
      </svg>
    </motion.div>
  )
}
