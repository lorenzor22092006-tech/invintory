'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface ModelloDetail {
  idModello: string
  categoria: string
  fotoUrl: string
  xsStock: number
  sStock: number
  mStock: number
  lStock: number
  skuXS: string
  skuS: string
  skuM: string
  skuL: string
}

const TAGLIE = [
  { key: 'XS', stockKey: 'xsStock', skuKey: 'skuXS' },
  { key: 'S',  stockKey: 'sStock',  skuKey: 'skuS'  },
  { key: 'M',  stockKey: 'mStock',  skuKey: 'skuM'  },
  { key: 'L',  stockKey: 'lStock',  skuKey: 'skuL'  },
] as const

export default function ModelloPage() {
  const router = useRouter()
  const params = useParams()
  const modelloId = decodeURIComponent(params.modello as string)

  const [item, setItem] = useState<ModelloDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmDone, setConfirmDone] = useState(false)

  useEffect(() => {
    fetch('/api/taglie')
      .then((r) => r.json())
      .then((data) => {
        const found = (data.items || []).find(
          (i: ModelloDetail) =>
            i.idModello.toLowerCase() === modelloId.toLowerCase()
        )
        if (found) {
          setItem(found)
        } else {
          setNotFound(true)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [modelloId])

  async function handleConferma() {
    setConfirming(true)
    await new Promise((r) => setTimeout(r, 600))
    setConfirming(false)
    setConfirmDone(true)
    setTimeout(() => {
      router.back()
    }, 800)
  }

  async function handleElimina() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/taglie/${encodeURIComponent(modelloId)}`, {
        method: 'DELETE',
      })
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
      <div style={{ minHeight: '100dvh', background: '#061311', maxWidth: 430, margin: '0 auto', padding: '52px 20px 90px' }}>
        <div style={{ height: 200, borderRadius: 16, background: '#0B1F1A', opacity: 0.5, marginBottom: 16 }} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 64, borderRadius: 12, background: '#0B1F1A', opacity: 0.5, marginBottom: 10 }} />
        ))}
      </div>
    )
  }

  if (notFound || !item) {
    return (
      <div style={{ minHeight: '100dvh', background: '#061311', maxWidth: 430, margin: '0 auto', padding: '52px 20px', textAlign: 'center', color: '#64748B' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
        Modello non trovato
        <br />
        <button
          onClick={() => router.back()}
          style={{ marginTop: 20, background: '#10B981', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, padding: '10px 24px', cursor: 'pointer' }}
        >
          Indietro
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#061311', display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', paddingBottom: 90 }}>

      {/* POPUP CONFERMA ELIMINAZIONE */}
      {showDeletePopup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 24px',
        }}>
          <div style={{
            background: '#0B1F1A',
            border: '1.5px solid #1B3A34',
            borderRadius: 20,
            padding: '28px 24px',
            width: '100%',
            maxWidth: 360,
          }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC', textAlign: 'center', marginBottom: 8 }}>
              Elimina modello?
            </div>
            <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Stai per eliminare{' '}
              <strong style={{ color: '#F8FAFC' }}>{item.idModello}</strong>{' '}
              dal foglio. Questa azione non può essere annullata.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeletePopup(false)}
                disabled={deleting}
                style={{
                  flex: 1,
                  background: '#102A24',
                  border: '1.5px solid #1B3A34',
                  borderRadius: 14,
                  color: '#F8FAFC',
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '14px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                Non eliminare
              </button>
              <button
                onClick={handleElimina}
                disabled={deleting}
                style={{
                  flex: 1,
                  background: '#EF4444',
                  border: 'none',
                  borderRadius: 14,
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '14px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Eliminando...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BACK BUTTON */}
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

      {/* HERO: immagine + nome + categoria */}
      <div style={{ padding: '16px 20px 0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 110, height: 110, borderRadius: 16, background: '#102A24', border: '1.5px solid #1B3A34', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {item.fotoUrl ? (
            <img
              src={`/api/image-proxy?url=${encodeURIComponent(item.fotoUrl)}`}
              alt={item.idModello}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#1B3A34" strokeWidth="1.5" />
            </svg>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2, wordBreak: 'break-word' }}>
            {item.idModello}
          </div>
          <div style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
            {item.categoria}
          </div>
        </div>
      </div>

      {/* TAGLIE */}
      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 12px 1fr', gap: '0 0', marginBottom: 4, padding: '0 4px' }}>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>SIZE</span>
          <span />
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700, paddingLeft: 12 }}>SKU</span>
        </div>

        {TAGLIE.map(({ key, stockKey, skuKey }) => {
          const stock = item[stockKey] as number
          const skuRaw = item[skuKey] as string
          const skus = skuRaw
            ? skuRaw.split(/[;,]/).map((s) => s.trim()).filter(Boolean)
            : []
          const disponibile = stock > 0

          return (
            <div key={key} style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
              <div style={{
                width: 44, minHeight: 52, borderRadius: 12,
                background: disponibile ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.10)',
                border: `1.5px solid ${disponibile ? '#10B981' : '#EF4444'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: disponibile ? '#10B981' : '#EF4444' }}>
                  {key}
                </span>
              </div>
              <div style={{
                flex: 1, background: '#0B1F1A', border: '1.5px solid #1B3A34',
                borderRadius: 12, padding: '10px 14px', minHeight: 52,
                display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', overflowX: 'auto',
              }}>
                {skus.length > 0 ? (
                  skus.map((sku, idx) => (
                    <span key={idx} style={{
                      background: '#102A24', border: '1px solid #1B3A34',
                      borderRadius: 8, padding: '3px 10px',
                      fontSize: 13, fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap',
                    }}>
                      {sku}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 13, color: '#64748B' }}>
                    {disponibile ? 'Nessuno SKU registrato' : 'Non disponibile'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* BOTTONI CONFERMA / ELIMINA */}
      <div style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={handleConferma}
          disabled={confirming || confirmDone}
          style={{
            width: '100%',
            background: confirmDone ? '#059669' : confirming ? '#065F46' : '#10B981',
            border: 'none',
            borderRadius: 16,
            color: 'white',
            fontSize: 16,
            fontWeight: 700,
            padding: '16px',
            cursor: confirming || confirmDone ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 24px rgba(16,185,129,0.25)',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {confirmDone ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Confermato!
            </>
          ) : confirming ? (
            'Conferma in corso...'
          ) : (
            'Conferma'
          )}
        </button>

        <button
          onClick={() => setShowDeletePopup(true)}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1.5px solid #EF4444',
            borderRadius: 16,
            color: '#EF4444',
            fontSize: 16,
            fontWeight: 700,
            padding: '16px',
            cursor: 'pointer',
          }}
        >
          Elimina modello
        </button>
      </div>

    </div>
  )
}