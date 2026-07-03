'use client'

import { useEffect, useState } from 'react'
import { colors, radius } from '@/lib/theme'

export default function SetupBanner() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok && data.message) setMessage(data.message)
      })
      .catch(() => {})
  }, [])

  if (!message) return null

  return (
    <div
      role="alert"
      style={{
        background: colors.dangerSoft,
        borderBottom: `1px solid ${colors.danger}`,
        padding: '14px 32px',
        fontSize: 14,
        lineHeight: 1.5,
        color: colors.text,
      }}
    >
      <strong style={{ color: colors.danger }}>Configurazione mancante — </strong>
      {message}
      <div style={{ marginTop: 8, fontSize: 13, color: colors.textSecondary }}>
        Crea il file <code style={{ color: colors.accentBright }}>.env.local</code> nella cartella del progetto, incolla le variabili da Vercel, salva e riavvia con{' '}
        <code style={{ color: colors.accentBright }}>npm run dev:clean</code>
      </div>
    </div>
  )
}
