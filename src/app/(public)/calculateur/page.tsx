/**
 * ROI Calculator Page
 */

import ROICalculator from './ROICalculator'

export const metadata = {
  title: 'Calculateur ROI - Estimez vos revenus avec Theralgo',
  description: 'Utilisez notre calculateur gratuit pour estimer combien de patients vous pouvez acquérir et combien vous pouvez gagner avec Theralgo.',
  openGraph: {
    title: 'Calculateur ROI - Estimez vos revenus avec Theralgo',
    description: 'Découvrez votre potentiel de revenus avec notre calculateur interactif.',
    type: 'website',
  },
}

export default function CalculatorPage() {
  return <ROICalculator />
}
