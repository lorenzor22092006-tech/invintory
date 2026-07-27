'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SalesChart from '@/components/SalesChart'
import SellersRanking from '@/components/SellersRanking'
import StockExplorer from '@/components/StockExplorer'
import type { Vendita } from '@/lib/types'
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui'

export default function HomePage() {
  const router = useRouter()
  const [vendite, setVendite] = useState<Vendita[]>([])
  const [venditeLoading, setVenditeLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vendite')
      .then((r) => r.json())
      .then((data: Vendita[]) => {
        setVendite(Array.isArray(data) ? data : [])
        setVenditeLoading(false)
      })
      .catch(() => setVenditeLoading(false))
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        subtitle="Gestisci il tuo stock Rubinos Sellers"
      />

      {/* AZIONI RAPIDE — prima cosa visibile, sopra il grafico */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <PrimaryButton style={{ flex: 1, padding: '13px 10px' }} onClick={() => router.push('/vendite/nuova')}>
          + Vendita
        </PrimaryButton>
        <SecondaryButton style={{ flex: 1, padding: '13px 10px' }} onClick={() => router.push('/resi/nuovo')}>
          + Reso
        </SecondaryButton>
        <SecondaryButton style={{ flex: 1, padding: '13px 10px' }} onClick={() => router.push('/stock/nuovo')}>
          + Prodotto
        </SecondaryButton>
      </div>

      <div style={{ marginBottom: 20 }}>
        <SecondaryButton fullWidth style={{ padding: '13px 10px' }} onClick={() => router.push('/resi')}>
          Storico resi
        </SecondaryButton>
      </div>

      {/* CHART + SIDE COLUMN */}
      <div className="inv-grid-kpi" style={{ marginBottom: 24 }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <SalesChart vendite={vendite} loading={venditeLoading} />
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: '20px 22px' }}>
            <SellersRanking vendite={vendite} loading={venditeLoading} />
          </Card>
        </div>
      </div>

      {/* Ricerca + box scadenze urgenti + tendina prodotti in scadenza (condiviso col ruolo venditore) */}
      <StockExplorer showUrgentBox />
    </PageShell>
  )
}
