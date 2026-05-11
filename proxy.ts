import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/account'];
const clientRoutes = ['/reservations'];
const adminRoutes = ['/admin'];

const authRoutes = ['/login', '/register'];

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    const cookie = request.cookies.get('session')?.value;
    const session = await decrypt(cookie);

    const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
    const isClientRoute = clientRoutes.some((route) => path.startsWith(route));
    const isAdminRoute = adminRoutes.some((route) => path.startsWith(route));
    const isAuthRoute = authRoutes.includes(path);

    if ((isProtectedRoute || isClientRoute || isAdminRoute) && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthRoute && session) {
        return NextResponse.redirect(new URL('/fleet', request.url));
    }

    // Tylko klient ma panel rezerwacji (i nie pracownik)
    if (isClientRoute && session?.role !== 'client') {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Pracownik i admin mają dostęp do panelu admina
    if (isAdminRoute && (!session || !['admin', 'employee'].includes(session.role as string))) {
        return NextResponse.redirect(new URL('/fleet', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
    ],
};