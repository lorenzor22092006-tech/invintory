'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

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

const esiti = ['In stock', 'Venduto', 'Reso', 'Reso, ma in stock'] as const

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

export default function ModificaProdottoPage() {
  const params = useParams()
  const router = useRouter()
  const rawSku = typeof params.sku === 'string' ? params.sku : ''
  const sku = decodeURIComponent(rawSku)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<StockItem>>({})
  const [idModelli, setIdModelli] = useState<string[]>([])
  const [taglie, setTaglie] = useState<string[]>([])
  const [openPicker, setOpenPicker] = useState<'idModello' | 'taglia' | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (!sku) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setOptionsError(null)

    fetch(`/api/stock/${encodeURIComponent(sku)}`)
      .then((r) => {
        if (!r.ok) throw new Error('prod')
        return r.json() as Promise<{ item: StockItem }>
      })
      .then((data) => {
        if (cancelled) return
        setForm(data.item)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Impossibile caricare il prodotto')
        setLoading(false)
      })

    fetch('/api/stock/opzioni-modifica')
      .then((r) => {
        if (!r.ok) throw new Error('opts')
        return r.json() as Promise<{ idModelli: string[]; taglie: string[] }>
      })
      .then((opts) => {
        if (cancelled) return
        setIdModelli(opts.idModelli || [])
        setTaglie(opts.taglie || [])
        setOptionsError(null)
      })
      .catch(() => {
        if (cancelled) return
        setOptionsError(
          'Impossibile caricare gli elenchi da foglio (ID modello / taglia).'
        )
      })

    return () => {
      cancelled = true
    }
  }, [sku])

  const idOptions = useMemo(() => {
    const v = (form.idModello ?? '').trim()
    const list = [...idModelli]
    if (v && !list.includes(v)) list.unshift(v)
    return list
  }, [idModelli, form.idModello])

  const tagliaOptions = useMemo(() => {
    const v = (form.taglia ?? '').trim()
    const list = [...taglie]
    if (v && !list.includes(v)) list.unshift(v)
    return list
  }, [taglie, form.taglia])

  const update =
    (field: keyof StockItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
    }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(sku)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroOrdine: form.numeroOrdine,
          dataOrdine: form.dataOrdine,
          prezzoAcquisto: form.prezzoAcquisto,
          scadenzaReso: form.scadenzaReso,
          esito: form.esito,
          idModello: form.idModello,
          taglia: form.taglia,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Salvataggio fallito')
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(sku)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Eliminazione fallita')
      }
      setDeleteConfirmOpen(false)
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally {
      setDeleting(false)
    }
  }

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
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
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#F8FAFC',
              margin: 0,
            }}
          >
            Modifica prodotto
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>SKU {sku}</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#64748B', fontSize: 14 }}>Caricamento…</p>
      ) : error && !form.sku ? (
        <p style={{ color: '#EF4444', fontSize: 14 }}>{error}</p>
      ) : (
        <>
          {optionsError ? (
            <p style={{ color: '#F59E0B', fontSize: 13, marginBottom: 12 }}>{optionsError}</p>
          ) : null}
          <form onSubmit={submit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Numero ordine</label>
                <input
                  style={inputStyle}
                  value={form.numeroOrdine ?? ''}
                  onChange={update('numeroOrdine')}
                />
              </div>
              <div>
                <label style={labelStyle}>Data ordine</label>
                <input
                  style={inputStyle}
                  value={form.dataOrdine ?? ''}
                  onChange={update('dataOrdine')}
                  placeholder="GG/MM/AAAA"
                />
              </div>
              <div>
                <label style={labelStyle}>Prezzo acquisto</label>
                <input
                  style={inputStyle}
                  value={form.prezzoAcquisto ?? ''}
                  onChange={update('prezzoAcquisto')}
                  placeholder="es. € 19,34"
                />
              </div>
              <div>
                <label style={labelStyle}>Scadenza reso</label>
                <input
                  style={inputStyle}
                  value={form.scadenzaReso ?? ''}
                  onChange={update('scadenzaReso')}
                  placeholder="GG/MM/AAAA"
                />
              </div>

              <div>
                <label style={labelStyle}>ID modello</label>
                <button
                  type="button"
                  onClick={() =>
                    setOpenPicker((p) => (p === 'idModello' ? null : 'idModello'))
                  }
                  style={{
                    ...triggerBase,
                    borderColor: openPicker === 'idModello' ? '#10B981' : '#1B3A34',
                  }}
                >
                  <span style={{ color: form.idModello ? '#F8FAFC' : '#64748B' }}>
                    {form.idModello?.trim() ? form.idModello : 'Seleziona ID modello…'}
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
                        Nessun ID modello in TAGLIE_STOCK
                      </div>
                    ) : (
                      idOptions.map((opt) => {
                        const sel = (form.idModello ?? '').trim() === opt
                        return (
                          <button
                            key={opt}
                            type="button"
                            role="option"
                            aria-selected={sel}
                            style={{
                              ...optionRow(sel),
                              borderBottom:
                                opt === idOptions[idOptions.length - 1]
                                  ? 'none'
                                  : '1px solid #102A24',
                            }}
                            onClick={() => {
                              setForm((f) => ({ ...f, idModello: opt }))
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
                  <span style={{ color: form.taglia ? '#F8FAFC' : '#64748B' }}>
                    {form.taglia?.trim() ? form.taglia : 'Seleziona taglia…'}
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
                        Nessuna taglia nella colonna Taglia di STOCK
                      </div>
                    ) : (
                      tagliaOptions.map((opt) => {
                        const sel = (form.taglia ?? '').trim() === opt
                        return (
                          <button
                            key={opt}
                            type="button"
                            role="option"
                            aria-selected={sel}
                            style={{
                              ...optionRow(sel),
                              borderBottom:
                                opt === tagliaOptions[tagliaOptions.length - 1]
                                  ? 'none'
                                  : '1px solid #102A24',
                            }}
                            onClick={() => {
                              setForm((f) => ({ ...f, taglia: opt }))
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
                <label style={labelStyle}>Esito</label>
                <select
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
                  value={form.esito ?? 'In stock'}
                  onChange={update('esito')}
                >
                  {esiti.map((opt) => (
                    <option
                      key={opt}
                      value={opt}
                      style={{ background: '#0B1F1A', color: '#F8FAFC' }}
                    >
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              {(form.giorniRimanenti !== null && form.giorniRimanenti !== undefined) ||
              form.statoScadenza ? (
                <div
                  style={{
                    background: '#0B1F1A',
                    border: '1.5px solid #1B3A34',
                    borderRadius: 14,
                    padding: 14,
                    fontSize: 13,
                    color: '#64748B',
                  }}
                >
                  {form.statoScadenza ? (
                    <div style={{ marginBottom: 4 }}>{form.statoScadenza}</div>
                  ) : null}
                  {form.giorniRimanenti !== null && form.giorniRimanenti !== undefined ? (
                    <div>Giorni rimanenti (foglio): {form.giorniRimanenti}</div>
                  ) : null}
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    Aggiornando la scadenza, il foglio ricalcolerà giorni e stato se ci sono formule.
                  </div>
                </div>
              ) : null}
            </div>

            {error ? (
              <p style={{ color: '#EF4444', fontSize: 14, marginTop: 16 }}>{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 28,
                width: '100%',
                background: saving ? '#059669' : '#10B981',
                border: 'none',
                borderRadius: 16,
                color: 'white',
                fontSize: 16,
                fontWeight: 700,
                padding: '16px',
                cursor: saving ? 'wait' : 'pointer',
                boxShadow: '0 4px 24px rgba(16,185,129,0.25)',
              }}
            >
              {saving ? 'Salvataggio…' : 'Salva modifiche'}
            </button>

            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              style={{
                marginTop: 14,
                width: '100%',
                background: 'transparent',
                border: '2px solid #EF4444',
                borderRadius: 16,
                color: '#EF4444',
                fontSize: 16,
                fontWeight: 700,
                padding: '14px',
                cursor: 'pointer',
              }}
            >
              Elimina Prodotto
            </button>
          </form>

          {deleteConfirmOpen ? (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                background: 'rgba(6, 19, 17, 0.88)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 340,
                  background: '#0B1F1A',
                  border: '1.5px solid #1B3A34',
                  borderRadius: 16,
                  padding: '22px 20px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}
              >
                <h2
                  id="delete-confirm-title"
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#F8FAFC',
                    margin: '0 0 12px',
                    lineHeight: 1.35,
                  }}
                >
                  Sei sicuro di voler eliminare l&apos;elemento?
                </h2>
                <p style={{ margin: '0 0 20px', fontSize: 14, color: '#94A3B8', lineHeight: 1.45 }}>
                  SKU <span style={{ color: '#10B981', fontWeight: 600 }}>{sku}</span> verrà
                  rimosso dal foglio STOCK. L&apos;azione non è annullabile da qui.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setDeleteConfirmOpen(false)}
                    style={{
                      width: '100%',
                      background: '#102A24',
                      border: '1.5px solid #10B981',
                      borderRadius: 14,
                      color: '#10B981',
                      fontSize: 15,
                      fontWeight: 700,
                      padding: '14px',
                      cursor: deleting ? 'default' : 'pointer',
                    }}
                  >
                    Non Eliminare
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={confirmDelete}
                    style={{
                      width: '100%',
                      background: deleting ? '#7F1D1D' : '#EF4444',
                      border: 'none',
                      borderRadius: 14,
                      color: 'white',
                      fontSize: 15,
                      fontWeight: 700,
                      padding: '14px',
                      cursor: deleting ? 'wait' : 'pointer',
                    }}
                  >
                    {deleting ? 'Eliminazione…' : 'Conferma'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
