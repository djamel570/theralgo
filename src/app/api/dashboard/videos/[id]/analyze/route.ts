/**
 * POST /api/dashboard/videos/[id]/analyze
 * Analyze a video with the Creative Director
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const videosLogger = logger.child({ component: 'VideoAnalyzeAPI' })

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const videoId = params.id

    // 2. Verify video belongs to user
    const supabase = createServiceSupabaseClient()
    const { data: video, error: fetchError } = await supabase
      .from('media_uploads')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !video) {
      return NextResponse.json(
        { error: 'Vidéo non trouvée' },
        { status: 404 }
      )
    }

    // 3. Generate creative score (simulated for now)
    // In production, this would call the Creative Director service
    const creativeScore = Math.floor(Math.random() * 40) + 60 // 60-100 score

    // 4. Update video with analysis
    const { error: updateError } = await supabase
      .from('media_uploads')
      .update({
        creative_score: creativeScore,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', videoId)

    if (updateError) {
      throw updateError
    }

    videosLogger.info('Video analyzed', {
      userId: user.id,
      videoId,
      creativeScore
    })

    return NextResponse.json({
      success: true,
      video: {
        id: videoId,
        creative_score: creativeScore,
        analyzed_at: new Date().toISOString()
      }
    })
  } catch (error) {
    videosLogger.error('Erreur lors de l\'analyse de la vidéo', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
