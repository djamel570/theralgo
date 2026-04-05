/**
 * POST /api/dashboard/videos/[id]/script
 * Generate a script for a video based on analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const videosLogger = logger.child({ component: 'VideoScriptAPI' })

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

    if (!video.creative_score) {
      return NextResponse.json(
        { error: 'La vidéo doit d\'abord être analysée' },
        { status: 400 }
      )
    }

    // 3. Generate script (simulated for now)
    // In production, this would call the script generation service
    const scripts = [
      'Script de promotion de service',
      'Script de témoignage client',
      'Script d\'introduction personnelle',
      'Script d\'appel à action',
      'Script éducatif'
    ]

    const randomScript = scripts[Math.floor(Math.random() * scripts.length)]
    const scriptTitle = `${randomScript} - ${new Date().toLocaleDateString('fr-FR')}`

    videosLogger.info('Script generated', {
      userId: user.id,
      videoId,
      scriptTitle
    })

    return NextResponse.json({
      success: true,
      scriptTitle,
      message: 'Script généré avec succès'
    })
  } catch (error) {
    videosLogger.error('Erreur lors de la génération du script', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
