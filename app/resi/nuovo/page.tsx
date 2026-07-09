'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PageShell,
  PageHeader,
  BackButton,
  PrimaryButton,
  SearchBar,
  ErrorBox,
  EmptyState,
  Skeleton,
  SectionCard,
  colors,
  S,
} from '@/components/ui'
import { radius } from '@/lib/theme'

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

interface RisultatoSku {
  sku: string
  ok: boolean
  errore?: string
}

const getScadenzaColor = (giorni: number | null) => {
  if (giorni === null) return colors.textMuted
  if (giorni <= 3) return colors.danger
  if (giorni <= 7) return colors.warning
  return colors.success
}

const getScadenzaLabel = (giorni: number | null) => {
  if (giorni === null) return ''
  if (giorni === 0) return 'Scade oggi'
  if (giorni === 1) return '1 giorno'
  return `${giorni} giorni`
}

export default function RegistraResoPage() {
  const router = useRouter()

  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [risultati, setRisultati] = useState<RisultatoSku[] | null>(null)

  useEffect(() => {
    fetch('/api/stock')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) {
          setLoadError(data.error || 'Impossibile caricare lo stock')
          setItems([])
          setLoading(false)
          return
        }
        setItems(data.items || [])
        setLoading(false)
      })
      .catch(() => {
        setLoadError('Errore di rete durante il caricamento dello stock')
        setLoading(false)
      })
  }, [])

  const inScadenza = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        item.esito === 'In stock' &&
        item.giorniRimanenti !== null &&
        item.giorniRimanenti >= 0
    )
    return [...filtered].sort((a, b) => (a.giorniRimanenti ?? 0) - (b.giorniRimanenti ?? 0))
  }, [items])

  const visibili = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return inScadenza
    return inScadenza.filter(
      (item) =>
        item.sku.toLowerCase().includes(q) ||
        item.idModello.toLowerCase().includes(q)
    )
  }, [inScadenza, search])

  const toggleSelezione = (sku: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(sku)) next.delete(sku)
      else next.add(sku)
      return next
    })
  }

  const selectedItems = useMemo(
    () => inScadenza.filter((item) => selected.has(item.sku)),
    [inScadenza, selected]
  )

  const registra = async () => {
    setError(null)
    if (selected.size === 0) {
      setError('Seleziona almeno un prodotto')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/resi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus: Array.from(selected) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && !data.risultati) {
        throw new Error(data.error || 'Errore registrazione')
      }
      setRisultati(data.risultati ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore')
    } finally {
      setSubmitting(false)
    }
  }

  if (risultati) {
    const ok = risultati.filter((r) => r.ok)
    const ko = risultati.filter((r) => !r.ok)
    return (
      <PageShell style={S.pagePadForm}>
        <PageHeader
          title="Riepilogo reso"
          back={<BackButton onClick={() => router.push('/')} />}
        />

        {ok.length > 0 && (
          <SectionCard title={`${ok.length} capi registrati come reso`}>
            {ok.map((r, i) => (
              <div
                key={r.sku}
                style={{
                  padding: '11px 16px',
                  borderBottom: i < ok.length - 1 ? `1px solid ${colors.border}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.success,
                    background: 'rgba(34,197,94,0.1)',
                    padding: '3px 8px',
                    borderRadius: radius.sm,
                  }}
                >
                  SKU {r.sku}
                </span>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>→ Reso</span>
              </div>
            ))}
          </SectionCard>
        )}

        {ko.length > 0 && (
          <div style={{ marginTop: ok.length > 0 ? 12 : 0, marginBottom: 20 }}>
            <SectionCard title={`${ko.length} SKU non elaborati`}>
              {ko.map((r, i) => (
                <div
                  key={r.sku}
                  style={{
                    padding: '11px 16px',
                    borderBottom: i < ko.length - 1 ? `1px solid ${colors.border}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: colors.danger,
                      background: colors.dangerSoft,
                      padding: '3px 8px',
                      borderRadius: radius.sm,
                    }}
                  >
                    SKU {r.sku}
                  </span>
                  <span style={{ fontSize: 13, color: colors.textMuted }}>{r.errore}</span>
                </div>
              ))}
            </SectionCard>
          </div>
        )}

        <PrimaryButton onClick={() => router.push('/')} fullWidth>
          TORNA ALLA HOME
        </PrimaryButton>
      </PageShell>
    )
  }

  return (
    <PageShell style={S.pagePadForm}>
      <PageHeader
        title="Registra reso"
        subtitle="Seleziona i prodotti da rendere"
        back={<BackButton onClick={() => router.back()} />}
        action={
          <button
            type="button"
            onClick={() => router.push('/resi')}
            className="inv-btn-glass"
            style={{ ...S.chip, padding: '7px 14px', fontSize: 12 }}
          >
            Storico resi
          </button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: selected.size > 0 ? 90 : 0 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cerca per SKU o modello…"
          onClear={() => setSearch('')}
        />

        {loadError && <ErrorBox message={loadError} />}
        {error && <ErrorBox message={error} />}

        <SectionCard
          title="Prodotti in scadenza"
          subtitle={loading ? 'Caricamento…' : `${visibili.length} disponibili`}
        >
          {loading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={52} />)}
            </div>
          ) : visibili.length === 0 ? (
            <EmptyState icon="✓" message="Nessun prodotto trovato" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {visibili.map((item, i) => {
                const checked = selected.has(item.sku)
                return (
                  <div
                    key={item.sku}
                    onClick={() => toggleSelezione(item.sku)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '13px 16px',
                      borderTop: i > 0 ? `1px solid ${colors.border}` : 'none',
                      cursor: 'pointer',
                      background: checked ? colors.accentSoft : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: `2px solid ${checked ? colors.accentBright : colors.border}`,
                        background: checked ? colors.accentBright : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {checked && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="#061311" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: colors.accentBright, minWidth: 34, flexShrink: 0 }}>
                      {item.sku}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.idModello || '—'}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        Taglia {item.taglia || 'n.d.'}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: getScadenzaColor(item.giorniRimanenti), flexShrink: 0 }}>
                      {getScadenzaLabel(item.giorniRimanenti)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {selected.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
            left: 0,
            right: 0,
            zIndex: 60,
            padding: '0 16px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', justifyContent: 'flex-end' }}>
            <PrimaryButton
              disabled={submitting}
              onClick={registra}
              style={{
                pointerEvents: 'auto',
                letterSpacing: '0.04em',
                borderRadius: 30,
                padding: '14px 22px',
                boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
              }}
            >
              {submitting ? 'Registrazione…' : `CONFERMA (${selectedItems.length})`}
            </PrimaryButton>
          </div>
        </div>
      )}
    </PageShell>
  )
}
