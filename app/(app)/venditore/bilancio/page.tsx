'use client'

import { useEffect, useState } from 'react'
import {
  PageShell,
  PageHeader,
  StatCard,
  SectionCard,
  Skeleton,
  colors,
  euro,
} from '@/components/ui'

interface SubVenditoreStats {
  nome: string
  numVendite: number
  guadagno: number
}

interface Bilancio {
  isSub: boolean
  numVendite: number
  guadagnoCapi: number
  guadagnoSub: number
  guadagnato: number
  mandato: number
  daRicevere: number
  subVenditori: SubVenditoreStats[]
}

export default function BilancioVenditorePage() {
  const [b, setB] = useState<Bilancio | null>(null)
  const [loading, setLoading] = useState(true)
  const [subOpen, setSubOpen] = useState(false)

  useEffect(() => {
    fetch('/api/venditore/bilancio')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.guadagnato === 'number') setB(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const mostraSub = !loading && b && !b.isSub

  return (
    <PageShell>
      <PageHeader title="Il mio bilancio" subtitle="Guadagni e pagamenti" />

      {/* Guadagno dalla vendita dei capi */}
      {loading ? (
        <div style={{ marginBottom: 12 }}><Skeleton height={90} /></div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <StatCard label="Guadagno dalla vendita dei capi" value={euro(b?.guadagnoCapi ?? 0)} hint="tue commissioni" />
        </div>
      )}

      {/* Guadagno dai sub-venditori + dropdown SUBITO sotto questa card, non sotto le altre */}
      {mostraSub && (
        <div style={{ marginBottom: 12 }}>
          <StatCard
            label="Guadagno dai miei sub-venditori"
            value={euro(b?.guadagnoSub ?? 0)}
            hint={`${b?.subVenditori.length ?? 0} sub-venditori · tocca per il dettaglio ${subOpen ? '▴' : '▾'}`}
            onClick={() => setSubOpen((v) => !v)}
          />
          {subOpen && (
            <div style={{ marginTop: 10 }}>
              <SectionCard title="Dettaglio sub-venditori" subtitle="Capi venduti e guadagno per ciascuno">
                {b!.subVenditori.length === 0 ? (
                  <div style={{ padding: '18px 20px', fontSize: 13, color: colors.textMuted }}>
                    Nessun sub-venditore assegnato
                  </div>
                ) : (
                  <div>
                    {b!.subVenditori.map((s, i) => (
                      <div
                        key={s.nome}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '13px 20px',
                          borderTop: i > 0 ? `1px solid ${colors.border}` : 'none',
                        }}
                      >
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: colors.text }}>{s.nome}</span>
                        <span style={{ fontSize: 12, color: colors.textMuted }}>{s.numVendite} capi</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: colors.accentBright, minWidth: 70, textAlign: 'right' }}>
                          {euro(s.guadagno)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      )}

      {/* Guadagno totale */}
      {loading ? (
        <div style={{ marginBottom: 20 }}><Skeleton height={90} /></div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <StatCard accent label="Guadagno totale" value={euro(b?.guadagnato ?? 0)} hint="somma delle voci sopra" />
        </div>
      )}

      {/* Riepilogo pagamenti */}
      {loading ? (
        <div className="inv-grid-2" style={{ marginBottom: 20 }}>
          {[1, 2].map((i) => (
            <Skeleton key={i} height={90} />
          ))}
        </div>
      ) : (
        <div className="inv-grid-2" style={{ marginBottom: 20 }}>
          <StatCard label="Soldi ricevuti" value={euro(b?.mandato ?? 0)} highlight={colors.success} hint="già mandati dal CEO" />
          <StatCard
            label="Da ricevere"
            value={euro(b?.daRicevere ?? 0)}
            highlight={(b?.daRicevere ?? 0) > 0 ? colors.warning : undefined}
            hint={mostraSub ? 'totale, incluso dai sub-venditori' : 'totale'}
          />
        </div>
      )}

      {/* Statistiche vendite */}
      <SectionCard title="Le tue vendite" subtitle="Riepilogo attività">
        <div style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Numero vendite
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: colors.text, marginTop: 4 }}>
            {loading ? '…' : b?.numVendite ?? 0}
          </div>
        </div>
      </SectionCard>
    </PageShell>
  )
}
