'use client'

import React, { ReactNode, ErrorInfo } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

const G = '#72C15F'
const C = '#F7F4EE'
const T = '#1A1A1A'
const W = '#FFFFFF'

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: undefined }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          background: C,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            background: W,
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 20px rgba(0,0,0,0.05)',
            maxWidth: '500px',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}>
              <AlertCircle style={{
                width: '48px',
                height: '48px',
                color: '#EF4444',
                strokeWidth: 1.5,
              }} />
            </div>

            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: T,
              margin: '0 0 0.75rem 0',
            }}>
              Une erreur est survenue
            </h1>

            <p style={{
              fontSize: '0.95rem',
              color: '#6B7280',
              margin: '0 0 1.5rem 0',
              lineHeight: 1.6,
            }}>
              Nous nous excusons pour ce problème. L'équipe technique a été notifiée. Veuillez réessayer.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                background: '#F3F4F6',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
                maxHeight: '200px',
                overflow: 'auto',
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#4B5563',
                  fontFamily: 'monospace',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.resetError}
              style={{
                background: G,
                color: W,
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
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
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
