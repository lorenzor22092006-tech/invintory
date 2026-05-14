'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScadenzaItem {
  sku: string
  idModello: string
  taglia: string
  scadenzaReso: string
  giorniRimanenti: number
  fotoUrl: string
}

function giorniColor(giorni: number): string {
  if (giorni <= 3) return '#EF4444'
  if (giorni <= 7) return '#F59E0B'
  return '#22C55E'
}

function giorniLabel(giorni: number): string {
  if (giorni === 0) return 'Scade oggi'
  if (giorni === 1) return '1 giorno'
  return `${giorni} giorni`
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
    <div
      style={{
        minHeight: '100dvh',
        background: '#061311',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 430,
        margin: '0 auto',
        paddingBottom: 90,
      }}
    >
      {/* HEADER */}
      <div style={{ padding: '52px 20px 0' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: '#10B981',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 20,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Indietro
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC', margin: '0 0 4px' }}>
          Scadenze
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px' }}>
          Prodotti in stock con reso in scadenza
        </p>
      </div>

      {/* LISTA */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 80, borderRadius: 14, background: '#0B1F1A', opacity: 0.5 }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            Nessun prodotto in scadenza
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item) => {
              const color = giorniColor(item.giorniRimanenti)
              return (
                <div
                  key={item.sku}
                  style={{
                    background: '#0B1F1A',
                    border: `1.5px solid ${item.giorniRimanenti <= 7 ? color + '55' : '#1B3A34'}`,
                    borderRadius: 14,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  {/* FOTO */}
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      background: '#102A24',
                      border: '1px solid #1B3A34',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.fotoUrl ? (
                      <img
                        src={`/api/image-proxy?url=${encodeURIComponent(item.fotoUrl)}`}
                        alt={item.idModello}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="3" stroke="#1B3A34" strokeWidth="1.5" />
                        <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#1B3A34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* INFO */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* SKU badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                      <span
                        style={{
                          background: 'rgba(16,185,129,0.12)',
                          border: '1px solid #10B981',
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#10B981',
                          flexShrink: 0,
                        }}
                      >
                        {item.sku}
                      </span>
                      {item.taglia && (
                        <span style={{ fontSize: 11, color: '#64748B' }}>
                          Taglia {item.taglia}
                        </span>
                      )}
                    </div>

                    {/* Modello */}
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#F8FAFC',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 3,
                      }}
                    >
                      {item.idModello || '—'}
                    </div>

                    {/* Data scadenza */}
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      Scade il {item.scadenzaReso}
                    </div>
                  </div>

                  {/* GIORNI RIMANENTI */}
                  <div
                    style={{
                      flexShrink: 0,
                      background: color + '18',
                      border: `1.5px solid ${color}`,
                      borderRadius: 10,
                      padding: '8px 12px',
                      textAlign: 'center',
                      minWidth: 60,
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>
                      {item.giorniRimanenti}
                    </div>
                    <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 2 }}>
                      {item.giorniRimanenti === 1 ? 'giorno' : 'giorni'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
