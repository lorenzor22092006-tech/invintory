'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PageShell,
  PageHeader,
  SearchBar,
  Chip,
  ChipRow,
  IconButton,
  EmptyState,
  Skeleton,
  SecondaryButton,
  colors,
  S,
} from '@/components/ui'
import { radius } from '@/lib/theme'

interface TagliaStock {
  taglia: string
  stock: number
  skus: string[]
}

interface ModelloItem {
  idModello: string
  categoria: string
  fotoUrl: string
  taglie: TagliaStock[]
  totale: number
  // legacy (non più usati per il totale, tenuti per compatibilità)
  xsStock: number
  sStock: number
  mStock: number
  lStock: number
  skuXS: string
  skuS: string
  skuM: string
  skuL: string
}

function ModelCard({ item, totale, onClick, dimmed }: { item: ModelloItem; totale: number; onClick: () => void; dimmed?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...S.listRow,
        cursor: 'pointer',
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.sm,
          background: colors.bgElevated,
          border: `1px solid ${colors.border}`,
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
            onError={(e) => { ;(e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke={colors.border} strokeWidth="1.5" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.idModello}
        </div>
        <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>{item.categoria}</div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            background: totale > 0 ? colors.accentSoft : 'rgba(100, 116, 139, 0.12)',
            border: `1px solid ${totale > 0 ? colors.accent : colors.textMuted}`,
            borderRadius: radius.sm,
            padding: '4px 10px',
            fontSize: 13,
            fontWeight: 700,
            color: totale > 0 ? colors.accentBright : colors.textMuted,
          }}
        >
          {totale} pz
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export default function TagliePage() {
  const router = useRouter()
  const [items, setItems] = useState<ModelloItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoriaAttiva, setCategoriaAttiva] = useState<string>('Tutte')
  const [categorie, setCategorie] = useState<string[]>([])
  const [mostraEsauriti, setMostraEsauriti] = useState(false)

  useEffect(() => {
    fetch('/api/taglie')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || [])
        setCategorie(['Tutte', ...(data.categorie || [])])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = items.filter((item) => {
    const q = search.toLowerCase()
    const matchSearch =
      q === '' ||
      item.idModello.toLowerCase().includes(q) ||
      [item.skuXS, item.skuS, item.skuM, item.skuL].some((skuList) =>
        skuList.toLowerCase().includes(q)
      )
    const matchCat = categoriaAttiva === 'Tutte' || item.categoria === categoriaAttiva
    return matchSearch && matchCat
  })

  // totale = tutte le taglie presenti (XL/XXL/numeriche incluse), non solo XS/S/M/L
  const getTotaleStock = (item: ModelloItem) =>
    typeof item.totale === 'number'
      ? item.totale
      : (item.taglie || []).reduce((s, t) => s + (t.stock || 0), 0)

  const filteredAttivi = filtered.filter((item) => getTotaleStock(item) > 0)
  const filteredEsauriti = filtered.filter((item) => getTotaleStock(item) === 0)

  return (
    <PageShell>
      <PageHeader
        title="Modelli"
        subtitle={loading ? undefined : `${filteredAttivi.length} modelli attivi`}
        filters={
          categorie.length > 1 ? (
            <ChipRow>
              {categorie.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  active={categoriaAttiva === cat}
                  onClick={() => setCategoriaAttiva(cat)}
                />
              ))}
            </ChipRow>
          ) : undefined
        }
        action={
          <IconButton
            variant="accent"
            size={44}
            label="Aggiungi modello"
            onClick={() => router.push('/taglie/nuovo')}
          >
            <span style={{ fontSize: 24, fontWeight: 300, lineHeight: 1 }}>+</span>
          </IconButton>
        }
      />

      <div style={{ marginBottom: 20 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cerca modello..."
          onClear={() => setSearch('')}
        />
      </div>

      {loading ? (
        <div className="inv-grid-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={76} />
          ))}
        </div>
      ) : filteredAttivi.length === 0 && filteredEsauriti.length === 0 ? (
        <EmptyState
          icon="📦"
          message={
            search || categoriaAttiva !== 'Tutte'
              ? 'Nessun modello trovato'
              : 'Nessun modello nel foglio'
          }
        />
      ) : (
        <div className="inv-grid-3">
          {filteredAttivi.map((item) => (
            <ModelCard key={item.idModello} item={item} totale={getTotaleStock(item)} onClick={() => router.push(`/taglie/${encodeURIComponent(item.idModello)}`)} />
          ))}

          {filteredEsauriti.length > 0 && (
            <SecondaryButton
              fullWidth
              onClick={() => setMostraEsauriti((v) => !v)}
              style={{
                gridColumn: '1 / -1',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: colors.textSecondary,
              }}
            >
              <span>📦 Capi esauriti ({filteredEsauriti.length})</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                style={{ transform: mostraEsauriti ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <path d="M9 18l6-6-6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </SecondaryButton>
          )}

          {mostraEsauriti && filteredEsauriti.map((item) => (
            <ModelCard key={item.idModello} item={item} totale={0} onClick={() => router.push(`/taglie/${encodeURIComponent(item.idModello)}`)} dimmed />
          ))}
        </div>
      )}
    </PageShell>
  )
}
