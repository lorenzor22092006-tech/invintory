'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NuovoModelloPage() {
  const router = useRouter()

  const [idModello, setIdModello] = useState('')
  const [categoria, setCategoria] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [categorie, setCategorie] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/taglie')
      .then((r) => r.json())
      .then((data) => {
        setCategorie(data.categorie || [])
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!idModello.trim() || !categoria.trim()) {
      setError('ID Modello e Categoria sono obbligatori.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/taglie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idModello: idModello.trim(),
          categoria: categoria.trim(),
          fotoUrl: fotoUrl.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Errore durante il salvataggio')
        setLoading(false)
        return
      }
      setSuccess(true)
      setTimeout(() => router.back(), 1000)
    } catch {
      setError('Errore di rete. Riprova.')
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
      {/* BACK BUTTON */}
      <div style={{ padding: '52px 20px 0' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#10B981',
            fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Indietro
        </button>
      </div>

      {/* HEADER */}
      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
          Nuovo modello
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>
          Aggiungi un nuovo modello al catalogo taglie
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

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
            style={{
              background: '#0B1F1A',
              border: '1.5px solid #1B3A34',
              borderRadius: 12,
              padding: '14px 16px',
              color: '#F8FAFC',
              fontSize: 15,
              outline: 'none',
            }}
          />
        </div>

        {/* Categoria */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Categoria *
          </label>
          {categorie.length > 0 ? (
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
              <button
                type="button"
                onClick={() => setCategoria('')}
                style={{
                  background: 'transparent',
                  border: '1.5px dashed #1B3A34',
                  borderRadius: 10,
                  padding: '8px 16px',
                  color: '#64748B',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                + Altra
              </button>
            </div>
          ) : null}
          <input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="es. Sneakers, Felpa, Pantalone..."
            style={{
              background: '#0B1F1A',
              border: '1.5px solid #1B3A34',
              borderRadius: 12,
              padding: '14px 16px',
              color: '#F8FAFC',
              fontSize: 15,
              outline: 'none',
            }}
          />
        </div>

        {/* Foto URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Link foto (Google Drive)
          </label>
          <input
            type="text"
            value={fotoUrl}
            onChange={(e) => setFotoUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            style={{
              background: '#0B1F1A',
              border: '1.5px solid #1B3A34',
              borderRadius: 12,
              padding: '14px 16px',
              color: '#F8FAFC',
              fontSize: 15,
              outline: 'none',
            }}
          />
          <span style={{ fontSize: 12, color: '#64748B' }}>
            Opzionale — incolla il link condivisibile di Google Drive
          </span>
        </div>

        {/* Errore */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1.5px solid #EF4444',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#EF4444',
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
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
          ) : loading ? (
            'Salvataggio...'
          ) : (
            'Aggiungi modello'
          )}
        </button>

      </form>
    </div>
  )
}