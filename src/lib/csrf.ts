import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a new CSRF token using crypto.randomUUID()
 */
export function generateCsrfToken(): string {
  return randomUUID()
}

/**
 * Validate CSRF token from request
 * Compares the token from the X-CSRF-Token header against the csrf-token cookie
 */
export function validateCsrf(request: NextRequest): boolean {
  // Get token from header
  const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME)

  if (!tokenFromHeader) {
    return false
  }

  // Get token from cookie
  const tokenFromCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value

  if (!tokenFromCookie) {
    return false
  }

  // Compare tokens (using constant-time comparison to prevent timing attacks)
  return constantTimeEqual(tokenFromHeader, tokenFromCookie)
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * Add CSRF token to response (sets it as a cookie)
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}
