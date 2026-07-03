'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PageShell,
  PageHeader,
  BackButton,
  Skeleton,
  EmptyState,
  ErrorBox,
  colors,
  S,
  euro,
} from '@/components/ui'

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

  return (
    <PageShell style={S.pagePadForm}>
      <PageHeader
        title="Pagamenti venditori"
        back={<BackButton onClick={() => router.back()} />}
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2].map((i) => (
            <Skeleton key={i} height={90} />
          ))}
        </div>
      ) : error ? (
        <ErrorBox message={error} />
      ) : venditori.length === 0 ? (
        <EmptyState icon="👤" message="Nessun venditore configurato" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {venditori.map((v) => (
            <button
              key={v.nome}
              type="button"
              onClick={() => router.push(`/bilancio/venditori/${encodeURIComponent(v.nome)}`)}
              style={{
                ...S.listRow,
                width: '100%',
                cursor: 'pointer',
                textAlign: 'left',
                boxSizing: 'border-box',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{v.nome}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>Fee totale</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{euro(v.feeDovuta)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>Già pagato</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.success }}>{euro(v.giaPagato)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>Da pagare</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: v.daPagare > 0 ? colors.warning : colors.accent }}>
                    {euro(v.daPagare)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  )
}
