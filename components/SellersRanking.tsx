'use client'

import { useMemo, useState } from 'react'
import { colors, euro } from '@/lib/theme'
import type { Vendita } from '@/lib/types'

type Period = 'settimana' | 'mese' | 'anno'
type Metrica = 'pezzi' | 'guadagno'

function parseDate(d: string): Date | null {
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
}

const PERIOD_LABEL: Record<Period, string> = {
  settimana: 'Settimana',
  mese: 'Mese',
  anno: 'Anno',
}

/** Classifica venditori: chi ha venduto di più nel periodo, per numero pezzi o guadagno lordo.
    Guadagno = guadagno lordo (prima della fee): così il ranking non premia chi ha la % più bassa. */
export default function SellersRanking({ vendite, loading }: { vendite: Vendita[]; loading: boolean }) {
  const [period, setPeriod] = useState<Period>('mese')
  const [metrica, setMetrica] = useState<Metrica>('pezzi')

  const righe = useMemo(() => {
    const now = new Date()
    let windowStart: Date
    if (period === 'settimana') {
      windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    } else if (period === 'mese') {
      windowStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    } else {
      windowStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    }

    const stats: Record<string, { pezzi: number; guadagno: number }> = {}
    for (const v of vendite) {
      const nome = (v.venditore || '').trim()
      if (!nome) continue
      const d = parseDate(v.dataVendita)
      if (!d || d < windowStart || d > now) continue
      if (!stats[nome]) stats[nome] = { pezzi: 0, guadagno: 0 }
      stats[nome].pezzi += 1
      stats[nome].guadagno += v.guadagnoLordo || 0
    }

    return Object.entries(stats)
      .map(([nome, s]) => ({ nome, ...s }))
      .sort((a, b) => b[metrica] - a[metrica])
  }, [vendite, period, metrica])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Analisi vendite
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['settimana', 'mese', 'anno'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              style={{
                padding: '4px 9px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 8,
                border: `1px solid ${period === p ? colors.accent : colors.border}`,
                background: period === p ? colors.accentSoft : 'transparent',
                color: period === p ? colors.accentBright : colors.textMuted,
                cursor: 'pointer',
              }}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['pezzi', 'guadagno'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetrica(m)}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 8,
              border: `1px solid ${metrica === m ? colors.accent : colors.border}`,
              background: metrica === m ? colors.accentSoft : 'transparent',
              color: metrica === m ? colors.accentBright : colors.textMuted,
              cursor: 'pointer',
            }}
          >
            {m === 'pezzi' ? 'N. pezzi' : 'Guadagno'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: colors.textMuted, fontSize: 13 }}>Caricamento…</div>
      ) : righe.length === 0 ? (
        <div style={{ color: colors.textMuted, fontSize: 13 }}>Nessuna vendita nel periodo</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {righe.slice(0, 5).map((r, i) => (
            <div
              key={r.nome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 0',
                borderTop: i > 0 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted, minWidth: 16 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.nome}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: colors.accentBright, flexShrink: 0 }}>
                {metrica === 'pezzi' ? `${r.pezzi} pz` : euro(r.guadagno)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
