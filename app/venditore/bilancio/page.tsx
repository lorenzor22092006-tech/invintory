'use client'

import { useEffect, useState } from 'react'
import {
  PageShell,
  PageHeader,
  StatCard,
  SectionCard,
  Skeleton,
  colors,
  euro,
} from '@/components/ui'

interface Bilancio {
  numVendite: number
  fatturato: number
  guadagnato: number
  mandato: number
  daRicevere: number
}

export default function BilancioVenditorePage() {
  const [b, setB] = useState<Bilancio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/venditore/bilancio')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.guadagnato === 'number') setB(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <PageShell>
      <PageHeader title="Il mio bilancio" subtitle="Guadagni e pagamenti" />

      {/* Riepilogo pagamenti — la cosa più importante per il venditore */}
      {loading ? (
        <div className="inv-grid-3" style={{ marginBottom: 20 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={90} />
          ))}
        </div>
      ) : (
        <div className="inv-grid-3" style={{ marginBottom: 20 }}>
          <StatCard accent label="Guadagnato totale" value={euro(b?.guadagnato ?? 0)} hint="le tue commissioni" />
          <StatCard label="Soldi ricevuti" value={euro(b?.mandato ?? 0)} highlight={colors.success} hint="già mandati dal CEO" />
          <StatCard
            label="Da ricevere"
            value={euro(b?.daRicevere ?? 0)}
            highlight={(b?.daRicevere ?? 0) > 0 ? colors.warning : undefined}
            hint="non ancora mandati"
          />
        </div>
      )}

      {/* Statistiche vendite */}
      <SectionCard title="Le tue vendite" subtitle="Riepilogo attività">
        <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 12px' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Numero vendite
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: colors.text, marginTop: 4 }}>
              {loading ? '…' : b?.numVendite ?? 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Fatturato generato
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: colors.accentBright, marginTop: 4 }}>
              {loading ? '…' : euro(b?.fatturato ?? 0)}
            </div>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  )
}
