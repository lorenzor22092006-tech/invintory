'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div style={{
      minHeight: '100dvh',
      background: '#061311',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 430,
      margin: '0 auto',
      paddingBottom: 90,
    }}>
      <div style={{ padding: '52px 20px 0' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#10B981', fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Indietro
        </button>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
          Nuovo modello
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>
          Aggiungi un nuovo modello al catalogo taglie
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* FOTO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Foto
          </label>
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
              background: '#0B1F1A',
              border: `2px dashed ${fotoPreview ? '#10B981' : '#1B3A34'}`,
              borderRadius: 14,
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
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }}
              />
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="#64748B" strokeWidth="1.5" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="#64748B" />
                  <path d="M21 15l-5-5L5 21" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 13, color: '#64748B' }}>Tocca per caricare una foto</span>
              </>
            )}
          </button>
          {fotoPreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'none', border: 'none', color: '#10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left' }}
            >
              Cambia foto
            </button>
          )}
        </div>

        {/* ID Modello */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ID Modello *
          </label>
          <input
            type="text"
            value={idModello}
            onChange={(e) => setIdModello(e.target.value.toUpperCase())}
            placeholder="es. NIKE AIR MAX 90"
            style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 12, padding: '14px 16px', color: '#F8FAFC', fontSize: 15, outline: 'none' }}
          />
        </div>

        {/* Categoria */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Categoria *
          </label>
          {categorie.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categorie.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
                  style={{
                    background: categoria === cat ? '#10B981' : '#0B1F1A',
                    border: `1.5px solid ${categoria === cat ? '#10B981' : '#1B3A34'}`,
                    borderRadius: 10,
                    padding: '8px 16px',
                    color: categoria === cat ? 'white' : '#94A3B8',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="es. Sneakers, Felpa, Pantalone..."
            style={{ background: '#0B1F1A', border: '1.5px solid #1B3A34', borderRadius: 12, padding: '14px 16px', color: '#F8FAFC', fontSize: 15, outline: 'none' }}
          />
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid #EF4444', borderRadius: 12, padding: '12px 16px', color: '#EF4444', fontSize: 14 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || success}
          style={{
            marginTop: 8,
            width: '100%',
            background: success ? '#059669' : loading ? '#065F46' : '#10B981',
            border: 'none',
            borderRadius: 16,
            color: 'white',
            fontSize: 16,
            fontWeight: 700,
            padding: '16px',
            cursor: loading || success ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 24px rgba(16,185,129,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {success ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Modello aggiunto!
            </>
          ) : loading ? 'Caricamento...' : 'Aggiungi modello'}
        </button>
      </form>
    </div>
  )
}
