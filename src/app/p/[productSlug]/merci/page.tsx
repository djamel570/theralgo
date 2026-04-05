import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface PageProps {
  params: Promise<{ productSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug } = await params

  const supabase = await createServerSupabaseClient()

  const { data: product } = await supabase
    .from('products')
    .select('title')
    .eq('slug', productSlug)
    .eq('status', 'published')
    .single()

  return {
    title: 'Merci pour votre achat',
    description: 'Votre achat a été confirmé. Vous allez recevoir un email avec vos accès.',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function ThankYouPage({ params }: PageProps) {
  const { productSlug } = await params

  const supabase = await createServerSupabaseClient()

  // Fetch product with therapist info
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*, therapist:user_id(id, name, email, phone, specialty, city)')
    .eq('slug', productSlug)
    .eq('status', 'published')
    .single()

  if (productError || !product) {
    notFound()
  }

  const therapist = product.therapist as unknown as {
    id: string
    name: string
    email?: string
    phone?: string
    specialty?: string
    city?: string
  }

  const GN = '#72C15F'
  const GD = '#5DB847'
  const T = '#1A1A1A'
  const M = '#6B7280'
  const C = '#F7F4EE'
  const W = '#FFFFFF'

  return (
    <div
      style={{
        backgroundColor: C,
        color: T,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: W,
          padding: '60px 40px',
          borderRadius: '16px',
          textAlign: 'center',
          border: `1px solid #e5e7eb`,
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: `${GN}20`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            fontSize: '3rem',
          }}
        >
          ✓
        </div>

        {/* Main heading */}
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '20px',
            color: GD,
          }}
        >
          Merci pour votre achat!
        </h1>

        {/* Product title */}
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '30px',
            color: T,
          }}
        >
          "{product.title}"
        </h2>

        {/* Main message */}
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.7,
            color: M,
            marginBottom: '30px',
          }}
        >
          Vous allez recevoir un email de confirmation avec votre accès immédiat au programme.
        </p>

        {/* Check email box */}
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: `2px solid ${GN}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '40px',
          }}
        >
          <p
            style={{
              fontSize: '0.95rem',
              color: T,
              margin: 0,
            }}
          >
            <strong>Vérifiez votre email</strong> (y compris vos spams) pour accéder à votre contenu.
          </p>
        </div>

        {/* Next steps */}
        <div
          style={{
            backgroundColor: '#f9f7f0',
            padding: '30px',
            borderRadius: '8px',
            marginBottom: '40px',
            textAlign: 'left',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              marginBottom: '15px',
              color: T,
            }}
          >
            Prochaines étapes:
          </h3>
          <ol
            style={{
              margin: 0,
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <li style={{ color: M, fontSize: '0.95rem' }}>
              Consultez votre email de confirmation
            </li>
            <li style={{ color: M, fontSize: '0.95rem' }}>
              Cliquez sur le lien d'activation
            </li>
            <li style={{ color: M, fontSize: '0.95rem' }}>
              Commencez votre parcours de transformation
            </li>
          </ol>
        </div>

        {/* Contact info */}
        {therapist.email && (
          <p
            style={{
              fontSize: '0.9rem',
              color: M,
              marginBottom: '40px',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '20px',
            }}
          >
            Des questions? N'hésitez pas à{' '}
            <a
              href={`mailto:${therapist.email}`}
              style={{
                color: GN,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              contacter {therapist.name}
            </a>
          </p>
        )}

        {/* Back to therapist profile */}
        <Link
          href={`/t/${product.user_id}`}
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            backgroundColor: GN,
            color: W,
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            transition: 'background-color 0.2s',
            marginBottom: '20px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = GD
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = GN
          }}
        >
          Retour au profil
        </Link>

        {/* Home link */}
        <div>
          <Link
            href="/"
            style={{
              color: M,
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            ← Accueil
          </Link>
        </div>
      </div>

      {/* Meta Pixel - Track Purchase */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && window.fbq) {
              window.fbq('track', 'Purchase', {
                value: ${product.price},
                currency: 'EUR',
                content_name: '${product.title.replace(/'/g, "\\'")}',
              });
            }
          `,
        }}
      />
    </div>
  )
}
