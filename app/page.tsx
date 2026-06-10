'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function HomePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState<'scadenza' | 'sku'>('scadenza')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [sortAsc, setSortAsc] = useState(true)
  const [searchHit, setSearchHit] = useState<StockItem | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stock')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const inScadenza = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        item.esito === 'In stock' &&
        item.giorniRimanenti !== null &&
        item.giorniRimanenti >= 0
    )
    return [...filtered].sort((a, b) => {
      const cmp = sortMode === 'sku'
        ? a.sku.localeCompare(b.sku, 'it', { numeric: true })
        : (a.giorniRimanenti ?? 0) - (b.giorniRimanenti ?? 0)
      return sortAsc ? cmp : -cmp
    })
  }, [items, sortMode, sortAsc])

  useEffect(() => {
    if (!search.trim()) {
      setSearchHit(null)
      setSearchError(null)
    }
  }, [search])

  function findProductBySkuQuery(q: string): StockItem | null {
    const ql = q.trim().toLowerCase()
    if (!ql) return null
    const norm = (s: string) => s.trim().toLowerCase()
    const exact = items.find((i) => norm(i.sku) === ql)
    if (exact) return exact
    const starts = items.filter((i) => norm(i.sku).startsWith(ql))
    if (starts.length >= 1) {
      return [...starts].sort((a, b) => norm(a.sku).length - norm(b.sku).length)[0]
    }
    const incl = items.filter((i) => norm(i.sku).includes(ql))
    if (incl.length >= 1) {
      return [...incl].sort((a, b) => norm(a.sku).length - norm(b.sku).length)[0]
    }
    return null
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    setSearchHit(null)
    setSearchError(null)
    if (!q) return
    if (loading) {
      setSearchError('Attendi il caricamento dello stock e riprova.')
      return
    }
    const hit = findProductBySkuQuery(q)
    if (hit) {
      setSearchHit(hit)
    } else {
      setSearchError(`Nessun prodotto con SKU che corrisponde a «${q}».`)
    }
  }

  const clearSearchBanner = () => {
    setSearchHit(null)
    setSearchError(null)
  }

  const getScadenzaColor = (giorni: number | null) => {
    if (giorni === null) return '#64748B'
    if (giorni <= 3) return '#EF4444'
    if (giorni <= 7) return '#F59E0B'
    return '#22C55E'
  }

  const getScadenzaLabel = (giorni: number | null) => {
    if (giorni === null) return ''
    if (giorni === 0) return 'Scade oggi'
    if (giorni === 1) return '1 giorno'
    return `${giorni} giorni`
  }

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
      <div
        style={{
          padding: '56px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 8,
        }}
      >
        <img
          src="/invintory-logo.png"
          alt=""
          width={220}
          height={220}
          style={{
            width: 'min(200px, 72vw)',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: '#F8FAFC',
            letterSpacing: '0.2em',
            margin: '10px 0 0',
            textTransform: 'uppercase',
          }}
        >
          INVINTORY
        </h1>
        <p
          style={{
            fontSize: 15,
            color: '#64748B',
            margin: '8px 0 0',
          }}
        >
          Gestisci il tuo stock
        </p>
      </div>

      {/* SEARCH BAR */}
      <div style={{ padding: '0 20px 28px' }}>
        <form onSubmit={handleSearch}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0B1F1A',
              border: '1.5px solid #1B3A34',
              borderRadius: 14,
              padding: '0 16px',
              gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Cerca per SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#F8FAFC',
                fontSize: 15,
                padding: '14px 0',
              }}
            />
            {search && (
              <button
                type="submit"
                style={{
                  background: '#10B981',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                Cerca
              </button>
            )}
          </div>
        </form>

        {(searchHit || searchError) && (
          <div style={{ marginTop: 16 }}>
            {searchHit ? (
              <div
                style={{
                  background: '#0B1F1A',
                  border: '2px solid #10B981',
                  borderRadius: 14,
                  padding: '16px 14px',
                  boxShadow: '0 4px 24px rgba(16,185,129,0.2)',
                  position: 'relative',
                }}
              >
                <button
                  type="button"
                  onClick={clearSearchBanner}
                  aria-label="Chiudi risultato ricerca"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: '1px solid #1B3A34',
                    background: '#102A24',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    fontSize: 18,
                  }}
                >
                  ×
                </button>
                <p
                  style={{
                    margin: '0 40px 12px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#10B981',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Risultato ricerca
                </p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      minWidth: 52,
                      height: 52,
                      borderRadius: 12,
                      background: '#102A24',
                      border: '1px solid #1B3A34',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 9, color: '#64748B', fontWeight: 600 }}>SKU</span>
                    <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>
                      {searchHit.sku}
                    </span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#F8FAFC',
                        lineHeight: 1.25,
                      }}
                    >
                      {searchHit.idModello || '—'}
                    </div>
                    <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>
                      Taglia {searchHit.taglia || 'n.d.'} · {searchHit.esito || '—'}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px 12px',
                    fontSize: 13,
                    color: '#94A3B8',
                    borderTop: '1px solid #1B3A34',
                    paddingTop: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Ordine</div>
                    <div style={{ color: '#F8FAFC' }}>{searchHit.numeroOrdine || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Data ordine</div>
                    <div style={{ color: '#F8FAFC' }}>{searchHit.dataOrdine || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Prezzo acquisto</div>
                    <div style={{ color: '#F8FAFC' }}>{searchHit.prezzoAcquisto || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Scadenza reso</div>
                    <div style={{ color: '#F8FAFC' }}>{searchHit.scadenzaReso || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Giorni rimanenti</div>
                    <div
                      style={{
                        color: getScadenzaColor(searchHit.giorniRimanenti),
                        fontWeight: 700,
                      }}
                    >
                      {searchHit.giorniRimanenti === null
                        ? '—'
                        : getScadenzaLabel(searchHit.giorniRimanenti)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/stock/${encodeURIComponent(searchHit.sku)}/modifica`)
                  }
                  style={{
                    marginTop: 14,
                    width: '100%',
                    background: '#10B981',
                    border: 'none',
                    borderRadius: 14,
                    color: 'white',
                    fontSize: 15,
                    fontWeight: 700,
                    padding: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Modifica prodotto
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: '#0B1F1A',
                  border: '1.5px solid #1B3A34',
                  borderRadius: 14,
                  padding: '14px 40px 14px 14px',
                  color: '#EF4444',
                  fontSize: 14,
                  position: 'relative',
                }}
              >
                <button
                  type="button"
                  onClick={clearSearchBanner}
                  aria-label="Chiudi messaggio"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: '1px solid #1B3A34',
                    background: '#102A24',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    fontSize: 18,
                  }}
                >
                  ×
                </button>
                {searchError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TWO BIG BUTTONS */}
      <div style={{ padding: '0 20px 36px', display: 'flex', gap: 12 }}>
        <button
          onClick={() => router.push('/vendite/nuova')}
          style={{
            flex: 1,
            background: '#10B981',
            border: 'none',
            borderRadius: 16,
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(16,185,129,0.25)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            style={{
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            Registra{'\n'}Vendita
          </span>
        </button>

        <button
          onClick={() => router.push('/stock/nuovo')}
          style={{
            flex: 1,
            background: '#0B1F1A',
            border: '1.5px solid #1B3A34',
            borderRadius: 16,
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(16,185,129,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#10B981" strokeWidth="2" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#10B981" strokeWidth="2" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#10B981" strokeWidth="2" />
              <path d="M17.5 14v7M14 17.5h7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span
            style={{
              color: '#F8FAFC',
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            Registra{'\n'}Prodotto
          </span>
        </button>
      </div>

      {/* REGISTRA RESO */}
      <div style={{ padding: '0 20px 36px' }}>
        <button
          onClick={() => router.push('/resi/nuovo')}
          style={{
            width: '100%',
            background: '#0B1F1A',
            border: '1.5px solid #1B3A34',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 14l-4-4 4-4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 10h11a4 4 0 0 1 0 8h-1" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 700 }}>Registra Reso</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto' }}>
            <path d="M9 18l6-6-6-6" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* PRODOTTI IN SCADENZA */}
      <div style={{ padding: '0 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 14,
          }}
        >
          {/* dropdown a sinistra */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setSortMenuOpen((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#102A24', border: '1.5px solid #1B3A34',
                borderRadius: 10, padding: '7px 12px', cursor: 'pointer', color: '#10B981',
                fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
              }}
            >
              {sortMode === 'scadenza' ? 'Per scadenza' : 'Per SKU'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {sortMenuOpen && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, zIndex: 50,
                background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 12,
                overflow: 'hidden', minWidth: 140, boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              }}>
                {(['scadenza', 'sku'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setSortMode(mode); setSortMenuOpen(false) }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '11px 14px',
                      border: 'none', borderBottom: mode === 'scadenza' ? '1px solid #102A24' : 'none',
                      background: sortMode === mode ? 'rgba(16,185,129,0.15)' : 'transparent',
                      color: sortMode === mode ? '#10B981' : '#F8FAFC',
                      fontSize: 13, fontWeight: sortMode === mode ? 700 : 400, cursor: 'pointer',
                    }}
                  >
                    {mode === 'scadenza' ? 'Per scadenza' : 'Per SKU'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* freccia + contatore a destra */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>
              {loading ? '...' : `${inScadenza.length} prodotti`}
            </span>
            <button
              type="button"
              onClick={() => setSortAsc((v) => !v)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1.5px solid #1B3A34', background: '#102A24',
                color: '#10B981', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transform: sortAsc ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 72,
                  borderRadius: 14,
                  background: '#0B1F1A',
                  opacity: 0.5,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : inScadenza.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#64748B',
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            Nessun prodotto in scadenza
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {inScadenza.map((item) => (
              <div
                key={item.sku}
                style={{
                  background: '#0B1F1A',
                  border: '1.5px solid #1B3A34',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                {/* Left: SKU + info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {/* SKU badge */}
                  <div
                    style={{
                      minWidth: 44,
                      height: 44,
                      borderRadius: 10,
                      background: '#102A24',
                      border: '1px solid #1B3A34',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 9, color: '#64748B', fontWeight: 600 }}>SKU</span>
                    <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>
                      {item.sku}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#F8FAFC',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.idModello || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {item.taglia ? `Taglia ${item.taglia}` : 'Taglia n.d.'} · Scade{' '}
                      {item.scadenzaReso}
                    </div>
                  </div>
                </div>

                {/* Right: modifica + giorni rimanenti */}
                <div
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/stock/${encodeURIComponent(item.sku)}/modifica`)
                    }
                    title="Modifica prodotto"
                    aria-label={`Modifica prodotto SKU ${item.sku}`}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: '1.5px solid #1B3A34',
                      background: '#102A24',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div style={{ textAlign: 'right', minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: getScadenzaColor(item.giorniRimanenti),
                      }}
                    >
                      {getScadenzaLabel(item.giorniRimanenti)}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>rimanenti</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}