/**
 * GET /api/dashboard/videos
 * List videos for authenticated therapist
 *
 * POST /api/dashboard/videos
 * Upload video metadata (actual file upload to Supabase Storage)
 * Body (FormData): { file, filename }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const videosLogger = logger.child({ component: 'VideosAPI' })

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
