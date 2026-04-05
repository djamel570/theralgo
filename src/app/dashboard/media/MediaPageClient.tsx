'use client'

import { useState } from 'react'
import { CheckCircle, Video } from 'lucide-react'
import VideoUploader from '@/components/dashboard/VideoUploader'

const GN = '#5DB847'
const T  = '#1A1A1A'
const M  = '#6B7280'
const C  = '#F7F4EE'
const W  = '#FFFFFF'
const LV = '#C4B5FD'

export default function MediaPageClient({ userId, existingMedia }: { userId: string; existingMedia: Record<string, unknown> | null }) {
  const [uploaded, setUploaded] = useState(false)

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.2rem)', color:T, marginBottom:6, letterSpacing:'-.03em' }}>
          Ma Vidéo
        </h1>
        <p style={{ color:M, fontSize:'.9rem', lineHeight:1.7 }}>
          Cette vidéo sera utilisée pour créer vos campagnes publicitaires personnalisées.
        </p>
      </div>

      {/* Tips card */}
      <div style={{ background:W, borderRadius:24, padding:'1.5rem', marginBottom:'1.5rem', border:'1px solid rgba(0,0,0,.07)', display:'flex', gap:14 }}>
        <div style={{ width:44, height:44, borderRadius:14, background:`${LV}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Video style={{ width:20, height:20, color:'#7C5CBF' }}/>
        </div>
        <div>
          <p style={{ fontSize:'.85rem', fontWeight:700, color:T, marginBottom:8 }}>Conseils pour une bonne vidéo</p>
          <ul style={{ fontSize:'.82rem', color:M, lineHeight:2 }}>
            <li>→ Parlez de votre spécialité et de ce qui vous différencie</li>
            <li>→ Durée idéale : 30 à 90 secondes</li>
            <li>→ Bonne lumière, fond neutre ou naturel</li>
            <li>→ Parlez directement à votre patient idéal</li>
          </ul>
        </div>
      </div>

      {/* Uploader card */}
      <div style={{ background:W, borderRadius:28, border:'1px solid rgba(0,0,0,.07)', boxShadow:'0 2px 16px rgba(0,0,0,.05)', padding:'2.5rem' }}>
        {existingMedia && !uploaded ? (
          <div style={{ marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1rem' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:`${GN}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <CheckCircle style={{ width:16, height:16, color:GN }}/>
              </div>
              <p style={{ fontSize:'.9rem', fontWeight:700, color:T }}>Vidéo déjà uploadée</p>
            </div>
            <video
              src={(existingMedia as any).file_url}
              controls
              style={{ width:'100%', borderRadius:16, border:'1px solid rgba(0,0,0,.08)', background:'#000', marginBottom:'1rem', maxHeight:300 }}
            />
            <p style={{ fontSize:'.82rem', color:M, marginBottom:'1rem' }}>Vous pouvez remplacer votre vidéo ci-dessous.</p>
          </div>
        ) : null}

        {uploaded ? (
          <div style={{ textAlign:'center', padding:'2.5rem' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:`${GN}15`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
              <CheckCircle style={{ width:32, height:32, color:GN }}/>
            </div>
            <h3 style={{ fontWeight:800, fontSize:'1.3rem', color:T, marginBottom:8, letterSpacing:'-.025em' }}>Vidéo uploadée avec succès !</h3>
            <p style={{ fontSize:'.88rem', color:M }}>Elle sera utilisée pour générer vos publicités.</p>
          </div>
        ) : (
          <VideoUploader userId={userId} onUploaded={() => setUploaded(true)} />
        )}
      </div>
    </div>
  )
}
