import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Theralgo — Acquisition patients pour thérapeutes',
  description: 'Theralgo connecte votre cabinet aux patients qui cherchent un thérapeute près de chez eux. Campagnes Meta, tableau de bord, support dédié. Actif en 10 jours.',
  keywords: ['thérapeute', 'patients', 'acquisition', 'campagnes', 'sophrologie', 'hypnothérapie', 'naturopathie'],
  openGraph: {
    title: 'Theralgo — De vrais patients. Un seul partenaire.',
    description: 'Plateforme d\'acquisition patients pour thérapeutes indépendants. Actif en 10 jours.',
    locale: 'fr_FR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Preconnect Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Load font async — no render blocking */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap"
          media="print"
          // @ts-expect-error onload trick for async font loading
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap"
          />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  )
}
