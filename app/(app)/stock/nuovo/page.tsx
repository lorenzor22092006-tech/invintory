'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'
import {
  PageShell,
  PageHeader,
  BackButton,
  PrimaryButton,
  SecondaryButton,
  FormLabel,
  FormInput,
  ErrorBox,
  Skeleton,
  colors,
  S,
} from '@/components/ui'
import { radius, shadow } from '@/lib/theme'

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
    <PageShell style={S.pagePadForm}>
      <PageHeader
        title="Registra prodotto"
        back={<BackButton onClick={() => router.back()} />}
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={52} />
          <Skeleton height={52} />
          <Skeleton height={52} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <FormLabel>SKU</FormLabel>
            <input
              style={S.input}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="es. 152"
              inputMode="numeric"
            />
          </div>
          <div>
            <FormLabel>N. ordine</FormLabel>
            <FormInput value={numeroOrdine} onChange={setNumeroOrdine} placeholder="es. PO-098-…" />
          </div>
          <div>
            <FormLabel>Data ordine</FormLabel>
            <FormInput value={dataOrdine} onChange={setDataOrdine} placeholder="GG/MM/AAAA" />
          </div>
          <div>
            <FormLabel>Prezzo acquisto</FormLabel>
            <FormInput value={prezzoAcquisto} onChange={setPrezzoAcquisto} placeholder="es. € 7,08" />
          </div>

          <div>
            <FormLabel>ID modello</FormLabel>
            <button
              type="button"
              onClick={() => setOpenPicker((p) => (p === 'idModello' ? null : 'idModello'))}
              style={{
                ...triggerBase,
                borderColor: openPicker === 'idModello' ? colors.accent : colors.border,
              }}
            >
              <span style={{ color: idModello ? colors.text : colors.textMuted }}>
                {idModello || 'Seleziona ID modello…'}
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
                            idx === idOptions.length - 1 ? 'none' : `1px solid ${colors.border}`,
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
            <FormLabel>Taglia</FormLabel>
            <button
              type="button"
              onClick={() => setOpenPicker((p) => (p === 'taglia' ? null : 'taglia'))}
              style={{
                ...triggerBase,
                borderColor: openPicker === 'taglia' ? colors.accent : colors.border,
              }}
            >
              <span style={{ color: taglia ? colors.text : colors.textMuted }}>
                {taglia || 'Seleziona taglia…'}
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
                            idx === tagliaOptions.length - 1 ? 'none' : `1px solid ${colors.border}`,
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

          <p style={{ fontSize: 12, color: colors.textMuted, margin: 0, lineHeight: 1.45 }}>
            Scadenza reso, giorni e stato vengono calcolati dal foglio se hai formule in quelle
            colonne. Esito impostato su <strong style={{ color: colors.accent }}>In stock</strong>.
          </p>

          {error ? <ErrorBox message={error} /> : null}

          <PrimaryButton
            disabled={submitting}
            onClick={registra}
            fullWidth
            style={{ marginTop: 8, letterSpacing: '0.04em' }}
          >
            {submitting ? 'Registrazione…' : 'REGISTRA'}
          </PrimaryButton>

          <SecondaryButton
            disabled={submitting}
            onClick={() => router.back()}
            fullWidth
            style={{ letterSpacing: '0.04em' }}
          >
            ANNULLA
          </SecondaryButton>
        </div>
      )}
    </PageShell>
  )
}
