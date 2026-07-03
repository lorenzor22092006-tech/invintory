'use client'

import { useState, useEffect } from 'react'
import { Vendita } from '@/lib/types'
import {
  PageShell,
  PageHeader,
  SearchBar,
  EmptyState,
  Skeleton,
  BottomSheet,
  FormLabel,
  FormInput,
  FormSelect,
  ErrorBox,
  PrimaryButton,
  SecondaryButton,
  colors,
  S,
  euro,
} from '@/components/ui'
import { radius } from '@/lib/theme'

type VenditaExt = Vendita & { dataISO: string }

function parseDataISO(data: string): string {
  const p = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return p ? `${p[3]}-${p[2]}-${p[1]}` : data
}

export default function VenditePage() {
  const [vendite, setVendite] = useState<VenditaExt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [venditori, setVenditori] = useState<string[]>([])

  const [editTarget, setEditTarget] = useState<VenditaExt | null>(null)
  const [editForm, setEditForm] = useState({ prezzoVendita: '', dataVendita: '', venditore: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    loadVendite()
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        setVenditori(data.venditori?.map((v: { nome: string }) => v.nome).filter(Boolean) || [])
      })
      .catch(() => {})
  }, [])

  function loadVendite() {
    setLoading(true)
    fetch('/api/vendite')
      .then((r) => r.json())
      .then((data: Vendita[]) => {
        const ext: VenditaExt[] = (Array.isArray(data) ? data : []).map((v) => ({
          ...v,
          dataISO: parseDataISO(v.dataVendita),
        }))
        ext.sort((a, b) => b.dataISO.localeCompare(a.dataISO))
        setVendite(ext)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  function openEdit(v: VenditaExt) {
    setEditTarget(v)
    setEditForm({
      prezzoVendita: String(v.prezzoVendita),
      dataVendita: v.dataISO,
      venditore: v.venditore || '',
    })
    setSaveError(null)
  }

  function closeEdit() {
    setEditTarget(null)
    setSaveError(null)
  }

  async function saveEdit() {
    if (!editTarget) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/vendite', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: editTarget.sku,
          prezzoVendita: parseFloat(editForm.prezzoVendita.replace(',', '.')) || 0,
          dataVendita: editForm.dataVendita,
          venditore: editForm.venditore,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error || 'Errore durante il salvataggio')
        setSaving(false)
        return
      }
      closeEdit()
      loadVendite()
    } catch {
      setSaveError('Errore di rete. Riprova.')
      setSaving(false)
    }
  }

  const filtered = vendite.filter(
    (v) =>
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.idModello.toLowerCase().includes(search.toLowerCase()) ||
      (v.venditore || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageShell>
      <PageHeader
        title="Vendite"
        subtitle={loading ? undefined : `${filtered.length} vendite`}
      />

      <div style={{ marginBottom: 20 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cerca SKU, modello, venditore..."
          onClear={() => setSearch('')}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={52} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🛍️"
          message={search ? 'Nessuna vendita trovata' : 'Nessuna vendita registrata'}
        />
      ) : (
        <div style={{ ...S.card, overflow: 'hidden' }}>
          <div className="inv-table-wrap"><div className="inv-table-min">
          <div
            style={{
              ...S.tableHeader,
              gridTemplateColumns: '90px 1fr 80px 110px 110px 110px 100px',
            }}
          >
            <span>SKU</span>
            <span>Modello</span>
            <span>Taglia</span>
            <span>Data</span>
            <span>Prezzo</span>
            <span>Netto</span>
            <span>Venditore</span>
          </div>
          {filtered.map((v, i) => (
            <div
              key={i}
              onClick={() => openEdit(v)}
              style={{
                ...S.tableRow,
                gridTemplateColumns: '90px 1fr 80px 110px 110px 110px 100px',
                cursor: 'pointer',
                borderBottom: i < filtered.length - 1 ? `1px solid ${colors.border}` : 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgElevated }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span
                style={{
                  background: colors.accentSoft,
                  border: `1px solid ${colors.accent}`,
                  borderRadius: radius.sm,
                  padding: '3px 8px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.accentBright,
                  justifySelf: 'start',
                }}
              >
                {v.sku}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {v.idModello || '—'}
              </span>
              <span style={{ fontSize: 13, color: colors.textSecondary }}>{v.taglia || '—'}</span>
              <span style={{ fontSize: 13, color: colors.textMuted }}>{v.dataVendita}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: colors.accentBright }}>{euro(v.prezzoVendita)}</span>
              <span style={{ fontSize: 13, color: colors.textMuted }}>{euro(v.guadagnoNetto)}</span>
              <span
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  background: v.venditore ? colors.bgElevated : 'transparent',
                  borderRadius: radius.sm,
                  padding: v.venditore ? '3px 8px' : 0,
                  justifySelf: 'start',
                }}
              >
                {v.venditore || '—'}
              </span>
            </div>
          ))}
          </div></div>
        </div>
      )}

      <BottomSheet open={!!editTarget} onClose={closeEdit}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...S.sectionTitle, fontSize: 17 }}>Modifica vendita</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 3 }}>
            {editTarget?.idModello || editTarget?.sku} — SKU {editTarget?.sku}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FormLabel>Prezzo vendita (€)</FormLabel>
            <FormInput
              type="number"
              step="0.01"
              value={editForm.prezzoVendita}
              onChange={(val) => setEditForm((f) => ({ ...f, prezzoVendita: val }))}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FormLabel>Data vendita</FormLabel>
            <FormInput
              type="date"
              value={editForm.dataVendita}
              onChange={(val) => setEditForm((f) => ({ ...f, dataVendita: val }))}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FormLabel>Venditore</FormLabel>
            <FormSelect
              value={editForm.venditore}
              onChange={(val) => setEditForm((f) => ({ ...f, venditore: val }))}
              placeholder="Nessuno"
            >
              {venditori.map((nome, idx) => (
                <option key={idx} value={nome}>
                  {nome}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>

        {saveError && (
          <div style={{ marginTop: 14 }}>
            <ErrorBox message={saveError} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <SecondaryButton fullWidth onClick={closeEdit}>
            Annulla
          </SecondaryButton>
          <PrimaryButton fullWidth onClick={saveEdit} disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva'}
          </PrimaryButton>
        </div>
      </BottomSheet>
    </PageShell>
  )
}
