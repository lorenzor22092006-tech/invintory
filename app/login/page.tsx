'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { colors, S } from '@/lib/theme'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Credenziali non valide')
        setLoading(false)
        return
      }
      router.replace(data.role === 'venditore' ? '/venditore' : '/')
      router.refresh()
    } catch {
      setError('Errore di rete. Riprova.')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="inv-glass" style={{ width: '100%', maxWidth: 400, borderRadius: 28, padding: '32px 26px' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              margin: '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 800,
              color: colors.onAccent,
              background:
                'linear-gradient(172deg, rgba(165,245,255,0.52) 0%, rgba(0,215,240,0.78) 18%, rgba(0,185,215,0.94) 50%, rgba(0,102,140,1) 100%)',
              boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.4), inset 0 -3px 8px rgba(0,20,30,0.4), 0 6px 20px rgba(0,190,218,0.25)',
            }}
          >
            RS
          </div>
          <h1 style={{ ...S.title, fontSize: 26 }}>Invintory</h1>
          <p style={{ ...S.subtitle, marginTop: 6 }}>Accedi al tuo account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@esempio.com"
              autoComplete="email"
              style={S.input}
            />
          </div>
          <div>
            <label style={S.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              style={S.input}
            />
          </div>

          {error && (
            <div
              style={{
                background: colors.dangerSoft,
                border: `1px solid ${colors.danger}`,
                borderRadius: 14,
                padding: '10px 14px',
                color: colors.danger,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="inv-btn inv-btn-primary"
            style={{ width: '100%', padding: '14px 22px', fontSize: 15, marginTop: 4 }}
          >
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}
