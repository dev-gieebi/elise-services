// Protège toutes les pages et API : sans session valide => page de connexion
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

const PUBLIC = ['/login', '/api/auth/login', '/api/auth/logout'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p)) return NextResponse.next();

  const user = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (user) {
    // La page Utilisateurs est réservée au superadmin
    if (pathname.startsWith('/utilisateurs') && user.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Session expirée, veuillez vous reconnecter.' }, { status: 401 });
  }
  const url = new URL('/login', req.url);
  if (pathname !== '/') url.searchParams.set('suite', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:png|jpg|svg|ico)$).*)'],
};
