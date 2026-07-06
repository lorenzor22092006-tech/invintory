import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'inv_session'
/** Durata quando l'utente NON spunta "ricorda" (sessione breve) */
const SESSION_DAYS_DEFAULT = 1
/** Durata con "ricorda questo dispositivo" */
const SESSION_DAYS_REMEMBER = 14

export interface Session {
  role: 'ceo' | 'venditore'
  /** Nome venditore (coincide con config_venditori.nome); per il CEO è "CEO" */
  nome: string
  email: string
  exp: number
}

function getSecret(): string {
  // AUTH_SECRET dedicato se presente, altrimenti deriva dal service role key
  // (privato e stabile) così non serve configurazione extra.
  return process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'inv-dev-secret'
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

export function sessionDays(remember: boolean): number {
  return remember ? SESSION_DAYS_REMEMBER : SESSION_DAYS_DEFAULT
}

export function createSessionToken(data: Omit<Session, 'exp'>, remember = false): string {
  const session: Session = {
    ...data,
    exp: Date.now() + sessionDays(remember) * 24 * 60 * 60 * 1000,
  }
  const payload = b64url(JSON.stringify(session))
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined): Session | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
    if (!session.exp || session.exp < Date.now()) return null
    if (session.role !== 'ceo' && session.role !== 'venditore') return null
    return session
  } catch {
    return null
  }
}

/** Sessione corrente da route handler / server component */
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

export async function requireCeo(): Promise<Session | null> {
  const s = await getSession()
  return s?.role === 'ceo' ? s : null
}

export function sessionCookieOptions(remember = false) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // "ricorda" → cookie persistente 14 giorni; altrimenti cookie di sessione
    // (senza maxAge sparisce alla chiusura del browser)
    ...(remember ? { maxAge: SESSION_DAYS_REMEMBER * 24 * 60 * 60 } : {}),
  }
}

/** Password leggibile: 12 caratteri senza ambigui (0/O, 1/l) */
export function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  for (const b of bytes) out += chars[b % chars.length]
  return out
}
