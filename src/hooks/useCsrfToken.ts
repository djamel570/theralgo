'use client'

import { useEffect, useState } from 'react'

/**
 * React hook to retrieve the CSRF token from cookies
 * Returns the CSRF token for use in fetch headers
 */
export function useCsrfToken(): string | null {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Extract CSRF token from cookies
    const cookies = document.cookie.split(';')
    const csrfCookie = cookies.find((cookie) => cookie.trim().startsWith('csrf-token='))

    if (csrfCookie) {
      const tokenValue = csrfCookie.split('=')[1]
      setToken(decodeURIComponent(tokenValue))
    }
  }, [])

  return token
}

/**
 * Helper function to add CSRF token to fetch request headers
 */
export function getCsrfHeaders(token: string | null): Record<string, string> {
  if (!token) {
    return {}
  }

  return {
    'X-CSRF-Token': token,
  }
}
