'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PageShell,
  PageHeader,
  BackButton,
  PrimaryButton,
  FormLabel,
  ErrorBox,
  SectionCard,
  colors,
  S,
} from '@/components/ui'
import { radius } from '@/lib/theme'

interface RisultatoSku {
  sku: string
  ok: boolean
  errore?: string
}

export default function RegistraResoPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [skus, setSkus] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [risultati, setRisultati] = useState<RisultatoSku[] | null>(null)

  const aggiungiSku = () => {
    const val = input.trim()
    if (!val) return
    if (skus.includes(val)) {
      setError(`SKU ${val} già aggiunto`)
      return
    }
    setSkus((prev) => [...prev, val])
    setInput('')
    setError(null)
    inputRef.current?.focus()
  }

  const rimuoviSku = (sku: string) => {
    setSkus((prev) => prev.filter((s) => s !== sku))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      aggiungiSku()
    }
  }

  const registra = async () => {
    setError(null)
    if (skus.length === 0) {
      setError('Aggiungi almeno uno SKU')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/resi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus }),
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
        back={<BackButton onClick={() => router.back()} />}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <FormLabel>Aggiungi SKU</FormLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              placeholder="es. 159"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError(null)
              }}
              onKeyDown={handleKeyDown}
              style={{ ...S.input, flex: 1 }}
            />
            <PrimaryButton onClick={aggiungiSku} style={{ whiteSpace: 'nowrap', padding: '12px 18px' }}>
              + Aggiungi
            </PrimaryButton>
          </div>
          <p style={{ fontSize: 12, color: colors.textMuted, margin: '6px 0 0' }}>
            Premi Invio o tocca &quot;+ Aggiungi&quot; per ogni SKU
          </p>
        </div>

        {skus.length > 0 && (
          <SectionCard
            title="SKU da rendere"
            subtitle={`${skus.length} capi`}
          >
            {skus.map((sku, i) => (
              <div
                key={sku}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 16px',
                  borderBottom: i < skus.length - 1 ? `1px solid ${colors.border}` : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: colors.text,
                    background: colors.bgElevated,
                    padding: '4px 10px',
                    borderRadius: radius.sm,
                  }}
                >
                  SKU {sku}
                </span>
                <button
                  type="button"
                  onClick={() => rimuoviSku(sku)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: radius.sm,
                    border: `1px solid ${colors.border}`,
                    background: 'transparent',
                    color: colors.danger,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </SectionCard>
        )}

        {error && <ErrorBox message={error} />}

        {skus.length > 0 && (
          <PrimaryButton
            disabled={submitting}
            onClick={registra}
            fullWidth
            style={{ letterSpacing: '0.04em' }}
          >
            {submitting ? 'Registrazione…' : `REGISTRA RESO (${skus.length} capi)`}
          </PrimaryButton>
        )}
      </div>
    </PageShell>
  )
}
