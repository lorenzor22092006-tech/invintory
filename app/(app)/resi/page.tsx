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
}

export default function StoricoResiPage() {
  const [resi, setResi] = useState<Reso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/resi')
      .then((r) => r.json())
      .then((data: Reso[]) => {
        setResi(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return resi
    return resi.filter(
      (r) =>
        r.sku.toLowerCase().includes(q) ||
        r.idModello.toLowerCase().includes(q) ||
        r.numeroOrdine.toLowerCase().includes(q)
    )
  }, [resi, search])

  return (
    <PageShell>
      <PageHeader
        title="Storico resi"
        subtitle={loading ? undefined : `${filtered.length} resi registrati`}
      />

      <div style={{ marginBottom: 20 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cerca SKU, modello, numero ordine…"
          onClear={() => setSearch('')}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={52} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="↩️" message={search ? 'Nessun reso trovato' : 'Nessun reso registrato'} />
      ) : (
        <div style={{ ...S.card, overflow: 'hidden' }}>
          {filtered.map((r, i) => {
            const open = expandedIdx === i
            return (
              <div key={i} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                <div
                  onClick={() => setExpandedIdx(open ? null : i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', cursor: 'pointer' }}
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
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{r.dataReso || '—'}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                    <path d="M6 9l6 6 6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {open && (
                  <div style={{ padding: '2px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 12px', fontSize: 12 }}>
                      <div>
                        <div style={{ color: colors.textMuted, marginBottom: 2 }}>Taglia</div>
                        <div style={{ color: colors.text, fontWeight: 600 }}>{r.taglia || '—'}</div>
                      </div>
                      <div>
                        <div style={{ color: colors.textMuted, marginBottom: 2 }}>Prezzo acquisto</div>
                        <div style={{ color: colors.text, fontWeight: 600 }}>{r.prezzoAcquisto || '—'}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ color: colors.textMuted, marginBottom: 2 }}>Numero ordine</div>
                        <div style={{ color: colors.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.numeroOrdine || '—'}
                        </div>
                      </div>
                    </div>
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
