'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface VenditoreStats {
  nome: string
  feeDovuta: number
  giaPagato: number
  daPagare: number
}

export default function PagamentiVenditoriPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [venditori, setVenditori] = useState<VenditoreStats[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/config').then((r) => r.json()),
      fetch('/api/vendite').then((r) => r.json()),
      fetch('/api/pagamenti').then((r) => r.json()),
    ])
      .then(([cfg, vendite, pagamenti]) => {
        const nomi: string[] = (cfg.venditori || []).map((v: { nome: string }) => String(v.nome ?? '').trim()).filter(Boolean)
        const stats: VenditoreStats[] = nomi.map((nome) => {
          const feeDovuta = (vendite as { venditore: string; fee: number }[])
            .filter((v) => v.venditore === nome)
            .reduce((sum, v) => sum + (v.fee || 0), 0)
          const giaPagato = (pagamenti as { venditore: string; importo: number }[])
            .filter((p) => p.venditore === nome)
            .reduce((sum, p) => sum + (p.importo || 0), 0)
          return {
            nome,
            feeDovuta: Math.round(feeDovuta * 100) / 100,
            giaPagato: Math.round(giaPagato * 100) / 100,
            daPagare: Math.round((feeDovuta - giaPagato) * 100) / 100,
          }
        })
        setVenditori(stats)
        setLoading(false)
      })
      .catch(() => {
        setError('Impossibile caricare i dati')
        setLoading(false)
      })
  }, [])

  const fmt = (n: number) =>
    '€' + n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div style={{ minHeight: '100dvh', background: '#061311', maxWidth: 430, margin: '0 auto', padding: '20px 20px 100px', boxSizing: 'border-box' }}>
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
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Pagamenti venditori</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: 90, borderRadius: 14, background: '#0B1F1A', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : error ? (
        <p style={{ color: '#EF4444', fontSize: 14 }}>{error}</p>
      ) : venditori.length === 0 ? (
        <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, padding: '24px 16px', textAlign: 'center' }}>
          <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>Nessun venditore configurato</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {venditori.map((v) => (
            <button
              key={v.nome}
              type="button"
              onClick={() => router.push(`/bilancio/venditori/${encodeURIComponent(v.nome)}`)}
              style={{ width: '100%', background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>{v.nome}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Fee totale</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>{fmt(v.feeDovuta)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Già pagato</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#22C55E' }}>{fmt(v.giaPagato)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Da pagare</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: v.daPagare > 0 ? '#F59E0B' : '#10B981' }}>{fmt(v.daPagare)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
