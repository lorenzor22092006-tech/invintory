'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Pagamento {
  venditore: string
  importo: number
  data: string
  note: string
}

export default function DettaglioVenditore() {
  const router = useRouter()
  const params = useParams()
  const nome = decodeURIComponent(String(params.nome ?? ''))

  const [loading, setLoading] = useState(true)
  const [feeDovuta, setFeeDovuta] = useState(0)
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([])
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [importo, setImporto] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [nota, setNota] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/vendite').then((r) => r.json()),
      fetch('/api/pagamenti').then((r) => r.json()),
    ])
      .then(([vendite, tutti]) => {
        const fee = (vendite as { venditore: string; fee: number }[])
          .filter((v) => v.venditore === nome)
          .reduce((sum, v) => sum + (v.fee || 0), 0)
        setFeeDovuta(Math.round(fee * 100) / 100)
        const miei = (tutti as Pagamento[]).filter((p) => p.venditore === nome)
        setPagamenti(miei)
        setLoading(false)
      })
      .catch(() => {
        setError('Impossibile caricare i dati')
        setLoading(false)
      })
  }

  useEffect(() => { loadData() }, [nome])

  const giaPagato = Math.round(pagamenti.reduce((s, p) => s + p.importo, 0) * 100) / 100
  const daPagare = Math.round((feeDovuta - giaPagato) * 100) / 100

  const fmt = (n: number) =>
    '€' + n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const registra = async () => {
    setFormError(null)
    const imp = parseFloat(importo.replace(',', '.'))
    if (!imp || imp <= 0) { setFormError('Importo non valido'); return }
    if (!data) { setFormError('Data obbligatoria'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/pagamenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venditore: nome, importo: imp, data, nota }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Errore salvataggio')
      setShowForm(false)
      setImporto('')
      setNota('')
      setData(new Date().toISOString().slice(0, 10))
      loadData()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Errore')
    } finally {
      setSubmitting(false)
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

  return (
    <div style={{ minHeight: '100dvh', background: '#061311', maxWidth: 430, margin: '0 auto', padding: '20px 20px 100px', boxSizing: 'border-box' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px solid #1B3A34', background: '#0B1F1A', color: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          aria-label="Indietro"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>{nome}</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: '#0B1F1A' }} />
          ))}
        </div>
      ) : error ? (
        <p style={{ color: '#EF4444', fontSize: 14 }}>{error}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* CARDS DA PAGARE / GIÀ PAGATO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>Da pagare</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: daPagare > 0 ? '#F59E0B' : '#10B981' }}>{fmt(daPagare)}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Fee totale: {fmt(feeDovuta)}</div>
            </div>
            <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>Già pagato</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#22C55E' }}>{fmt(giaPagato)}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{pagamenti.length} pagament{pagamenti.length === 1 ? 'o' : 'i'}</div>
            </div>
          </div>

          {/* BOTTONE REGISTRA PAGAMENTO */}
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              style={{ width: '100%', background: '#10B981', border: 'none', borderRadius: 16, color: 'white', fontSize: 16, fontWeight: 700, padding: '16px', cursor: 'pointer', boxShadow: '0 4px 24px rgba(16,185,129,0.25)', letterSpacing: '0.04em' }}
            >
              + REGISTRA PAGAMENTO
            </button>
          ) : (
            <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>Nuovo pagamento</div>

              <div>
                <label style={labelStyle}>Importo (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="es. 15 o 15,50"
                  value={importo}
                  onChange={(e) => setImporto(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Data</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Note (opzionale)</label>
                <input
                  type="text"
                  placeholder="es. Bonifico maggio"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {formError && <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{formError}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={registra}
                  style={{ flex: 1, background: submitting ? '#059669' : '#10B981', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, padding: '13px', cursor: submitting ? 'wait' : 'pointer' }}
                >
                  {submitting ? 'Salvataggio…' : 'SALVA'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => { setShowForm(false); setFormError(null); setImporto(''); setNota('') }}
                  style={{ flex: 1, background: '#102A24', border: '1.5px solid #1B3A34', borderRadius: 12, color: '#94A3B8', fontSize: 15, fontWeight: 700, padding: '13px', cursor: 'pointer' }}
                >
                  ANNULLA
                </button>
              </div>
            </div>
          )}

          {/* STORICO PAGAMENTI */}
          {pagamenti.length > 0 && (
            <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #1B3A34' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>Storico pagamenti</div>
              </div>
              {pagamenti.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < pagamenti.length - 1 ? '1px solid #102A24' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 600 }}>{p.data}</div>
                    {p.note && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{p.note}</div>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#22C55E' }}>{fmt(p.importo)}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
