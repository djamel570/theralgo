'use client'

import { useState, useEffect } from 'react'
import { FunnelVariant } from '@/lib/adaptive-funnel'
import { RotateCcw, Eye, Copy, ChevronDown } from 'lucide-react'

interface FunnelEditorProps {
  profileId: string
  profileName: string
  profileCity: string
  specialty: string
  segments: Array<{ key: string; label: string }>
}

const GN = '#72C15F'      // green
const C = '#F7F4EE'       // cream
const T = '#1A1A1A'       // text
const M = '#6B7280'       // muted
const W = '#FFFFFF'       // white

export default function FunnelEditor({
  profileId,
  profileName,
  profileCity,
  specialty,
  segments,
}: FunnelEditorProps) {
  const [variants, setVariants] = useState<Record<string, FunnelVariant>>({})
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null)
  const [editingVariant, setEditingVariant] = useState<FunnelVariant | null>(null)
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({})

  // Fetch variants on mount
  useEffect(() => {
    const loadVariants = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/funnel/variant?profileId=${profileId}&segmentKey=_all`,
          { method: 'GET' }
        )
        // This will 404, so we'll just start empty
        // In production, you'd have a /api/funnel/variants/list endpoint
      } catch (err) {
        console.error('Error loading variants:', err)
      } finally {
        setLoading(false)
      }
    }

    loadVariants()
  }, [profileId])

  const generateVariants = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/funnel/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          profileId,
          specialty,
          segments,
        }),
      })

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`)
      }

      const data = await response.json()
      const variantMap: Record<string, FunnelVariant> = {}
      data.variants.forEach((v: FunnelVariant) => {
        variantMap[v.segmentKey] = v
      })
      setVariants(variantMap)
    } catch (err) {
      console.error('Generation error:', err)
      alert('Erreur lors de la génération des variantes')
    } finally {
      setGenerating(false)
    }
  }

  const saveVariant = async (variant: FunnelVariant) => {
    const key = variant.segmentKey
    setSaveStatus(prev => ({ ...prev, [key]: 'saving' }))

    try {
      const response = await fetch('/api/funnel/variant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          profileId,
          variant,
        }),
      })

      if (!response.ok) {
        throw new Error(`Save failed: ${response.statusText}`)
      }

      const data = await response.json()
      setVariants(prev => ({ ...prev, [key]: data.variant }))
      setSaveStatus(prev => ({ ...prev, [key]: 'saved' }))

      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [key]: 'idle' }))
      }, 2000)
    } catch (err) {
      console.error('Save error:', err)
      alert('Erreur lors de la sauvegarde de la variante')
      setSaveStatus(prev => ({ ...prev, [key]: 'idle' }))
    }
  }

  const handleVariantChange = (key: string, variant: FunnelVariant) => {
    setVariants(prev => ({ ...prev, [key]: variant }))
    setEditingVariant(variant)
  }

  const previewUrl = (segmentKey: string) => {
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000'
    const slug = `${profileName.toLowerCase().replace(/\s+/g, '-')}-${specialty.toLowerCase().replace(/\s+/g, '-')}-${profileCity.toLowerCase().replace(/\s+/g, '-')}`
    return `${baseUrl}/t/${slug}?segment=${segmentKey}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={{ padding: '2rem', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header & Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: T, marginBottom: '1rem' }}>
          Éditeur de variantes de funnel
        </h2>
        <p style={{ fontSize: '0.95rem', color: M, marginBottom: '1.5rem' }}>
          Adaptez le contenu de la landing page pour chaque segment d'intention
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={generateVariants}
            disabled={generating}
            style={{
              padding: '0.75rem 1.5rem',
              background: GN,
              color: W,
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.7 : 1,
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '0.95rem',
            }}
          >
            {generating ? 'Génération en cours...' : '✨ Générer les variantes'}
          </button>
        </div>
      </div>

      {/* Variants List */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {segments.map(segment => {
          const variant = variants[segment.key]
          const isExpanded = expandedSegment === segment.key
          const status = saveStatus[segment.key] || 'idle'

          return (
            <div
              key={segment.key}
              style={{
                background: W,
                borderRadius: 12,
                border: '2px solid rgba(0,0,0,.08)',
                overflow: 'hidden',
              }}
            >
              {/* Segment Header */}
              <div
                onClick={() => setExpandedSegment(isExpanded ? null : segment.key)}
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isExpanded ? `${GN}08` : 'transparent',
                  transition: 'background 0.3s',
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: T, marginBottom: '0.25rem' }}>
                    {segment.label}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: M }}>
                    {variant ? 'Variante générée' : 'En attente de génération'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {variant && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          window.open(previewUrl(segment.key), '_blank')
                        }}
                        title="Prévisualiser"
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: 'transparent',
                          border: `2px solid ${GN}`,
                          color: GN,
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                        }}
                      >
                        <Eye size={16} />
                        Prévisualiser
                      </button>

                      <button
                        onClick={e => {
                          e.stopPropagation()
                          copyToClipboard(previewUrl(segment.key))
                        }}
                        title="Copier l'URL"
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: 'transparent',
                          border: `2px solid ${M}`,
                          color: M,
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                        }}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  )}

                  <ChevronDown
                    size={20}
                    style={{
                      color: M,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.3s',
                    }}
                  />
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && variant && (
                <div style={{ borderTop: '2px solid rgba(0,0,0,.08)', padding: '1.5rem' }}>
                  <VariantEditor
                    variant={variant}
                    onChange={v => handleVariantChange(segment.key, v)}
                    onSave={() => saveVariant(variant)}
                    saveStatus={status}
                  />
                </div>
              )}

              {isExpanded && !variant && (
                <div style={{ padding: '2rem', textAlign: 'center', color: M }}>
                  <p style={{ fontSize: '0.95rem' }}>
                    Générez les variantes pour commencer l'édition
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Variant Editor Sub-Component
// ─────────────────────────────────────────────────────────

interface VariantEditorProps {
  variant: FunnelVariant
  onChange: (variant: FunnelVariant) => void
  onSave: () => void
  saveStatus: 'idle' | 'saving' | 'saved'
}

function VariantEditor({ variant, onChange, onSave, saveStatus }: VariantEditorProps) {
  const [activeTab, setActiveTab] = useState<'hero' | 'problem' | 'approach' | 'form'>('hero')

  const updateVariant = (updates: Partial<FunnelVariant>) => {
    onChange({ ...variant, ...updates })
  }

  const updateNested = (section: string, updates: Record<string, unknown>) => {
    const updated = { ...variant }
    const sectionKey = section as keyof FunnelVariant
    const currentSection = variant[sectionKey]
    if (typeof currentSection === 'object' && currentSection !== null) {
      updated[sectionKey] = { ...currentSection, ...updates } as never
    }
    onChange(updated)
  }

  const tabs = [
    { id: 'hero', label: 'Héro' },
    { id: 'problem', label: 'Problème' },
    { id: 'approach', label: 'Approche' },
    { id: 'form', label: 'Formulaire' },
  ] as const

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `2px solid ${C}`, paddingBottom: '0.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'hero' | 'problem' | 'approach' | 'form')}
            style={{
              padding: '0.75rem 1rem',
              background: activeTab === tab.id ? GN : 'transparent',
              color: activeTab === tab.id ? W : M,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              transition: 'all 0.3s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {activeTab === 'hero' && (
          <>
            <TextField
              label="Headline"
              value={variant.hero.headline}
              onChange={value => updateNested('hero', { headline: value })}
            />
            <TextField
              label="Sous-titre"
              value={variant.hero.subheadline}
              onChange={value => updateNested('hero', { subheadline: value })}
              multiline
            />
            <TextField
              label="Texte CTA"
              value={variant.hero.ctaText}
              onChange={value => updateNested('hero', { ctaText: value })}
            />
          </>
        )}

        {activeTab === 'problem' && (
          <>
            <TextField
              label="Titre"
              value={variant.problemSection.title}
              onChange={value => updateNested('problemSection', { title: value })}
            />
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: T, marginBottom: '0.5rem' }}>
                Problèmes (un par ligne)
              </label>
              <textarea
                value={variant.problemSection.problems.join('\n')}
                onChange={e => updateNested('problemSection', { problems: e.target.value.split('\n').filter(p => p.trim()) })}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  borderRadius: 8,
                  border: `2px solid ${C}`,
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <TextField
              label="Déclaration d'empathie"
              value={variant.problemSection.empathyStatement}
              onChange={value => updateNested('problemSection', { empathyStatement: value })}
            />
          </>
        )}

        {activeTab === 'approach' && (
          <>
            <TextField
              label="Titre"
              value={variant.approachSection.title}
              onChange={value => updateNested('approachSection', { title: value })}
            />
            <TextField
              label="Description"
              value={variant.approachSection.description}
              onChange={value => updateNested('approachSection', { description: value })}
              multiline
            />
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: T, marginBottom: '0.5rem' }}>
                Techniques (une par ligne)
              </label>
              <textarea
                value={variant.approachSection.techniques.join('\n')}
                onChange={e => updateNested('approachSection', { techniques: e.target.value.split('\n').filter(t => t.trim()) })}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  borderRadius: 8,
                  border: `2px solid ${C}`,
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </>
        )}

        {activeTab === 'form' && (
          <>
            <TextField
              label="Titre du formulaire"
              value={variant.formSection.title}
              onChange={value => updateNested('formSection', { title: value })}
            />
            <TextField
              label="Sous-titre du formulaire"
              value={variant.formSection.subtitle}
              onChange={value => updateNested('formSection', { subtitle: value })}
              multiline
            />
          </>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={saveStatus !== 'idle'}
        style={{
          padding: '0.75rem 1.5rem',
          background: saveStatus === 'saved' ? '#10b981' : GN,
          color: W,
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          cursor: saveStatus !== 'idle' ? 'not-allowed' : 'pointer',
          opacity: saveStatus !== 'idle' ? 0.7 : 1,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize: '0.95rem',
          transition: 'all 0.3s',
        }}
      >
        {saveStatus === 'saving' && 'Sauvegarde...'}
        {saveStatus === 'saved' && '✓ Sauvegardé'}
        {saveStatus === 'idle' && 'Enregistrer les modifications'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Text Field Component
// ─────────────────────────────────────────────────────────

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
}

function TextField({ label, value, onChange, multiline }: TextFieldProps) {
  const Component = multiline ? 'textarea' : 'input'

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: T, marginBottom: '0.5rem' }}>
        {label}
      </label>
      {Component === 'textarea' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: multiline ? '100px' : 'auto',
            padding: '0.75rem',
            borderRadius: 8,
            border: `2px solid ${C}`,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: '0.95rem',
            boxSizing: 'border-box',
            fontWeight: 'normal',
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 8,
            border: `2px solid ${C}`,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: '0.95rem',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}
