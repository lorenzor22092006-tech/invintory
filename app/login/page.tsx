'use client'

import { useState } from 'react'
import { colors, S } from '@/lib/theme'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
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
        body: JSON.stringify({ email, password, remember }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Credenziali non valide')
        setLoading(false)
        return
      }
      // full reload: rimonta il layout (e il SessionProvider) col cookie appena impostato
      window.location.href = data.role === 'venditore' ? '/venditore' : '/'
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
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                autoComplete="current-password"
                style={{ ...S.input, paddingRight: 46 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              userSelect: 'none',
              marginTop: 2,
            }}
          >
            <span
              onClick={() => setRemember((v) => !v)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1.5px solid ${remember ? colors.accent : 'rgba(255,255,255,0.2)'}`,
                background: remember ? colors.accent : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {remember && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke={colors.onAccent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <span style={{ fontSize: 13, color: colors.textSecondary }}>
              Ricorda questo dispositivo per 14 giorni
            </span>
          </label>

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
