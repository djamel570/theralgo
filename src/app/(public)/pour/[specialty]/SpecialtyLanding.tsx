'use client'

/**
 * Specialty Landing Page Component
 * Dynamic SEO-optimized landing pages for each therapist specialty
 */

import Link from 'next/link'
import { useMemo } from 'react'

interface SpecialtyLandingProps {
  specialty: string
  specialtyLabel: string
}

const specialtyContent: { [key: string]: { headline: string; description: string; problems: string[]; features: { icon: string; title: string; description: string }[]; exampleName: string; exampleCity: string; exampleMetrics: { patients: number; days: number } } } = {
  hypnotherapeute: {
    headline: 'Theralgo pour les Hypnothérapeutes',
    description: 'Générez des patients via Facebook et Instagram grâce à un ciblage précis des personnes cherchant l\'hypnose.',
    problems: [
      'Attirer les bonnes personnes (celles vraiment motivées)',
      'Démontrer l\'efficacité de l\'hypnothérapie sans jargon',
      'Gérer les objections courantes (peur de perdre le contrôle, ça marche vraiment?)',
      'Convertir leads en rendez-vous confirmés',
    ],
    features: [
      {
        icon: '🎯',
        title: 'Ciblage par intention',
        description: 'Nous ciblons les personnes cherchant "arrêter de fumer hypnose", "gérer le stress", etc.',
      },
      {
        icon: '✍️',
        title: 'Créatifs testés',
        description: 'Notre IA utilise les hooks qui fonctionnent: promesses claires, social proof, objections anticipées.',
      },
      {
        icon: '📅',
        title: 'Calendrier intégré',
        description: 'Les leads prennent directement rendez-vous. Pas de perdus dans les échanges emails.',
      },
      {
        icon: '📊',
        title: 'Analytics en temps réel',
        description: 'Voyez combien de leads, de rendez-vous confirmés, quel coût par patient.',
      },
    ],
    exampleName: 'Sophie Martin',
    exampleCity: 'Lyon',
    exampleMetrics: { patients: 12, days: 30 },
  },
  sophrologue: {
    headline: 'Theralgo pour les Sophrologues',
    description: 'Attirez des patients stressés, des sportifs et des femmes enceintes cherchant sophrologie.',
    problems: [
      'Se différencier dans un marché saturé de bien-être',
      'Montrer les résultats concrets de la sophrologie',
      'Toucher les sportifs et les étudiants qui préparent des examens',
      'Construire une liste de patients réguliers',
    ],
    features: [
      {
        icon: '🧘',
        title: 'Segments ciblés',
        description: 'Stress professionnel, sport, préparation examen, grossesse... chacun son message.',
      },
      {
        icon: '🎬',
        title: 'Vidéos de démo',
        description: 'Montrez une séance (ou ses principes) pour vaincre les objections avant la prise de RDV.',
      },
      {
        icon: '⭐',
        title: 'Témoignages vidéo',
        description: 'Vos patients content leur transformation: "J\'ai retrouvé mon sommeil en 4 séances".',
      },
      {
        icon: '💬',
        title: 'Chatbot pour qualifier',
        description: 'Les leads répondent 2-3 questions pour que vous sachiez qui convertir en priorité.',
      },
    ],
    exampleName: 'Marie Dubois',
    exampleCity: 'Toulouse',
    exampleMetrics: { patients: 15, days: 30 },
  },
  osteopathe: {
    headline: 'Theralgo pour les Ostéopathes',
    description: 'Attirez des patients souffrant de douleurs dorsales, cervicales, sports ou travail.',
    problems: [
      'Intéresser des gens qui ne connaissent pas l\'ostéopathie (confusion avec kinésithérapie)',
      'Cibler les douleurs spécifiques (dos, cou, migraines, sports)',
      'Montrer l\'efficacité sans tomber dans le pseudo-scientifique',
      'Créer un suivi patient automatisé (entre séances)',
    ],
    features: [
      {
        icon: '🏥',
        title: 'Ciblage par symptôme',
        description: 'Douleur dorsale, douleur cervicale, migraines, sports... chaque public a son angle.',
      },
      {
        icon: '📹',
        title: 'Contenu éducatif',
        description: '"5 exercices à faire entre mes séances"... le patient sent du support, revient.',
      },
      {
        icon: '🤝',
        title: 'Intégration praticiens',
        description: 'Synapse avec kinés, médecins du sport pour créer un écosystème',
      },
      {
        icon: '📋',
        title: 'Suivi structuré',
        description: 'Rappels de séance, exercices, évaluations de progression.',
      },
    ],
    exampleName: 'Marc Leclerc',
    exampleCity: 'Bordeaux',
    exampleMetrics: { patients: 18, days: 30 },
  },
  psychopraticien: {
    headline: 'Theralgo pour les Psychopraticiens',
    description: 'Générez des patients cherchant un soutien émotionnel, relation d\'aide, ou coaching.',
    problems: [
      'Toucher des gens traversant une période difficile',
      'Se démarquer des psychologues et psychiatres (crédibilité)',
      'Montrer votre approche spécifique (PNL, EMDR, analyse transactionnelle...)',
      'Construire la confiance avant la première séance',
    ],
    features: [
      {
        icon: '💡',
        title: 'Approche spécifique',
        description: 'Mettez en avant votre méthode: "Je pratique la PNL" motive mieux qu\'un générique.',
      },
      {
        icon: '📝',
        title: 'Articles éducatifs',
        description: 'Publiez "Comment gérer une rupture" ou "Dépasser le syndrome de l\'imposteur".',
      },
      {
        icon: '🎙️',
        title: 'Podcast/vidéo',
        description: 'Parlez de thèmes (confiance, relation, famille) pour vous positionner comme expert.',
      },
      {
        icon: '🔐',
        title: 'Confidentialité/sécurité',
        description: 'Montrez que vous respectez la confidentialité (outil RGPD intégré).',
      },
    ],
    exampleName: 'Stéphane Moreau',
    exampleCity: 'Paris',
    exampleMetrics: { patients: 10, days: 30 },
  },
  coach: {
    headline: 'Theralgo pour les Coaches de Vie',
    description: 'Attirez des clients cherchant développement personnel, réorientation ou transformation.',
    problems: [
      'Saturé par la concurrence de coachs en ligne',
      'Montrer les résultats concrets de votre coaching',
      'Toucher votre niche spécifique (entrepreneuriat, carrière, confiance...)',
      'Créer des packages coaching progressifs (séances + groupe)',
    ],
    features: [
      {
        icon: '🚀',
        title: 'Spécialités claires',
        description: 'Coach pro, de carrière, confiance, créativité: chacun son public.',
      },
      {
        icon: '📊',
        title: 'Case studies',
        description: '"J\'ai aidé 50 femmes à créer leur business": données = crédibilité.',
      },
      {
        icon: '👥',
        title: 'Groupe + sessions 1:1',
        description: 'Offrez un hybrid: groupe pour la communauté, 1:1 pour l\'intensité.',
      },
      {
        icon: '🎁',
        title: 'Ressources gratuites',
        description: 'Fiche de diagnostic, plan de 30 jours: montrez votre valeur avant achat.',
      },
    ],
    exampleName: 'Valérie Laurent',
    exampleCity: 'Marseille',
    exampleMetrics: { patients: 8, days: 30 },
  },
  naturopathe: {
    headline: 'Theralgo pour les Naturopathes',
    description: 'Attirez des patients cherchant une approche naturelle de la santé.',
    problems: [
      'Naviguer la crédibilité (pas remboursé Sécu)',
      'Montrer l\'efficacité naturelle vs pharmaceutique',
      'Toucher les clients "bien-être holistique"',
      'Créer des programmes de suivi (alimentation, plantes, compléments)',
    ],
    features: [
      {
        icon: '🌿',
        title: 'Contenu éducatif nature',
        description: 'Partages sur les plantes, "Curcuma vs douleurs", nutrition...',
      },
      {
        icon: '📸',
        title: 'Avant/après (santé)',
        description: 'Énergie retrouvée, digestion améliorée, peau, sommeil.',
      },
      {
        icon: '🧬',
        title: 'Bilan de santé',
        description: 'Offrez un diagnostic naturopathique gratuit pour convertir en consultation payante.',
      },
      {
        icon: '📱',
        title: 'Programme digital',
        description: 'Ebook recettes, plans nutritionnels, suivi en ligne entre consultations.',
      },
    ],
    exampleName: 'Isabelle Rousseau',
    exampleCity: 'Nice',
    exampleMetrics: { patients: 9, days: 30 },
  },
}

export default function SpecialtyLanding({ specialty, specialtyLabel }: SpecialtyLandingProps) {
  const content = specialtyContent[specialty] || specialtyContent.hypnotherapeute

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{ backgroundColor: '#F7F4EE', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '52px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '16px', lineHeight: '1.2' }}>
            {content.headline}
          </h1>
          <p style={{ fontSize: '20px', color: '#6B7280', marginBottom: '32px' }}>{content.description}</p>
          <Link
            href="/auth/signup"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#72C15F',
              color: '#FFFFFF',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '16px',
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Essayez Theralgo gratuitement
          </Link>
        </div>
      </section>

      {/* Problems Section */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '12px', textAlign: 'center' }}>
            Les défis des {specialtyLabel}s
          </h2>
          <p style={{ fontSize: '16px', color: '#6B7280', textAlign: 'center', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            Vous connaissez bien ces obstacles... Theralgo les résout tous.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {content.problems.map((problem, index) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  borderLeft: '4px solid #72C15F',
                }}
              >
                <p style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: '500' }}>✓ {problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '60px 20px', backgroundColor: '#F0FDF4' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '12px', textAlign: 'center' }}>
            Comment Theralgo vous aide
          </h2>
          <p style={{ fontSize: '16px', color: '#6B7280', textAlign: 'center', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            Une plateforme tout-en-un pour attirer, convertir et fidéliser vos patients.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {content.features.map((feature, index) => (
              <div
                key={index}
                style={{
                  padding: '24px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #DCFCE7',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study Section */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#F0FDF4', padding: '40px', borderRadius: '8px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>Cas client réel</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#72C15F', marginBottom: '8px' }}>
                  {content.exampleMetrics.patients} patients
                </p>
                <p style={{ fontSize: '16px', color: '#1A1A1A', fontWeight: '500' }}>
                  en {content.exampleMetrics.days} jours
                </p>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '16px' }}>
                {content.exampleName}, {content.exampleCity}
              </h2>
              <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '16px', lineHeight: '1.6' }}>
                "{content.exampleName} a utilisé Theralgo pour améliorer son acquisition de patients. Grâce au ciblage précis, aux
                créatifs optimisés et au calendrier intégré, elle a généré {content.exampleMetrics.patients} nouveaux patients en seulement{' '}
                {content.exampleMetrics.days} jours."
              </p>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Coût par patient</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1A1A1A' }}>~35€</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>ROI</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#72C15F' }}>3.5x</p>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#6B7280', fontStyle: 'italic' }}>
                *Les résultats varient selon la qualité de votre contenu, votre tarification et votre implication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Preview */}
      <section style={{ padding: '60px 20px', backgroundColor: '#F7F4EE' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '12px' }}>
            Quel est votre potentiel?
          </h2>
          <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '32px' }}>
            Utilisez notre calculateur gratuit pour estimer combien de patients vous pouvez acquérir.
          </p>
          <Link
            href="/calculateur"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#FFFFFF',
              color: '#72C15F',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '16px',
              textDecoration: 'none',
              border: '2px solid #72C15F',
              cursor: 'pointer',
            }}
          >
            Essayez le calculateur
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '16px' }}>
            Prêt à multiplier votre impact?
          </h2>
          <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '32px' }}>
            Rejoignez des centaines de {specialtyLabel}s qui ont déjà transformé leur pratique avec Theralgo.
          </p>
          <Link
            href="/auth/signup"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#72C15F',
              color: '#FFFFFF',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '16px',
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Commencez votre essai gratuit
          </Link>
        </div>
      </section>
    </div>
  )
}
