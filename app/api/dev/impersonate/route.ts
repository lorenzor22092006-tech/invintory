import { NextResponse } from 'next/server'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth'

/** SOLO sviluppo locale: permette di impersonare CEO / venditore / sub-venditore
    senza password, per testare rapidamente le dashboard diverse. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non disponibile in produzione' }, { status: 403 })
  }

  const body = await request.json()
  const ruolo = String(body.ruolo ?? '')

  const presets: Record<string, { role: 'ceo' | 'venditore'; nome: string; email: string; isSub?: boolean }> = {
    ceo: { role: 'ceo', nome: 'CEO', email: (process.env.ADMIN_EMAIL || 'ceo@test.it').toLowerCase() },
    venditore: { role: 'venditore', nome: 'Andri', email: 'andri@test.it', isSub: false },
    subvenditore: { role: 'venditore', nome: 'Gabriele', email: 'gabryavellino@gmail.com', isSub: true },
  }

  const preset = presets[ruolo]
  if (!preset) return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 })

  const token = createSessionToken(preset, true)
  const res = NextResponse.json({ success: true, ...preset })
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(true))
  return res
}
