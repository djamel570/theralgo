import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createServerSupabaseClient, createServiceSupabaseClient } from './supabase-server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

/**
 * Helper to return validation error response
 */
export function validationError(error: ZodError) {
  return NextResponse.json(
    { error: 'Validation error', details: error.flatten() },
    { status: 400 }
  )
}

/**
 * Extracts and verifies the current user from Supabase session
 */
export async function getAuthenticatedUser(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Verifies that the user owns a specific resource
 */
export async function verifyResourceOwnership(
  userId: string,
  resourceTable: string,
  resourceId: string
): Promise<boolean> {
  try {
    const supabase = createServiceSupabaseClient()

    // Map table names to their user_id field
    const userIdField = 'user_id'

    const { data, error } = await supabase
      .from(resourceTable)
      .select('id')
      .eq('id', resourceId)
      .eq(userIdField, userId)
      .maybeSingle()

    if (error) {
      console.error('Ownership check error:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Ownership verification error:', error)
    return false
  }
}

/**
 * Checks if user is an admin
 */
export async function requireAdmin(req: NextRequest): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) return false

    return ADMIN_EMAILS.includes(user.email)
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

/**
 * Helper to return a 401 Unauthorized response
 */
export function unauthorized(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Helper to return a 403 Forbidden response
 */
export function forbidden(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}
