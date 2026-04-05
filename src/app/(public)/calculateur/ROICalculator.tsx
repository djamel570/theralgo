'use client'

/**
 * ROI Calculator Component
 * Calculate revenue potential with Theralgo based on user inputs
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface SpecialtyData {
  key: string
  label: string
}

const specialties: SpecialtyData[] = [
  { key: 'hypnotherapeute', label: 'Hypnothérapeute' },
  { key: 'sophrologue', label: 'Sophrologue' },
  { key: 'osteopathe', label: 'Ostéopathe' },
  { key: 'psychopraticien', label: 'Psychopraticien' },
  { key: 'coach', label: 'Coach de Vie' },
  { key: 'naturopathe', label: 'Naturopathe' },
]

// Conversion rates by specialty
const conversionRatesBySpecialty: { [key: string]: { ctr: number; landingToLead: number; leadToBooking: number; bookingToPatient: number; productConversion: number } } = {
  hypnotherapeute: { ctr: 1.8, landingToLead: 8, leadToBooking: 45, bookingToPatient: 75, productConversion: 2.5 },
  sophrologue: { ctr: 1.5, landingToLead: 7, leadToBooking: 40, bookingToPatient: 70, productConversion: 2.0 },
  osteopathe: { ctr: 2.0, landingToLead: 9, leadToBooking: 50, bookingToPatient: 80, productConversion: 2.0 },
  psychopraticien: { ctr: 1.5, landingToLead: 8, leadToBooking: 35, bookingToPatient: 65, productConversion: 3.0 },
  coach: { ctr: 2.2, landingToLead: 10, leadToBooking: 55, bookingToPatient: 85, productConversion: 3.5 },
  naturopathe: { ctr: 1.6, landingToLead: 7, leadToBooking: 38, bookingToPatient: 72, productConversion: 2.5 },
}

export default function ROICalculator() {
  const [specialty, setSpecialty] = useState('hypnotherapeute')
  const [consultationPrice, setConsultationPrice] = useState(80)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(5)
  const [monthlyBudget, setMonthlyBudget] = useState(500)
  const [sellDigitalProducts, setSellDigitalProducts] = useState(false)
  const [productPrice, setProductPrice] = useState(47)

  const conversionRates = conversionRatesBySpecialty[specialty] || conversionRatesBySpecialty.hypnotherapeute

  // Calculate metrics
  const calculations = useMemo(() => {
    const monthlyImpressions = (monthlyBudget / 100) * 1000 * (conversionRates.ctr / 1.5) // Assume CTR of ~1.5% baseline
    const leadsPerMonth = Math.round((monthlyImpressions * conversionRates.landingToLead) / 100)
    const bookingsPerMonth = Math.round((leadsPerMonth * conversionRates.leadToBooking) / 100)
    const patientsPerMonth = Math.round((bookingsPerMonth * conversionRates.bookingToPatient) / 100)

    // Revenue from consultations
    const consultationRevenue = patientsPerMonth * consultationPrice * sessionsPerWeek * 4.33 // ~4.33 weeks per month, first consultation only
    const followUpRevenue = patientsPerMonth * consultationPrice * sessionsPerWeek * 3.33 // Conservative estimate for follow-ups

    // Revenue from digital products
    const productConversions = Math.round((patientsPerMonth * conversionRates.productConversion) / 100)
    const productRevenue = productConversions * productPrice

    // ROI
    const totalRevenue = consultationRevenue + followUpRevenue + (sellDigitalProducts ? productRevenue : 0)
    const roi = monthlyBudget > 0 ? (totalRevenue / monthlyBudget).toFixed(2) : '0'

    // Cost per patient
    const costPerPatient = patientsPerMonth > 0 ? (monthlyBudget / patientsPerMonth).toFixed(2) : '0'

    // Product coverage
    const productCoverage =
      sellDigitalProducts && productRevenue > 0 ? Math.round((productRevenue / monthlyBudget) * 100) : 0

    return {
      monthlyImpressions: Math.round(monthlyImpressions),
      leadsPerMonth,
      bookingsPerMonth,
      patientsPerMonth,
      consultationRevenue: Math.round(consultationRevenue),
      followUpRevenue: Math.round(followUpRevenue),
      productRevenue: Math.round(productRevenue),
      totalRevenue: Math.round(totalRevenue),
      roi,
      costPerPatient,
      productCoverage,
    }
  }, [specialty, consultationPrice, sessionsPerWeek, monthlyBudget, sellDigitalProducts, productPrice, conversionRates])

  const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number | string; prefix?: string; suffix?: string }) => (
    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#72C15F', fontVariantNumeric: 'tabular-nums' }}>
      {prefix}
      {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      {suffix}
    </div>
  )

  return (
    <div style={{ backgroundColor: '#F7F4EE', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '12px', lineHeight: '1.2' }}>
            Calculez votre potentiel de revenus avec Theralgo
          </h1>
          <p style={{ fontSize: '18px', color: '#6B7280', maxWidth: '600px', margin: '0 auto' }}>
            Estimez combien de patients vous pouvez acquérir et combien vous pouvez gagner en ligne
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          {/* Input Section */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1A1A1A', marginBottom: '24px' }}>
              Vos paramètres
            </h2>

            {/* Specialty */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Spécialité
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {specialties.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Consultation Price */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Prix moyen d'une consultation: {consultationPrice}€
              </label>
              <input
                type="range"
                min="30"
                max="300"
                value={consultationPrice}
                onChange={(e) => setConsultationPrice(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                <span>30€</span>
                <span>300€</span>
              </div>
            </div>

            {/* Sessions Per Week */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Nombre de séances/semaine souhaitées: {sessionsPerWeek}
              </label>
              <input
                type="range"
                min="1"
                max="15"
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                <span>1</span>
                <span>15</span>
              </div>
            </div>

            {/* Monthly Budget */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Budget publicitaire mensuel: {monthlyBudget}€
              </label>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                <span>100€</span>
                <span>5000€</span>
              </div>
            </div>

            {/* Digital Products Toggle */}
            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#1A1A1A' }}>
                <input
                  type="checkbox"
                  checked={sellDigitalProducts}
                  onChange={(e) => setSellDigitalProducts(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Voulez-vous vendre des produits digitaux?
              </label>
            </div>

            {/* Product Price */}
            {sellDigitalProducts && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Prix du produit digital: {productPrice}€
                </label>
                <input
                  type="range"
                  min="17"
                  max="300"
                  value={productPrice}
                  onChange={(e) => setProductPrice(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  <span>17€</span>
                  <span>300€</span>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div>
            {/* Main Results */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1A1A1A', marginBottom: '24px' }}>
                Vos résultats estimés
              </h2>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginBottom: '6px' }}>Leads estimés/mois</p>
                <AnimatedCounter value={calculations.leadsPerMonth} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginBottom: '6px' }}>Rendez-vous estimés/mois</p>
                <AnimatedCounter value={calculations.bookingsPerMonth} />
              </div>

              <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '2px solid #E5E7EB' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginBottom: '6px' }}>Patients acquis/mois</p>
                <AnimatedCounter value={calculations.patientsPerMonth} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginBottom: '6px' }}>Revenu consultations supplémentaires</p>
                <AnimatedCounter value={Math.round(calculations.consultationRevenue + calculations.followUpRevenue)} suffix="€/mois" />
              </div>

              {sellDigitalProducts && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginBottom: '6px' }}>Revenu produits digitaux</p>
                  <AnimatedCounter value={calculations.productRevenue} suffix="€/mois" />
                </div>
              )}

              <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '2px solid #E5E7EB' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginBottom: '6px' }}>Revenu total potentiel</p>
                <AnimatedCounter value={calculations.totalRevenue} suffix="€/mois" />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginBottom: '6px' }}>ROI - Pour 1€ investi</p>
                <AnimatedCounter value={calculations.roi} suffix="€ récupérés" />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginBottom: '6px' }}>Coût par patient acquis</p>
                <AnimatedCounter value={calculations.costPerPatient} suffix="€" />
              </div>

              {sellDigitalProducts && calculations.productCoverage > 0 && (
                <div style={{ padding: '12px', backgroundColor: '#DBEAFE', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                  <p style={{ fontSize: '13px', color: '#1D4ED8', fontWeight: '600' }}>
                    Vos produits digitaux couvrent {calculations.productCoverage}% de vos publicités
                  </p>
                </div>
              )}
            </div>

            {/* CTA */}
            <Link
              href="/auth/signup"
              style={{
                display: 'block',
                padding: '14px 24px',
                backgroundColor: '#72C15F',
                color: '#FFFFFF',
                textAlign: 'center',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                textDecoration: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Commencez gratuitement
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '8px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
            Ces estimations sont basées sur des conversion rates moyennes pour votre spécialité. Vos résultats réels dépendront de la qualité de vos contenus,
            votre ciblage et votre engagement envers votre clientèle.
          </p>
        </div>
      </div>
    </div>
  )
}
