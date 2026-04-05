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
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb'
    }
  }
}

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

    // 2. Fetch videos
    const supabase = createServiceSupabaseClient()
    const { data: videos, error } = await supabase
      .from('media_uploads')
      .select('*')
      .eq('user_id', user.id)
      .eq('media_type', 'video')
      .order('upload_date', { ascending: false })

    if (error) {
      throw error
    }

    videosLogger.info('Videos fetched', {
      userId: user.id,
      count: videos?.length || 0
    })

    return NextResponse.json({
      success: true,
      videos: (videos || []).map(video => ({
        id: video.id,
        title: video.filename || 'Sans titre',
        filename: video.filename,
        url: video.media_url,
        duration: video.duration,
        thumbnail_url: video.thumbnail_url,
        creative_score: video.creative_score,
        analyzed_at: video.analyzed_at,
        uploaded_at: video.upload_date
      }))
    })
  } catch (error) {
    videosLogger.error('Erreur lors de la récupération des vidéos', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file || !filename) {
      return NextResponse.json(
        { error: 'Fichier et nom requis' },
        { status: 400 }
      )
    }

    // 3. Validate file
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Seules les vidéos sont acceptées' },
        { status: 400 }
      )
    }

    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 500MB)' },
        { status: 400 }
      )
    }

    // 4. Upload to Supabase Storage
    const supabase = createServiceSupabaseClient()
    const fileId = crypto.randomUUID()
    const storagePath = `videos/${user.id}/${fileId}/${filename}`

    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, Buffer.from(buffer), {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // 5. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(storagePath)

    // 6. Create media record in database
    const { data: video, error: dbError } = await supabase
      .from('media_uploads')
      .insert({
        id: fileId,
        user_id: user.id,
        filename: filename,
        media_type: 'video',
        media_url: publicUrl,
        file_size: file.size,
        upload_date: new Date().toISOString(),
        storage_path: storagePath
      })
      .select('*')
      .single()

    if (dbError) {
      throw dbError
    }

    videosLogger.info('Video uploaded', {
      userId: user.id,
      videoId: fileId,
      filename,
      size: file.size
    })

    return NextResponse.json({
      success: true,
      message: 'Vidéo téléchargée avec succès',
      video: {
        id: video.id,
        title: video.filename,
        filename: video.filename,
        url: video.media_url,
        duration: video.duration,
        thumbnail_url: video.thumbnail_url,
        creative_score: video.creative_score,
        analyzed_at: video.analyzed_at,
        uploaded_at: video.upload_date
      }
    })
  } catch (error) {
    videosLogger.error('Erreur lors du téléchargement de la vidéo', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
