import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'
import { hasSupabaseConfig, supabase } from '@/lib/supabase'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const attempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_ATTEMPTS
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    // confronta comunque contro un buffer di pari lunghezza per non bocciare subito su timing
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Troppi tentativi, riprova più tardi' }, { status: 429 })
    }

    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const remember = body.remember === true

    if (!email || !password) {
      return NextResponse.json({ error: 'Inserisci email e password' }, { status: 400 })
    }

    // 1) Account CEO da variabili d'ambiente
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const adminPassword = process.env.ADMIN_PASSWORD || ''
    if (adminEmail && adminPassword && email === adminEmail && safeEqual(password, adminPassword)) {
      const token = createSessionToken({ role: 'ceo', nome: 'CEO', email }, remember)
      const res = NextResponse.json({ success: true, role: 'ceo' })
      res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(remember))
      return res
    }

    // 2) Venditori: account creati dal CEO in Supabase Auth.
    //    Client dedicato: signInWithPassword non deve toccare il client
    //    service-role condiviso (altrimenti sovrascrive l'auth e RLS blocca le query).
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 })
    }
    const authClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data, error } = await authClient.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 })
    }
    const meta = (data.user.user_metadata || {}) as { venditore?: string; role?: string }
    const nome = String(meta.venditore || '').trim()
    if (!nome) {
      return NextResponse.json({ error: 'Account non collegato a un venditore' }, { status: 403 })
    }

    // Query dati con il client service-role condiviso (NON authClient: dopo
    // signInWithPassword quel client passa al token dell'utente loggato e le
    // query successive tornano vuote invece di usare i permessi service-role).
    const { data: venditoreConfig } = await supabase
      .from('config_venditori')
      .select('capo')
      .eq('nome', nome)
      .maybeSingle()
    const isSub = Boolean(venditoreConfig?.capo)

    const token = createSessionToken({ role: 'venditore', nome, email, isSub }, remember)
    const res = NextResponse.json({ success: true, role: 'venditore', nome })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(remember))
    return res
  } catch {
    return NextResponse.json({ error: 'Errore durante il login' }, { status: 500 })
  }
}
