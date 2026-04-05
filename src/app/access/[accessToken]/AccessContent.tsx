'use client'

/**
 * Composant d'affichage du contenu du produit numérique
 * Affiche les modules avec lecteurs audio/vidéo, PDFs, exercices
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Play, Download, BookOpen } from 'lucide-react'

const GN = '#72C15F' // vert
const T = '#1A1A1A' // texte
const M = '#6B7280' // muet
const C = '#F7F4EE' // crème
const W = '#FFFFFF' // blanc

interface Module {
  order: number
  title: string
  description: string
  type: 'audio' | 'video' | 'pdf' | 'live_session' | 'exercise'
  duration: string
  script?: string
  exerciseContent?: string
  deliveryDay?: number
  contentUrl?: string
}

interface DigitalProduct {
  id: string
  title: string
  description: string
  type: string
  modules: Module[]
  metadata?: Record<string, unknown>
}

interface Purchase {
  id: string
  buyerName: string
  buyerEmail: string
  created_at: string
}

interface AccessContentProps {
  purchase: Purchase
  product: DigitalProduct
}

export function AccessContent({ purchase, product }: AccessContentProps) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set())

  const toggleModule = (moduleOrder: number) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleOrder)) {
      newExpanded.delete(moduleOrder)
    } else {
      newExpanded.add(moduleOrder)
    }
    setExpandedModules(newExpanded)
  }

  const toggleCompleted = (moduleOrder: number) => {
    const newCompleted = new Set(completedModules)
    if (newCompleted.has(moduleOrder)) {
      newCompleted.delete(moduleOrder)
    } else {
      newCompleted.add(moduleOrder)
    }
    setCompletedModules(newCompleted)
  }

  const modules = product.modules || []
  const completionRate = modules.length > 0 ? Math.round((completedModules.size / modules.length) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C, padding: '40px 20px' }}>
      {/* En-tête */}
      <div style={{ maxWidth: '800px', margin: '0 auto 40px' }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${GN} 0%, #5DB847 100%)`,
            color: W,
            padding: '40px',
            borderRadius: '12px',
            marginBottom: '30px',
          }}
        >
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
            {product.type === 'audio_program'
              ? 'Programme Audio'
              : product.type === 'mini_course'
                ? 'Mini-Cours'
                : product.type === 'live_workshop'
                  ? 'Atelier en Direct'
                  : 'Abonnement'}
          </p>
          <h1 style={{ margin: '0 0 15px 0', fontSize: '32px', fontWeight: 700 }}>{product.title}</h1>
          <p style={{ margin: '0', fontSize: '16px', opacity: 0.95, lineHeight: '1.6' }}>{product.description}</p>
        </div>

        {/* Progress */}
        <div
          style={{
            background: W,
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: T }}>Votre progression</p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: GN }}>{completionRate}%</p>
          </div>
          <div
            style={{
              height: '8px',
              backgroundColor: '#E5E7EB',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: GN,
                width: `${completionRate}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: M }}>
            {completedModules.size} sur {modules.length} modules complétés
          </p>
        </div>
      </div>

      {/* Modules */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: T }}>Contenu du cours</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {modules.map((module) => (
            <div
              key={module.order}
              style={{
                background: W,
                border: `1px solid #E5E7EB`,
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {/* Module Header */}
              <div
                onClick={() => toggleModule(module.order)}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: expandedModules.has(module.order) ? '#F9FAFB' : W,
                  transition: 'background-color 0.2s',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCompleted(module.order)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: completedModules.has(module.order) ? GN : '#D1D5DB',
                  }}
                >
                  {completedModules.has(module.order) ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>

                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 600,
                      color: T,
                      textDecoration: completedModules.has(module.order) ? 'line-through' : 'none',
                      opacity: completedModules.has(module.order) ? 0.6 : 1,
                    }}
                  >
                    {module.title}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: M }}>
                    {module.duration} • {module.type === 'audio' ? '🎧' : module.type === 'video' ? '🎬' : module.type === 'pdf' ? '📄' : module.type === 'exercise' ? '✏️' : '🔴'} {module.type}
                  </p>
                </div>

                <div style={{ color: M }}>
                  {expandedModules.has(module.order) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Module Content */}
              {expandedModules.has(module.order) && (
                <div
                  style={{
                    padding: '20px',
                    borderTop: `1px solid #E5E7EB`,
                    backgroundColor: '#FAFBFC',
                  }}
                >
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: T, lineHeight: '1.6' }}>
                    {module.description}
                  </p>

                  {/* Contenu spécifique par type */}
                  {module.type === 'audio' && (
                    <div style={{ marginBottom: '20px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          backgroundColor: W,
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: `1px solid #E5E7EB`,
                        }}
                      >
                        <Play size={20} style={{ color: GN }} />
                        <div style={{ flex: 1 }}>
                          <audio
                            controls
                            style={{
                              width: '100%',
                              height: '32px',
                            }}
                          >
                            <source src={module.contentUrl} type="audio/mpeg" />
                            Votre navigateur ne supporte pas la lecture audio.
                          </audio>
                        </div>
                      </div>
                    </div>
                  )}

                  {module.type === 'video' && (
                    <div
                      style={{
                        marginBottom: '20px',
                        position: 'relative',
                        paddingBottom: '56.25%',
                        height: 0,
                        overflow: 'hidden',
                        borderRadius: '8px',
                        backgroundColor: '#000',
                      }}
                    >
                      <video
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                        }}
                        controls
                      >
                        <source src={module.contentUrl} type="video/mp4" />
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                    </div>
                  )}

                  {module.type === 'pdf' && (
                    <div style={{ marginBottom: '20px' }}>
                      <a
                        href={module.contentUrl}
                        download
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: GN,
                          color: W,
                          padding: '12px 20px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: 600,
                          transition: 'opacity 0.2s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        <Download size={16} />
                        Télécharger le PDF
                      </a>
                    </div>
                  )}

                  {module.type === 'exercise' && (
                    <div
                      style={{
                        backgroundColor: '#F0FDF4',
                        border: `1px solid #DCFCE7`,
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <BookOpen size={18} style={{ color: GN, flexShrink: 0 }} />
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: T }}>Exercice pratique</h4>
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          color: T,
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {module.exerciseContent}
                      </div>
                    </div>
                  )}

                  {module.type === 'live_session' && (
                    <div
                      style={{
                        backgroundColor: '#EFF6FF',
                        border: `1px solid #BFDBFE`,
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '20px',
                        color: '#1E40AF',
                        fontSize: '14px',
                      }}
                    >
                      <strong>Atelier en direct</strong>
                      <p style={{ margin: '8px 0 0 0' }}>Lien de connexion envoyé par email selon l'horaire.</p>
                    </div>
                  )}

                  {/* Script si disponible */}
                  {module.script && (
                    <details style={{ marginTop: '20px' }}>
                      <summary
                        style={{
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: GN,
                          userSelect: 'none',
                        }}
                      >
                        Voir la transcription
                      </summary>
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '12px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: M,
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          maxHeight: '300px',
                          overflowY: 'auto',
                        }}
                      >
                        {module.script}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: '800px', margin: '60px auto 0', textAlign: 'center', paddingTop: '40px', borderTop: `1px solid #E5E7EB`, color: M, fontSize: '12px' }}>
        <p style={{ margin: '20px 0 0 0' }}>
          Des questions? Contactez votre thérapeute pour plus d'informations.
        </p>
        <p style={{ margin: '10px 0 0 0' }}>© 2026 Theralgo. Tous droits réservés.</p>
      </div>
    </div>
  )
}
