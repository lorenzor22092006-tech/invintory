import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_COOKIE = 'inv_session'

interface Session {
  role: 'ceo' | 'venditore'
  nome: string
  email: string
  exp: number
}

function verifyToken(token: string | undefined): Session | null {
  if (!token) return null
  const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'inv-dev-secret'
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', secret).update(payload).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const s = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
    if (!s.exp || s.exp < Date.now()) return null
    return s
  } catch {
    return null
  }
}

/** Percorsi raggiungibili senza login */
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/health']

/** Pagine consentite ai venditori (prefissi) */
const SELLER_ALLOWED = [
  '/venditore',
  '/taglie',
  '/vendite/nuova',
  '/resi/nuovo',
  '/stock/nuovo',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const session = verifyToken(request.cookies.get(SESSION_COOKIE)?.value)

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Già loggato → via dalla pagina di login
  if (pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = session.role === 'venditore' ? '/venditore' : '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Le API applicano i propri controlli di ruolo internamente
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (session.role === 'venditore') {
    const allowed = SELLER_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + '/'))
    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = '/venditore'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // tutto tranne asset statici e file pubblici
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)',
  ],
}
