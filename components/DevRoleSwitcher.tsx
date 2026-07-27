'use client'

import { useState } from 'react'
import { colors, radius } from '@/lib/theme'
import { useSession } from '@/lib/use-session'

const RUOLI = [
  { key: 'ceo', label: 'CEO' },
  { key: 'venditore', label: 'Venditore (Andri)' },
  { key: 'subvenditore', label: 'Sub-venditore (Gabriele)' },
] as const

/** Barra di test SOLO sviluppo: cambia ruolo/utente senza login manuale. */
export default function DevRoleSwitcher() {
  const session = useSession()
  const [loading, setLoading] = useState<string | null>(null)

  if (process.env.NODE_ENV === 'production') return null

  const attivo =
    session?.role === 'ceo' ? 'ceo' : session?.nome === 'Gabriele' ? 'subvenditore' : session?.role === 'venditore' ? 'venditore' : null

  async function impersona(ruolo: string) {
    setLoading(ruolo)
    try {
      await fetch('/api/dev/impersonate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ruolo }),
      })
      window.location.href = ruolo === 'ceo' ? '/' : '/venditore'
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: '#3a1d00',
        borderBottom: '1px solid #7a4a00',
        overflowX: 'auto',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 800, color: '#ffb84d', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
        DEV · vedi come
      </span>
      {RUOLI.map((r) => (
        <button
          key={r.key}
          type="button"
          disabled={loading !== null}
          onClick={() => impersona(r.key)}
          style={{
            flexShrink: 0,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: radius.sm,
            border: `1px solid ${attivo === r.key ? '#ffb84d' : colors.border}`,
            background: attivo === r.key ? '#ffb84d' : 'transparent',
            color: attivo === r.key ? '#3a1d00' : '#ffb84d',
            cursor: loading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading === r.key ? '...' : r.label}
        </button>
      ))}
    </div>
  )
}
