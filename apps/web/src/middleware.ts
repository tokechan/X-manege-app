/**
 * NextAuth Middleware
 * Protects routes and handles authentication
 */

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Check if user is trying to access admin routes
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Allow the request to proceed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/signup',
          '/auth/error',
          '/auth/verify-request',
          '/api/auth',
        ]

        // Check if the current path is public
        const isPublicRoute = publicRoutes.some(route => 
          pathname === route || pathname.startsWith(route + '/')
        )

        // Allow access to public routes
        if (isPublicRoute) {
          return true
        }

        // For protected routes, require a valid token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
