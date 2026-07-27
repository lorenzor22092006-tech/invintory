'use client'

import { useEffect, useState } from 'react'
import PagamentiVenditoriPanel from '@/components/PagamentiVenditoriPanel'
import {
  PageShell,
  PageHeader,
  SectionCard,
  BottomSheet,
  FormLabel,
  FormInput,
  ErrorBox,
  PrimaryButton,
  SecondaryButton,
  IconButton,
  EmptyState,
  Skeleton,
  colors,
} from '@/components/ui'

const ADMIN_PASSWORD = 'TESTAdiminchia1$'

interface Venditore {
  nome: string
  feePercentuale: number
  capo: string
}

type Sheet =
  | { tipo: 'add-venditore' }
  | { tipo: 'edit-venditore'; venditore: Venditore }
  | { tipo: 'delete-venditore'; nome: string }
  | { tipo: 'add-categoria' }
  | { tipo: 'edit-categoria'; nome: string }
  | { tipo: 'delete-categoria'; nome: string }
  | null

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
  const [fCapo, setFCapo] = useState('')

  // form categoria
  const [fCat, setFCat] = useState('')

  // credenziali accesso venditore
  const [credTarget, setCredTarget] = useState<string | null>(null)
  const [credEmail, setCredEmail] = useState('')
  const [credResult, setCredResult] = useState<{ email: string; password: string } | null>(null)
  const [credLoading, setCredLoading] = useState(false)
  const [credError, setCredError] = useState<string | null>(null)

  // password gate
  const [pendingAction, setPendingAction] = useState<Sheet>(null)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwVisible, setPwVisible] = useState(false)

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
      setFCapo(s.venditore.capo || '')
    } else if (s?.tipo === 'add-venditore') {
      setFNome('')
      setFFee('')
      setFCapo('')
    } else if (s?.tipo === 'edit-categoria') {
      setFCat(s.nome)
    } else if (s?.tipo === 'add-categoria') {
      setFCat('')
    }
    setSheet(s)
  }

  function requirePassword(action: Sheet) {
    setPendingAction(action)
    setPwInput('')
    setPwError(null)
    setPwVisible(false)
  }

  function confirmPassword() {
    if (pwInput === ADMIN_PASSWORD) {
      const action = pendingAction
      setPendingAction(null)
      setPwInput('')
      setPwError(null)
      openSheet(action)
    } else {
      setPwError('Password errata')
    }
  }

  function closeSheet() {
    if (saving) return
    setSheet(null)
    setError(null)
  }

  function closePasswordGate() {
    setPendingAction(null)
    setPwInput('')
    setPwError(null)
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
        await api('POST', { tipo: 'venditore', valore: nome, fee, capo: fCapo })
      } else if (sheet.tipo === 'edit-venditore') {
        await api('PATCH', { tipo: 'venditore', nomeOriginale: sheet.venditore.nome, nome, fee, capo: fCapo })
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

  const addIcon = (
    <span style={{ fontSize: 22, fontWeight: 300, lineHeight: 1 }}>+</span>
  )

  const editIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const deleteIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  return (
    <PageShell>
      <PageHeader
        title="Team"
        subtitle={loading ? undefined : `${venditori.length} venditori · ${categorie.length} categorie`}
      />

      {/* ── GESTIONE PAGAMENTI VENDITORI (sopra i box) ──────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <PagamentiVenditoriPanel />
      </div>

      <div className="inv-grid-2" style={{ alignItems: 'start' }}>

        {/* ── VENDITORI ───────────────────────────────────────────────────── */}
        <SectionCard
          title="Venditori"
          subtitle={`${venditori.length} ${venditori.length === 1 ? 'membro' : 'membri'}`}
          action={
            <IconButton
              variant="accent"
              size={36}
              label="Aggiungi venditore"
              onClick={() => requirePassword({ tipo: 'add-venditore' })}
            >
              {addIcon}
            </IconButton>
          }
        >
          {loading ? (
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2].map((i) => (
                <Skeleton key={i} height={52} />
              ))}
            </div>
          ) : venditori.length === 0 ? (
            <EmptyState icon="👥" message="Nessun venditore ancora" />
          ) : (
            <div>
              {venditori.map((v, i) => (
                <div
                  key={v.nome}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '13px 18px',
                    borderBottom: i < venditori.length - 1 ? `1px solid ${colors.border}` : 'none',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      background: colors.accentSoft,
                      border: `1px solid ${colors.borderStrong}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                      color: colors.accentBright,
                      flexShrink: 0,
                    }}
                  >
                    {v.nome.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.nome}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '2px 7px',
                          borderRadius: 999,
                          flexShrink: 0,
                          background: v.capo ? 'rgba(217,119,6,0.15)' : colors.accentSoft,
                          color: v.capo ? '#D97706' : colors.accentBright,
                        }}
                      >
                        {v.capo ? 'Sub' : 'Main'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      Fee: {v.feePercentuale}%{v.capo ? ` · capo: ${v.capo}` : ''}
                    </div>
                  </div>

                  <span
                    style={{
                      background: colors.bgElevated,
                      border: `1px solid ${colors.borderStrong}`,
                      borderRadius: 999,
                      padding: '4px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: colors.accentBright,
                      flexShrink: 0,
                    }}
                  >
                    {v.feePercentuale}%
                  </span>

                  <IconButton
                    size={34}
                    label={`Credenziali accesso ${v.nome}`}
                    onClick={() => {
                      setCredTarget(v.nome)
                      setCredEmail('')
                      setCredResult(null)
                      setCredError(null)
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                  </IconButton>

                  <IconButton
                    size={34}
                    label={`Modifica ${v.nome}`}
                    onClick={() => requirePassword({ tipo: 'edit-venditore', venditore: v })}
                  >
                    {editIcon}
                  </IconButton>

                  <IconButton
                    size={34}
                    variant="danger"
                    label={`Elimina ${v.nome}`}
                    onClick={() => requirePassword({ tipo: 'delete-venditore', nome: v.nome })}
                  >
                    {deleteIcon}
                  </IconButton>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── CATEGORIE ───────────────────────────────────────────────────── */}
        <SectionCard
          title="Categorie prodotti"
          subtitle={`${categorie.length} ${categorie.length === 1 ? 'categoria' : 'categorie'}`}
          action={
            <IconButton
              variant="accent"
              size={36}
              label="Aggiungi categoria"
              onClick={() => openSheet({ tipo: 'add-categoria' })}
            >
              {addIcon}
            </IconButton>
          }
        >
          {loading ? (
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={44} />
              ))}
            </div>
          ) : categorie.length === 0 ? (
            <EmptyState icon="🏷️" message="Nessuna categoria ancora" />
          ) : (
            <div>
              {categorie.map((cat, i) => (
                <div
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 18px',
                    borderBottom: i < categorie.length - 1 ? `1px solid ${colors.border}` : 'none',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat}
                  </div>

                  <IconButton
                    size={34}
                    label={`Modifica ${cat}`}
                    onClick={() => openSheet({ tipo: 'edit-categoria', nome: cat })}
                  >
                    {editIcon}
                  </IconButton>

                  <IconButton
                    size={34}
                    variant="danger"
                    label={`Elimina ${cat}`}
                    onClick={() => openSheet({ tipo: 'delete-categoria', nome: cat })}
                  >
                    {deleteIcon}
                  </IconButton>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

      </div>

      {/* ── BOTTOM SHEET: aggiungi / modifica venditore ─────────────────── */}
      <BottomSheet
        open={sheet?.tipo === 'add-venditore' || sheet?.tipo === 'edit-venditore'}
        onClose={closeSheet}
      >
        {sheet && (sheet.tipo === 'add-venditore' || sheet.tipo === 'edit-venditore') && (
          <>
            <div style={{ fontSize: 17, fontWeight: 800, color: colors.text, marginBottom: 4 }}>
              {sheet.tipo === 'add-venditore' ? 'Nuovo venditore' : 'Modifica venditore'}
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>
              {sheet.tipo === 'add-venditore'
                ? 'Aggiungi un membro al team'
                : `Stai modificando ${sheet.venditore.nome}`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <FormLabel>Nome *</FormLabel>
                <FormInput value={fNome} onChange={setFNome} placeholder="es. Lorenzo" />
              </div>
              <div>
                <FormLabel>Fee % (commissione)</FormLabel>
                <FormInput value={fFee} onChange={setFFee} placeholder="es. 5" type="number" step="0.1" />
              </div>
              <div>
                <FormLabel>Capo (opzionale — rende questo venditore un sub)</FormLabel>
                <select
                  value={fCapo}
                  onChange={(e) => setFCapo(e.target.value)}
                  style={{
                    width: '100%',
                    background: colors.bgInput,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: '13px 16px',
                    color: colors.text,
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Nessuno — venditore main</option>
                  {venditori
                    .filter((v) => v.nome !== fNome && !v.capo)
                    .map((v) => (
                      <option key={v.nome} value={v.nome}>{v.nome}</option>
                    ))}
                </select>
              </div>
            </div>

            {error && <div style={{ marginTop: 12 }}><ErrorBox message={error} /></div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <SecondaryButton onClick={closeSheet} disabled={saving} style={{ flex: 1 }}>
                Annulla
              </SecondaryButton>
              <PrimaryButton onClick={saveVenditore} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Salvataggio…' : 'Salva'}
              </PrimaryButton>
            </div>
          </>
        )}
      </BottomSheet>

      {/* ── BOTTOM SHEET: conferma elimina venditore ────────────────────── */}
      <BottomSheet open={sheet?.tipo === 'delete-venditore'} onClose={closeSheet}>
        {sheet?.tipo === 'delete-venditore' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: colors.text, marginBottom: 8 }}>
                Elimina venditore?
              </div>
              <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>
                Stai per eliminare{' '}
                <strong style={{ color: colors.text }}>{sheet.nome}</strong>{' '}
                dal team. I dati delle vendite esistenti non verranno modificati.
              </div>
            </div>

            {error && <ErrorBox message={error} />}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <SecondaryButton onClick={closeSheet} disabled={saving} style={{ flex: 1 }}>
                Annulla
              </SecondaryButton>
              <PrimaryButton
                onClick={deleteVenditore}
                disabled={saving}
                style={{ flex: 1, background: colors.danger, boxShadow: 'none' }}
              >
                {saving ? 'Eliminando…' : 'Elimina'}
              </PrimaryButton>
            </div>
          </>
        )}
      </BottomSheet>

      {/* ── BOTTOM SHEET: aggiungi / modifica categoria ─────────────────── */}
      <BottomSheet
        open={sheet?.tipo === 'add-categoria' || sheet?.tipo === 'edit-categoria'}
        onClose={closeSheet}
      >
        {sheet && (sheet.tipo === 'add-categoria' || sheet.tipo === 'edit-categoria') && (
          <>
            <div style={{ fontSize: 17, fontWeight: 800, color: colors.text, marginBottom: 4 }}>
              {sheet.tipo === 'add-categoria' ? 'Nuova categoria' : 'Modifica categoria'}
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>
              {sheet.tipo === 'add-categoria'
                ? 'Aggiungi una categoria al catalogo prodotti'
                : `Stai modificando "${sheet.nome}"`}
            </div>

            <div>
              <FormLabel>Nome categoria *</FormLabel>
              <FormInput value={fCat} onChange={setFCat} placeholder="es. Sneakers" />
            </div>

            {error && <div style={{ marginTop: 12 }}><ErrorBox message={error} /></div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <SecondaryButton onClick={closeSheet} disabled={saving} style={{ flex: 1 }}>
                Annulla
              </SecondaryButton>
              <PrimaryButton onClick={saveCategoria} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Salvataggio…' : 'Salva'}
              </PrimaryButton>
            </div>
          </>
        )}
      </BottomSheet>

      {/* ── PASSWORD GATE (solo per azioni venditori) ───────────────────── */}
      <BottomSheet open={pendingAction !== null} onClose={closePasswordGate}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: colors.accentSoft,
              border: `1px solid ${colors.borderStrong}`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke={colors.accentBright} strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" stroke={colors.accentBright} strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1.5" fill={colors.accentBright} />
            </svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: colors.text }}>Accesso richiesto</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
            Inserisci la password admin per continuare
          </div>
        </div>

        <div style={{ position: 'relative', marginTop: 16 }}>
          <input
            type={pwVisible ? 'text' : 'password'}
            value={pwInput}
            onChange={(e) => { setPwInput(e.target.value); setPwError(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmPassword() }}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%',
              background: colors.bgInput,
              border: `1px solid ${pwError ? colors.danger : colors.border}`,
              borderRadius: 18,
              padding: '13px 48px 13px 16px',
              color: colors.text,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={() => setPwVisible((v) => !v)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: colors.textMuted,
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {pwVisible ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>

        {pwError && (
          <div style={{ marginTop: 10 }}>
            <ErrorBox message={pwError} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <SecondaryButton onClick={closePasswordGate} style={{ flex: 1 }}>
            Annulla
          </SecondaryButton>
          <PrimaryButton onClick={confirmPassword} style={{ flex: 1 }}>
            Conferma
          </PrimaryButton>
        </div>
      </BottomSheet>

      {/* ── BOTTOM SHEET: conferma elimina categoria ────────────────────── */}
      <BottomSheet open={sheet?.tipo === 'delete-categoria'} onClose={closeSheet}>
        {sheet?.tipo === 'delete-categoria' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: colors.text, marginBottom: 8 }}>
                Elimina categoria?
              </div>
              <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>
                Stai per eliminare la categoria{' '}
                <strong style={{ color: colors.text }}>&ldquo;{sheet.nome}&rdquo;</strong>.
                I prodotti già catalogati non verranno modificati.
              </div>
            </div>

            {error && <ErrorBox message={error} />}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <SecondaryButton onClick={closeSheet} disabled={saving} style={{ flex: 1 }}>
                Annulla
              </SecondaryButton>
              <PrimaryButton
                onClick={deleteCategoria}
                disabled={saving}
                style={{ flex: 1, background: colors.danger, boxShadow: 'none' }}
              >
                {saving ? 'Eliminando…' : 'Elimina'}
              </PrimaryButton>
            </div>
          </>
        )}
      </BottomSheet>

      {/* ── BOTTOM SHEET: credenziali accesso venditore ─────────────────── */}
      <BottomSheet
        open={!!credTarget}
        onClose={() => setCredTarget(null)}
      >
        {credTarget && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: colors.text }}>
                Accesso app — {credTarget}
              </div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 1.5 }}>
                Genera email e password che il venditore userà per entrare nella sua dashboard.
              </div>
            </div>

            {credResult ? (
              <>
                <div
                  style={{
                    background: colors.accentSoft,
                    border: `1px solid ${colors.borderStrong}`,
                    borderRadius: 16,
                    padding: '16px 18px',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginTop: 4, wordBreak: 'break-all' }}>{credResult.email}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 14 }}>Password</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: colors.accentBright, marginTop: 4, letterSpacing: '0.06em', fontFamily: 'ui-monospace, monospace' }}>
                    {credResult.password}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: colors.warning, marginBottom: 16, lineHeight: 1.5 }}>
                  ⚠️ Copia e invia subito queste credenziali al venditore: la password non sarà più visibile.
                  Puoi rigenerarla in qualsiasi momento da qui.
                </div>
                <PrimaryButton
                  fullWidth
                  onClick={() => {
                    navigator.clipboard?.writeText(`Email: ${credResult.email}\nPassword: ${credResult.password}`).catch(() => {})
                    setCredTarget(null)
                  }}
                >
                  Copia e chiudi
                </PrimaryButton>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  <FormLabel>Email del venditore</FormLabel>
                  <FormInput
                    type="email"
                    value={credEmail}
                    onChange={setCredEmail}
                    placeholder="nome@esempio.com"
                  />
                </div>

                {credError && (
                  <div style={{ marginBottom: 14 }}>
                    <ErrorBox message={credError} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <SecondaryButton onClick={() => setCredTarget(null)} disabled={credLoading} style={{ flex: 1 }}>
                    Annulla
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={async () => {
                      setCredLoading(true)
                      setCredError(null)
                      try {
                        const res = await fetch('/api/config/accesso', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ nome: credTarget, email: credEmail }),
                        })
                        const data = await res.json()
                        if (!res.ok) {
                          setCredError(data.error || 'Errore generazione credenziali')
                        } else {
                          setCredResult({ email: data.email, password: data.password })
                        }
                      } catch {
                        setCredError('Errore di rete. Riprova.')
                      }
                      setCredLoading(false)
                    }}
                    disabled={credLoading || !credEmail.trim()}
                    style={{ flex: 1 }}
                  >
                    {credLoading ? 'Generazione…' : 'Genera password'}
                  </PrimaryButton>
                </div>
              </>
            )}
          </>
        )}
      </BottomSheet>

    </PageShell>
  )
}
