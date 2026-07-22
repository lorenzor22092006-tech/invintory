'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  PageShell,
  PageHeader,
  BackButton,
  PrimaryButton,
  SecondaryButton,
  Skeleton,
  EmptyState,
  colors,
  S,
} from '@/components/ui'
import { radius } from '@/lib/theme'

interface TagliaStock {
  taglia: string
  stock: number
  skus: string[]
}

interface ModelloDetail {
  idModello: string
  categoria: string
  fotoUrl: string
  taglie: TagliaStock[]
  // legacy
  xsStock: number
  sStock: number
  mStock: number
  lStock: number
  skuXS: string
  skuS: string
  skuM: string
  skuL: string
}

function convertToJpeg(file: File): Promise<File> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        if (!blob) { resolve(file); return }
        resolve(new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.88)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

function getImageSrc(fotoUrl: string) {
  if (!fotoUrl) return null
  if (fotoUrl.includes('supabase.co/storage')) return fotoUrl
  return `/api/image-proxy?url=${encodeURIComponent(fotoUrl)}`
}

export default function ModelloPage() {
  const router = useRouter()
  const params = useParams()
  const modelloId = decodeURIComponent(params.modello as string)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [item, setItem] = useState<ModelloDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fotoSaved, setFotoSaved] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmDone, setConfirmDone] = useState(false)

  useEffect(() => {
    fetch('/api/taglie')
      .then((r) => r.json())
      .then((data) => {
        const found = (data.items || []).find(
          (i: ModelloDetail) => i.idModello.toLowerCase() === modelloId.toLowerCase()
        )
        if (found) setItem(found)
        else setNotFound(true)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [modelloId])

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0]
    if (!rawFile) return
    setUploading(true)
    try {
      const needsConvert = rawFile.type === 'image/heic' || rawFile.type === 'image/heif' || rawFile.type === ''
      const file = needsConvert ? await convertToJpeg(rawFile) : rawFile
      const fd = new FormData()
      fd.append('file', file)
      fd.append('modelloId', modelloId)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Errore upload')

      const newUrl = uploadData.url

      const patchRes = await fetch(`/api/taglie/${encodeURIComponent(modelloId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotoUrl: newUrl }),
      })
      if (!patchRes.ok) throw new Error('Errore salvataggio')

      setItem((prev) => prev ? { ...prev, fotoUrl: newUrl } : prev)
      setFotoSaved(true)
      setTimeout(() => setFotoSaved(false), 2500)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore durante il caricamento')
    }
    setUploading(false)
  }

  async function handleConferma() {
    setConfirming(true)
    await new Promise((r) => setTimeout(r, 600))
    setConfirming(false)
    setConfirmDone(true)
    setTimeout(() => router.back(), 800)
  }

  async function handleElimina() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/taglie/${encodeURIComponent(modelloId)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Errore durante l'eliminazione")
        setDeleting(false)
        setShowDeletePopup(false)
        return
      }
      setShowDeletePopup(false)
      router.back()
    } catch {
      alert('Errore di rete. Riprova.')
      setDeleting(false)
      setShowDeletePopup(false)
    }
  }

  if (loading) {
    return (
      <PageShell style={S.pagePad}>
        <Skeleton height={200} style={{ marginBottom: 16 }} />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={64} style={{ marginBottom: 10 }} />
        ))}
      </PageShell>
    )
  }

  if (notFound || !item) {
    return (
      <PageShell style={S.pagePad}>
        <EmptyState icon="❌" message="Modello non trovato" />
        <PrimaryButton onClick={() => router.back()} style={{ marginTop: 20 }}>
          Indietro
        </PrimaryButton>
      </PageShell>
    )
  }

  const imageSrc = getImageSrc(item.fotoUrl)

  return (
    <PageShell>
      {showDeletePopup && (
        <div style={{ ...S.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ ...S.card, padding: '28px 24px', width: '100%', maxWidth: 360 }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
            <div style={{ ...S.sectionTitle, textAlign: 'center', marginBottom: 8 }}>Elimina modello?</div>
            <div style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Stai per eliminare <strong style={{ color: colors.text }}>{item.idModello}</strong> dal catalogo.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <SecondaryButton
                onClick={() => setShowDeletePopup(false)}
                disabled={deleting}
                style={{ flex: 1, opacity: deleting ? 0.5 : 1 }}
              >
                Non eliminare
              </SecondaryButton>
              <button
                onClick={handleElimina}
                disabled={deleting}
                style={{
                  flex: 1,
                  background: colors.danger,
                  border: 'none',
                  borderRadius: radius.md,
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '14px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                  fontFamily: S.btnPrimary.fontFamily,
                }}
              >
                {deleting ? 'Eliminando...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title={item.idModello}
        subtitle={item.categoria}
        back={<BackButton onClick={() => router.back()} />}
      />

      <div style={{ padding: `0 20px`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 110,
            height: 110,
            borderRadius: radius.lg,
            background: colors.bgElevated,
            border: `1px solid ${uploading ? colors.accent : colors.border}`,
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {uploading ? (
            <div style={{ fontSize: 12, color: colors.accent, fontWeight: 700, textAlign: 'center', padding: 8 }}>
              Carico...
            </div>
          ) : imageSrc ? (
            <>
              <img src={imageSrc} alt={item.idModello} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', fontSize: 10, color: colors.text, textAlign: 'center', padding: '4px 0' }}>
                Cambia
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke={colors.border} strokeWidth="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" fill={colors.border} />
                <path d="M21 15l-5-5L5 21" stroke={colors.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 10, color: colors.textMuted }}>Carica foto</span>
            </div>
          )}
          {fotoSaved && (
            <div style={{ position: 'absolute', inset: 0, background: colors.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke={colors.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" onChange={handleFotoChange} style={{ display: 'none' }} />

        <div style={{ minWidth: 0, paddingTop: 8 }}>
          <div style={{ fontSize: 12, color: colors.accent, marginTop: 8, cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
            {item.fotoUrl ? '📷 Cambia foto' : '📷 Carica foto'}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 12px 1fr', gap: '0 0', marginBottom: 4, padding: '0 4px' }}>
          <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700 }}>SIZE</span>
          <span />
          <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700, paddingLeft: 12 }}>SKU</span>
        </div>

        {(item.taglie || []).map(({ taglia: key, stock, skus }) => {
          const disponibile = stock > 0
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
              <div
                style={{
                  width: 44,
                  minHeight: 52,
                  borderRadius: radius.md,
                  background: disponibile ? colors.accentSoft : colors.dangerSoft,
                  border: `1px solid ${disponibile ? colors.accent : colors.danger}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: disponibile ? colors.accent : colors.danger }}>{key}</span>
              </div>
              <div
                style={{
                  flex: 1,
                  ...S.cardInset,
                  padding: '10px 14px',
                  minHeight: 52,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                {skus.length > 0 ? (
                  skus.map((sku, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: colors.bgMuted,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.sm,
                        padding: '3px 10px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: colors.text,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sku}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 13, color: colors.textMuted }}>
                    {disponibile ? 'Nessuno SKU registrato' : 'Non disponibile'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PrimaryButton
          onClick={handleConferma}
          disabled={confirming || confirmDone}
          fullWidth
          style={{
            background: confirmDone ? colors.accentDark : confirming ? '#065F46' : colors.accentBright,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {confirmDone ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke={colors.onAccent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Confermato!
            </>
          ) : confirming ? 'Conferma in corso...' : 'Conferma'}
        </PrimaryButton>
        <button
          onClick={() => setShowDeletePopup(true)}
          style={{
            width: '100%',
            background: 'transparent',
            border: `1px solid ${colors.danger}`,
            borderRadius: radius.lg,
            color: colors.danger,
            fontSize: 16,
            fontWeight: 700,
            padding: '16px',
            cursor: 'pointer',
            fontFamily: S.btnPrimary.fontFamily,
          }}
        >
          Elimina modello
        </button>
      </div>
    </PageShell>
  )
}
