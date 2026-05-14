'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KpiDashboard, Vendita } from '@/lib/types'

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
              padding: '11px 16px',
              borderBottom: idx < items.length - 1 ? '1px solid #102A24' : 'none',
            }}
          >
            <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>
              {MEDAL[idx] ?? (
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
                  {idx + 1}
                </span>
              )}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.cat}
              </div>
              <div
                style={{
                  marginTop: 4,
                  height: 4,
                  borderRadius: 2,
                  background: '#1B3A34',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: '#10B981',
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981', flexShrink: 0 }}>
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

function euro(n: number) {
  const safe = Number.isFinite(n) ? n : 0
  return '€' + safe.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
                  background: val > 0 ? '#10B981' : '#1B3A34',
                  borderRadius: '3px 3px 0 0',
                }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
        {bars.map((bar, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>{bar.label}</span>
          </div>
        ))}
      </div>
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
    // Fetch critici (KPI + vendite) — separati dal taglie che è opzionale
    Promise.all([
      fetch('/api/dashboard').then((r) => r.json()),
      fetch('/api/vendite').then((r) => r.json()),
    ])
      .then(([kpiData, venditeData]) => {
        // Valida che kpiData sia un vero KpiDashboard e non un oggetto {error}
        setKpi(typeof kpiData?.fatturato === 'number' ? kpiData : null)
        setVendite(Array.isArray(venditeData) ? venditeData : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Fetch opzionale per classifiche categorie — non blocca la pagina se fallisce
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
      <div
        style={{
          minHeight: '100dvh',
          background: '#061311',
          maxWidth: 430,
          margin: '0 auto',
          padding: '52px 20px 90px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {[80, 180, 200, 160].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 14, background: '#0B1F1A', opacity: 0.5 }} />
        ))}
      </div>
    )
  }

  if (!kpi) {
    return (
      <div style={{ minHeight: '100dvh', background: '#061311', maxWidth: 430, margin: '0 auto', padding: '52px 20px', textAlign: 'center', color: '#EF4444', fontSize: 14 }}>
        Errore caricamento dati
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#061311', display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', paddingBottom: 90 }}>

      {/* HEADER */}
      <div style={{ padding: '52px 20px 20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>Bilancio</h1>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* KPI GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Fatturato</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>{euro(kpi.fatturato)}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>{kpi.totaleVenduti} vendite</div>
          </div>

          <div style={{ background: '#0B1F1A', border: '1.5px solid #10B981', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Guadagno netto</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981' }}>{euro(kpi.guadagnoNetto)}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>dopo fee</div>
          </div>

          <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>In stock</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>{kpi.totaleStock}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>{euro(kpi.rimanenze)}</div>
          </div>

          {/* SCADENZE — cliccabile */}
          <div
            onClick={() => router.push('/bilancio/scadenze')}
            style={{
              background: '#0B1F1A',
              border: `1.5px solid ${kpi.scadenzeImminenti > 0 ? '#F59E0B' : '#1B3A34'}`,
              borderRadius: 14,
              padding: '14px 16px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Scadenze</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: kpi.scadenzeImminenti > 0 ? '#F59E0B' : '#F8FAFC' }}>
              {kpi.scadenzeImminenti}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
              {kpi.scaduti > 0 ? `${kpi.scaduti} scaduti` : 'entro 15gg'}
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              style={{ position: 'absolute', top: 14, right: 14, opacity: 0.4 }}
            >
              <path d="M9 18l6-6-6-6" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* GRAFICO */}
        <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>Andamento vendite</div>
            <div style={{ display: 'flex', background: '#102A24', borderRadius: 8, overflow: 'hidden', border: '1px solid #1B3A34' }}>
              {(['fatturato', 'netto'] as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  style={{
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    background: metric === m ? '#10B981' : 'transparent',
                    color: metric === m ? 'white' : '#64748B',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {m === 'fatturato' ? 'Fatturato' : 'Netto'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', background: '#102A24', borderRadius: 10, padding: 3, marginBottom: 16, border: '1px solid #1B3A34' }}>
            {(
              [
                ['settimane', 'Settimane'],
                ['mesi', 'Mesi'],
                ['anno', 'Anno'],
              ] as [Period, string][]
            ).map(([p, label]) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  background: period === p ? '#0B1F1A' : 'transparent',
                  color: period === p ? '#F8FAFC' : '#64748B',
                  border: period === p ? '1px solid #1B3A34' : 'none',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <BarChart bars={chartData} metric={metric} />

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #1B3A34', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{metric === 'fatturato' ? 'Fatturato' : 'Netto'} periodo</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>{euro(chartTotal)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#64748B' }}>Vendite</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>{chartCount}</div>
            </div>
          </div>
        </div>

        {/* VENDITE DEL PERIODO */}
        <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1B3A34' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
              Vendite nel periodo
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              {period === 'settimane' && 'Ultime 8 settimane'}
              {period === 'mesi' && 'Ultimi 12 mesi'}
              {period === 'anno' && 'Tutte le vendite'}
            </div>
          </div>

          {venditePerPeriod.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B', fontSize: 14 }}>
              Nessuna vendita in questo periodo
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {venditePerPeriod.map((v, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 16px',
                    borderBottom: i < venditePerPeriod.length - 1 ? '1px solid #102A24' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                      <span style={{
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid #10B981',
                        borderRadius: 5,
                        padding: '1px 7px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#10B981',
                        flexShrink: 0,
                      }}>
                        {v.sku}
                      </span>
                      {v.taglia && (
                        <span style={{ fontSize: 11, color: '#64748B' }}>{v.taglia}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.idModello || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      {v.dataVendita}
                      {v.venditore ? ` · ${v.venditore}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>{euro(v.prezzoVendita)}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>netto {euro(v.guadagnoNetto)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIEPILOGO FINANZIARIO */}
        <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1B3A34' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>Riepilogo finanziario</div>
          </div>
          {[
            { label: 'Fatturato totale', value: euro(kpi.fatturato), color: '#F8FAFC' },
            { label: 'Costo acquisti', value: `−${euro(kpi.costoAcquisti)}`, color: '#EF4444' },
            { label: 'Guadagno lordo', value: euro(kpi.guadagnoLordo), color: '#F8FAFC' },
            { label: 'Fee venditori', value: `−${euro(kpi.feeTotali)}`, color: '#EF4444' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #102A24' }}>
              <span style={{ fontSize: 14, color: '#94A3B8' }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: row.color }}>{row.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC' }}>Guadagno netto</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>{euro(kpi.guadagnoNetto)}</span>
          </div>
        </div>

        {/* CLASSIFICA CATEGORIE — PIÙ VENDUTE */}
        {topVendute.length > 0 && (
          <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1B3A34' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>Categorie più vendute</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Per numero di pezzi venduti</div>
            </div>
            <RankingList
              items={topVendute}
              valueKey="count"
              format={(n) => `${n} pz`}
            />
          </div>
        )}

        {/* CLASSIFICA CATEGORIE — PIÙ MARGINE */}
        {topMargine.length > 0 && (
          <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1B3A34' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>Categorie più redditizie</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Per guadagno netto totale</div>
            </div>
            <RankingList
              items={topMargine}
              valueKey="netto"
              format={(n) => '€' + n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            />
          </div>
        )}

        {/* RIEPILOGO STOCK */}
        <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1B3A34' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>Stock</div>
          </div>
          {[
            { label: 'Totale ordinati', value: kpi.totaleStock + kpi.totaleVenduti + kpi.totaleResi },
            { label: 'In stock', value: kpi.totaleStock },
            { label: 'Venduti', value: kpi.totaleVenduti },
            { label: 'Resi', value: kpi.totaleResi },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #102A24' : 'none' }}>
              <span style={{ fontSize: 14, color: '#94A3B8' }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>{row.value}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
