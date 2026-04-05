'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Video, CheckCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'

interface VideoUploaderProps {
  userId: string
  onUploaded?: (url: string, mediaId: string) => void
  existingUrl?: string
}

export default function VideoUploader({ userId, onUploaded, existingUrl }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploaded, setUploaded] = useState(!!existingUrl)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(existingUrl || '')
  const supabase = createClient()

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return

    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      setError('Format invalide. Utilisez MP4 ou MOV.')
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 500 MB).')
      return
    }

    setError('')
    setUploading(true)
    setProgress(10)

    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`

      const { data, error: uploadError } = await supabase.storage
        .from('therapist-videos')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      setProgress(80)

      const { data: { publicUrl } } = supabase.storage
        .from('therapist-videos')
        .getPublicUrl(data.path)

      // Save to DB
      const { data: media, error: dbError } = await supabase
        .from('media_uploads')
        .insert({
          user_id: userId,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          status: 'ready',
        })
        .select()
        .single()

      if (dbError) throw dbError

      setProgress(100)
      setPreview(publicUrl)
      setUploaded(true)
      onUploaded?.(publicUrl, media.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload.')
    } finally {
      setUploading(false)
    }
  }, [userId, supabase, onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'] },
    maxFiles: 1,
    disabled: uploading,
  })

  if (uploaded && preview) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video">
          <video src={preview} controls className="w-full h-full object-contain" />
          <button
            onClick={() => { setUploaded(false); setPreview('') }}
            className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Vidéo uploadée avec succès
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all',
          isDragActive ? 'border-blue-900 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-900 hover:bg-blue-50/50',
          uploading && 'pointer-events-none opacity-70'
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="w-full max-w-xs">
            <div className="w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <p className="text-slate-700 font-medium mb-3">Upload en cours...</p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-900 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-slate-400 text-sm mt-2">{progress}%</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center mb-4">
              <Video className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-slate-700 font-medium mb-1">
              {isDragActive ? 'Déposez votre vidéo ici' : 'Déposez votre vidéo de présentation'}
            </p>
            <p className="text-slate-400 text-sm mb-4">ou cliquez pour sélectionner</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-slate-200 rounded-full text-slate-600 text-xs">MP4</span>
              <span className="px-3 py-1 bg-slate-200 rounded-full text-slate-600 text-xs">MOV</span>
              <span className="px-3 py-1 bg-slate-200 rounded-full text-slate-600 text-xs">Max 500 MB</span>
              <span className="px-3 py-1 bg-emerald-100 rounded-full text-emerald-700 text-xs">30–60 secondes recommandées</span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3 border border-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
