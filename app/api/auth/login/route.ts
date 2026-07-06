import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasSupabaseConfig } from '@/lib/supabase'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: Request) {
  try {
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
    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
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

    const token = createSessionToken({ role: 'venditore', nome, email }, remember)
    const res = NextResponse.json({ success: true, role: 'venditore', nome })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(remember))
    return res
  } catch {
    return NextResponse.json({ error: 'Errore durante il login' }, { status: 500 })
  }
}
