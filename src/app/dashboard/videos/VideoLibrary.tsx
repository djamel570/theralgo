'use client'

import { useState, useRef } from 'react'
import { Upload, Play, AlertCircle, Zap, FileVideo } from 'lucide-react'

/* ── Design tokens ──────────────────────────────────────── */
const G = '#72C15F'
const GN = '#5DB847'
const T = '#1A1A1A'
const M = '#6B7280'
const C = '#F7F4EE'
const W = '#FFFFFF'

interface Video {
  id: string
  title: string
  filename: string
  url: string
  duration?: number
  thumbnail_url?: string
  creative_score?: number
  analyzed_at?: string
  uploaded_at: string
}

interface VideoLibraryProps {
  initialVideos?: Video[]
  userId: string
}

export default function VideoLibrary({ initialVideos = [], userId }: VideoLibraryProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Handle file drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (dropZoneRef.current) {
      dropZoneRef.current.style.background = W
      dropZoneRef.current.style.borderColor = 'rgba(0,0,0,.12)'
    }

    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('video/')
    )

    if (files.length > 0) {
      await uploadVideos(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (dropZoneRef.current) {
      dropZoneRef.current.style.background = C
      dropZoneRef.current.style.borderColor = GN
    }
  }

  const handleDragLeave = () => {
    if (dropZoneRef.current) {
      dropZoneRef.current.style.background = W
      dropZoneRef.current.style.borderColor = 'rgba(0,0,0,.12)'
    }
  }

  // Upload videos
  const uploadVideos = async (filesToUpload: File[]) => {
    setUploading(true)
    try {
      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('filename', file.name)

        const res = await fetch('/api/dashboard/videos', {
          method: 'POST',
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          setVideos([...videos, data.video])
        }
      }
    } catch (error) {
      console.error('Failed to upload videos:', error)
    }
    setUploading(false)
  }

  // Analyze video
  const analyzeVideo = async (videoId: string) => {
    try {
      const res = await fetch(`/api/dashboard/videos/${videoId}/analyze`, {
        method: 'POST'
      })

      if (res.ok) {
        const data = await res.json()
        setVideos(videos.map(v =>
          v.id === videoId
            ? {
              ...v,
              creative_score: data.video.creative_score,
              analyzed_at: new Date().toISOString()
            }
            : v
        ))
        if (selectedVideo?.id === videoId) {
          setSelectedVideo({
            ...selectedVideo,
            creative_score: data.video.creative_score,
            analyzed_at: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('Failed to analyze video:', error)
    }
  }

  // Generate script
  const generateScript = async (videoId: string) => {
    try {
      const res = await fetch(`/api/dashboard/videos/${videoId}/script`, {
        method: 'POST'
      })

      if (res.ok) {
        const data = await res.json()
        // In a real app, this would open a script generation interface
        alert(`Script généré: ${data.scriptTitle}`)
      }
    } catch (error) {
      console.error('Failed to generate script:', error)
    }
  }

  const openDetailModal = (video: Video) => {
    setSelectedVideo(video)
    setShowDetailModal(true)
  }

  const getScoreColor = (score?: number) => {
    if (!score) return M
    if (score >= 80) return G
    if (score >= 60) return GN
    return '#F59E0B'
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: T, marginBottom: '.5rem' }}>
          Ma Vidéothèque
        </h1>
        <p style={{ fontSize: '.95rem', color: M }}>
          Téléchargez et analysez vos vidéos avec le Creative Director
        </p>
      </div>

      {/* Upload Zone */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed rgba(0,0,0,.12)`,
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          background: W,
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '2rem'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload style={{ width: 32, height: 32, color: GN, margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: T, marginBottom: '.5rem' }}>
          Glissez vos vidéos ici
        </h3>
        <p style={{ fontSize: '.9rem', color: M, marginBottom: '1rem' }}>
          ou cliquez pour sélectionner des fichiers
        </p>
        <p style={{ fontSize: '.8rem', color: M }}>
          Formats supportés: MP4, WebM, MOV (max 500MB)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*"
          onChange={(e) => {
            if (e.target.files) {
              uploadVideos(Array.from(e.target.files))
            }
          }}
          style={{ display: 'none' }}
        />
      </div>

      {uploading && (
        <div style={{
          background: C,
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          textAlign: 'center',
          color: T,
          fontWeight: 600
        }}>
          Téléchargement en cours...
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: W, padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(0,0,0,.07)` }}>
          <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Vidéos téléchargées</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: T }}>{videos.length}</p>
        </div>
        <div style={{ background: W, padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(0,0,0,.07)` }}>
          <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Vidéos analysées</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: GN }}>
            {videos.filter(v => v.creative_score !== undefined).length}
          </p>
        </div>
        <div style={{ background: W, padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(0,0,0,.07)` }}>
          <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Score moyen</p>
          <p style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: getScoreColor(
              videos.filter(v => v.creative_score).length > 0
                ? Math.round(videos.reduce((sum, v) => sum + (v.creative_score || 0), 0) / videos.filter(v => v.creative_score).length)
                : undefined
            )
          }}>
            {videos.filter(v => v.creative_score).length > 0
              ? Math.round(videos.reduce((sum, v) => sum + (v.creative_score || 0), 0) / videos.filter(v => v.creative_score).length)
              : '-'}
          </p>
        </div>
      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div style={{
          background: W,
          padding: '3rem 2rem',
          borderRadius: '12px',
          textAlign: 'center',
          color: M,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <FileVideo style={{ width: 32, height: 32, opacity: 0.5 }} />
          <p>Aucune vidéo pour le moment</p>
          <p style={{ fontSize: '.85rem' }}>Commencez par télécharger une vidéo ci-dessus</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {videos.map(video => (
            <div key={video.id} style={{
              background: W,
              borderRadius: '12px',
              border: `1px solid rgba(0,0,0,.07)`,
              overflow: 'hidden',
              transition: 'box-shadow 0.2s'
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,.1)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '100%',
                paddingBottom: '56.25%',
                position: 'relative',
                background: T,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.title}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <FileVideo style={{ width: 32, height: 32, color: M }} />
                )}
                <button
                  onClick={() => window.open(video.url, '_blank')}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,.3)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                    opacity: 0
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.5)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0' }}
                >
                  <Play style={{ width: 28, height: 28, color: W }} />
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: T,
                  marginBottom: '.5rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {video.title}
                </h3>

                {/* Score */}
                {video.creative_score !== undefined ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                      <p style={{ fontSize: '.8rem', color: M }}>Creative Director Score</p>
                      <span style={{ fontSize: '.85rem', fontWeight: 700, color: getScoreColor(video.creative_score) }}>
                        {video.creative_score}/100
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'rgba(0,0,0,.1)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${video.creative_score}%`,
                        height: '100%',
                        background: getScoreColor(video.creative_score),
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: C,
                    padding: '.5rem .75rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '.8rem',
                    color: M,
                    textAlign: 'center'
                  }}>
                    Non analysée
                  </div>
                )}

                {/* Date */}
                <p style={{ fontSize: '.8rem', color: M, marginBottom: '1rem' }}>
                  {new Date(video.uploaded_at).toLocaleDateString('fr-FR')}
                </p>

                {/* Buttons */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '.75rem'
                }}>
                  {video.creative_score === undefined ? (
                    <button
                      onClick={() => analyzeVideo(video.id)}
                      style={{
                        padding: '.5rem .75rem',
                        borderRadius: '6px',
                        border: `1px solid ${GN}`,
                        background: GN,
                        color: W,
                        fontSize: '.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '.4rem'
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    >
                      <Zap style={{ width: 14, height: 14 }} />
                      Analyser
                    </button>
                  ) : (
                    <button
                      onClick={() => generateScript(video.id)}
                      style={{
                        padding: '.5rem .75rem',
                        borderRadius: '6px',
                        border: `1px solid ${G}`,
                        background: G,
                        color: W,
                        fontSize: '.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    >
                      Générer un script
                    </button>
                  )}
                  <button
                    onClick={() => openDetailModal(video)}
                    style={{
                      padding: '.5rem .75rem',
                      borderRadius: '6px',
                      border: `1px solid rgba(0,0,0,.12)`,
                      background: C,
                      color: T,
                      fontSize: '.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.08)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C }}
                  >
                    Détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Detail Modal */}
      {showDetailModal && selectedVideo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,.25)',
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}
          onClick={() => setShowDetailModal(false)}
        >
          <div style={{
            background: W,
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,.15)',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'fadeIn 0.3s ease-out'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview */}
            <div style={{
              width: '100%',
              paddingBottom: '56.25%',
              position: 'relative',
              background: T,
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '1.5rem'
            }}>
              {selectedVideo.thumbnail_url && (
                <img src={selectedVideo.thumbnail_url} alt={selectedVideo.title}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>

            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: T }}>
                {selectedVideo.title}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: M
                }}
              >
                ×
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ background: C, padding: '1rem', borderRadius: '8px' }}>
                <p style={{ fontSize: '.8rem', color: M, marginBottom: '.5rem' }}>Téléchargée le</p>
                <p style={{ fontSize: '.95rem', fontWeight: 600, color: T }}>
                  {new Date(selectedVideo.uploaded_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {selectedVideo.creative_score !== undefined && (
                <div style={{ background: C, padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ fontSize: '.8rem', color: M, marginBottom: '.5rem' }}>Score CD</p>
                  <p style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: getScoreColor(selectedVideo.creative_score)
                  }}>
                    {selectedVideo.creative_score}/100
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '.75rem'
            }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '.75rem 1rem',
                  borderRadius: '8px',
                  border: `1px solid rgba(0,0,0,.12)`,
                  background: W,
                  color: T,
                  fontSize: '.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = W }}
              >
                Fermer
              </button>
              {selectedVideo.creative_score === undefined && (
                <button
                  onClick={() => {
                    analyzeVideo(selectedVideo.id)
                    setShowDetailModal(false)
                  }}
                  style={{
                    padding: '.75rem 1rem',
                    borderRadius: '8px',
                    background: GN,
                    color: W,
                    fontSize: '.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  Analyser maintenant
                </button>
              )}
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
