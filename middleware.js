import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * This middleware is responsible for protecting routes by enforcing authentication.
 * It utilizes NextAuth's withAuth helper to automatically handle sessions and redirections.
 */
export default withAuth(
  /**
   * The core middleware function.
   * Runs only if the user is authenticated (i.e., if `authorized` returns true).
   * You can add further logic here to modify the response or redirect if needed.
   */
  function middleware(req) {
    // Request proceeds if user is authenticated or path is whitelisted by `authorized`.
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * The `authorized` callback determines whether a user can access a route.
       * 
       * - `token`: JWT/session token object (if present, the user is authenticated).
       * - `req`: The request object.
       */
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to all pages under `/auth/` (login, signup, etc.) for both authenticated and unauthenticated users.
        if (pathname.startsWith('/auth/')) {
          return true;
        }
        
        // Allow access to NextAuth API routes (e.g., sign-in, sign-out, callback endpoints) for everyone.
        if (pathname.startsWith('/api/auth/')) {
          return true;
        }
        
        // For all other routes, only allow access if the session token exists (user is authenticated).
        return !!token;
      },
    },
    /**
     * Custom pages configuration for NextAuth.
     * When unauthenticated users attempt to access a protected route, they are redirected to this sign-in page.
     */
    pages: {
      signIn: '/auth/signin',
    },
  }
);

/**
 * The `config` object determines which routes the middleware applies to using the `matcher` property.
 * 
 * This matcher applies the middleware to all routes *except*:
 *   - API authentication endpoints (`/api/auth`)
 *   - Next.js static files (`/_next/static`)
 *   - Next.js image optimization files (`/_next/image`)
 *   - The favicon (`/favicon.ico`)
 *   - Static image assets (files ending with .png, .jpg, .jpeg, .gif, .svg)
 *   - Public folder files with those extensions
 * 
 * This prevents the middleware from running on static resources and public API authentication endpoints.
 */
export const config = {
  matcher: [
    // This regex pattern excludes all the routes above from middleware protection.
    // Excludes ALL /api routes (not just /api/auth) so Bearer token auth can work
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};