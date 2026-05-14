'use client'

import { useState, useEffect } from 'react'
import { Vendita } from '@/lib/types'

type VenditaExt = Vendita & { dataISO: string }

function parseDataISO(data: string): string {
  const p = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return p ? `${p[3]}-${p[2]}-${p[1]}` : data
}

function euro(n: number): string {
  return '€' + n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    <div
      style={{
        minHeight: '100dvh',
        background: '#061311',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 430,
        margin: '0 auto',
        paddingBottom: 90,
      }}
    >
      {/* HEADER */}
      <div style={{ padding: '52px 20px 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC', margin: '0 0 16px' }}>
          Vendite
        </h1>

        {/* SEARCH */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#0B1F1A',
            border: '1.5px solid #1B3A34',
            borderRadius: 14,
            padding: '0 16px',
            gap: 10,
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Cerca SKU, modello, venditore..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F8FAFC',
              fontSize: 15,
              padding: '13px 0',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{ height: 94, borderRadius: 14, background: '#0B1F1A', opacity: 0.5 }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: '#64748B',
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🛍️</div>
            {search ? 'Nessuna vendita trovata' : 'Nessuna vendita registrata'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((v, i) => (
              <div
                key={i}
                onClick={() => openEdit(v)}
                style={{
                  background: '#0B1F1A',
                  border: '1.5px solid #1B3A34',
                  borderRadius: 14,
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
              >
                {/* Riga 1: SKU badge + taglia + data + freccia */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span
                      style={{
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid #10B981',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#10B981',
                      }}
                    >
                      {v.sku}
                    </span>
                    {v.taglia && (
                      <span
                        style={{
                          background: '#102A24',
                          border: '1px solid #1B3A34',
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#94A3B8',
                        }}
                      >
                        {v.taglia}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{v.dataVendita}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="#1B3A34"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Riga 2: ID Modello */}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#F8FAFC',
                    marginBottom: 8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {v.idModello || '—'}
                </div>

                {/* Riga 3: prezzi + venditore */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>
                      {euro(v.prezzoVendita)}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      netto {euro(v.guadagnoNetto)}
                    </span>
                  </div>
                  {v.venditore && (
                    <span
                      style={{
                        fontSize: 12,
                        color: '#94A3B8',
                        background: '#102A24',
                        borderRadius: 6,
                        padding: '2px 8px',
                      }}
                    >
                      {v.venditore}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT BOTTOM SHEET */}
      {editTarget && (
        <>
          <div
            onClick={closeEdit}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              zIndex: 50,
            }}
          />
          <div
            style={{
              position: 'fixed',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: 0,
              width: '100%',
              maxWidth: 430,
              zIndex: 51,
              background: '#0B1F1A',
              borderRadius: '20px 20px 0 0',
              border: '1.5px solid #1B3A34',
              borderBottom: 'none',
              padding: '20px 20px 44px',
            }}
          >
            {/* Handle */}
            <div
              style={{
                width: 40,
                height: 4,
                background: '#1B3A34',
                borderRadius: 2,
                margin: '0 auto 20px',
              }}
            />

            {/* Titolo */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC' }}>
                Modifica vendita
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
                {editTarget.idModello || editTarget.sku} — SKU {editTarget.sku}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Prezzo vendita */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Prezzo vendita (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.prezzoVendita}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, prezzoVendita: e.target.value }))
                  }
                  style={{
                    background: '#102A24',
                    border: '1.5px solid #1B3A34',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#F8FAFC',
                    fontSize: 15,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Data vendita */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Data vendita
                </label>
                <input
                  type="date"
                  value={editForm.dataVendita}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, dataVendita: e.target.value }))
                  }
                  style={{
                    background: '#102A24',
                    border: '1.5px solid #1B3A34',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#F8FAFC',
                    fontSize: 15,
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              {/* Venditore */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Venditore
                </label>
                <select
                  value={editForm.venditore}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, venditore: e.target.value }))
                  }
                  style={{
                    background: '#102A24',
                    border: '1.5px solid #1B3A34',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: editForm.venditore ? '#F8FAFC' : '#64748B',
                    fontSize: 15,
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  <option value="">Nessuno</option>
                  {venditori.map((nome, i) => (
                    <option key={i} value={nome}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {saveError && (
              <div
                style={{
                  marginTop: 14,
                  background: 'rgba(239,68,68,0.10)',
                  border: '1.5px solid #EF4444',
                  borderRadius: 12,
                  padding: '10px 14px',
                  color: '#EF4444',
                  fontSize: 14,
                }}
              >
                {saveError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={closeEdit}
                style={{
                  flex: 1,
                  background: '#102A24',
                  border: '1.5px solid #1B3A34',
                  borderRadius: 14,
                  color: '#F8FAFC',
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '14px',
                  cursor: 'pointer',
                }}
              >
                Annulla
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{
                  flex: 1,
                  background: saving ? '#065F46' : '#10B981',
                  border: 'none',
                  borderRadius: 14,
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '14px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
