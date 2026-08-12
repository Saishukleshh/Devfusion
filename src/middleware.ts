import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'devfusion-super-secret-jwt-key-2026-hackathon'
);

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/customer',
  '/cart',
  '/checkout',
  '/orders',
  '/inventory',
  '/seller',
  '/admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userRole = (payload.role as string) || 'CUSTOMER';

      if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('redirectTo', pathname);
        redirectUrl.searchParams.set('error', 'Admin role required');
        return NextResponse.redirect(redirectUrl);
      }

      if (pathname.startsWith('/seller') && userRole !== 'SELLER' && userRole !== 'ADMIN') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('redirectTo', pathname);
        redirectUrl.searchParams.set('error', 'Seller role required');
        return NextResponse.redirect(redirectUrl);
      }
    } catch {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
