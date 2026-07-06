'use client'

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react'

export interface ClientSession {
  role: 'ceo' | 'venditore'
  nome: string
  email: string
}

// null = non loggato, undefined = in caricamento
const SessionContext = createContext<ClientSession | null | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ClientSession | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (active) setSession(data) })
      .catch(() => { if (active) setSession(null) })
    return () => { active = false }
  }, [])

  return createElement(SessionContext.Provider, { value: session }, children)
}

/** Sessione corrente condivisa (un solo fetch per tutta l'app) */
export function useSession(): ClientSession | null | undefined {
  return useContext(SessionContext)
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  window.location.href = '/login'
}
