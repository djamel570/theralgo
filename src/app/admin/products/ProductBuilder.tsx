'use client'

import { useState } from 'react'
import { ChevronRight, Sparkles, Package, Music, BookOpen, Users, Zap, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { DigitalProduct, ProductType, ProductModule } from '@/lib/product-builder'

type Step = 'type' | 'define' | 'preview' | 'review'

interface ProductBuilderProps {
  therapistName: string
  therapistProfile: {
    id: string
    specialty: string
    approach: string
    mainProblem: string
    techniques: string
    city: string
  }
}

export default function ProductBuilder({ therapistName, therapistProfile }: ProductBuilderProps) {
  const [step, setStep] = useState<Step>('type')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Choose product type
  const [productType, setProductType] = useState<ProductType | null>(null)

  // Step 2: Define topic
  const [topic, setTopic] = useState('')
  const [targetSegment, setTargetSegment] = useState('')
  const [tone, setTone] = useState<'warm' | 'professional' | 'energetic' | 'calm'>('warm')
  const [duration, setDuration] = useState('')

  // Step 3 & 4: Generated product
  const [product, setProduct] = useState<DigitalProduct | null>(null)
  const [editedProduct, setEditedProduct] = useState<DigitalProduct | null>(null)
  const [activeTab, setActiveTab] = useState<'structure' | 'scripts' | 'sales' | 'emails' | 'ads'>('structure')

  const productTypes: { type: ProductType; label: string; description: string; icon: React.ReactNode }[] = [
    {
      type: 'audio_program',
      label: 'Programme Audio',
      description: 'Série de modules audio (MP3) livrés sur plusieurs jours/semaines',
      icon: <Music className="w-8 h-8" />,
    },
    {
      type: 'mini_course',
      label: 'Mini-Cours',
      description: 'Cours structuré avec vidéos, PDF et exercices pratiques',
      icon: <BookOpen className="w-8 h-8" />,
    },
    {
      type: 'live_workshop',
      label: 'Atelier Live',
      description: 'Événement en direct + enregistrement + matériels support',
      icon: <Users className="w-8 h-8" />,
    },
    {
      type: 'subscription',
      label: 'Abonnement',
      description: 'Accès mensuel à contenu, communauté, mises à jour régulières',
      icon: <Zap className="w-8 h-8" />,
    },
  ]

  const handleGenerateProduct = async () => {
    if (!productType || !topic) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: therapistProfile.id,
          therapistName,
          specialty: therapistProfile.specialty,
          approach: therapistProfile.approach,
          mainProblem: therapistProfile.mainProblem,
          techniques: therapistProfile.techniques,
          city: therapistProfile.city,
          productType,
          topic,
          targetSegment: targetSegment || undefined,
          priceRange: 'medium',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      const data = await response.json()
      setProduct(data.product)
      setEditedProduct(data.product)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateScripts = async () => {
    if (!product) return

    setLoading(true)
    setError(null)

    try {
      const moduleIndices = product.modules.map((_, i) => i)
      const response = await fetch('/api/products/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          moduleIndices,
          therapistVoice: tone,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la génération des scripts')
      }

      const data = await response.json()
      if (editedProduct) {
        const updatedProduct = {
          ...editedProduct,
          modules: editedProduct.modules.map((m, i) => {
            const script = data.scripts.find((s: ProductModule) => s.order === m.order)
            return script ? { ...m, ...script } : m
          }),
        }
        setEditedProduct(updatedProduct)
      }
      setActiveTab('scripts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleAddModule = () => {
    if (!editedProduct) return
    const newModule: ProductModule = {
      order: editedProduct.modules.length + 1,
      title: 'Nouveau module',
      description: 'Description à remplir',
      type: 'audio',
      duration: '30 minutes',
    }
    setEditedProduct({
      ...editedProduct,
      modules: [...editedProduct.modules, newModule],
    })
  }

  const handleRemoveModule = (index: number) => {
    if (!editedProduct) return
    setEditedProduct({
      ...editedProduct,
      modules: editedProduct.modules.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i + 1 })),
    })
  }

  const handleUpdateModule = (index: number, field: string, value: unknown) => {
    if (!editedProduct) return
    const updated = [...editedProduct.modules]
    updated[index] = { ...updated[index], [field]: value }
    setEditedProduct({ ...editedProduct, modules: updated })
  }

  const handlePublish = async () => {
    if (!editedProduct) return
    // TODO: Implement publish logic
    console.log('Publishing product:', editedProduct)
    alert('Produit publié ! (À implémenter)')
  }

  // ════════════════════════════════════════════════════════════════════════
  // STEP 1: Choose Product Type
  // ════════════════════════════════════════════════════════════════════════

  if (step === 'type') {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            Créer un Produit Digital
          </h1>
          <p style={{ fontSize: '1rem', color: '#666', marginTop: '0.5rem' }}>
            Choisissez le type de produit à créer avec l'IA
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {productTypes.map(({ type, label, description, icon }) => (
            <button
              key={type}
              onClick={() => {
                setProductType(type)
                setStep('define')
              }}
              style={{
                padding: '2rem',
                border: 'none',
                borderRadius: '16px',
                background: '#F7F4EE',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#72C15F'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F7F4EE'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ color: '#72C15F', display: 'flex' }}>{icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{label}</h3>
              <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>{description}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // STEP 2: Define Topic & Settings
  // ════════════════════════════════════════════════════════════════════════

  if (step === 'define') {
    return (
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => setStep('type')}
            style={{
              background: 'none',
              border: 'none',
              color: '#72C15F',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '1rem',
              padding: 0,
            }}
          >
            ← Retour
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            Définir le Produit
          </h1>
          <p style={{ fontSize: '1rem', color: '#666', marginTop: '0.5rem' }}>
            {productTypes.find(t => t.type === productType)?.label}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            color: '#991b1b',
            fontSize: '0.95rem',
          }}>
            <AlertCircle className="w-5 h-5" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '0.5rem' }}>
              Sujet principal *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Gestion du stress, Perte de poids, Sommeil..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '0.5rem' }}>
              Segment cible (optionnel)
            </label>
            <input
              type="text"
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value)}
              placeholder="Ex: Professionnels stressés, Femmes 30-50 ans..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '0.75rem' }}>
              Ton de communication
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {['warm', 'professional', 'energetic', 'calm'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t as typeof tone)}
                  style={{
                    padding: '0.75rem',
                    border: `2px solid ${tone === t ? '#72C15F' : '#ddd'}`,
                    borderRadius: '8px',
                    background: tone === t ? '#F0F9EE' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: tone === t ? '#5DB847' : '#666',
                    transition: 'all 0.2s',
                  }}
                >
                  {{ warm: '🤝 Chaleureux', professional: '💼 Professionnel', energetic: '⚡ Énergique', calm: '🧘 Calme' }[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '0.5rem' }}>
              Durée estimée (optionnel)
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Ex: 21 jours, 4 semaines, 2 heures..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={() => setStep('type')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #ddd',
                borderRadius: '999px',
                background: 'white',
                color: '#1A1A1A',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Retour
            </button>
            <button
              onClick={handleGenerateProduct}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '999px',
                background: '#72C15F',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <Sparkles className="w-5 h-5" />
              {loading ? 'Génération...' : 'Générer l\'aperçu'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // STEP 3: Preview & Customize
  // ════════════════════════════════════════════════════════════════════════

  if (step === 'preview' && product && editedProduct) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => setStep('define')}
            style={{
              background: 'none',
              border: 'none',
              color: '#72C15F',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '1rem',
              padding: 0,
            }}
          >
            ← Retour
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            Aperçu & Personnalisation
          </h1>
          <p style={{ fontSize: '1rem', color: '#666', marginTop: '0.5rem' }}>
            {editedProduct.title}
          </p>
        </div>

        <div style={{ background: '#F7F4EE', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, margin: '0 0 0.5rem' }}>SOUS-TITRE</p>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                {editedProduct.subtitle}
              </h2>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, margin: '0 0 0.5rem' }}>PRIX SUGGÉRÉ</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#72C15F', margin: 0 }}>
                €{editedProduct.price.amount}
                {editedProduct.price.compareAt && (
                  <span style={{ fontSize: '0.8rem', color: '#999', marginLeft: '0.5rem', textDecoration: 'line-through' }}>
                    €{editedProduct.price.compareAt}
                  </span>
                )}
              </h2>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Package className="w-5 h-5" style={{ color: '#72C15F' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              Structure ({editedProduct.modules.length} modules)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {editedProduct.modules.map((module, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                  <input
                    type="text"
                    value={module.title}
                    onChange={(e) => handleUpdateModule(idx, 'title', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  />
                  <select
                    value={module.type}
                    onChange={(e) => handleUpdateModule(idx, 'type', e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="audio">Audio</option>
                    <option value="video">Vidéo</option>
                    <option value="pdf">PDF</option>
                    <option value="live_session">Live</option>
                    <option value="exercise">Exercice</option>
                  </select>
                  <input
                    type="text"
                    value={module.duration}
                    onChange={(e) => handleUpdateModule(idx, 'duration', e.target.value)}
                    placeholder="30 min"
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      width: '100px',
                    }}
                  />
                </div>
                <button
                  onClick={() => handleRemoveModule(idx)}
                  style={{
                    background: '#fee2e2',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#991b1b',
                    cursor: 'pointer',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddModule}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              border: '2px dashed #72C15F',
              borderRadius: '8px',
              background: 'white',
              color: '#72C15F',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            + Ajouter un module
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setStep('define')}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid #ddd',
              borderRadius: '999px',
              background: 'white',
              color: '#1A1A1A',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Retour
          </button>
          <button
            onClick={() => setStep('review')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '999px',
              background: '#72C15F',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            Générer le produit complet <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // STEP 4: Full Review & Publish
  // ════════════════════════════════════════════════════════════════════════

  if (step === 'review' && editedProduct) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => setStep('preview')}
            style={{
              background: 'none',
              border: 'none',
              color: '#72C15F',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '1rem',
              padding: 0,
            }}
          >
            ← Retour
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            Révision Complète
          </h1>
          <p style={{ fontSize: '1rem', color: '#666', marginTop: '0.5rem' }}>
            {editedProduct.title} • €{editedProduct.price.amount}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            color: '#991b1b',
          }}>
            <AlertCircle className="w-5 h-5" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e0e0e0', paddingBottom: '1rem' }}>
          {(['structure', 'scripts', 'sales', 'emails', 'ads'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                background: activeTab === tab ? '#72C15F' : 'transparent',
                color: activeTab === tab ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              {{ structure: 'Structure', scripts: 'Scripts', sales: 'Page de vente', emails: 'Emails', ads: 'Campagne' }[tab]}
            </button>
          ))}
        </div>

        {/* Tab: Structure */}
        {activeTab === 'structure' && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A', marginTop: 0 }}>Modules</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {editedProduct.modules.map((m, i) => (
                  <div key={i} style={{ padding: '1rem', background: '#F7F4EE', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      <strong>{m.order}.</strong>
                      <strong>{m.title}</strong>
                      <span style={{ color: '#72C15F', fontSize: '0.85rem' }}>({m.type})</span>
                    </div>
                    <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>{m.description}</p>
                    <p style={{ color: '#999', margin: '0.5rem 0 0', fontSize: '0.85rem' }}>⏱ {m.duration}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Scripts */}
        {activeTab === 'scripts' && (
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={handleGenerateScripts}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                background: '#72C15F',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Génération en cours...' : 'Générer tous les scripts'}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editedProduct.modules.map((m, i) => (
                <div key={i} style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1A1A1A', margin: '0 0 1rem' }}>
                    Module {m.order}: {m.title}
                  </h4>
                  {m.script ? (
                    <textarea
                      value={m.script}
                      onChange={(e) => handleUpdateModule(i, 'script', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '200px',
                        padding: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontFamily: 'monospace',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>Script à générer</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Sales Page */}
        {activeTab === 'sales' && (
          <div style={{ marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A', marginTop: 0 }}>Page de vente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, margin: 0 }}>HEADLINE</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A', margin: '0.5rem 0 0' }}>
                  {editedProduct.salesPage.headline}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, margin: 0 }}>SUBHEADLINE</p>
                <p style={{ fontSize: '0.95rem', color: '#666', margin: '0.5rem 0 0' }}>
                  {editedProduct.salesPage.subheadline}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, margin: 0 }}>BÉNÉFICES</p>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem' }}>
                {editedProduct.salesPage.benefits.map((b, i) => (
                  <li key={i} style={{ color: '#1A1A1A', marginBottom: '0.5rem' }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, margin: 0 }}>FAQ</p>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {editedProduct.salesPage.faq.map((item, i) => (
                  <div key={i}>
                    <strong style={{ color: '#1A1A1A' }}>{item.question}</strong>
                    <p style={{ color: '#666', margin: '0.5rem 0 0' }}>{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Emails */}
        {activeTab === 'emails' && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editedProduct.emailSequence.map((email, i) => (
                <div key={i} style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#999', margin: 0 }}>
                      Email {email.order} • Jour {email.dayOffset > 0 ? '+' : ''}{email.dayOffset}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#72C15F', margin: '0.25rem 0 0' }}>
                      {email.type.toUpperCase()}
                    </p>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A', margin: '0 0 0.5rem' }}>
                    {email.subject}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: 0, fontStyle: 'italic' }}>
                    {email.previewText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Ads */}
        {activeTab === 'ads' && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A', marginTop: 0 }}>Variantes Publicitaires</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {editedProduct.adCampaign.adVariants.map((variant, i) => (
                  <div key={i} style={{ padding: '1rem', background: '#F7F4EE', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#999', margin: 0, marginBottom: '0.5rem' }}>Variante {i + 1}</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1A1A1A', margin: 0, marginBottom: '0.5rem' }}>
                      {variant.headline}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: 0, marginBottom: '0.5rem' }}>
                      {variant.primaryText}
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', background: '#72C15F', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                        {variant.ctaType}
                      </span>
                      <span style={{ fontSize: '0.8rem', background: '#e0e0e0', color: '#666', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                        {variant.targetSegment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ fontSize: '0.85rem', color: '#999', fontWeight: 600, margin: 0 }}>BUDGET SUGGÉRÉ</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A', margin: '0.5rem 0 0' }}>
                  €{editedProduct.adCampaign.suggestedBudget.daily}/jour • {editedProduct.adCampaign.suggestedBudget.duration} jours
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Publish Button */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={() => setStep('preview')}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid #ddd',
              borderRadius: '999px',
              background: 'white',
              color: '#1A1A1A',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Retour
          </button>
          <button
            onClick={handlePublish}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '999px',
              background: '#72C15F',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              flex: 1,
            }}
          >
            Publier le produit
          </button>
        </div>
      </div>
    )
  }

  return null
}
