'use client'

import { useState, useRef } from 'react'
import { Upload, Copy, Check, AlertCircle, Zap, Film } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { VideoAnalysis, VideoScript } from '@/lib/creative-director'
import { extractVideoFrames, extractVideoMetadata, isValidVideoFormat, formatFileSize } from '@/lib/video-processor'

const G = '#72C15F'
const GN = '#5DB847'
const T = '#1A1A1A'
const M = '#6B7280'
const C = '#F7F4EE'
const W = '#FFFFFF'

interface CreativeDirectorProps {
  profileId: string
  specialty: string
  therapistName: string
  therapistApproach: string
  mainProblemSolved: string
  targetSegments: Array<{
    name: string
    description: string
  }>
}

type Tab = 'analyzer' | 'generator' | 'comparison'

export default function CreativeDirector({
  profileId,
  specialty,
  therapistName,
  therapistApproach,
  mainProblemSolved,
  targetSegments,
}: CreativeDirectorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('analyzer')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoMetadata, setVideoMetadata] = useState<any>(null)
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null)
  const [script, setScript] = useState<VideoScript | null>(null)
  const [variants, setVariants] = useState<VideoScript[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [selectedSegment, setSelectedSegment] = useState(targetSegments[0]?.name || '')
  const [selectedTone, setSelectedTone] = useState<'warm' | 'professional' | 'energetic' | 'calm'>('warm')
  const [selectedDuration, setSelectedDuration] = useState<'30s' | '45s' | '60s' | '90s'>('60s')
  const [selectedFormat, setSelectedFormat] = useState<'talking_head' | 'testimonial_style' | 'educational' | 'day_in_life'>('talking_head')
  const [variantCount, setVariantCount] = useState(2)
  const [varyElement, setVaryElement] = useState<'hook' | 'cta' | 'emotional_arc' | 'all'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate
    if (!isValidVideoFormat(file)) {
      setError('Format vidéo non supporté. Utilisez MP4, WebM, OGG, MOV, AVI ou WMV.')
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 500 MB).')
      return
    }

    setVideoFile(file)

    // Extract metadata
    try {
      const metadata = await extractVideoMetadata(file)
      setVideoMetadata(metadata)
    } catch (err) {
      setError('Erreur lors de la lecture du fichier vidéo.')
      console.error(err)
    }
  }

  const analyzeVideo = async () => {
    if (!videoFile || !selectedSegment) {
      setError('Sélectionnez une vidéo et un segment.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Extract frames
      const { frames } = await extractVideoFrames(videoFile, 5)

      // Call API
      const res = await fetch('/api/creative/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames,
          videoMetadata,
          specialty,
          targetSegment: selectedSegment,
          profileId,
        }),
      })

      if (!res.ok) {
        throw new Error(`Erreur API: ${res.statusText}`)
      }

      const data = await res.json()
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateScript = async () => {
    if (!selectedSegment) {
      setError('Sélectionnez un segment.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/creative/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          specialty,
          targetSegment: selectedSegment,
          therapistName,
          therapistApproach,
          mainProblemSolved,
          tone: selectedTone,
          duration: selectedDuration,
          format: selectedFormat,
        }),
      })

      if (!res.ok) {
        throw new Error(`Erreur API: ${res.statusText}`)
      }

      const data = await res.json()
      setScript(data.script)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateVariants = async () => {
    if (!script) {
      setError('Générez un script d\'abord.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/creative/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          baseScript: script,
          numberOfVariants: variantCount,
          varyElement,
        }),
      })

      if (!res.ok) {
        throw new Error(`Erreur API: ${res.statusText}`)
      }

      const data = await res.json()
      setVariants(data.variants)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération des variantes.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const getScoreColor = (score: number): string => {
    if (score >= 70) return G
    if (score >= 40) return '#F59E0B'
    return '#EF4444'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 70) return 'Prêt à lancer'
    if (score >= 40) return 'À améliorer'
    return 'À retravailler'
  }

  return (
    <div style={{ backgroundColor: C, padding: '24px', borderRadius: '16px', marginTop: '20px' }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: `2px solid #E5E7EB` }}>
        {(['analyzer', 'generator', 'comparison'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? `3px solid ${G}` : 'none',
              color: activeTab === tab ? T : M,
              fontWeight: activeTab === tab ? '600' : '500',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {tab === 'analyzer' && 'Analyseur'}
            {tab === 'generator' && 'Générateur'}
            {tab === 'comparison' && 'Comparaison'}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#FEE2E2',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#991B1B',
          fontSize: '14px',
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION A: VIDEO ANALYZER */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'analyzer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card style={{ backgroundColor: W }}>
            <CardHeader style={{ backgroundColor: C, borderBottom: `1px solid #E5E7EB` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: T, margin: '0' }}>
                <Film size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                Télécharger une vidéo
              </h3>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  style={{ display: 'none' }}
                />

                {!videoFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '40px 20px',
                      border: `2px dashed ${M}`,
                      borderRadius: '8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#F9FAFB',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = G
                      e.currentTarget.style.backgroundColor = '#F0F9EF'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = M
                      e.currentTarget.style.backgroundColor = '#F9FAFB'
                    }}
                  >
                    <Upload size={32} style={{ color: G, margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ margin: '0 0 4px', color: T, fontWeight: '500', fontSize: '14px' }}>
                      Cliquez pour télécharger
                    </p>
                    <p style={{ margin: '0', color: M, fontSize: '13px' }}>
                      MP4, WebM, OGG, MOV... (max 500 MB)
                    </p>
                  </div>
                ) : (
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#F0F9EF',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${G}`,
                  }}>
                    <p style={{ margin: '0 0 8px 0', color: T, fontWeight: '500', fontSize: '14px' }}>
                      {videoFile.name}
                    </p>
                    <p style={{ margin: '0', color: M, fontSize: '13px' }}>
                      {formatFileSize(videoFile.size)} • {videoMetadata?.duration || '?'} sec • {videoMetadata?.resolution?.width}x{videoMetadata?.resolution?.height}
                    </p>
                    <button
                      onClick={() => {
                        setVideoFile(null)
                        setVideoMetadata(null)
                        setAnalysis(null)
                      }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 12px',
                        backgroundColor: '#FEE2E2',
                        color: '#991B1B',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Changer
                    </button>
                  </div>
                )}

                {/* Segment Selection */}
                {videoFile && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: T, fontSize: '14px' }}>
                      Segment visé
                    </label>
                    <select
                      value={selectedSegment}
                      onChange={e => setSelectedSegment(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid #D1D5DB`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                      }}
                    >
                      {targetSegments.map(seg => (
                        <option key={seg.name} value={seg.name}>
                          {seg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Analyze Button */}
                {videoFile && (
                  <Button
                    onClick={analyzeVideo}
                    disabled={loading}
                    style={{
                      backgroundColor: G,
                      color: W,
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'Analyse en cours...' : 'Analyser la vidéo'}
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Analysis Results */}
          {analysis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Overall Score Card */}
              <Card style={{ backgroundColor: W }}>
                <CardBody style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                    <div>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        backgroundColor: getScoreColor(analysis.overallScore),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                      }}>
                        <div style={{ color: W, fontSize: '48px', fontWeight: '700' }}>
                          {Math.round(analysis.overallScore)}
                        </div>
                      </div>
                      <p style={{ margin: '12px 0 0', color: T, fontWeight: '600', fontSize: '14px' }}>
                        {getScoreLabel(analysis.overallScore)}
                      </p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ margin: '0 0 12px', color: M, fontSize: '13px' }}>
                        <strong>CTR Prédit:</strong> {analysis.predictedCTR.toUpperCase()}
                      </p>
                      {analysis.readyToLaunch && (
                        <div style={{
                          padding: '12px',
                          backgroundColor: '#ECFDF5',
                          borderRadius: '6px',
                          color: '#065F46',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}>
                          ✓ Prête à lancer! Cette vidéo satisfait les critères de qualité.
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Dimension Scores */}
              <Card style={{ backgroundColor: W }}>
                <CardHeader style={{ backgroundColor: C }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', color: T, margin: '0' }}>
                    Détails des dimensions
                  </h4>
                </CardHeader>
                <CardBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(analysis.dimensions).map(([key, dim]) => (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ fontSize: '13px', fontWeight: '500', color: T }}>
                            {key === 'hookStrength' && 'Accroche'}
                            {key === 'emotionalArc' && 'Arc émotionnel'}
                            {key === 'authenticityScore' && 'Authenticité'}
                            {key === 'ctaClarity' && 'Clarté du CTA'}
                            {key === 'technicalQuality' && 'Qualité technique'}
                            {key === 'paceAndLength' && 'Rythme et durée'}
                          </label>
                          <span style={{ fontWeight: '600', color: T }}>{Math.round(dim.score)}/20</span>
                        </div>
                        <div style={{
                          height: '8px',
                          backgroundColor: '#E5E7EB',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            backgroundColor: getScoreColor(dim.score * 5),
                            width: `${(dim.score / 20) * 100}%`,
                            transition: 'width 0.3s',
                          }} />
                        </div>
                        <p style={{ margin: '6px 0 0', color: M, fontSize: '13px' }}>{dim.feedback}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Strengths and Improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Card style={{ backgroundColor: W }}>
                  <CardHeader style={{ backgroundColor: '#ECFDF5' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#065F46', margin: '0' }}>
                      ✓ Points forts
                    </h4>
                  </CardHeader>
                  <CardBody>
                    <ul style={{ margin: '0', paddingLeft: '20px', color: T, fontSize: '13px', lineHeight: '1.6' }}>
                      {analysis.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>

                <Card style={{ backgroundColor: W }}>
                  <CardHeader style={{ backgroundColor: '#FEF3C7' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#92400E', margin: '0' }}>
                      → À améliorer
                    </h4>
                  </CardHeader>
                  <CardBody>
                    <ul style={{ margin: '0', paddingLeft: '20px', color: T, fontSize: '13px', lineHeight: '1.6' }}>
                      {analysis.improvements.map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION B: SCRIPT GENERATOR */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'generator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card style={{ backgroundColor: W }}>
            <CardHeader style={{ backgroundColor: C }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: T, margin: '0' }}>
                <Zap size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                Générer un script
              </h3>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {/* Segment */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: T, fontSize: '14px' }}>
                    Segment
                  </label>
                  <select
                    value={selectedSegment}
                    onChange={e => setSelectedSegment(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid #D1D5DB`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {targetSegments.map(seg => (
                      <option key={seg.name} value={seg.name}>
                        {seg.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tone */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: T, fontSize: '14px' }}>
                    Ton
                  </label>
                  <select
                    value={selectedTone}
                    onChange={e => setSelectedTone(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid #D1D5DB`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    <option value="warm">Chaleureux</option>
                    <option value="professional">Professionnel</option>
                    <option value="energetic">Énergique</option>
                    <option value="calm">Calme</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: T, fontSize: '14px' }}>
                    Durée
                  </label>
                  <select
                    value={selectedDuration}
                    onChange={e => setSelectedDuration(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid #D1D5DB`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    <option value="30s">30 secondes</option>
                    <option value="45s">45 secondes</option>
                    <option value="60s">60 secondes</option>
                    <option value="90s">90 secondes</option>
                  </select>
                </div>

                {/* Format */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: T, fontSize: '14px' }}>
                    Format
                  </label>
                  <select
                    value={selectedFormat}
                    onChange={e => setSelectedFormat(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid #D1D5DB`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    <option value="talking_head">Face caméra</option>
                    <option value="testimonial_style">Témoignage</option>
                    <option value="educational">Éducatif</option>
                    <option value="day_in_life">Journée type</option>
                  </select>
                </div>

                {/* Generate Button */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Button
                    onClick={generateScript}
                    disabled={loading}
                    style={{
                      width: '100%',
                      backgroundColor: G,
                      color: W,
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'Génération en cours...' : 'Générer le script'}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Script Display */}
          {script && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Card style={{ backgroundColor: W }}>
                <CardHeader style={{ backgroundColor: C }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', color: T, margin: '0' }}>
                    {script.title}
                  </h4>
                  <p style={{ margin: '6px 0 0', color: M, fontSize: '13px' }}>
                    {script.targetSegment} • {script.totalDuration}
                  </p>
                </CardHeader>
                <CardBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {script.shots.map((shot, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          backgroundColor: idx % 2 === 0 ? '#F9FAFB' : '#F3F4F6',
                          borderRadius: '8px',
                          borderLeft: `4px solid ${G}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <h5 style={{ margin: '0', color: T, fontWeight: '600', fontSize: '14px' }}>
                            {shot.timestamp}
                          </h5>
                          <span style={{ color: M, fontSize: '12px', fontStyle: 'italic' }}>Shot {idx + 1}</span>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ margin: '0 0 8px', color: '#666', fontWeight: '500', fontSize: '13px' }}>
                            Ce qu'il faut faire
                          </p>
                          <p style={{ margin: '0', color: T, fontSize: '13px', lineHeight: '1.5' }}>
                            {shot.instruction}
                          </p>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ margin: '0 0 8px', color: '#666', fontWeight: '500', fontSize: '13px' }}>
                            À dire
                          </p>
                          <div style={{
                            padding: '12px',
                            backgroundColor: W,
                            borderRadius: '6px',
                            borderLeft: `3px solid ${G}`,
                            fontStyle: 'italic',
                            color: T,
                            fontSize: '13px',
                            lineHeight: '1.6',
                          }}>
                            "{shot.dialogue}"
                          </div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ margin: '0 0 8px', color: '#666', fontWeight: '500', fontSize: '13px' }}>
                            Note visuelle
                          </p>
                          <p style={{ margin: '0', color: T, fontSize: '13px', lineHeight: '1.5' }}>
                            {shot.visualNote}
                          </p>
                        </div>

                        <div style={{
                          padding: '10px',
                          backgroundColor: '#F0F9EF',
                          borderRadius: '6px',
                          color: '#065F46',
                          fontSize: '12px',
                          lineHeight: '1.5',
                        }}>
                          <strong>Pourquoi ça marche:</strong> {shot.whyItWorks}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tips */}
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid #E5E7EB` }}>
                    <h5 style={{ margin: '0 0 12px', color: T, fontWeight: '600', fontSize: '14px' }}>
                      Conseils de tournage
                    </h5>
                    <ul style={{ margin: '0', paddingLeft: '20px', color: T, fontSize: '13px', lineHeight: '1.8' }}>
                      {script.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Equipment */}
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px', color: T, fontWeight: '600', fontSize: '14px' }}>
                      Équipement nécessaire
                    </h5>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {script.equipment.map((eq, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#F0F9EF',
                            color: G,
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          {eq}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Button
                  onClick={() => copyToClipboard(JSON.stringify(script, null, 2))}
                  style={{
                    backgroundColor: W,
                    color: G,
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: `2px solid ${G}`,
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {copiedIndex === -1 ? <Check size={16} /> : <Copy size={16} />}
                  Copier
                </Button>
                <Button
                  onClick={generateVariants}
                  disabled={loading}
                  style={{
                    backgroundColor: GN,
                    color: W,
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'En cours...' : 'Générer des variantes'}
                </Button>
              </div>

              {/* Variants Configuration */}
              {!variants.length && !loading && (
                <Card style={{ backgroundColor: C }}>
                  <CardBody>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: T, fontSize: '13px' }}>
                          Nombre de variantes
                        </label>
                        <select
                          value={variantCount}
                          onChange={e => setVariantCount(parseInt(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid #D1D5DB`,
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                          }}
                        >
                          <option value={2}>2 variantes</option>
                          <option value={3}>3 variantes</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: T, fontSize: '13px' }}>
                          Élément à varier
                        </label>
                        <select
                          value={varyElement}
                          onChange={e => setVaryElement(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid #D1D5DB`,
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                          }}
                        >
                          <option value="hook">Accroche</option>
                          <option value="cta">CTA</option>
                          <option value="emotional_arc">Arc émotionnel</option>
                          <option value="all">Tout</option>
                        </select>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Variants Display */}
              {variants.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ margin: '0', color: T, fontWeight: '600', fontSize: '15px' }}>
                    Variantes pour A/B Testing
                  </h4>
                  {variants.map((variant, varIdx) => (
                    <Card key={varIdx} style={{ backgroundColor: W }}>
                      <CardHeader style={{ backgroundColor: '#F3F4F6' }}>
                        <h5 style={{ margin: '0', color: T, fontWeight: '600', fontSize: '14px' }}>
                          Variante {varIdx + 1}: {variant.title}
                        </h5>
                      </CardHeader>
                      <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {variant.shots.map((shot, shotIdx) => (
                            <div key={shotIdx} style={{ fontSize: '13px', color: T }}>
                              <strong>{shot.timestamp}</strong> - {shot.dialogue.substring(0, 60)}...
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => copyToClipboard(JSON.stringify(variant, null, 2), varIdx)}
                          style={{
                            marginTop: '12px',
                            backgroundColor: W,
                            color: G,
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: `1px solid ${G}`,
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          {copiedIndex === varIdx ? <Check size={14} /> : <Copy size={14} />}
                          Copier
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION C: COMPARISON */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'comparison' && (
        <Card style={{ backgroundColor: W }}>
          <CardBody>
            <p style={{ margin: '0', color: M, fontSize: '14px' }}>
              Analysez plusieurs versions de votre vidéo pour voir les améliorations.
            </p>
            <p style={{ margin: '16px 0 0', color: M, fontSize: '13px', fontStyle: 'italic' }}>
              Téléchargez une première version dans l'onglet "Analyseur", améliorez-la, puis téléchargez la nouvelle version pour comparer les résultats.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
