'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KpiDashboard, Vendita } from '@/lib/types'
import {
  PageShell,
  PageHeader,
  StatCard,
  SectionCard,
  EmptyState,
  Skeleton,
  SkuBadge,
  Chip,
  ChipRow,
  Card,
  ErrorBox,
  colors,
  S,
  euro,
} from '@/components/ui'

type Period = 'settimane' | 'mesi' | 'anno'
type Metric = 'fatturato' | 'netto'

interface CatStat {
  cat: string
  count: number
  fatturato: number
  netto: number
}

function computeCatStats(
  vendite: Vendita[],
  modelToCat: Record<string, string>
): { topVendute: CatStat[]; topMargine: CatStat[] } {
  const map: Record<string, CatStat> = {}
  for (const v of vendite) {
    const cat = modelToCat[(v.idModello || '').toUpperCase()] || 'Senza categoria'
    if (!map[cat]) map[cat] = { cat, count: 0, fatturato: 0, netto: 0 }
    map[cat].count++
    map[cat].fatturato += v.prezzoVendita
    map[cat].netto += v.guadagnoNetto
  }
  const all = Object.values(map)
  return {
    topVendute: [...all].sort((a, b) => b.count - a.count).slice(0, 5),
    topMargine: [...all].sort((a, b) => b.netto - a.netto).slice(0, 5),
  }
}

const MEDAL = ['🥇', '🥈', '🥉']

function RankingList({
  items,
  valueKey,
  format,
}: {
  items: CatStat[]
  valueKey: 'count' | 'netto'
  format: (n: number) => string
}) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, idx) => {
        const val = item[valueKey]
        const pct = (val / max) * 100
        return (
          <div
            key={item.cat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 18px',
              borderBottom: idx < items.length - 1 ? `1px solid ${colors.border}` : 'none',
            }}
          >
            <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>
              {MEDAL[idx] ?? (
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.textMuted }}>
                  {idx + 1}
                </span>
              )}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.cat}
              </div>
              <div
                style={{
                  marginTop: 4,
                  height: 4,
                  borderRadius: 999,
                  background: colors.bgElevated,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${colors.accentBright}, ${colors.accent})`,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.accentBright, flexShrink: 0 }}>
              {format(val)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface ChartBar {
  label: string
  fatturato: number
  netto: number
  count: number
}

function parseDate(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
}

function computeChart(vendite: Vendita[], period: Period): ChartBar[] {
  const now = new Date()

  if (period === 'settimane') {
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const currentMonday = new Date(now)
    currentMonday.setDate(now.getDate() - daysToMonday)
    currentMonday.setHours(0, 0, 0, 0)
    return Array.from({ length: 8 }, (_, rev) => {
      const i = 7 - rev
      const weekStart = new Date(currentMonday)
      weekStart.setDate(currentMonday.getDate() - i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`
      const inPeriod = vendite.filter((v) => {
        const d = parseDate(v.dataVendita)
        return d && d >= weekStart && d <= weekEnd
      })
      return {
        label,
        fatturato: inPeriod.reduce((s, v) => s + v.prezzoVendita, 0),
        netto: inPeriod.reduce((s, v) => s + v.guadagnoNetto, 0),
        count: inPeriod.length,
      }
    })
  }

  if (period === 'mesi') {
    return Array.from({ length: 12 }, (_, rev) => {
      const i = 11 - rev
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('it-IT', { month: 'short' })
      const inPeriod = vendite.filter((v) => {
        const vd = parseDate(v.dataVendita)
        if (!vd) return false
        return `${vd.getFullYear()}-${String(vd.getMonth() + 1).padStart(2, '0')}` === key
      })
      return {
        label,
        fatturato: inPeriod.reduce((s, v) => s + v.prezzoVendita, 0),
        netto: inPeriod.reduce((s, v) => s + v.guadagnoNetto, 0),
        count: inPeriod.length,
      }
    })
  }

  const yearMap: Record<string, ChartBar> = {}
  for (const v of vendite) {
    const d = parseDate(v.dataVendita)
    if (!d) continue
    const y = String(d.getFullYear())
    if (!yearMap[y]) yearMap[y] = { label: y, fatturato: 0, netto: 0, count: 0 }
    yearMap[y].fatturato += v.prezzoVendita
    yearMap[y].netto += v.guadagnoNetto
    yearMap[y].count++
  }
  const cy = String(now.getFullYear())
  if (!yearMap[cy]) yearMap[cy] = { label: cy, fatturato: 0, netto: 0, count: 0 }
  return Object.values(yearMap).sort((a, b) => a.label.localeCompare(b.label))
}

function getVenditePerPeriod(vendite: Vendita[], period: Period): Vendita[] {
  const now = new Date()
  let start: Date | null = null

  if (period === 'settimane') {
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    start = new Date(now)
    start.setDate(now.getDate() - daysToMonday - 7 * 7)
    start.setHours(0, 0, 0, 0)
  } else if (period === 'mesi') {
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    start.setHours(0, 0, 0, 0)
  }

  const filtered = start
    ? vendite.filter((v) => {
        const d = parseDate(v.dataVendita)
        return d && d >= start!
      })
    : [...vendite]

  return filtered.sort((a, b) => {
    const da = parseDate(a.dataVendita)
    const db = parseDate(b.dataVendita)
    if (!da || !db) return 0
    return db.getTime() - da.getTime()
  })
}

function BarChart({ bars, metric }: { bars: ChartBar[]; metric: Metric }) {
  const values = bars.map((b) => Math.max(metric === 'fatturato' ? b.fatturato : b.netto, 0))
  const max = Math.max(...values, 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 96 }}>
        {bars.map((bar, i) => {
          const val = Math.max(metric === 'fatturato' ? bar.fatturato : bar.netto, 0)
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: val > 0 ? `${Math.max((val / max) * 100, 5)}%` : '2px',
                  background: val > 0
                    ? `linear-gradient(180deg, ${colors.accentBright}, ${colors.accent})`
                    : colors.bgElevated,
                  borderRadius: '6px 6px 0 0',
                }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
        {bars.map((bar, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 9, color: colors.textMuted, display: 'block' }}>{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  valueColor,
  bold,
  last,
}: {
  label: string
  value: string | number
  valueColor?: string
  bold?: boolean
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: bold ? '14px 18px' : '12px 18px',
        borderBottom: last ? 'none' : `1px solid ${colors.border}`,
      }}
    >
      <span style={{ fontSize: bold ? 15 : 14, fontWeight: bold ? 800 : 400, color: bold ? colors.text : colors.textSecondary }}>
        {label}
      </span>
      <span style={{ fontSize: bold ? 15 : 14, fontWeight: bold ? 800 : 600, color: valueColor ?? colors.text }}>
        {value}
      </span>
    </div>
  )
}

export default function Bilancio() {
  const router = useRouter()
  const [kpi, setKpi] = useState<KpiDashboard | null>(null)
  const [vendite, setVendite] = useState<Vendita[]>([])
  const [modelToCat, setModelToCat] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('mesi')
  const [metric, setMetric] = useState<Metric>('fatturato')

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then((r) => r.json()),
      fetch('/api/vendite').then((r) => r.json()),
    ])
      .then(([kpiData, venditeData]) => {
        setKpi(typeof kpiData?.fatturato === 'number' ? kpiData : null)
        setVendite(Array.isArray(venditeData) ? venditeData : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch('/api/taglie')
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, string> = {}
        for (const item of data.items || []) {
          if (item.idModello) map[item.idModello.toUpperCase()] = item.categoria || ''
        }
        setModelToCat(map)
      })
      .catch(() => {})
  }, [])

  const chartData = computeChart(vendite, period)
  const { topVendute, topMargine } = computeCatStats(vendite, modelToCat)
  const chartTotal = chartData.reduce(
    (s, b) => s + (metric === 'fatturato' ? b.fatturato : b.netto),
    0
  )
  const chartCount = chartData.reduce((s, b) => s + b.count, 0)
  const venditePerPeriod = getVenditePerPeriod(vendite, period)

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="Bilancio" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[80, 180, 200, 160].map((h, i) => (
            <Skeleton key={i} height={h} />
          ))}
        </div>
      </PageShell>
    )
  }

  if (!kpi) {
    return (
      <PageShell>
        <PageHeader title="Bilancio" />
        <ErrorBox message="Errore caricamento dati" />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader title="Bilancio" subtitle="Panoramica finanziaria e vendite" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI GRID */}
        <div className="inv-grid-4">
          <StatCard
            label="Fatturato"
            value={euro(kpi.fatturato)}
            hint={`${kpi.totaleVenduti} vendite`}
          />
          <StatCard
            label="Guadagno netto"
            value={euro(kpi.guadagnoNetto)}
            hint="dopo fee"
            highlight={colors.accentBright}
          />
          <StatCard
            label="In stock"
            value={kpi.totaleStock}
            hint={euro(kpi.rimanenze)}
          />
          <div style={{ position: 'relative' }}>
            <StatCard
              label="Scadenze"
              value={kpi.scadenzeImminenti}
              hint={kpi.scaduti > 0 ? `${kpi.scaduti} scaduti` : 'entro 15gg'}
              highlight={kpi.scadenzeImminenti > 0 ? colors.warning : undefined}
              onClick={() => router.push('/bilancio/scadenze')}
            />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              style={{ position: 'absolute', top: 16, right: 16, opacity: 0.45, pointerEvents: 'none' }}
            >
              <path d="M9 18l6-6-6-6" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* GRAFICO */}
        <SectionCard
          title="Andamento vendite"
          action={
            <ChipRow>
              <Chip label="Fatturato" active={metric === 'fatturato'} onClick={() => setMetric('fatturato')} />
              <Chip label="Netto" active={metric === 'netto'} onClick={() => setMetric('netto')} />
            </ChipRow>
          }
        >
          <div style={{ padding: '16px 18px' }}>
            <div
              style={{
                display: 'flex',
                background: colors.bgMuted,
                borderRadius: 999,
                padding: 4,
                marginBottom: 16,
                border: `1px solid ${colors.border}`,
              }}
            >
              {(
                [
                  ['settimane', 'Settimane'],
                  ['mesi', 'Mesi'],
                  ['anno', 'Anno'],
                ] as [Period, string][]
              ).map(([p, label]) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={period === p ? 'inv-btn-glass' : undefined}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    color: period === p ? colors.accentBright : colors.textMuted,
                    ...(period === p ? {} : { background: 'transparent', border: 'none' }),
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <BarChart bars={chartData} metric={metric} />

            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>{metric === 'fatturato' ? 'Fatturato' : 'Netto'} periodo</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginTop: 2 }}>{euro(chartTotal)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: colors.textMuted }}>Vendite</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginTop: 2 }}>{chartCount}</div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* VENDITE DEL PERIODO */}
        <SectionCard
          title="Vendite nel periodo"
          subtitle={
            period === 'settimane'
              ? 'Ultime 8 settimane'
              : period === 'mesi'
                ? 'Ultimi 12 mesi'
                : 'Tutte le vendite'
          }
        >
          {venditePerPeriod.length === 0 ? (
            <EmptyState icon="📊" message="Nessuna vendita in questo periodo" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {venditePerPeriod.map((v, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 18px',
                    borderBottom: i < venditePerPeriod.length - 1 ? `1px solid ${colors.border}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <SkuBadge sku={v.sku} />
                      {v.taglia && (
                        <span style={{ fontSize: 11, color: colors.textMuted }}>{v.taglia}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.idModello || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                      {v.dataVendita}
                      {v.venditore ? ` · ${v.venditore}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: colors.accentBright }}>{euro(v.prezzoVendita)}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>netto {euro(v.guadagnoNetto)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* RIEPILOGO FINANZIARIO + STOCK side by side */}
        <div className="inv-grid-2" style={{ alignItems: 'start' }}>
          <SectionCard title="Riepilogo finanziario">
            <SummaryRow label="Fatturato totale" value={euro(kpi.fatturato)} />
            <SummaryRow label="Costo acquisti" value={`−${euro(kpi.costoAcquisti)}`} valueColor={colors.danger} />
            <SummaryRow label="Guadagno lordo" value={euro(kpi.guadagnoLordo)} />
            <SummaryRow label="Fee venditori" value={`−${euro(kpi.feeTotali)}`} valueColor={colors.danger} />
            <SummaryRow label="Guadagno netto" value={euro(kpi.guadagnoNetto)} valueColor={colors.accentBright} bold last />
          </SectionCard>

          <SectionCard title="Stock">
            {[
              { label: 'Totale ordinati', value: kpi.totaleStock + kpi.totaleVenduti + kpi.totaleResi },
              { label: 'In stock', value: kpi.totaleStock },
              { label: 'Venduti', value: kpi.totaleVenduti },
              { label: 'Resi', value: kpi.totaleResi },
            ].map((row, i, arr) => (
              <SummaryRow key={i} label={row.label} value={row.value} last={i === arr.length - 1} />
            ))}
          </SectionCard>
        </div>

        {/* CLASSIFICA CATEGORIE — side by side */}
        {(topVendute.length > 0 || topMargine.length > 0) && (
          <div className="inv-grid-2" style={{ alignItems: 'start' }}>
            {topVendute.length > 0 && (
              <SectionCard title="Categorie più vendute" subtitle="Per numero di pezzi venduti">
                <RankingList
                  items={topVendute}
                  valueKey="count"
                  format={(n) => `${n} pz`}
                />
              </SectionCard>
            )}
            {topMargine.length > 0 && (
              <SectionCard title="Categorie più redditizie" subtitle="Per guadagno netto totale">
                <RankingList
                  items={topMargine}
                  valueKey="netto"
                  format={(n) => '€' + n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                />
              </SectionCard>
            )}
          </div>
        )}

        {/* GESTIONE PAGAMENTI VENDITORI */}
        <a href="/bilancio/venditori" style={{ textDecoration: 'none' }}>
          <Card
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: colors.accentSoft,
                  border: `1px solid ${colors.borderStrong}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={colors.accentBright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke={colors.accentBright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={colors.accentBright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={colors.accentBright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>Gestione pagamenti venditori</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Traccia fee dovute e pagamenti effettuati</div>
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Card>
        </a>

      </div>
    </PageShell>
  )
}
