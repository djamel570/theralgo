'use client'

import { AlertCircle } from 'lucide-react'

interface Props {
  error?: Error
  resetError?: () => void
}

const G = '#72C15F'
const C = '#F7F4EE'
const T = '#1A1A1A'
const W = '#FFFFFF'

export default function ErrorFallback({ error, resetError }: Props) {
  return (
    <div style={{
      background: C,
      borderRadius: '12px',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '1rem',
      }}>
        <AlertCircle style={{
          width: '40px',
          height: '40px',
          color: '#EF4444',
          strokeWidth: 1.5,
        }} />
      </div>

      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: T,
        margin: '0 0 0.5rem 0',
      }}>
        Une erreur est survenue
      </h2>

      <p style={{
        fontSize: '0.9rem',
        color: '#6B7280',
        margin: '0 0 1.5rem 0',
        lineHeight: 1.5,
      }}>
        Nous nous excusons pour ce problème. Veuillez réessayer.
      </p>

      {error && process.env.NODE_ENV === 'development' && (
        <div style={{
          background: W,
          borderRadius: '6px',
          padding: '0.75rem',
          marginBottom: '1rem',
          maxHeight: '150px',
          overflow: 'auto',
          borderLeft: `3px solid #EF4444`,
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: '#4B5563',
            fontFamily: 'monospace',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            textAlign: 'left',
          }}>
            {error.message}
          </p>
        </div>
      )}

      {resetError && (
        <button
          onClick={resetError}
          style={{
            background: G,
            color: W,
            border: 'none',
            borderRadius: '6px',
            padding: '0.6rem 1.2rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#5DB847'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = G
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          Réessayer
        </button>
      )}
    </div>
  )
}
