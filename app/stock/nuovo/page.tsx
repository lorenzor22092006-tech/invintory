'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  maxHeight: 240,
  overflowY: 'auto',
  borderRadius: 12,
  border: '1.5px solid #1B3A34',
  background: '#0B1F1A',
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
}

export default function RegistraProdottoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [idModelli, setIdModelli] = useState<string[]>([])
  const [taglie, setTaglie] = useState<string[]>([])
  const [sku, setSku] = useState('')
  const [numeroOrdine, setNumeroOrdine] = useState('')
  const [dataOrdine, setDataOrdine] = useState('')
  const [prezzoAcquisto, setPrezzoAcquisto] = useState('')
  const [idModello, setIdModello] = useState('')
  const [taglia, setTaglia] = useState('')
  const [openPicker, setOpenPicker] = useState<'idModello' | 'taglia' | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/stock/opzioni-modifica')
      .then((r) => (r.ok ? r.json() : null))
      .then((opts: { idModelli: string[]; taglie: string[] } | null) => {
        if (cancelled || !opts) return
        setIdModelli(opts.idModelli || [])
        setTaglie(opts.taglie || [])
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Impossibile caricare ID modello e taglie')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const idOptions = useMemo(() => {
    const v = idModello.trim()
    const list = [...idModelli]
    if (v && !list.includes(v)) list.unshift(v)
    return list
  }, [idModelli, idModello])

  const tagliaOptions = useMemo(() => {
    const v = taglia.trim()
    const list = [...taglie]
    if (v && !list.includes(v)) list.unshift(v)
    return list
  }, [taglie, taglia])

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

  const registra = async () => {
    setError(null)
    if (!sku.trim() || !numeroOrdine.trim() || !dataOrdine.trim() || !prezzoAcquisto.trim()) {
      setError('Compila SKU, N. ordine, data ordine e prezzo acquisto')
      return
    }
    if (!idModello.trim() || !taglia.trim()) {
      setError('Seleziona ID modello e taglia')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: sku.trim(),
          numeroOrdine: numeroOrdine.trim(),
          dataOrdine: dataOrdine.trim(),
          prezzoAcquisto: prezzoAcquisto.trim(),
          idModello: idModello.trim(),
          taglia: taglia.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Registrazione fallita')
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
          Registra prodotto
        </h1>
      </div>

      {loading ? (
        <p style={{ color: '#64748B', fontSize: 14 }}>Caricamento…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>SKU</label>
            <input
              style={inputStyle}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="es. 152"
              inputMode="numeric"
            />
          </div>
          <div>
            <label style={labelStyle}>N. ordine</label>
            <input
              style={inputStyle}
              value={numeroOrdine}
              onChange={(e) => setNumeroOrdine(e.target.value)}
              placeholder="es. PO-098-…"
            />
          </div>
          <div>
            <label style={labelStyle}>Data ordine</label>
            <input
              style={inputStyle}
              value={dataOrdine}
              onChange={(e) => setDataOrdine(e.target.value)}
              placeholder="GG/MM/AAAA"
            />
          </div>
          <div>
            <label style={labelStyle}>Prezzo acquisto</label>
            <input
              style={inputStyle}
              value={prezzoAcquisto}
              onChange={(e) => setPrezzoAcquisto(e.target.value)}
              placeholder="es. € 7,08"
            />
          </div>

          <div>
            <label style={labelStyle}>ID modello</label>
            <button
              type="button"
              onClick={() => setOpenPicker((p) => (p === 'idModello' ? null : 'idModello'))}
              style={{
                ...triggerBase,
                borderColor: openPicker === 'idModello' ? '#10B981' : '#1B3A34',
              }}
            >
              <span style={{ color: idModello ? '#F8FAFC' : '#64748B' }}>
                {idModello || 'Seleziona ID modello…'}
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
            {openPicker === 'idModello' ? (
              <div style={listPanel} role="listbox">
                {idOptions.length === 0 ? (
                  <div style={{ padding: 14, color: '#64748B', fontSize: 14 }}>
                    Nessun modello in TAGLIE_STOCK
                  </div>
                ) : (
                  idOptions.map((opt, idx) => {
                    const sel = opt === idModello
                    return (
                      <button
                        key={opt}
                        type="button"
                        style={{
                          ...optionRow(sel),
                          borderBottom:
                            idx === idOptions.length - 1 ? 'none' : '1px solid #102A24',
                        }}
                        onClick={() => {
                          setIdModello(opt)
                          setOpenPicker(null)
                        }}
                      >
                        {opt}
                      </button>
                    )
                  })
                )}
              </div>
            ) : null}
          </div>

          <div>
            <label style={labelStyle}>Taglia</label>
            <button
              type="button"
              onClick={() => setOpenPicker((p) => (p === 'taglia' ? null : 'taglia'))}
              style={{
                ...triggerBase,
                borderColor: openPicker === 'taglia' ? '#10B981' : '#1B3A34',
              }}
            >
              <span style={{ color: taglia ? '#F8FAFC' : '#64748B' }}>
                {taglia || 'Seleziona taglia…'}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 9l6 6 6-6"
                  stroke="#22C55E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {openPicker === 'taglia' ? (
              <div style={listPanel} role="listbox">
                {tagliaOptions.length === 0 ? (
                  <div style={{ padding: 14, color: '#64748B', fontSize: 14 }}>
                    Nessuna taglia disponibile
                  </div>
                ) : (
                  tagliaOptions.map((opt, idx) => {
                    const sel = opt === taglia
                    return (
                      <button
                        key={opt}
                        type="button"
                        style={{
                          ...optionRow(sel),
                          borderBottom:
                            idx === tagliaOptions.length - 1 ? 'none' : '1px solid #102A24',
                        }}
                        onClick={() => {
                          setTaglia(opt)
                          setOpenPicker(null)
                        }}
                      >
                        {opt}
                      </button>
                    )
                  })
                )}
              </div>
            ) : null}
          </div>

          <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.45 }}>
            Scadenza reso, giorni e stato vengono calcolati dal foglio se hai formule in quelle
            colonne. Esito impostato su <strong style={{ color: '#10B981' }}>In stock</strong>.
          </p>

          {error ? <p style={{ color: '#EF4444', fontSize: 14, margin: 0 }}>{error}</p> : null}

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
