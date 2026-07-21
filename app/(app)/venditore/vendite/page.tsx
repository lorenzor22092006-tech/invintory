'use client'

import { useEffect, useState } from 'react'
import { Vendita } from '@/lib/types'
import {
  PageShell,
  PageHeader,
  SearchBar,
  EmptyState,
  Skeleton,
  colors,
  S,
  euro,
} from '@/components/ui'
import { radius } from '@/lib/theme'

export default function VenditeVenditorePage() {
  const [vendite, setVendite] = useState<Vendita[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

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

  const filtered = vendite.filter(
    (v) =>
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.idModello.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageShell>
      <PageHeader
        title="Le mie vendite"
        subtitle={loading ? undefined : `${filtered.length} vendite`}
      />

      <div style={{ marginBottom: 20 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cerca SKU o modello..."
          onClear={() => setSearch('')}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={52} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🛍️"
          message={search ? 'Nessuna vendita trovata' : 'Non hai ancora registrato vendite'}
        />
      ) : (
        <div style={{ ...S.card, overflow: 'hidden' }}>
          {filtered.map((v, i) => {
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
                    {v.sku}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.idModello || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{v.dataVendita}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: colors.accentBright }}>{euro(v.prezzoVendita)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors.success, marginTop: 2 }}>tua fee {euro(v.fee)}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                    <path d="M6 9l6 6 6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {open && (
                  <div style={{ padding: '2px 16px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 12px', fontSize: 12 }}>
                      <div>
                        <div style={{ color: colors.textMuted, marginBottom: 2 }}>Taglia</div>
                        <div style={{ color: colors.text, fontWeight: 600 }}>{v.taglia || '—'}</div>
                      </div>
                      <div>
                        <div style={{ color: colors.textMuted, marginBottom: 2 }}>Data</div>
                        <div style={{ color: colors.text, fontWeight: 600 }}>{v.dataVendita}</div>
                      </div>
                      <div>
                        <div style={{ color: colors.textMuted, marginBottom: 2 }}>Prezzo vendita</div>
                        <div style={{ color: colors.text, fontWeight: 600 }}>{euro(v.prezzoVendita)}</div>
                      </div>
                      <div>
                        <div style={{ color: colors.textMuted, marginBottom: 2 }}>La tua fee</div>
                        <div style={{ color: colors.success, fontWeight: 700 }}>{euro(v.fee)}</div>
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
