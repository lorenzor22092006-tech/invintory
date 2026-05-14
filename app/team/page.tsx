'use client'

import { useEffect, useState } from 'react'

interface Venditore {
  nome: string
  feePercentuale: number
}

type Sheet =
  | { tipo: 'add-venditore' }
  | { tipo: 'edit-venditore'; venditore: Venditore }
  | { tipo: 'delete-venditore'; nome: string }
  | { tipo: 'add-categoria' }
  | { tipo: 'edit-categoria'; nome: string }
  | { tipo: 'delete-categoria'; nome: string }
  | null

// ── piccoli componenti UI ──────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={type === 'number' ? '0.1' : undefined}
      style={{
        background: '#102A24',
        border: '1.5px solid #1B3A34',
        borderRadius: 12,
        padding: '12px 14px',
        color: '#F8FAFC',
        fontSize: 15,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
      }}
    />
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.10)',
        border: '1.5px solid #EF4444',
        borderRadius: 12,
        padding: '10px 14px',
        color: '#EF4444',
        fontSize: 14,
        marginTop: 12,
      }}
    >
      {msg}
    </div>
  )
}

function SheetHandle() {
  return (
    <div
      style={{
        width: 40,
        height: 4,
        background: '#1B3A34',
        borderRadius: 2,
        margin: '0 auto 20px',
      }}
    />
  )
}

function SheetOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50 }}
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
        {children}
      </div>
    </>
  )
}

// ── pagina principale ──────────────────────────────────────────────────────

export default function TeamPage() {
  const [venditori, setVenditori] = useState<Venditore[]>([])
  const [categorie, setCategorie] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // form venditore
  const [fNome, setFNome] = useState('')
  const [fFee, setFFee] = useState('')

  // form categoria
  const [fCat, setFCat] = useState('')

  function load() {
    setLoading(true)
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        setVenditori(data.venditori || [])
        setCategorie(data.categorie || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openSheet(s: Sheet) {
    setError(null)
    setSaving(false)
    if (s?.tipo === 'edit-venditore') {
      setFNome(s.venditore.nome)
      setFFee(String(s.venditore.feePercentuale))
    } else if (s?.tipo === 'add-venditore') {
      setFNome('')
      setFFee('')
    } else if (s?.tipo === 'edit-categoria') {
      setFCat(s.nome)
    } else if (s?.tipo === 'add-categoria') {
      setFCat('')
    }
    setSheet(s)
  }

  function closeSheet() {
    if (saving) return
    setSheet(null)
    setError(null)
  }

  async function api(method: string, body: object) {
    const res = await fetch('/api/config', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Errore')
    return data
  }

  // ── salva venditore (add / edit) ─────────────────────────────────────────
  async function saveVenditore() {
    if (!sheet) return
    const nome = fNome.trim()
    const fee = parseFloat(fFee.replace(',', '.')) || 0
    if (!nome) { setError('Il nome è obbligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      if (sheet.tipo === 'add-venditore') {
        await api('POST', { tipo: 'venditore', valore: nome, fee })
      } else if (sheet.tipo === 'edit-venditore') {
        await api('PATCH', { tipo: 'venditore', nomeOriginale: sheet.venditore.nome, nome, fee })
      }
      closeSheet()
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

  // ── elimina venditore ────────────────────────────────────────────────────
  async function deleteVenditore() {
    if (sheet?.tipo !== 'delete-venditore') return
    setSaving(true)
    setError(null)
    try {
      await api('DELETE', { tipo: 'venditore', nome: sheet.nome })
      closeSheet()
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

  // ── salva categoria (add / edit) ─────────────────────────────────────────
  async function saveCategoria() {
    if (!sheet) return
    const nome = fCat.trim()
    if (!nome) { setError('Il nome è obbligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      if (sheet.tipo === 'add-categoria') {
        await api('POST', { tipo: 'categoria', valore: nome })
      } else if (sheet.tipo === 'edit-categoria') {
        await api('PATCH', { tipo: 'categoria', nomeOriginale: sheet.nome, nome })
      }
      closeSheet()
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

  // ── elimina categoria ────────────────────────────────────────────────────
  async function deleteCategoria() {
    if (sheet?.tipo !== 'delete-categoria') return
    setSaving(true)
    setError(null)
    try {
      await api('DELETE', { tipo: 'categoria', nome: sheet.nome })
      closeSheet()
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore')
    } finally {
      setSaving(false)
    }
  }

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
      <div style={{ padding: '52px 20px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>Team</h1>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── VENDITORI ───────────────────────────────────────────────────── */}
        <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden' }}>
          {/* Header sezione */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #1B3A34' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>Venditori</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                {venditori.length} {venditori.length === 1 ? 'membro' : 'membri'}
              </div>
            </div>
            <button
              onClick={() => openSheet({ tipo: 'add-venditore' })}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#10B981',
                border: 'none',
                color: 'white',
                fontSize: 22,
                fontWeight: 300,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(16,185,129,0.3)',
              }}
            >
              +
            </button>
          </div>

          {/* Lista venditori */}
          {loading ? (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2].map((i) => (
                <div key={i} style={{ height: 52, borderRadius: 10, background: '#102A24', opacity: 0.5 }} />
              ))}
            </div>
          ) : venditori.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B', fontSize: 14 }}>
              Nessun venditore ancora
            </div>
          ) : (
            <div>
              {venditori.map((v, i) => (
                <div
                  key={v.nome}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '13px 16px',
                    borderBottom: i < venditori.length - 1 ? '1px solid #102A24' : 'none',
                    gap: 12,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid #1B3A34',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#10B981',
                      flexShrink: 0,
                    }}
                  >
                    {v.nome.charAt(0).toUpperCase()}
                  </div>

                  {/* Nome + fee */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.nome}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      Fee: {v.feePercentuale}%
                    </div>
                  </div>

                  {/* Fee badge */}
                  <span
                    style={{
                      background: '#102A24',
                      border: '1px solid #1B3A34',
                      borderRadius: 8,
                      padding: '3px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#10B981',
                      flexShrink: 0,
                    }}
                  >
                    {v.feePercentuale}%
                  </span>

                  {/* Modifica */}
                  <button
                    onClick={() => openSheet({ tipo: 'edit-venditore', venditore: v })}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: '#102A24',
                      border: '1px solid #1B3A34',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Elimina */}
                  <button
                    onClick={() => openSheet({ tipo: 'delete-venditore', nome: v.nome })}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── CATEGORIE ───────────────────────────────────────────────────── */}
        <div style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 14, overflow: 'hidden' }}>
          {/* Header sezione */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #1B3A34' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>Categorie prodotti</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                {categorie.length} {categorie.length === 1 ? 'categoria' : 'categorie'}
              </div>
            </div>
            <button
              onClick={() => openSheet({ tipo: 'add-categoria' })}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#10B981',
                border: 'none',
                color: 'white',
                fontSize: 22,
                fontWeight: 300,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(16,185,129,0.3)',
              }}
            >
              +
            </button>
          </div>

          {/* Lista categorie */}
          {loading ? (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 44, borderRadius: 10, background: '#102A24', opacity: 0.5 }} />
              ))}
            </div>
          ) : categorie.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B', fontSize: 14 }}>
              Nessuna categoria ancora
            </div>
          ) : (
            <div>
              {categorie.map((cat, i) => (
                <div
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: i < categorie.length - 1 ? '1px solid #102A24' : 'none',
                    gap: 12,
                  }}
                >
                  {/* Nome */}
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat}
                  </div>

                  {/* Modifica */}
                  <button
                    onClick={() => openSheet({ tipo: 'edit-categoria', nome: cat })}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: '#102A24',
                      border: '1px solid #1B3A34',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Elimina */}
                  <button
                    onClick={() => openSheet({ tipo: 'delete-categoria', nome: cat })}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── BOTTOM SHEET: aggiungi / modifica venditore ─────────────────── */}
      {(sheet?.tipo === 'add-venditore' || sheet?.tipo === 'edit-venditore') && (
        <SheetOverlay onClose={closeSheet}>
          <SheetHandle />
          <div style={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC', marginBottom: 4 }}>
            {sheet.tipo === 'add-venditore' ? 'Nuovo venditore' : 'Modifica venditore'}
          </div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
            {sheet.tipo === 'add-venditore'
              ? 'Aggiungi un membro al team'
              : `Stai modificando ${sheet.venditore.nome}`}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Label>Nome *</Label>
              <TextInput value={fNome} onChange={setFNome} placeholder="es. Lorenzo" />
            </div>
            <div>
              <Label>Fee % (commissione)</Label>
              <TextInput value={fFee} onChange={setFFee} placeholder="es. 5" type="number" />
            </div>
          </div>

          {error && <ErrorBox msg={error} />}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={closeSheet}
              disabled={saving}
              style={{ flex: 1, background: '#102A24', border: '1.5px solid #1B3A34', borderRadius: 14, color: '#F8FAFC', fontSize: 15, fontWeight: 700, padding: '14px', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
            >
              Annulla
            </button>
            <button
              onClick={saveVenditore}
              disabled={saving}
              style={{ flex: 1, background: saving ? '#065F46' : '#10B981', border: 'none', borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 700, padding: '14px', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.25)', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        </SheetOverlay>
      )}

      {/* ── BOTTOM SHEET: conferma elimina venditore ────────────────────── */}
      {sheet?.tipo === 'delete-venditore' && (
        <SheetOverlay onClose={closeSheet}>
          <SheetHandle />
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>
              Elimina venditore?
            </div>
            <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.5 }}>
              Stai per eliminare{' '}
              <strong style={{ color: '#F8FAFC' }}>{sheet.nome}</strong>{' '}
              dal team. I dati delle vendite esistenti non verranno modificati.
            </div>
          </div>

          {error && <ErrorBox msg={error} />}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              onClick={closeSheet}
              disabled={saving}
              style={{ flex: 1, background: '#102A24', border: '1.5px solid #1B3A34', borderRadius: 14, color: '#F8FAFC', fontSize: 15, fontWeight: 700, padding: '14px', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
            >
              Annulla
            </button>
            <button
              onClick={deleteVenditore}
              disabled={saving}
              style={{ flex: 1, background: saving ? '#7F1D1D' : '#EF4444', border: 'none', borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 700, padding: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Eliminando…' : 'Elimina'}
            </button>
          </div>
        </SheetOverlay>
      )}

      {/* ── BOTTOM SHEET: aggiungi / modifica categoria ─────────────────── */}
      {(sheet?.tipo === 'add-categoria' || sheet?.tipo === 'edit-categoria') && (
        <SheetOverlay onClose={closeSheet}>
          <SheetHandle />
          <div style={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC', marginBottom: 4 }}>
            {sheet.tipo === 'add-categoria' ? 'Nuova categoria' : 'Modifica categoria'}
          </div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
            {sheet.tipo === 'add-categoria'
              ? 'Aggiungi una categoria al catalogo prodotti'
              : `Stai modificando "${sheet.nome}"`}
          </div>

          <div>
            <Label>Nome categoria *</Label>
            <TextInput value={fCat} onChange={setFCat} placeholder="es. Sneakers" />
          </div>

          {error && <ErrorBox msg={error} />}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={closeSheet}
              disabled={saving}
              style={{ flex: 1, background: '#102A24', border: '1.5px solid #1B3A34', borderRadius: 14, color: '#F8FAFC', fontSize: 15, fontWeight: 700, padding: '14px', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
            >
              Annulla
            </button>
            <button
              onClick={saveCategoria}
              disabled={saving}
              style={{ flex: 1, background: saving ? '#065F46' : '#10B981', border: 'none', borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 700, padding: '14px', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.25)', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        </SheetOverlay>
      )}

      {/* ── BOTTOM SHEET: conferma elimina categoria ────────────────────── */}
      {sheet?.tipo === 'delete-categoria' && (
        <SheetOverlay onClose={closeSheet}>
          <SheetHandle />
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>
              Elimina categoria?
            </div>
            <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.5 }}>
              Stai per eliminare la categoria{' '}
              <strong style={{ color: '#F8FAFC' }}>&ldquo;{sheet.nome}&rdquo;</strong>.
              I prodotti già catalogati non verranno modificati.
            </div>
          </div>

          {error && <ErrorBox msg={error} />}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              onClick={closeSheet}
              disabled={saving}
              style={{ flex: 1, background: '#102A24', border: '1.5px solid #1B3A34', borderRadius: 14, color: '#F8FAFC', fontSize: 15, fontWeight: 700, padding: '14px', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
            >
              Annulla
            </button>
            <button
              onClick={deleteCategoria}
              disabled={saving}
              style={{ flex: 1, background: saving ? '#7F1D1D' : '#EF4444', border: 'none', borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 700, padding: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Eliminando…' : 'Elimina'}
            </button>
          </div>
        </SheetOverlay>
      )}

    </div>
  )
}
