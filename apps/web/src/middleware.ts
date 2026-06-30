import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getRoleFromSessionClaims } from './lib/auth-role';

const isPublicRoute = createRouteMatcher([
  '/',
  '/shop(.*)',
  '/games(.*)',
  '/faq(.*)',
  '/contact(.*)',
  '/checkout(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/admin/sign-in(.*)',
  '/auth/redirect(.*)',
  '/api/webhooks(.*)',
  '/api/games(.*)',
  '/api/health(.*)',
  '/api/payments/webhook(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isAdminSignInRoute = createRouteMatcher(['/admin/sign-in(.*)']);
const isAdminSignUpRoute = createRouteMatcher(['/admin/sign-up(.*)']);
const isSignInRoute = createRouteMatcher(['/sign-in(.*)']);

function resolveAdminEntryPath(redirectUrl: string | null): string {
  if (redirectUrl && redirectUrl.startsWith('/admin')) {
    return redirectUrl;
  }
  return '/admin';
}

export default clerkMiddleware(async (auth, req) => {
  if (isAdminSignUpRoute(req)) {
    return new NextResponse(null, { status: 404 });
  }

  if (isAdminSignInRoute(req)) {
    const { userId, sessionClaims } = await auth();
    if (userId) {
      const redirectUrl = req.nextUrl.searchParams.get('redirect_url');
      if (getRoleFromSessionClaims(sessionClaims as Record<string, unknown>) === 'admin') {
        return NextResponse.redirect(
          new URL(resolveAdminEntryPath(redirectUrl), req.url),
        );
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
    return;
  }

  if (isPublicRoute(req)) {
    if (isSignInRoute(req)) {
      const { userId } = await auth();
      if (userId) {
        const redirectUrl = req.nextUrl.searchParams.get('redirect_url');
        const target = new URL('/auth/redirect', req.url);
        if (redirectUrl) {
          target.searchParams.set('redirect_url', redirectUrl);
        }
        return NextResponse.redirect(target);
      }
    }
    return;
  }

  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      const signIn = new URL('/admin/sign-in', req.url);
      signIn.searchParams.set('redirect_url', req.nextUrl.pathname);
      return NextResponse.redirect(signIn);
    }

    if (getRoleFromSessionClaims(sessionClaims as Record<string, unknown>) !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return;
  }

  // Protected user routes (my-games, etc.) — Clerk Neon pattern: require auth
  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
