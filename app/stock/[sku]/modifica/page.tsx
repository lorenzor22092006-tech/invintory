'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'
import {
  PageShell,
  PageHeader,
  BackButton,
  PrimaryButton,
  SecondaryButton,
  FormLabel,
  ErrorBox,
  Skeleton,
  colors,
  S,
} from '@/components/ui'
import { radius, shadow } from '@/lib/theme'

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

const triggerBase: CSSProperties = {
  ...S.input,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  cursor: 'pointer',
  textAlign: 'left',
}

const listPanel: CSSProperties = {
  marginTop: 8,
  maxHeight: 240,
  overflowY: 'auto',
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgCard,
  boxShadow: shadow.card,
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

  const inputStyle: CSSProperties = S.input

  const optionRow = (selected: boolean): CSSProperties => ({
    width: '100%',
    textAlign: 'left',
    padding: '12px 14px',
    border: 'none',
    borderBottom: `1px solid ${colors.border}`,
    background: selected ? colors.accentSoft : 'transparent',
    color: colors.text,
    fontSize: 15,
    cursor: 'pointer',
  })

  return (
    <PageShell style={S.pagePadForm}>
      <PageHeader
        title="Modifica prodotto"
        subtitle={`SKU ${sku}`}
        back={<BackButton onClick={() => router.back()} />}
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={52} />
          <Skeleton height={52} />
          <Skeleton height={52} />
        </div>
      ) : error && !form.sku ? (
        <ErrorBox message={error} />
      ) : (
        <>
          {optionsError ? (
            <p style={{ color: colors.warning, fontSize: 13, marginBottom: 12 }}>{optionsError}</p>
          ) : null}
          <form onSubmit={submit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <FormLabel>Numero ordine</FormLabel>
                <input
                  style={inputStyle}
                  value={form.numeroOrdine ?? ''}
                  onChange={update('numeroOrdine')}
                />
              </div>
              <div>
                <FormLabel>Data ordine</FormLabel>
                <input
                  style={inputStyle}
                  value={form.dataOrdine ?? ''}
                  onChange={update('dataOrdine')}
                  placeholder="GG/MM/AAAA"
                />
              </div>
              <div>
                <FormLabel>Prezzo acquisto</FormLabel>
                <input
                  style={inputStyle}
                  value={form.prezzoAcquisto ?? ''}
                  onChange={update('prezzoAcquisto')}
                  placeholder="es. € 19,34"
                />
              </div>
              <div>
                <FormLabel>Scadenza reso</FormLabel>
                <input
                  style={inputStyle}
                  value={form.scadenzaReso ?? ''}
                  onChange={update('scadenzaReso')}
                  placeholder="GG/MM/AAAA"
                />
              </div>

              <div>
                <FormLabel>ID modello</FormLabel>
                <button
                  type="button"
                  onClick={() =>
                    setOpenPicker((p) => (p === 'idModello' ? null : 'idModello'))
                  }
                  style={{
                    ...triggerBase,
                    borderColor: openPicker === 'idModello' ? colors.accent : colors.border,
                  }}
                >
                  <span style={{ color: form.idModello ? colors.text : colors.textMuted }}>
                    {form.idModello?.trim() ? form.idModello : 'Seleziona ID modello…'}
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 9l6 6 6-6"
                      stroke={colors.accent}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {openPicker === 'idModello' ? (
                  <div style={listPanel} role="listbox">
                    {idOptions.length === 0 ? (
                      <div style={{ padding: 14, color: colors.textMuted, fontSize: 14 }}>
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
                                  : `1px solid ${colors.border}`,
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
                <FormLabel>Taglia</FormLabel>
                <button
                  type="button"
                  onClick={() => setOpenPicker((p) => (p === 'taglia' ? null : 'taglia'))}
                  style={{
                    ...triggerBase,
                    borderColor: openPicker === 'taglia' ? colors.accent : colors.border,
                  }}
                >
                  <span style={{ color: form.taglia ? colors.text : colors.textMuted }}>
                    {form.taglia?.trim() ? form.taglia : 'Seleziona taglia…'}
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 9l6 6 6-6"
                      stroke={colors.success}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {openPicker === 'taglia' ? (
                  <div style={listPanel} role="listbox">
                    {tagliaOptions.length === 0 ? (
                      <div style={{ padding: 14, color: colors.textMuted, fontSize: 14 }}>
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
                                  : `1px solid ${colors.border}`,
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
                <FormLabel>Esito</FormLabel>
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
                      style={{ background: colors.bgCard, color: colors.text }}
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
                    ...S.cardInset,
                    padding: 14,
                    fontSize: 13,
                    color: colors.textMuted,
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
              <div style={{ marginTop: 16 }}>
                <ErrorBox message={error} />
              </div>
            ) : null}

            <PrimaryButton
              type="submit"
              disabled={saving}
              fullWidth
              style={{ marginTop: 28 }}
            >
              {saving ? 'Salvataggio…' : 'Salva modifiche'}
            </PrimaryButton>

            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              style={{
                marginTop: 14,
                width: '100%',
                background: 'transparent',
                border: `2px solid ${colors.danger}`,
                borderRadius: radius.lg,
                color: colors.danger,
                fontSize: 16,
                fontWeight: 700,
                padding: '14px',
                cursor: 'pointer',
                fontFamily: S.btnPrimary.fontFamily,
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
              style={S.overlay}
            >
              <div
                style={{
                  ...S.card,
                  width: '100%',
                  maxWidth: 340,
                  margin: 'auto',
                  padding: '22px 20px',
                }}
              >
                <h2
                  id="delete-confirm-title"
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: colors.text,
                    margin: '0 0 12px',
                    lineHeight: 1.35,
                  }}
                >
                  Sei sicuro di voler eliminare l&apos;elemento?
                </h2>
                <p style={{ margin: '0 0 20px', fontSize: 14, color: colors.textSecondary, lineHeight: 1.45 }}>
                  SKU <span style={{ color: colors.accent, fontWeight: 600 }}>{sku}</span> verrà
                  rimosso dal foglio STOCK. L&apos;azione non è annullabile da qui.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SecondaryButton
                    disabled={deleting}
                    onClick={() => setDeleteConfirmOpen(false)}
                    fullWidth
                    style={{ borderColor: colors.accent, color: colors.accent }}
                  >
                    Non Eliminare
                  </SecondaryButton>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={confirmDelete}
                    style={{
                      width: '100%',
                      background: deleting ? '#7F1D1D' : colors.danger,
                      border: 'none',
                      borderRadius: radius.md,
                      color: colors.text,
                      fontSize: 15,
                      fontWeight: 700,
                      padding: '14px',
                      cursor: deleting ? 'wait' : 'pointer',
                      fontFamily: S.btnPrimary.fontFamily,
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
    </PageShell>
  )
}
