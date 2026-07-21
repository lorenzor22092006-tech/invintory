'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PageShell,
  PageHeader,
  SectionCard,
  EmptyState,
  Skeleton,
  PrimaryButton,
  SecondaryButton,
  ErrorBox,
  colors,
} from '@/components/ui'

interface StockItem {
  sku: string
  numeroOrdine: string
  dataOrdine: string
  prezzoAcquisto: string
  scadenzaReso: string
  giorniRimanenti: number | null
  statoScadenza: string
  esito: string
  idModello: string
  taglia: string
}

export default function VenditoreHomePage() {
  const router = useRouter()
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [expandedSku, setExpandedSku] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setNome(data.nome || ''))
      .catch(() => {})
    fetch('/api/stock')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) {
          setLoadError(data.error || 'Impossibile caricare lo stock')
          setLoading(false)
          return
        }
        setItems(data.items || [])
        setLoading(false)
      })
      .catch(() => {
        setLoadError('Errore di rete durante il caricamento')
        setLoading(false)
      })
  }, [])

  const inScadenza = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        item.esito === 'In stock' &&
        item.giorniRimanenti !== null &&
        item.giorniRimanenti >= 0
    )
    return [...filtered].sort((a, b) => (a.giorniRimanenti ?? 0) - (b.giorniRimanenti ?? 0))
  }, [items])

  const getColor = (giorni: number | null) => {
    if (giorni === null) return colors.textMuted
    if (giorni <= 3) return colors.danger
    if (giorni <= 7) return colors.warning
    return colors.success
  }
  const getLabel = (giorni: number | null) => {
    if (giorni === null) return ''
    if (giorni === 0) return 'Scade oggi'
    if (giorni === 1) return '1 giorno'
    return `${giorni} giorni`
  }

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        subtitle={nome ? `Ciao ${nome}, gestisci il tuo lavoro` : 'La tua area venditore'}
      />

      {/* AZIONI — prima cosa visibile */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
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

      {loadError && (
        <div style={{ marginBottom: 20 }}>
          <ErrorBox message={loadError} />
        </div>
      )}

      {/* PRODOTTI IN SCADENZA */}
      <SectionCard
        title="Prodotti in scadenza"
        subtitle={loading ? 'Caricamento…' : `${inScadenza.length} prodotti attivi`}
      >
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={52} />
            ))}
          </div>
        ) : inScadenza.length === 0 ? (
          <EmptyState icon="✓" message="Nessun prodotto in scadenza" />
        ) : (
          <div>
            {inScadenza.map((item) => {
              const open = expandedSku === item.sku
              return (
                <div key={item.sku} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <div
                    onClick={() => setExpandedSku(open ? null : item.sku)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: colors.accentBright, minWidth: 36 }}>{item.sku}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.idModello || '—'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: getColor(item.giorniRimanenti), flexShrink: 0 }}>
                      {getLabel(item.giorniRimanenti)}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                      <path d="M6 9l6 6 6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {open && (
                    <div style={{ padding: '2px 16px 14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 12px', fontSize: 12 }}>
                        <div>
                          <div style={{ color: colors.textMuted, marginBottom: 2 }}>Taglia</div>
                          <div style={{ color: colors.text, fontWeight: 600 }}>{item.taglia || 'n.d.'}</div>
                        </div>
                        <div>
                          <div style={{ color: colors.textMuted, marginBottom: 2 }}>Scadenza reso</div>
                          <div style={{ color: colors.text, fontWeight: 600 }}>{item.scadenzaReso || '—'}</div>
                        </div>
                        <div>
                          <div style={{ color: colors.textMuted, marginBottom: 2 }}>Prezzo acquisto</div>
                          <div style={{ color: colors.text, fontWeight: 600 }}>{item.prezzoAcquisto || '—'}</div>
                        </div>
                        <div>
                          <div style={{ color: colors.textMuted, marginBottom: 2 }}>N. ordine</div>
                          <div style={{ color: colors.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.numeroOrdine || '—'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
