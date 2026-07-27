import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

/** Percorsi raggiungibili senza login */
const PUBLIC_PATHS = ['/login', '/link', '/api/auth/login', '/api/auth/logout', '/api/health', '/api/dev']

/** Pagine consentite ai venditori (prefissi) */
const SELLER_ALLOWED = [
  '/venditore',
  '/taglie',
  '/vendite/nuova',
  '/resi',
  '/stock/nuovo',
]

/** Prefissi vietati ai sub-venditori: possono solo registrare vendite, non gestire resi/stock */
const SUB_FORBIDDEN = ['/resi', '/stock/nuovo']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)

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
    const vietatoPerSub =
      session.isSub && SUB_FORBIDDEN.some((p) => pathname === p || pathname.startsWith(p + '/'))
    if (!allowed || vietatoPerSub) {
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
