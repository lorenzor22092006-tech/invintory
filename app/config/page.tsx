'use client'

import { useState, useEffect } from 'react'
import { Venditore } from '@/lib/types'
import {
  PageShell,
  PageHeader,
  PrimaryButton,
  FormLabel,
  FormInput,
  SectionCard,
  Skeleton,
  colors,
  S,
} from '@/components/ui'
import { radius } from '@/lib/theme'

export default function Config() {
  const [venditori, setVenditori] = useState<Venditore[]>([])
  const [categorie, setCategorie] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [nuovoVenditore, setNuovoVenditore] = useState({ nome: '', fee: '' })
  const [nuovaCategoria, setNuovaCategoria] = useState('')
  const [messaggio, setMessaggio] = useState('')

  useEffect(() => {
    caricaConfig()
  }, [])

  function caricaConfig() {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        setVenditori(data.venditori.filter((v: Venditore) => v.nome))
        setCategorie(data.categorie.filter((c: string) => c))
        setLoading(false)
      })
  }

  async function aggiungiVenditore() {
    if (!nuovoVenditore.nome) return
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'venditore',
        valore: nuovoVenditore.nome,
        fee: parseFloat(nuovoVenditore.fee) || 0,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setMessaggio('Venditore aggiunto!')
      setNuovoVenditore({ nome: '', fee: '' })
      caricaConfig()
    }
  }

  async function aggiungiCategoria() {
    if (!nuovaCategoria) return
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'categoria',
        valore: nuovaCategoria,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setMessaggio('Categoria aggiunta!')
      setNuovaCategoria('')
      caricaConfig()
    }
  }

  if (loading) {
    return (
      <PageShell style={S.pagePadForm}>
        <Skeleton height={40} style={{ marginBottom: 20 }} />
        <Skeleton height={200} style={{ marginBottom: 16 }} />
        <Skeleton height={200} />
      </PageShell>
    )
  }

  return (
    <PageShell style={S.pagePadForm}>
      <PageHeader title="Configurazione" subtitle="Venditori e categorie prodotto" />

      {messaggio && (
        <div
          style={{
            background: colors.accentSoft,
            border: `1px solid ${colors.accent}`,
            borderRadius: radius.md,
            padding: '12px 14px',
            color: colors.accentBright,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {messaggio}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard title="Venditori">
          {venditori.map((v, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: i < venditori.length - 1 ? `1px solid ${colors.border}` : 'none',
                fontSize: 14,
              }}
            >
              <span style={{ color: colors.text, fontWeight: 600 }}>{v.nome}</span>
              <span style={{ color: colors.textMuted }}>Fee {v.feePercentuale}%</span>
            </div>
          ))}
          <div style={{ padding: '16px', borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FormLabel>Nome venditore</FormLabel>
            <FormInput
              value={nuovoVenditore.nome}
              onChange={(v) => setNuovoVenditore({ ...nuovoVenditore, nome: v })}
              placeholder="Nome venditore"
            />
            <FormLabel>Fee % (es. 15)</FormLabel>
            <FormInput
              value={nuovoVenditore.fee}
              onChange={(v) => setNuovoVenditore({ ...nuovoVenditore, fee: v })}
              placeholder="Fee % (es. 15)"
            />
            <PrimaryButton onClick={aggiungiVenditore} fullWidth>
              + Aggiungi venditore
            </PrimaryButton>
          </div>
        </SectionCard>

        <SectionCard title="Categorie prodotto">
          {categorie.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < categorie.length - 1 ? `1px solid ${colors.border}` : 'none',
                fontSize: 14,
              }}
            >
              <span style={{ color: colors.text, fontWeight: 600 }}>{c}</span>
              <span
                style={{
                  background: colors.accentSoft,
                  color: colors.accentBright,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: radius.pill,
                }}
              >
                Attiva
              </span>
            </div>
          ))}
          <div style={{ padding: '16px', borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FormLabel>Nome categoria</FormLabel>
            <FormInput
              value={nuovaCategoria}
              onChange={setNuovaCategoria}
              placeholder="Nome categoria (es. Giacca)"
            />
            <PrimaryButton onClick={aggiungiCategoria} fullWidth>
              + Aggiungi categoria
            </PrimaryButton>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  )
}
