'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { CSSProperties } from 'react'
import {
  PageShell,
  PageHeader,
  BackButton,
  PrimaryButton,
  SecondaryButton,
  FormLabel,
  ErrorBox,
  SectionCard,
  Skeleton,
  StatCard,
  colors,
  S,
  euro,
} from '@/components/ui'

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

  const inputStyle: CSSProperties = S.input

  return (
    <PageShell style={S.pagePadForm}>
      <PageHeader
        title={nome}
        back={<BackButton onClick={() => router.back()} />}
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={80} />
          ))}
        </div>
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard
              label="Da pagare"
              value={euro(daPagare)}
              hint={`Fee totale: ${euro(feeDovuta)}`}
              highlight={daPagare > 0 ? colors.warning : colors.accent}
            />
            <StatCard
              label="Già pagato"
              value={euro(giaPagato)}
              hint={`${pagamenti.length} pagament${pagamenti.length === 1 ? 'o' : 'i'}`}
              highlight={colors.success}
            />
          </div>

          {!showForm ? (
            <PrimaryButton onClick={() => setShowForm(true)} fullWidth style={{ letterSpacing: '0.04em' }}>
              + REGISTRA PAGAMENTO
            </PrimaryButton>
          ) : (
            <div style={{ ...S.card, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={S.sectionTitle}>Nuovo pagamento</div>

              <div>
                <FormLabel>Importo (€)</FormLabel>
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
                <FormLabel>Data</FormLabel>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </div>

              <div>
                <FormLabel>Note (opzionale)</FormLabel>
                <input
                  type="text"
                  placeholder="es. Bonifico maggio"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {formError && <ErrorBox message={formError} />}

              <div style={{ display: 'flex', gap: 10 }}>
                <PrimaryButton
                  disabled={submitting}
                  onClick={registra}
                  style={{ flex: 1, padding: '13px' }}
                >
                  {submitting ? 'Salvataggio…' : 'SALVA'}
                </PrimaryButton>
                <SecondaryButton
                  disabled={submitting}
                  onClick={() => { setShowForm(false); setFormError(null); setImporto(''); setNota('') }}
                  style={{ flex: 1, padding: '13px' }}
                >
                  ANNULLA
                </SecondaryButton>
              </div>
            </div>
          )}

          {pagamenti.length > 0 && (
            <SectionCard title="Storico pagamenti">
              {pagamenti.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: i < pagamenti.length - 1 ? `1px solid ${colors.border}` : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, color: colors.text, fontWeight: 600 }}>{p.data}</div>
                    {p.note && <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{p.note}</div>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.success }}>{euro(p.importo)}</div>
                </div>
              ))}
            </SectionCard>
          )}
        </div>
      )}
    </PageShell>
  )
}
