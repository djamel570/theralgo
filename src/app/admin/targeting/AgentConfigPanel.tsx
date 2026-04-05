'use client'

import React, { useState, useEffect } from 'react'
import { DEFAULT_AGENT_CONFIG, AgentConfig } from '@/lib/optimization-agent'

interface AgentConfigPanelProps {
  onSave?: (config: AgentConfig) => void
  initialConfig?: Partial<AgentConfig>
}

export default function AgentConfigPanel({ onSave, initialConfig }: AgentConfigPanelProps) {
  const [config, setConfig] = useState<AgentConfig>({
    ...DEFAULT_AGENT_CONFIG,
    ...initialConfig,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch current config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/agent/config')
        if (!res.ok) throw new Error('Failed to fetch config')
        const data = await res.json()
        setConfig(data.config)
      } catch (err) {
        console.error('Failed to load agent config:', err)
      }
    }
    fetchConfig()
  }, [])

  const handleInputChange = (field: keyof AgentConfig, value: number) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/agent/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save config')
      }

      setSuccess(true)
      if (onSave) onSave(config)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const colors = {
    primary: '#72C15F',
    cream: '#F7F4EE',
    dark: '#1A1A1A',
  }

  const labels: Record<keyof AgentConfig, string> = {
    minImpressions: 'Impressions minimales',
    minSpend: 'Dépense minimale (EUR)',
    learningPeriodDays: 'Période d\'apprentissage (jours)',
    maxCPL: 'Coût par lead max (EUR)',
    minCTR: 'Taux de clic min (%)',
    maxCPC: 'Coût par clic max (EUR)',
    scaleBudgetIncrement: 'Augmentation budget (%)',
    maxDailyBudget: 'Budget quotidien max (centimes)',
    creativeFatigueThreshold: 'Seuil fatigue créative (%)',
    minROAS: 'ROAS minimum',
    minDataPoints: 'Points de données min',
    pauseThreshold: 'Seuil de pause',
  }

  const descriptions: Record<keyof AgentConfig, string> = {
    minImpressions: 'Nombre minimum d\'impressions avant d\'analyser la performance',
    minSpend: 'Dépense minimale avant d\'analyser la performance',
    learningPeriodDays: 'Jours à attendre avant de prendre des décisions automatiques',
    maxCPL: 'Pause si le coût par lead dépasse ce seuil',
    minCTR: 'Pause si le taux de clic est inférieur à ce pourcentage',
    maxCPC: 'Pause si le coût par clic dépasse ce seuil',
    scaleBudgetIncrement: 'Pourcentage d\'augmentation du budget pour les très bons ad sets',
    maxDailyBudget: 'Budget quotidien maximum par ad set (en centimes)',
    creativeFatigueThreshold: 'Pourcentage de baisse de CTR pour détecter la fatigue créative',
    minROAS: 'Retour sur dépenses minimales requis',
    minDataPoints: 'Nombre minimum de points de données pour prendre une décision',
    pauseThreshold: 'Score de performance minimum avant mise en pause',
  }

  return (
    <div
      style={{
        backgroundColor: colors.cream,
        borderRadius: '12px',
        padding: '24px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      <h2
        style={{
          color: colors.dark,
          marginBottom: '24px',
          fontSize: '20px',
          fontWeight: 600,
        }}
      >
        Configuration de l'agent d'optimisation
      </h2>

      {error && (
        <div
          style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          Configuration enregistrée avec succès
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Minimum Data Section */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '16px',
            borderLeft: `4px solid ${colors.primary}`,
          }}
        >
          <h3 style={{ color: colors.dark, marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
            Données minimales
          </h3>

          <ConfigInput
            label={labels.minImpressions}
            description={descriptions.minImpressions}
            value={config.minImpressions}
            onChange={(v) => handleInputChange('minImpressions', v)}
            primaryColor={colors.primary}
          />

          <ConfigInput
            label={labels.minSpend}
            description={descriptions.minSpend}
            value={config.minSpend}
            onChange={(v) => handleInputChange('minSpend', v)}
            primaryColor={colors.primary}
          />

          <ConfigInput
            label={labels.learningPeriodDays}
            description={descriptions.learningPeriodDays}
            value={config.learningPeriodDays}
            onChange={(v) => handleInputChange('learningPeriodDays', v)}
            primaryColor={colors.primary}
          />
        </div>

        {/* Performance Thresholds Section */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '16px',
            borderLeft: `4px solid ${colors.primary}`,
          }}
        >
          <h3 style={{ color: colors.dark, marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
            Seuils de performance
          </h3>

          <ConfigInput
            label={labels.maxCPL}
            description={descriptions.maxCPL}
            value={config.maxCPL}
            onChange={(v) => handleInputChange('maxCPL', v)}
            primaryColor={colors.primary}
          />

          <ConfigInput
            label={labels.minCTR}
            description={descriptions.minCTR}
            value={config.minCTR}
            onChange={(v) => handleInputChange('minCTR', v)}
            primaryColor={colors.primary}
          />

          <ConfigInput
            label={labels.maxCPC}
            description={descriptions.maxCPC}
            value={config.maxCPC}
            onChange={(v) => handleInputChange('maxCPC', v)}
            primaryColor={colors.primary}
          />
        </div>

        {/* Scaling Rules Section */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '16px',
            borderLeft: `4px solid ${colors.primary}`,
          }}
        >
          <h3 style={{ color: colors.dark, marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
            Règles de mise à l'échelle
          </h3>

          <ConfigInput
            label={labels.scaleBudgetIncrement}
            description={descriptions.scaleBudgetIncrement}
            value={config.scaleBudgetIncrement}
            onChange={(v) => handleInputChange('scaleBudgetIncrement', v)}
            primaryColor={colors.primary}
          />

          <ConfigInput
            label={labels.maxDailyBudget}
            description={descriptions.maxDailyBudget}
            value={config.maxDailyBudget}
            onChange={(v) => handleInputChange('maxDailyBudget', v)}
            primaryColor={colors.primary}
          />
        </div>

        {/* Creative & Advanced Section */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '16px',
            borderLeft: `4px solid ${colors.primary}`,
          }}
        >
          <h3 style={{ color: colors.dark, marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
            Créatif et avancé
          </h3>

          <ConfigInput
            label={labels.creativeFatigueThreshold}
            description={descriptions.creativeFatigueThreshold}
            value={config.creativeFatigueThreshold}
            onChange={(v) => handleInputChange('creativeFatigueThreshold', v)}
            primaryColor={colors.primary}
          />

          {config.minROAS && (
            <ConfigInput
              label={labels.minROAS}
              description={descriptions.minROAS}
              value={config.minROAS}
              onChange={(v) => handleInputChange('minROAS', v)}
              primaryColor={colors.primary}
            />
          )}

          {config.minDataPoints && (
            <ConfigInput
              label={labels.minDataPoints}
              description={descriptions.minDataPoints}
              value={config.minDataPoints}
              onChange={(v) => handleInputChange('minDataPoints', v)}
              primaryColor={colors.primary}
            />
          )}

          {config.pauseThreshold && (
            <ConfigInput
              label={labels.pauseThreshold}
              description={descriptions.pauseThreshold}
              value={config.pauseThreshold}
              onChange={(v) => handleInputChange('pauseThreshold', v)}
              primaryColor={colors.primary}
            />
          )}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.target as HTMLButtonElement).style.opacity = '0.9'
          }}
          onMouseLeave={(e) => {
            if (!loading) (e.target as HTMLButtonElement).style.opacity = '1'
          }}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}

interface ConfigInputProps {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  primaryColor: string
}

function ConfigInput({ label, description, value, onChange, primaryColor }: ConfigInputProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          color: '#333',
          fontSize: '13px',
          fontWeight: 500,
          marginBottom: '6px',
        }}
      >
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid #ddd`,
          borderRadius: '6px',
          fontSize: '13px',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
      <p
        style={{
          fontSize: '11px',
          color: '#666',
          marginTop: '4px',
          marginBottom: 0,
        }}
      >
        {description}
      </p>
    </div>
  )
}
