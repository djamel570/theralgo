/**
 * Specialty Landing Page
 * Dynamic SEO-optimized pages for each therapist specialty
 */

import SpecialtyLanding from './SpecialtyLanding'

interface PageProps {
  params: Promise<{
    specialty: string
  }>
}

const specialties: { [key: string]: string } = {
  hypnotherapeutes: 'Hypnothérapeute',
  sophrologues: 'Sophrologue',
  osteopathes: 'Ostéopathe',
  psychopraticiens: 'Psychopraticien',
  coaches: 'Coach de Vie',
  naturopathes: 'Naturopathe',
}

// Map URL-friendly names to specialty keys
const urlToSpecialty: { [key: string]: string } = {
  hypnotherapeutes: 'hypnotherapeute',
  sophrologues: 'sophrologue',
  osteopathes: 'osteopathe',
  psychopraticiens: 'psychopraticien',
  coaches: 'coach',
  naturopathes: 'naturopathe',
}

export async function generateMetadata({ params }: PageProps) {
  const { specialty } = await params
  const label = specialties[specialty] || 'Thérapeute'

  return {
    title: `Theralgo pour les ${label}s - Générez des patients en ligne`,
    description: `Découvrez comment Theralgo aide les ${label}s à attirer et convertir des patients via Facebook et Instagram.`,
    openGraph: {
      title: `Theralgo pour les ${label}s`,
      description: `Plateforme de marketing pour ${label}s: ciblage, calendrier intégré, et suivi des résultats.`,
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(specialties).map((specialty) => ({
    specialty,
  }))
}

export default async function Page({ params }: PageProps) {
  const { specialty } = await params
  const specialtyKey = urlToSpecialty[specialty] || 'hypnotherapeute'
  const label = specialties[specialty] || 'Thérapeute'

  return <SpecialtyLanding specialty={specialtyKey} specialtyLabel={label} />
}
