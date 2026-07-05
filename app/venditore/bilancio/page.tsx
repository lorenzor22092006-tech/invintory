'use client'

import { useEffect, useMemo, useState } from 'react'
import { Vendita } from '@/lib/types'
import {
  PageShell,
  PageHeader,
  StatCard,
  Skeleton,
  colors,
  euro,
} from '@/components/ui'

export default function BilancioVenditorePage() {
  const [vendite, setVendite] = useState<Vendita[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // l'API restituisce già solo le vendite del venditore loggato
    fetch('/api/vendite')
      .then((r) => r.json())
      .then((data: Vendita[]) => {
        setVendite(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const kpi = useMemo(() => {
    const fatturato = vendite.reduce((s, v) => s + (v.prezzoVendita || 0), 0)
    const fee = vendite.reduce((s, v) => s + (v.fee || 0), 0)
    const netto = vendite.reduce((s, v) => s + (v.guadagnoNetto || 0), 0)
    return { fatturato, fee, netto, count: vendite.length }
  }, [vendite])

  return (
    <PageShell>
      <PageHeader title="Il mio bilancio" subtitle="Le tue statistiche personali" />

      {loading ? (
        <div className="inv-grid-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={90} />
          ))}
        </div>
      ) : (
        <div className="inv-grid-4">
          <StatCard accent label="Fatturato" value={euro(kpi.fatturato)} hint="dalle tue vendite" />
          <StatCard label="Vendite" value={kpi.count} hint="pezzi venduti da te" />
          <StatCard label="Le tue commissioni" value={euro(kpi.fee)} highlight={colors.success} hint="quanto hai guadagnato" />
          <StatCard label="Netto vendite" value={euro(kpi.netto)} hint="netto dopo fee e costi" />
        </div>
      )}
    </PageShell>
  )
}
