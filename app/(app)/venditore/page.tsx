'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StockExplorer from '@/components/StockExplorer'
import {
  PageShell,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui'

export default function VenditoreHomePage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [isSub, setIsSub] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setNome(data.nome || '')
        setIsSub(Boolean(data.isSub))
      })
      .catch(() => {})
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        subtitle={nome ? `Ciao ${nome}, gestisci il tuo lavoro` : 'La tua area venditore'}
      />

      {/* AZIONI — prima cosa visibile. I sub-venditori vendono soltanto: niente reso/prodotto. */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <PrimaryButton style={{ flex: 1, padding: '13px 10px' }} onClick={() => router.push('/vendite/nuova')}>
          + Vendita
        </PrimaryButton>
        {!isSub && (
          <>
            <SecondaryButton style={{ flex: 1, padding: '13px 10px' }} onClick={() => router.push('/resi/nuovo')}>
              + Reso
            </SecondaryButton>
            <SecondaryButton style={{ flex: 1, padding: '13px 10px' }} onClick={() => router.push('/stock/nuovo')}>
              + Prodotto
            </SecondaryButton>
          </>
        )}
      </div>

      {/* Storico resi (pacchi da fare) — solo venditori main, che gestiscono i resi */}
      {!isSub && (
        <div style={{ marginBottom: 24 }}>
          <SecondaryButton fullWidth style={{ padding: '13px 10px' }} onClick={() => router.push('/resi')}>
            Storico resi
          </SecondaryButton>
        </div>
      )}

      {/* Ricerca + box scadenze urgenti (solo main, non sub) + tendina prodotti in scadenza */}
      <StockExplorer showUrgentBox={!isSub} />
    </PageShell>
  )
}
