'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/use-session'
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

interface StockItem {
  sku: string
  esito: string
  idModello: string
  taglia: string
}

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
  maxHeight: 280,
  overflowY: 'auto',
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgCard,
  boxShadow: shadow.card,
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
  const session = useSession()
  const isVenditore = session?.role === 'venditore'
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

  const inputStyle: CSSProperties = S.input

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
    <PageShell style={S.pagePadForm}>
      <PageHeader
        title="Registra vendita"
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
            <button
              type="button"
              onClick={() => setSkuOpen((o) => !o)}
              style={{
                ...triggerBase,
                borderColor: skuOpen ? colors.accent : colors.border,
              }}
            >
              <span style={{ color: sku ? colors.text : colors.textMuted }}>
                {sku || 'Seleziona SKU…'}
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
            {skuOpen ? (
              <div style={listPanel} role="listbox">
                {skusInStock.length === 0 ? (
                  <div style={{ padding: 14, color: colors.textMuted, fontSize: 14 }}>
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
                            idx === skusInStock.length - 1 ? 'none' : `1px solid ${colors.border}`,
                        }}
                        onClick={() => {
                          setSku(it.sku)
                          setSkuOpen(false)
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{it.sku}</span>
                        <span style={{ color: colors.textMuted, fontSize: 13, marginLeft: 8 }}>
                          {(it.idModello || '—') + (it.taglia ? ` · ${it.taglia}` : '')}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            ) : null}
            {selectedCapo ? (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: colors.textMuted }}>
                {selectedCapo.idModello || 'Modello n.d.'}
                {selectedCapo.taglia ? ` · taglia ${selectedCapo.taglia}` : ''}
              </p>
            ) : null}
          </div>

          <div>
            <FormLabel>Prezzo vendita</FormLabel>
            <FormInput
              value={prezzoVendita}
              onChange={setPrezzoVendita}
              placeholder="es. 35 o 35,50"
            />
          </div>

          <div>
            <FormLabel>Data vendita</FormLabel>
            <FormInput type="date" value={dataVendita} onChange={setDataVendita} />
          </div>

          <div>
            <FormLabel>{isVenditore ? 'Venditore' : 'Venditore (opzionale)'}</FormLabel>
            {isVenditore ? (
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: colors.text, fontWeight: 700 }}>
                {session?.nome}
              </div>
            ) : (
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
              <option value="" style={{ background: colors.bgCard, color: colors.textSecondary }}>
                Nessuno
              </option>
              {venditori.map((v) => (
                <option key={v} value={v} style={{ background: colors.bgCard, color: colors.text }}>
                  {v}
                </option>
              ))}
            </select>
            )}
          </div>

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
