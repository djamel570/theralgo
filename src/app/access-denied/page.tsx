/**
 * Page d'accès refusé
 */

const T = '#1A1A1A'
const M = '#6B7280'
const C = '#F7F4EE'
const W = '#FFFFFF'

export default function AccessDeniedPage() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: C,
      padding: '20px',
    }}>
      <div style={{
        background: W,
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '500px',
      }}>
        <h1 style={{
          margin: '0 0 10px 0',
          fontSize: '28px',
          fontWeight: 700,
          color: T,
        }}>
          Accès refusé
        </h1>
        <p style={{
          margin: '0 0 20px 0',
          fontSize: '15px',
          color: M,
          lineHeight: '1.6',
        }}>
          Ce lien d'accès est invalide, expiré, ou le produit n'est plus disponible.
        </p>
        <p style={{
          margin: '20px 0 0 0',
          fontSize: '13px',
          color: M,
        }}>
          Si vous pensez que c'est une erreur, veuillez contacter directement votre thérapeute.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#72C15F',
            color: W,
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 600,
          }}
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  )
}
