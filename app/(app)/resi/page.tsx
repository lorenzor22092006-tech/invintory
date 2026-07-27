'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  PageShell,
  PageHeader,
  SearchBar,
  EmptyState,
  Skeleton,
  colors,
  S,
} from '@/components/ui'
import { radius } from '@/lib/theme'

interface Reso {
  sku: string
  idModello: string
  taglia: string
  numeroOrdine: string
  prezzoAcquisto: string
  dataReso: string
  pacco: number | null
}

interface Pacco {
  numero: number | null
  articoli: Reso[]
  dataReso: string
}

export default function StoricoResiPage() {
  const [resi, setResi] = useState<Reso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/resi')
      .then((r) => r.json())
      .then((data: Reso[]) => {
        setResi(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // raggruppa i resi per numero di pacco (i resi vecchi senza pacco finiscono in "senza numero")
  const pacchi = useMemo<Pacco[]>(() => {
    const map = new Map<number | null, Reso[]>()
    for (const r of resi) {
      const key = r.pacco ?? null
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    const list: Pacco[] = Array.from(map.entries()).map(([numero, articoli]) => ({
      numero,
      articoli,
      dataReso: articoli[0]?.dataReso || '',
    }))
    // numeri più alti (recenti) in cima; i senza numero in fondo
    return list.sort((a, b) => {
      if (a.numero === null) return 1
      if (b.numero === null) return -1
      return b.numero - a.numero
    })
  }, [resi])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pacchi
    return pacchi
      .map((p) => ({
        ...p,
        articoli: p.articoli.filter(
          (r) =>
            r.sku.toLowerCase().includes(q) ||
            r.idModello.toLowerCase().includes(q) ||
            r.numeroOrdine.toLowerCase().includes(q) ||
            (p.numero !== null && `pacco reso ${p.numero}`.includes(q))
        ),
      }))
      .filter((p) => p.articoli.length > 0)
  }, [pacchi, search])

  return (
    <PageShell>
      <PageHeader
        title="Storico resi"
        subtitle={loading ? undefined : `${filtered.length} pacchi da fare`}
      />

      <div style={{ marginBottom: 20 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cerca pacco, SKU, modello…"
          onClear={() => setSearch('')}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={64} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📦" message={search ? 'Nessun pacco trovato' : 'Nessun pacco reso da fare'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((p) => {
            const key = p.numero ?? -1
            const open = expanded === key
            const titolo = p.numero !== null ? `Pacco reso ${p.numero}` : 'Resi senza pacco'
            return (
              <div key={key} style={{ ...S.card, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpanded(open ? null : key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>📦</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{titolo}</div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      {p.articoli.length} {p.articoli.length === 1 ? 'articolo' : 'articoli'}
                      {p.dataReso ? ` · ${p.dataReso}` : ''}
                    </div>
                  </div>
                  <span
                    style={{
                      background: colors.accentSoft,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: radius.sm,
                      padding: '3px 9px',
                      fontSize: 13,
                      fontWeight: 800,
                      color: colors.accentBright,
                      flexShrink: 0,
                    }}
                  >
                    {p.articoli.length}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                    <path d="M6 9l6 6 6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {open && (
                  <div style={{ borderTop: `1px solid ${colors.border}` }}>
                    {p.articoli.map((r, i) => (
                      <div
                        key={r.sku + i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 16px',
                          borderTop: i > 0 ? `1px solid ${colors.border}` : 'none',
                        }}
                      >
                        <span
                          style={{
                            background: colors.accentSoft,
                            border: `1px solid ${colors.accent}`,
                            borderRadius: radius.sm,
                            padding: '3px 8px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: colors.accentBright,
                            flexShrink: 0,
                          }}
                        >
                          {r.sku}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.idModello || '—'}
                          </div>
                          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                            Taglia {r.taglia || 'n.d.'}
                            {r.numeroOrdine ? ` · ${r.numeroOrdine}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
