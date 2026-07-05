'use client'

import { useEffect, useState } from 'react'

export interface ClientSession {
  role: 'ceo' | 'venditore'
  nome: string
  email: string
}

/** Sessione corrente lato client (null = non loggato, undefined = in caricamento) */
export function useSession(): ClientSession | null | undefined {
  const [session, setSession] = useState<ClientSession | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSession(data))
      .catch(() => setSession(null))
  }, [])

  return session
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  window.location.href = '/login'
}
