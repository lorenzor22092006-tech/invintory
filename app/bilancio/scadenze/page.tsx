'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PageShell,
  PageHeader,
  BackButton,
  Skeleton,
  EmptyState,
  colors,
  S,
} from '@/components/ui'
import { radius } from '@/lib/theme'

interface ScadenzaItem {
  sku: string
  idModello: string
  taglia: string
  scadenzaReso: string
  giorniRimanenti: number
  fotoUrl: string
}

function giorniColor(giorni: number): string {
  if (giorni <= 3) return colors.danger
  if (giorni <= 7) return colors.warning
  return colors.success
}

export default function ScadenzePage() {
  const router = useRouter()
  const [items, setItems] = useState<ScadenzaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/stock').then((r) => r.json()),
      fetch('/api/taglie').then((r) => r.json()),
    ])
      .then(([stockData, taglieData]) => {
        const stockItems: {
          sku: string
          idModello: string
          taglia: string
          scadenzaReso: string
          giorniRimanenti: number | null
          esito: string
        }[] = stockData.items || []

        const fotoMap: Record<string, string> = {}
        for (const m of taglieData.items || []) {
          if (m.idModello && m.fotoUrl) {
            fotoMap[m.idModello.toUpperCase()] = m.fotoUrl
          }
        }

        const inScadenza: ScadenzaItem[] = stockItems
          .filter(
            (item) =>
              item.esito === 'In stock' &&
              item.giorniRimanenti !== null &&
              item.giorniRimanenti >= 0
          )
          .map((item) => ({
            sku: item.sku,
            idModello: item.idModello,
            taglia: item.taglia,
            scadenzaReso: item.scadenzaReso,
            giorniRimanenti: item.giorniRimanenti as number,
            fotoUrl: fotoMap[item.idModello?.toUpperCase() || ''] || '',
          }))
          .sort((a, b) => a.giorniRimanenti - b.giorniRimanenti)

        setItems(inScadenza)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="Scadenze"
        subtitle="Prodotti in stock con reso in scadenza"
        back={<BackButton onClick={() => router.back()} />}
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="✅" message="Nessun prodotto in scadenza" />
      ) : (
        <div style={{ ...S.card, overflow: 'hidden' }}>
          <div style={S.tableHeader}>
            <span>SKU</span>
            <span>Modello</span>
            <span>Taglia</span>
            <span>Scadenza</span>
            <span>Giorni</span>
            <span />
          </div>
          {items.map((item) => {
            const color = giorniColor(item.giorniRimanenti)
            return (
              <div
                key={item.sku}
                style={{
                  ...S.tableRow,
                  borderLeft: item.giorniRimanenti <= 7 ? `3px solid ${color}` : undefined,
                }}
              >
                <span
                  style={{
                    background: colors.accentSoft,
                    border: `1px solid ${colors.accent}`,
                    borderRadius: radius.sm,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.accent,
                    width: 'fit-content',
                  }}
                >
                  {item.sku}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.idModello || '—'}
                </span>
                <span style={{ fontSize: 13, color: colors.textMuted }}>{item.taglia || '—'}</span>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>{item.scadenzaReso}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color }}>{item.giorniRimanenti}</span>
                <span style={{ fontSize: 11, color, fontWeight: 600 }}>
                  {item.giorniRimanenti === 1 ? 'giorno' : 'giorni'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
