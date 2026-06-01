'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

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

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: '#061311',
    border: '1.5px solid #1B3A34',
    borderRadius: 12,
    color: '#F8FAFC',
    fontSize: 15,
    padding: '12px 14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  if (risultati) {
    const ok = risultati.filter((r) => r.ok)
    const ko = risultati.filter((r) => !r.ok)
    return (
      <div style={{ minHeight: '100dvh', background: '#061311', maxWidth: 430, margin: '0 auto', padding: '20px 20px 100px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px solid #1B3A34', background: '#0B1F1A', color: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Riepilogo reso</h1>
        </div>

        {ok.length > 0 && (
          <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1B3A34', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{ok.length} capi registrati come reso</span>
            </div>
            {ok.map((r, i) => (
              <div key={r.sku} style={{ padding: '11px 16px', borderBottom: i < ok.length - 1 ? '1px solid #102A24' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '3px 8px', borderRadius: 6 }}>SKU {r.sku}</span>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>→ Reso</span>
              </div>
            ))}
          </div>
        )}

        {ko.length > 0 && (
          <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1B3A34', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{ko.length} SKU non elaborati</span>
            </div>
            {ko.map((r, i) => (
              <div key={r.sku} style={{ padding: '11px 16px', borderBottom: i < ko.length - 1 ? '1px solid #102A24' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '3px 8px', borderRadius: 6 }}>SKU {r.sku}</span>
                <span style={{ fontSize: 13, color: '#64748B' }}>{r.errore}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push('/')}
          style={{ width: '100%', background: '#10B981', border: 'none', borderRadius: 16, color: 'white', fontSize: 16, fontWeight: 700, padding: '16px', cursor: 'pointer', boxShadow: '0 4px 24px rgba(16,185,129,0.25)' }}
        >
          TORNA ALLA HOME
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#061311', maxWidth: 430, margin: '0 auto', padding: '20px 20px 100px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px solid #1B3A34', background: '#0B1F1A', color: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Registra reso</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* INPUT SKU */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
            Aggiungi SKU
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              placeholder="es. 159"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(null) }}
              onKeyDown={handleKeyDown}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={aggiungiSku}
              style={{ background: '#10B981', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, padding: '12px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              + Aggiungi
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#64748B', margin: '6px 0 0' }}>Premi Invio o tocca "+ Aggiungi" per ogni SKU</p>
        </div>

        {/* LISTA SKU AGGIUNTI */}
        {skus.length > 0 && (
          <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1B3A34', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>SKU da rendere</span>
              <span style={{ fontSize: 12, color: '#64748B' }}>{skus.length} capi</span>
            </div>
            {skus.map((sku, i) => (
              <div key={sku} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < skus.length - 1 ? '1px solid #102A24' : 'none' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', background: '#102A24', padding: '4px 10px', borderRadius: 8 }}>SKU {sku}</span>
                <button
                  type="button"
                  onClick={() => rimuoviSku(sku)}
                  style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #1B3A34', background: 'transparent', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p style={{ color: '#EF4444', fontSize: 14, margin: 0 }}>{error}</p>}

        {skus.length > 0 && (
          <button
            type="button"
            disabled={submitting}
            onClick={registra}
            style={{ width: '100%', background: submitting ? '#059669' : '#10B981', border: 'none', borderRadius: 16, color: 'white', fontSize: 16, fontWeight: 700, padding: '16px', cursor: submitting ? 'wait' : 'pointer', boxShadow: '0 4px 24px rgba(16,185,129,0.25)', letterSpacing: '0.04em' }}
          >
            {submitting ? 'Registrazione…' : `REGISTRA RESO (${skus.length} capi)`}
          </button>
        )}
      </div>
    </div>
  )
}
