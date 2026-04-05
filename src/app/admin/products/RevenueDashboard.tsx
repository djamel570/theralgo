'use client'

/**
 * Dashboard des revenus produits
 * Affiche les métriques de vente, ROI, et projetions
 */

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, Plus, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'

const GN = '#72C15F' // vert
const GND = '#5DB847' // vert foncé
const T = '#1A1A1A' // texte
const M = '#6B7280' // muet
const C = '#F7F4EE' // crème
const W = '#FFFFFF' // blanc

interface DailyRevenue {
  date: string
  revenue: number
  adSpend: number
  purchases: number
}

interface ProductBreakdown {
  productId: string
  title: string
  type: string
  price: number
  totalSales: number
  totalRevenue: number
  conversionRate: number
  pageViews: number
  checkouts: number
  accessOpened: number
}

interface RevenueData {
  success: boolean
  totalRevenue: number
  totalPurchases: number
  totalAdSpend: number
  roi: number
  flywheelPercentage: number
  dailyRevenue: DailyRevenue[]
  productBreakdown: ProductBreakdown[]
  crossSellMetric: number
  passiveIncomeProjection: number
}

export function RevenueDashboard() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products/revenue')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <RefreshCw size={24} style={{ color: GN, animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!data) {
    return <div style={{ color: M, textAlign: 'center', padding: '40px' }}>Erreur lors du chargement</div>
  }

  // Formater devises
  const formatEur = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const chartData = data.dailyRevenue.map((day) => ({
    date: new Date(day.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    Revenu: day.revenue / 100,
    'Dépense Pub': day.adSpend,
  }))

  return (
    <div style={{ padding: '40px 20px', minHeight: '100vh', backgroundColor: C }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: 700, color: T }}>
            Dashboard Revenus Produits
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: M }}>Suivez les performances de vos produits numériques</p>
        </div>

        {/* Cartes d'aperçu */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          {/* Total revenu */}
          <div
            style={{
              background: W,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: `1px solid #E5E7EB`,
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: M, letterSpacing: '0.5px' }}>
              Revenu Total
            </p>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 700, color: T }}>
              {formatEur(data.totalRevenue)}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: GN }}>
              <TrendingUp size={16} />
              <span>{data.totalPurchases} achat(s)</span>
            </div>
          </div>

          {/* Total achats */}
          <div
            style={{
              background: W,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: `1px solid #E5E7EB`,
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: M, letterSpacing: '0.5px' }}>
              Total Achats
            </p>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 700, color: T }}>
              {data.totalPurchases}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: M }}>clients satisfaits</p>
          </div>

          {/* Dépense pub */}
          <div
            style={{
              background: W,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: `1px solid #E5E7EB`,
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: M, letterSpacing: '0.5px' }}>
              Dépense Pub
            </p>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 700, color: T }}>
              {formatEur(data.totalAdSpend)}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: M }}>(30 derniers jours)</p>
          </div>

          {/* ROI */}
          <div
            style={{
              background: `linear-gradient(135deg, ${GN} 0%, ${GND} 100%)`,
              color: W,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.5px' }}>
              ROI
            </p>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 700 }}>
              {data.roi > 0 ? '+' : ''}{Math.round(data.roi * 100) / 100}%
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: 0.95 }}>
              {data.roi > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{data.roi > 0 ? 'Bénéficiaire' : 'À améliorer'}</span>
            </div>
          </div>
        </div>

        {/* Indicateur Flywheel */}
        <div
          style={{
            background: W,
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '40px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: `2px solid ${data.flywheelPercentage > 100 ? GN : '#FCA5A5'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Zap size={24} style={{ color: data.flywheelPercentage > 100 ? GN : '#DC2626' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: T }}>Indicateur Flywheel</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: M }}>Vos produits financent-ils vos publicités?</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: T }}>{data.flywheelPercentage}%</span>
            <span style={{ fontSize: '14px', color: M }}>de couverture des dépenses pub</span>
          </div>

          {data.flywheelPercentage > 100 ? (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#F0FDF4',
                border: `1px solid #DCFCE7`,
                borderRadius: '6px',
                color: '#166534',
                fontSize: '13px',
              }}
            >
              ✓ Excellent! Vos produits génèrent plus que le coût de vos annonces. Vous êtes dans un vrai flywheel!
            </div>
          ) : (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#FEF2F2',
                border: `1px solid #FECACA`,
                borderRadius: '6px',
                color: '#991B1B',
                fontSize: '13px',
              }}
            >
              Augmentez vos ventes ou optimisez votre budget pub pour atteindre le flywheel.
            </div>
          )}
        </div>

        {/* Graphique revenus */}
        <div
          style={{
            background: W,
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '40px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: T }}>
            Revenus vs Dépenses Pub (30j)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GN} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={GN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke={M} style={{ fontSize: '12px' }} />
              <YAxis stroke={M} style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: T,
                  border: 'none',
                  borderRadius: '8px',
                  color: W,
                  padding: '12px',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="Revenu"
                stroke={GN}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Dépense Pub"
                stroke="#EF4444"
                dot={false}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Métriques supplémentaires */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              background: W,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: `1px solid #E5E7EB`,
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: M, letterSpacing: '0.5px' }}>
              Cross-Sell
            </p>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 700, color: T }}>
              {data.crossSellMetric}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: M }}>acheteurs de produits en RDV</p>
          </div>

          <div
            style={{
              background: W,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: `1px solid #E5E7EB`,
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: M, letterSpacing: '0.5px' }}>
              Revenu Annuel Projeté
            </p>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 700, color: T }}>
              {formatEur(data.passiveIncomeProjection)}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: M }}>si tendance continue</p>
          </div>
        </div>

        {/* Tableau des produits */}
        <div
          style={{
            background: W,
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '40px',
            overflow: 'hidden',
            border: `1px solid #E5E7EB`,
          }}
        >
          <div style={{ padding: '24px', borderBottom: `1px solid #E5E7EB` }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: T }}>Produits</h2>
          </div>

          {data.productBreakdown.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: M }}>
              <p style={{ margin: 0, fontSize: '14px' }}>Aucun produit publié pour le moment</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: `1px solid #E5E7EB` }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: M, textTransform: 'uppercase' }}>
                      Produit
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: M, textTransform: 'uppercase' }}>
                      Prix
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: M, textTransform: 'uppercase' }}>
                      Ventes
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: M, textTransform: 'uppercase' }}>
                      Revenu
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: M, textTransform: 'uppercase' }}>
                      Conv.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.productBreakdown.map((product) => (
                    <tr
                      key={product.productId}
                      style={{
                        borderBottom: `1px solid #E5E7EB`,
                        cursor: 'pointer',
                        backgroundColor: expandedProduct === product.productId ? '#F9FAFB' : 'transparent',
                      }}
                      onClick={() => setExpandedProduct(expandedProduct === product.productId ? null : product.productId)}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: T, fontWeight: 500 }}>
                        <div>
                          <div>{product.title}</div>
                          <div style={{ fontSize: '12px', color: M, marginTop: '4px' }}>{product.type}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', color: T }}>
                        {formatEur(product.price)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: T }}>
                        {product.totalSales}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: GN }}>
                        {formatEur(product.totalRevenue)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', color: T }}>
                        {product.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
          }}
        >
          <Button
            label="Créer un produit"
            href="/products/create"
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          />
          <Button
            label="Lancer une campagne"
            href="/products/launch"
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              opacity: data.productBreakdown.length === 0 ? 0.5 : 1,
            }}
            disabled={data.productBreakdown.length === 0}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
