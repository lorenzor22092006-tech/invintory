'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ModelloItem {
  idModello: string
  categoria: string
  fotoUrl: string
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
        background: '#0B1F1A',
        border: '1.5px solid #1B3A34',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
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
            onError={(e) => { ;(e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#1B3A34" strokeWidth="1.5" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.idModello}
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{item.categoria}</div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            background: totale > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
            border: `1px solid ${totale > 0 ? '#10B981' : '#64748B'}`,
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 13,
            fontWeight: 700,
            color: totale > 0 ? '#10B981' : '#64748B',
          }}
        >
          {totale} pz
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="#1B3A34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

  const getTotaleStock = (item: ModelloItem) =>
    item.xsStock + item.sStock + item.mStock + item.lStock

  const filteredAttivi = filtered.filter((item) => getTotaleStock(item) > 0)
  const filteredEsauriti = filtered.filter((item) => getTotaleStock(item) === 0)

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
      <div style={{ padding: '52px 20px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#F8FAFC',
              margin: 0,
            }}
          >
            Modelli
          </h1>
          <button
            onClick={() => router.push('/taglie/nuovo')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#10B981',
              border: 'none',
              color: 'white',
              fontSize: 24,
              fontWeight: 300,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
          >
            +
          </button>
        </div>

        {/* SEARCH */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#0B1F1A',
            border: '1.5px solid #1B3A34',
            borderRadius: 14,
            padding: '0 16px',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Cerca modello..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F8FAFC',
              fontSize: 15,
              padding: '13px 0',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* FILTRO CATEGORIE */}
        {categorie.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'none',
            }}
          >
            {categorie.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaAttiva(cat)}
                style={{
                  flexShrink: 0,
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: `1.5px solid ${categoriaAttiva === cat ? '#10B981' : '#1B3A34'}`,
                  background: categoriaAttiva === cat ? 'rgba(16,185,129,0.15)' : '#0B1F1A',
                  color: categoriaAttiva === cat ? '#10B981' : '#64748B',
                  fontSize: 13,
                  fontWeight: categoriaAttiva === cat ? 700 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LISTA */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: 76,
                  borderRadius: 14,
                  background: '#0B1F1A',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        ) : filteredAttivi.length === 0 && filteredEsauriti.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: '#64748B',
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            {search || categoriaAttiva !== 'Tutte'
              ? 'Nessun modello trovato'
              : 'Nessun modello nel foglio'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* LISTA ATTIVI */}
            {filteredAttivi.map((item) => (
              <ModelCard key={item.idModello} item={item} totale={getTotaleStock(item)} onClick={() => router.push(`/taglie/${encodeURIComponent(item.idModello)}`)} />
            ))}

            {/* BOTTONE CAPI ESAURITI */}
            {filteredEsauriti.length > 0 && (
              <button
                onClick={() => setMostraEsauriti((v) => !v)}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: '#0B1F1A',
                  border: '1.5px solid #1B3A34',
                  color: '#94A3B8',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                  <path d="M9 18l6-6-6-6" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {/* LISTA ESAURITI (collassabile) */}
            {mostraEsauriti && filteredEsauriti.map((item) => (
              <ModelCard key={item.idModello} item={item} totale={0} onClick={() => router.push(`/taglie/${encodeURIComponent(item.idModello)}`)} dimmed />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}