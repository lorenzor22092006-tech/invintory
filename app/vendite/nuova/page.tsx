'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface StockItem {
  sku: string
  esito: string
  idModello: string
  taglia: string
}

const triggerBase: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  background: '#061311',
  border: '1.5px solid #1B3A34',
  borderRadius: 12,
  color: '#F8FAFC',
  fontSize: 15,
  padding: '12px 14px',
  cursor: 'pointer',
  textAlign: 'left',
  boxSizing: 'border-box',
}

const listPanel: React.CSSProperties = {
  marginTop: 8,
  maxHeight: 280,
  overflowY: 'auto',
  borderRadius: 12,
  border: '1.5px solid #1B3A34',
  background: '#0B1F1A',
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
}

export default function RegistraVenditaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skusInStock, setSkusInStock] = useState<StockItem[]>([])
  const [venditori, setVenditori] = useState<string[]>([])
  const [sku, setSku] = useState('')
  const [prezzoVendita, setPrezzoVendita] = useState('')
  const [dataVendita, setDataVendita] = useState(() => {
    const t = new Date()
    return t.toISOString().slice(0, 10)
  })
  const [venditore, setVenditore] = useState('')
  const [skuOpen, setSkuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/stock').then((r) => r.json()),
      fetch('/api/config').then((r) => r.json()),
    ])
      .then(([stockData, cfg]) => {
        if (cancelled) return
        const items: StockItem[] = (stockData.items || []).map(
          (it: { sku: string; esito: string; idModello: string; taglia: string }) => ({
            sku: String(it.sku ?? '').trim(),
            esito: String(it.esito ?? '').trim(),
            idModello: String(it.idModello ?? ''),
            taglia: String(it.taglia ?? ''),
          })
        )
        const inStock = items
          .filter((it) => it.sku && (it.esito === 'In stock' || it.esito === 'Reso, ma in stock'))
          .sort((a, b) => a.sku.localeCompare(b.sku, 'it', { numeric: true }))
        setSkusInStock(inStock)
        const nomi = (cfg.venditori || [])
          .map((v: { nome: string }) => String(v.nome ?? '').trim())
          .filter(Boolean)
        setVenditori(nomi)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Impossibile caricare stock o configurazione')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedCapo = useMemo(
    () => skusInStock.find((s) => s.sku === sku),
    [skusInStock, sku]
  )

  const optionRow = (selected: boolean): React.CSSProperties => ({
    width: '100%',
    textAlign: 'left',
    padding: '12px 14px',
    border: 'none',
    borderBottom: '1px solid #102A24',
    background: selected ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
    color: '#F8FAFC',
    fontSize: 15,
    cursor: 'pointer',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#061311',
    border: '1.5px solid #1B3A34',
    borderRadius: 12,
    color: '#F8FAFC',
    fontSize: 15,
    padding: '12px 14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: 6,
  }

  const registra = async () => {
    setError(null)
    if (!sku.trim()) {
      setError('Seleziona uno SKU')
      return
    }
    if (!prezzoVendita.trim()) {
      setError('Inserisci il prezzo di vendita')
      return
    }
    if (!dataVendita) {
      setError('Inserisci la data di vendita')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/vendite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: sku.trim(),
          prezzoVendita: prezzoVendita.replace(',', '.'),
          dataVendita,
          venditore: venditore.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Registrazione fallita')
      }
      router.push('/')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#061311',
        maxWidth: 430,
        margin: '0 auto',
        padding: '20px 20px 100px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: '1.5px solid #1B3A34',
            background: '#0B1F1A',
            color: '#F8FAFC',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Indietro"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#F8FAFC',
            margin: 0,
          }}
        >
          Registra vendita
        </h1>
      </div>

      {loading ? (
        <p style={{ color: '#64748B', fontSize: 14 }}>Caricamento…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>SKU</label>
            <button
              type="button"
              onClick={() => setSkuOpen((o) => !o)}
              style={{
                ...triggerBase,
                borderColor: skuOpen ? '#10B981' : '#1B3A34',
              }}
            >
              <span style={{ color: sku ? '#F8FAFC' : '#64748B' }}>
                {sku || 'Seleziona SKU…'}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 9l6 6 6-6"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {skuOpen ? (
              <div style={listPanel} role="listbox">
                {skusInStock.length === 0 ? (
                  <div style={{ padding: 14, color: '#64748B', fontSize: 14 }}>
                    Nessun prodotto in stock disponibile
                  </div>
                ) : (
                  skusInStock.map((it, idx) => {
                    const sel = it.sku === sku
                    return (
                      <button
                        key={it.sku}
                        type="button"
                        role="option"
                        aria-selected={sel}
                        style={{
                          ...optionRow(sel),
                          borderBottom:
                            idx === skusInStock.length - 1 ? 'none' : '1px solid #102A24',
                        }}
                        onClick={() => {
                          setSku(it.sku)
                          setSkuOpen(false)
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{it.sku}</span>
                        <span style={{ color: '#64748B', fontSize: 13, marginLeft: 8 }}>
                          {(it.idModello || '—') + (it.taglia ? ` · ${it.taglia}` : '')}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            ) : null}
            {selectedCapo ? (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748B' }}>
                {selectedCapo.idModello || 'Modello n.d.'}
                {selectedCapo.taglia ? ` · taglia ${selectedCapo.taglia}` : ''}
              </p>
            ) : null}
          </div>

          <div>
            <label style={labelStyle}>Prezzo vendita</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="es. 35 o 35,50"
              value={prezzoVendita}
              onChange={(e) => setPrezzoVendita(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Data vendita</label>
            <input
              type="date"
              value={dataVendita}
              onChange={(e) => setDataVendita(e.target.value)}
              style={{
                ...inputStyle,
                colorScheme: 'dark',
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Venditore (opzionale)</label>
            <select
              value={venditore}
              onChange={(e) => setVenditore(e.target.value)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                colorScheme: 'dark',
                WebkitAppearance: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: 40,
              }}
            >
              <option value="" style={{ background: '#0B1F1A', color: '#94A3B8' }}>
                Nessuno
              </option>
              {venditori.map((v) => (
                <option key={v} value={v} style={{ background: '#0B1F1A', color: '#F8FAFC' }}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p style={{ color: '#EF4444', fontSize: 14, margin: 0 }}>{error}</p>
          ) : null}

          <button
            type="button"
            disabled={submitting}
            onClick={registra}
            style={{
              marginTop: 8,
              width: '100%',
              background: submitting ? '#059669' : '#10B981',
              border: 'none',
              borderRadius: 16,
              color: 'white',
              fontSize: 16,
              fontWeight: 700,
              padding: '16px',
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: '0 4px 24px rgba(16,185,129,0.25)',
              letterSpacing: '0.04em',
            }}
          >
            {submitting ? 'Registrazione…' : 'REGISTRA'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => router.back()}
            style={{
              width: '100%',
              background: '#0B1F1A',
              border: '1.5px solid #1B3A34',
              borderRadius: 16,
              color: '#94A3B8',
              fontSize: 16,
              fontWeight: 700,
              padding: '14px',
              cursor: submitting ? 'default' : 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            ANNULLA
          </button>
        </div>
      )}
    </div>
  )
}
