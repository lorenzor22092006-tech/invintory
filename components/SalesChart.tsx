'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { colors } from '@/lib/theme'
import type { Vendita } from '@/lib/types'

type Period = 'giorno' | 'mese' | 'anno'

/** Fixed series colors — validated for dark surface (dataviz palette check).
    Identity never changes with filters: Totale/Mie fixed, sellers by name order. */
const TOTAL_COLOR = '#16A34A'
const MINE_COLOR = '#3B82F6'
const SELLER_COLORS = ['#D97706', '#8B5CF6', '#DB2777']
const OTHER_COLOR = '#94A3B8'

interface SeriesDef {
  key: string
  label: string
  color: string
}

interface Bucket {
  label: string
  full: string
  counts: Record<string, number>
}

function parseDate(d: string): Date | null {
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
}

const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

/** Catmull-Rom → cubic bezier path for smooth lines.
    Control-point y clamped to the plot band so curves never overshoot the baseline. */
function smoothPath(pts: { x: number; y: number }[], yMin: number, yMax: number): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  const clamp = (y: number) => Math.min(Math.max(y, yMin), yMax)
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6)
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6)
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}

export default function SalesChart({ vendite, loading }: { vendite: Vendita[]; loading: boolean }) {
  const [period, setPeriod] = useState<Period>('mese')
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { series, buckets, totalInWindow, deltaPct } = useMemo(() => {
    const now = new Date()
    const dated = vendite
      .map((v) => ({ v, d: parseDate(v.dataVendita) }))
      .filter((x): x is { v: Vendita; d: Date } => x.d !== null)

    // Sellers present in data, fixed alphabetical order → fixed color per name
    const sellerNames = [...new Set(dated.map((x) => x.v.venditore).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'it')
    )
    const named = sellerNames.slice(0, SELLER_COLORS.length)
    const hasOther = sellerNames.length > named.length

    const series: SeriesDef[] = [
      { key: '__tot', label: 'Totale', color: TOTAL_COLOR },
      { key: '__mie', label: 'Mie', color: MINE_COLOR },
      ...named.map((name, i) => ({ key: name, label: name, color: SELLER_COLORS[i] })),
      ...(hasOther ? [{ key: '__other', label: 'Altri', color: OTHER_COLOR }] : []),
    ]

    const keyFor = (venditore: string): string => {
      if (!venditore) return '__mie'
      if (named.includes(venditore)) return venditore
      return '__other'
    }

    // Build time buckets for current + previous window
    const buckets: Bucket[] = []
    let windowStart: Date
    let prevStart: Date
    if (period === 'giorno') {
      windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
      prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59)
      for (let i = 0; i < 30; i++) {
        const d = new Date(windowStart.getFullYear(), windowStart.getMonth(), windowStart.getDate() + i)
        buckets.push({
          label: `${d.getDate()}`,
          full: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
          counts: {},
        })
      }
    } else if (period === 'mese') {
      windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      prevStart = new Date(now.getFullYear(), now.getMonth() - 23, 1)
      for (let i = 0; i < 12; i++) {
        const d = new Date(windowStart.getFullYear(), windowStart.getMonth() + i, 1)
        buckets.push({
          label: MONTHS[d.getMonth()],
          full: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
          counts: {},
        })
      }
    } else {
      const y0 = now.getFullYear() - 4
      windowStart = new Date(y0, 0, 1)
      prevStart = new Date(y0 - 5, 0, 1)
      for (let i = 0; i < 5; i++) {
        buckets.push({ label: `${y0 + i}`, full: `${y0 + i}`, counts: {} })
      }
    }

    const idxFor = (d: Date): number => {
      if (d < windowStart || d > now) return -1
      if (period === 'giorno') {
        return Math.floor((d.getTime() - windowStart.getTime()) / 86400000)
      }
      if (period === 'mese') {
        return (d.getFullYear() - windowStart.getFullYear()) * 12 + d.getMonth() - windowStart.getMonth()
      }
      return d.getFullYear() - windowStart.getFullYear()
    }

    let totalInWindow = 0
    let totalPrev = 0
    for (const { v, d } of dated) {
      const i = idxFor(d)
      if (i >= 0 && i < buckets.length) {
        const b = buckets[i]
        const k = keyFor(v.venditore)
        b.counts['__tot'] = (b.counts['__tot'] ?? 0) + 1
        b.counts[k] = (b.counts[k] ?? 0) + 1
        totalInWindow++
      } else if (d >= prevStart && d < windowStart) {
        totalPrev++
      }
    }

    const deltaPct = totalPrev > 0 ? ((totalInWindow - totalPrev) / totalPrev) * 100 : null
    return { series, buckets, totalInWindow, deltaPct }
  }, [vendite, period])

  const H = 220
  const padL = 30
  const padR = 12
  const padT = 12
  const padB = 24
  const plotW = Math.max(width - padL - padR, 50)
  const plotH = H - padT - padB

  const maxY = Math.max(1, ...buckets.map((b) => b.counts['__tot'] ?? 0))
  const yTicks = useMemo(() => {
    const step = Math.max(1, Math.ceil(maxY / 3))
    const ticks: number[] = []
    for (let v = 0; v <= maxY + step - 1; v += step) ticks.push(v)
    return ticks.slice(0, 4)
  }, [maxY])
  const yMax = Math.max(maxY, yTicks[yTicks.length - 1] ?? 1)

  const xFor = (i: number) => padL + (buckets.length > 1 ? (i / (buckets.length - 1)) * plotW : plotW / 2)
  const yFor = (v: number) => padT + plotH - (v / yMax) * plotH

  const pointsFor = (key: string) =>
    buckets.map((b, i) => ({ x: xFor(i), y: yFor(b.counts[key] ?? 0) }))

  const yTop = padT
  const yBase = padT + plotH
  const totalPts = pointsFor('__tot')
  const areaPath =
    totalPts.length > 1
      ? `${smoothPath(totalPts, yTop, yBase)} L${totalPts[totalPts.length - 1].x},${yBase} L${totalPts[0].x},${yBase} Z`
      : ''

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (buckets.length < 2) return
    const i = Math.round(((x - padL) / plotW) * (buckets.length - 1))
    setHoverIdx(Math.min(Math.max(i, 0), buckets.length - 1))
  }

  const hover = hoverIdx !== null ? buckets[hoverIdx] : null
  const xLabelEvery = period === 'giorno' ? 5 : 1

  return (
    <div style={{ padding: '20px 22px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header a layout fisso: label + toggle sulla prima riga, numero sotto.
          Il toggle non si sposta mai cambiando periodo. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
          Vendite
        </div>
        <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 999, flexShrink: 0 }} className="inv-glass">
          {(
            [
              ['giorno', '30 gg'],
              ['mese', '12 mesi'],
              ['anno', 'Anni'],
            ] as [Period, string][]
          ).map(([p, label]) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                color: period === p ? colors.accentBright : colors.textMuted,
                background: period === p ? colors.accentSoft : 'transparent',
                border: period === p ? `1px solid ${colors.borderStrong}` : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minHeight: 36 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: colors.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {loading ? '…' : totalInWindow}
        </span>
        {deltaPct !== null && !loading && (
          <span style={{ fontSize: 13, fontWeight: 700, color: deltaPct >= 0 ? colors.success : colors.danger }}>
            {deltaPct >= 0 ? '↑' : '↓'} {Math.abs(deltaPct).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Plot */}
      <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
        {loading ? (
          <div style={{ height: H, borderRadius: 14, background: 'rgba(255,255,255,0.04)', animation: 'inv-pulse 1.5s ease-in-out infinite' }} />
        ) : (
          <>
            <svg
              width={width}
              height={H}
              onMouseMove={handleMove}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ display: 'block', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="inv-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TOTAL_COLOR} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={TOTAL_COLOR} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* recessive grid + y labels */}
              {yTicks.map((t) => (
                <g key={t}>
                  <line x1={padL} x2={padL + plotW} y1={yFor(t)} y2={yFor(t)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <text x={padL - 8} y={yFor(t) + 3.5} textAnchor="end" fontSize="10" fill={colors.textMuted}>
                    {t}
                  </text>
                </g>
              ))}

              {/* x labels */}
              {buckets.map((b, i) =>
                i % xLabelEvery === 0 ? (
                  <text key={i} x={xFor(i)} y={H - 6} textAnchor="middle" fontSize="10" fill={colors.textMuted}>
                    {b.label}
                  </text>
                ) : null
              )}

              {/* area under total */}
              {areaPath && <path d={areaPath} fill="url(#inv-area)" />}

              {/* series lines: total last so it stays on top */}
              {[...series].reverse().map((s) => (
                <path
                  key={s.key}
                  d={smoothPath(pointsFor(s.key), yTop, yBase)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.key === '__tot' ? 2.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={s.key === '__tot' ? 1 : 0.9}
                />
              ))}

              {/* crosshair + hover markers */}
              {hoverIdx !== null && (
                <g>
                  <line
                    x1={xFor(hoverIdx)}
                    x2={xFor(hoverIdx)}
                    y1={padT}
                    y2={padT + plotH}
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {series.map((s) => (
                    <circle
                      key={s.key}
                      cx={xFor(hoverIdx)}
                      cy={yFor(buckets[hoverIdx].counts[s.key] ?? 0)}
                      r="4.5"
                      fill={s.color}
                      stroke={colors.bg}
                      strokeWidth="2"
                    />
                  ))}
                </g>
              )}
            </svg>

            {/* tooltip */}
            {hover && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: Math.min(Math.max(xFor(hoverIdx!) + 10, 0), Math.max(width - 150, 0)),
                  pointerEvents: 'none',
                  background: 'rgba(13, 20, 22, 0.92)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  minWidth: 130,
                  zIndex: 5,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.text, marginBottom: 6 }}>{hover.full}</div>
                {series.map((s) => (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{s.label}</span>
                    <span style={{ fontWeight: 700, color: colors.text }}>{hover.counts[s.key] ?? 0}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
        {series.map((s) => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textSecondary }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
