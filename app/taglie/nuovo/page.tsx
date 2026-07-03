'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PageShell,
  PageHeader,
  BackButton,
  PrimaryButton,
  FormLabel,
  FormInput,
  ErrorBox,
  Chip,
  colors,
  S,
} from '@/components/ui'
import { radius } from '@/lib/theme'

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

export default function NuovoModelloPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [idModello, setIdModello] = useState('')
  const [categoria, setCategoria] = useState('')
  const [categorie, setCategorie] = useState<string[]>([])
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/taglie')
      .then((r) => r.json())
      .then((data) => setCategorie(data.categorie || []))
      .catch(() => {})
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0]
    if (!rawFile) return
    const needsConvert = rawFile.type === 'image/heic' || rawFile.type === 'image/heif' || rawFile.type === ''
    const file = needsConvert ? await convertToJpeg(rawFile) : rawFile
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!idModello.trim() || !categoria.trim()) {
      setError('ID Modello e Categoria sono obbligatori.')
      return
    }
    setLoading(true)
    try {
      let fotoUrl = ''
      if (fotoFile) {
        const fd = new FormData()
        fd.append('file', fotoFile)
        fd.append('modelloId', idModello.trim())
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Errore upload foto')
        fotoUrl = uploadData.url
      }

      const res = await fetch('/api/taglie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idModello: idModello.trim(), categoria: categoria.trim(), fotoUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Errore durante il salvataggio')
        setLoading(false)
        return
      }
      setSuccess(true)
      setTimeout(() => router.back(), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di rete. Riprova.')
      setLoading(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Nuovo modello"
        subtitle="Aggiungi un nuovo modello al catalogo taglie"
        back={<BackButton onClick={() => router.back()} />}
      />

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FormLabel>Foto</FormLabel>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              height: fotoPreview ? 'auto' : 120,
              background: colors.bgCard,
              border: `2px dashed ${fotoPreview ? colors.accent : colors.border}`,
              borderRadius: radius.lg,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              overflow: 'hidden',
              padding: 0,
            }}
          >
            {fotoPreview ? (
              <img
                src={fotoPreview}
                alt="preview"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: radius.md }}
              />
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke={colors.textMuted} strokeWidth="1.5" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill={colors.textMuted} />
                  <path d="M21 15l-5-5L5 21" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 13, color: colors.textMuted }}>Tocca per caricare una foto</span>
              </>
            )}
          </button>
          {fotoPreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'none', border: 'none', color: colors.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left' }}
            >
              Cambia foto
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FormLabel>ID Modello *</FormLabel>
          <input
            type="text"
            value={idModello}
            onChange={(e) => setIdModello(e.target.value.toUpperCase())}
            placeholder="es. NIKE AIR MAX 90"
            style={S.input}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FormLabel>Categoria *</FormLabel>
          {categorie.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categorie.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  active={categoria === cat}
                  onClick={() => setCategoria(cat)}
                />
              ))}
            </div>
          )}
          <FormInput
            value={categoria}
            onChange={setCategoria}
            placeholder="es. Sneakers, Felpa, Pantalone..."
          />
        </div>

        {error && <ErrorBox message={error} />}

        <PrimaryButton
          type="submit"
          disabled={loading || success}
          fullWidth
          style={{
            marginTop: 8,
            background: success ? colors.accentDark : loading ? '#065F46' : colors.accentBright,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {success ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke={colors.onAccent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Modello aggiunto!
            </>
          ) : loading ? 'Caricamento...' : 'Aggiungi modello'}
        </PrimaryButton>
      </form>
    </PageShell>
  )
}
