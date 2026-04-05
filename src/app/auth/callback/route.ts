import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // OAuth error returned by provider
  if (error) {
    console.error('[auth/callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Can't set cookies in static context, ignore
            }
          },
        },
      }
    )

    const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeErr) {
      console.error('[auth/callback] Exchange error:', exchangeErr.message)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeErr.message)}`
      )
    }

    // New user via Google → redirect to profile to fill Therapist Signature
    // Existing user → redirect to dashboard
    const isNewUser = data.user?.created_at === data.user?.last_sign_in_at
    return NextResponse.redirect(
      isNewUser ? `${origin}/dashboard/profile` : `${origin}/dashboard`
    )
  }

  // No code, no error — unexpected
  return NextResponse.redirect(`${origin}/login`)
}
