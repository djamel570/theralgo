import { NextResponse, type NextRequest } from 'next/server'

function isValidSession(request: NextRequest): boolean {
  // Look for the Supabase auth token cookie
  const allCookies = request.cookies.getAll()
  
  // Find the auth token cookie (either full or chunked)
  const authCookie = allCookies.find(
    (c) => c.name.match(/sb-[a-z]+-auth-token$/) || c.name.match(/sb-[a-z]+-auth-token\.0$/)
  )

  if (!authCookie || !authCookie.value) return false

  try {
    // Supabase stores the session as a base64url-encoded JSON or a chunked JSON
    // Try to parse the value
    let raw = authCookie.value

    // Handle URL encoding
    raw = decodeURIComponent(raw)

    // Could be base64 encoded
    let parsed: { access_token?: string; expires_at?: number } | null = null

    // Try direct JSON parse first
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Try base64 decode
      try {
        const decoded = Buffer.from(raw, 'base64').toString('utf-8')
        parsed = JSON.parse(decoded)
      } catch {
        // If we can't parse it, treat as valid (let the server validate)
        // This prevents the redirect loop
        return true
      }
    }

    if (!parsed) return false

    // Check if access_token exists
    if (!parsed.access_token) return false

    // Check expiry if available
    if (parsed.expires_at) {
      const now = Math.floor(Date.now() / 1000)
      if (parsed.expires_at < now) return false
    }

    return true
  } catch {
    // On any error, don't redirect (let the server-side auth handle it)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasValidSession = isValidSession(request)

  // Redirect authenticated users away from auth pages
  if (hasValidSession && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect dashboard routes — if no valid session, redirect to login
  if (!hasValidSession && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect admin routes
  if (!hasValidSession && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://connect.facebook.net https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' https:; connect-src 'self' https://api.supabase.co https://api-inference.huggingface.co https://connect.facebook.net; frame-src 'none';"
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/signup'],
}
