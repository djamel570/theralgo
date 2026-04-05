'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Package, TrendingUp, AlertCircle } from 'lucide-react'

/* ── Design tokens ──────────────────────────────────────── */
const G = '#72C15F'
const GN = '#5DB847'
const T = '#1A1A1A'
const M = '#6B7280'
const C = '#F7F4EE'
const W = '#FFFFFF'

interface Product {
  id: string
  title: string
  type: string
  price_amount: number
  status: 'draft' | 'published' | 'archived'
  sales_count?: number
  revenue?: number
  created_at: string
}

interface TherapistProductsProps {
  initialProducts?: Product[]
  userId: string
}

export default function TherapistProducts({ initialProducts = [], userId }: TherapistProductsProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
    setLoading(false)
  }

  // Toggle product publish status
  const togglePublish = async (productId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published'
      const res = await fetch('/api/dashboard/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status: newStatus })
      })

      if (res.ok) {
        setProducts(products.map(p =>
          p.id === productId ? { ...p, status: newStatus } : p
        ))
      }
    } catch (error) {
      console.error('Failed to update product status:', error)
    }
  }

  const typeLabels: Record<string, string> = {
    course: 'Cours',
    ebook: 'E-book',
    program: 'Programme',
    template: 'Modèle',
    consultation: 'Consultation',
    other: 'Autre'
  }

  const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0)
  const totalSales = products.reduce((sum, p) => sum + (p.sales_count || 0), 0)
  const publishedCount = products.filter(p => p.status === 'published').length

  const openDetailModal = (product: Product) => {
    setSelectedProduct(product)
    setShowDetailModal(true)
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: T, marginBottom: '.5rem' }}>
            Mes Produits Numériques
          </h1>
          <p style={{ fontSize: '.95rem', color: M }}>
            Gérez vos produits et suivez les ventes en temps réel
          </p>
        </div>
        <Link href="/dashboard/products/create" style={{
          padding: '.75rem 1.5rem',
          borderRadius: '8px',
          background: GN,
          color: W,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '.9rem',
          transition: 'opacity 0.2s'
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          Créer un nouveau produit
        </Link>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: W, padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(0,0,0,.07)` }}>
          <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Produits publiés</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: T }}>{publishedCount}</p>
          <p style={{ fontSize: '.8rem', color: M, marginTop: '.5rem' }}>sur {products.length} total</p>
        </div>
        <div style={{ background: W, padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(0,0,0,.07)` }}>
          <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Ventes totales</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: GN }}>{totalSales}</p>
          <p style={{ fontSize: '.8rem', color: M, marginTop: '.5rem' }}>tous produits</p>
        </div>
        <div style={{ background: W, padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(0,0,0,.07)` }}>
          <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Revenus totaux</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: G }}>{(totalRevenue / 100).toFixed(2)} €</p>
          <p style={{ fontSize: '.8rem', color: M, marginTop: '.5rem' }}>(derniers 30 jours)</p>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div style={{
          background: W,
          padding: '3rem 2rem',
          borderRadius: '12px',
          textAlign: 'center',
          color: M
        }}>
          Chargement des produits...
        </div>
      ) : products.length === 0 ? (
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
          <Package style={{ width: 32, height: 32, opacity: 0.5 }} />
          <p>Aucun produit créé pour le moment</p>
          <Link href="/dashboard/products/create" style={{
            padding: '.5rem 1rem',
            borderRadius: '6px',
            background: GN,
            color: W,
            textDecoration: 'none',
            fontSize: '.85rem',
            fontWeight: 600,
            marginTop: '.5rem'
          }}>
            Créer un produit
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {products.map(product => (
            <div key={product.id} style={{
              background: W,
              borderRadius: '12px',
              border: `1px solid rgba(0,0,0,.07)`,
              overflow: 'hidden',
              transition: 'box-shadow 0.2s'
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,.1)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              {/* Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: `1px solid rgba(0,0,0,.07)`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: T, marginBottom: '.5rem' }}>
                    {product.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '.75rem',
                      fontWeight: 600,
                      background: C,
                      padding: '.25rem .75rem',
                      borderRadius: '999px',
                      color: T
                    }}>
                      {typeLabels[product.type] || product.type}
                    </span>
                    <span style={{
                      fontSize: '.75rem',
                      fontWeight: 600,
                      background: product.status === 'published' ? GN : M,
                      color: W,
                      padding: '.25rem .75rem',
                      borderRadius: '999px'
                    }}>
                      {product.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => togglePublish(product.id, product.status)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: product.status === 'published' ? GN : M,
                    transition: 'color 0.2s'
                  }}
                  title={product.status === 'published' ? 'Dépublier' : 'Publier'}
                >
                  {product.status === 'published' ? (
                    <Eye style={{ width: 20, height: 20 }} />
                  ) : (
                    <EyeOff style={{ width: 20, height: 20 }} />
                  )}
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem' }}>
                {/* Price */}
                <div style({ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '.85rem', color: M, marginBottom: '.25rem' }}>Prix</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: GN }}>
                    {(product.price_amount / 100).toFixed(2)} €
                  </p>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ background: C, padding: '.75rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '.8rem', color: M, marginBottom: '.25rem' }}>Ventes</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: T }}>
                      {product.sales_count || 0}
                    </p>
                  </div>
                  <div style={{ background: C, padding: '.75rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '.8rem', color: M, marginBottom: '.25rem' }}>Revenus</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: G }}>
                      {((product.revenue || 0) / 100).toFixed(2)} €
                    </p>
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => openDetailModal(product)}
                  style={{
                    width: '100%',
                    padding: '.75rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid ${GN}`,
                    background: 'transparent',
                    color: GN,
                    fontSize: '.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = GN;
                    (e.currentTarget as HTMLElement).style.color = W
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = GN
                  }}
                >
                  Voir les détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
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
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,.15)',
            animation: 'fadeIn 0.3s ease-out'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: T }}>
                {selectedProduct.title}
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

            {/* Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div>
                <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Type</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: T }}>
                  {typeLabels[selectedProduct.type] || selectedProduct.type}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Statut</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: selectedProduct.status === 'published' ? GN : M }}>
                  {selectedProduct.status === 'published' ? 'Publié' : 'Brouillon'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Prix</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: GN }}>
                  {(selectedProduct.price_amount / 100).toFixed(2)} €
                </p>
              </div>
              <div>
                <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Crée le</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: T }}>
                  {new Date(selectedProduct.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Ventes</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: T }}>
                  {selectedProduct.sales_count || 0}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Revenus</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: G }}>
                  {((selectedProduct.revenue || 0) / 100).toFixed(2)} €
                </p>
              </div>
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
              <Link href={`/dashboard/products/${selectedProduct.id}`} style={{
                padding: '.75rem 1rem',
                borderRadius: '8px',
                background: GN,
                color: W,
                textDecoration: 'none',
                fontSize: '.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'opacity 0.2s'
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                Modifier
              </Link>
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
