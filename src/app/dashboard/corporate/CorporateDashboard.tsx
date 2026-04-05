'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  CalendarDays,
  BarChart3,
  Plus,
  Users,
  Euro,
  Star,
  ChevronRight,
  Loader2,
  Check,
  X,
  Send,
  Eye,
  Clock,
  MapPin,
  Video,
  Briefcase,
  TrendingUp,
  Award,
  ClipboardList,
} from 'lucide-react';

// Types
interface Client {
  id: string;
  companyName: string;
  industry: string;
  companySize: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  status: 'prospect' | 'proposition' | 'negotiation' | 'active' | 'completed';
  contractValue: number;
  createdAt: string;
}

interface Proposal {
  id: string;
  clientId: string;
  clientName: string;
  companyName: string;
  specificNeeds: string;
  budgetRange: string;
  format: 'ateliers' | 'seances' | 'complet';
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: string;
  preview?: {
    executiveSummary: string;
    services: string[];
    timeline: string;
    packages: Package[];
    roi: string;
    kpis: string[];
  };
}

interface Package {
  name: string;
  price: number;
  features: string[];
}

interface Session {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  isRemote: boolean;
  maxParticipants: number;
  rate: number;
  participants: number;
  satisfactionScore: number;
}

interface Report {
  id: string;
  clientId: string;
  clientName: string;
  period: string;
  type: 'mensuel' | 'trimestriel' | 'annuel' | 'post-programme';
  createdAt: string;
  preview?: {
    executiveSummary: string;
    metrics: {
      sessions: number;
      participants: number;
      satisfaction: number;
      wellbeingImprovement: number;
    };
    roi: number;
    recommendations: string[];
    assessment: AssessmentDimension[];
  };
}

interface AssessmentDimension {
  name: string;
  before: number;
  after: number;
}

interface Stats {
  activeClients: number;
  b2bRevenue: number;
  sessionsMonthlly: number;
  averageSatisfaction: number;
}

// Mock data
const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    companyName: 'TechCorp Solutions',
    industry: 'Tech',
    companySize: '500-1000',
    contactName: 'Marie Dupont',
    contactRole: 'RH Director',
    contactEmail: 'marie@techcorp.com',
    contactPhone: '+33 1 23 45 67 89',
    status: 'active',
    contractValue: 45000,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    companyName: 'FinanceGroup',
    industry: 'Finance',
    companySize: '200-500',
    contactName: 'Jean Martin',
    contactRole: 'Wellness Manager',
    contactEmail: 'jean@financegroup.com',
    contactPhone: '+33 1 98 76 54 32',
    status: 'negotiation',
    contractValue: 32000,
    createdAt: '2024-02-10',
  },
  {
    id: '3',
    companyName: 'SantéPlus Hospital',
    industry: 'Santé',
    companySize: '1000+',
    contactName: 'Dr. Sophie Leclerc',
    contactRole: 'Wellness Director',
    contactEmail: 'sophie@santeplus.com',
    contactPhone: '+33 1 11 22 33 44',
    status: 'active',
    contractValue: 75000,
    createdAt: '2023-11-20',
  },
  {
    id: '4',
    companyName: 'Prospère Startups',
    industry: 'Tech',
    companySize: '50-200',
    contactName: 'Luc Bernard',
    contactRole: 'Founder',
    contactEmail: 'luc@prospere.com',
    contactPhone: '+33 1 55 66 77 88',
    status: 'prospect',
    contractValue: 15000,
    createdAt: '2024-03-05',
  },
];

const SESSION_TYPES = [
  'Gestion du stress',
  'Méditation guidée',
  'Résilience professionnelle',
  'Communication non-violente',
  'Leadership bienveillant',
  'Prévention du burnout',
  'Wellbeing holistique',
  'Cohésion d\'équipe',
  'Équilibre vie-travail',
  'Mindfulness au travail',
];

const WORKSHOP_TEMPLATES = [
  { id: '1', name: 'Gestion du stress en 4 séances' },
  { id: '2', name: 'Méditation pour managers' },
  { id: '3', name: 'Résilience d\'équipe' },
  { id: '4', name: 'Communication authentique' },
  { id: '5', name: 'Leadership conscient' },
  { id: '6', name: 'Wellbeing intégral' },
  { id: '7', name: 'Prévention du burnout' },
  { id: '8', name: 'Mindfulness appliquée' },
  { id: '9', name: 'Intelligence émotionnelle' },
  { id: '10', name: 'Cohésion et confiance' },
];

// Toast notification component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({
  message,
  type,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? '#5DB847' : '#EF4444';
  const icon = type === 'success' ? Check : X;
  const Icon = icon;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: bgColor,
        color: '#FFFFFF',
        borderRadius: '9999px',
        zIndex: 1000,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <Icon size={20} />
      <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '14px' }}>{message}</span>
    </div>
  );
};

// Stats Card component
const StatsCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({
  icon,
  label,
  value,
}) => (
  <div
    style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      flex: 1,
      minWidth: '200px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <div style={{ color: '#72C15F' }}>{icon}</div>
      <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', color: '#6B7280' }}>
        {label}
      </span>
    </div>
    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '28px', fontWeight: 600, color: '#1A1A1A' }}>
      {value}
    </div>
  </div>
);

// Client Kanban card component
const ClientKanbanCard: React.FC<{ client: Client }> = ({ client }) => (
  <div
    style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      borderLeft: `4px solid #72C15F`,
    }}
  >
    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
      {client.companyName}
    </div>
    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
      {client.contactName} · {client.contactRole}
    </div>
    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, color: '#72C15F', marginTop: '8px' }}>
      €{client.contractValue.toLocaleString()}
    </div>
  </div>
);

// Kanban column component
const KanbanColumn: React.FC<{ title: string; color: string; clients: Client[] }> = ({ title, color, clients }) => (
  <div style={{ flex: 1, minWidth: '250px' }}>
    <div
      style={{
        backgroundColor: color,
        color: '#FFFFFF',
        padding: '12px',
        borderRadius: '8px 8px 0 0',
        fontFamily: 'Plus Jakarta Sans',
        fontSize: '13px',
        fontWeight: 600,
        textAlign: 'center',
      }}
    >
      {title} ({clients.length})
    </div>
    <div style={{ backgroundColor: '#F7F4EE', padding: '12px', minHeight: '300px' }}>
      {clients.map((client) => (
        <ClientKanbanCard key={client.id} client={client} />
      ))}
    </div>
  </div>
);

// New Client Form Modal component
const NewClientFormModal: React.FC<{ onClose: () => void; onSubmit: (data: Partial<Client>) => void }> = ({
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    industry: 'Tech',
    companySize: '50-200',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>
          Nouveau client
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Nom de l'entreprise
            </label>
            <input
              type="text"
              name="companyName"
              placeholder="Ex: TechCorp Solutions"
              value={formData.companyName || ''}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Secteur d'activité
            </label>
            <select
              name="industry"
              value={formData.industry || ''}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            >
              <option value="Tech">Tech</option>
              <option value="Finance">Finance</option>
              <option value="Santé">Santé</option>
              <option value="Éducation">Éducation</option>
              <option value="Commerce">Commerce</option>
              <option value="Industrie">Industrie</option>
              <option value="Services">Services</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Taille de l'entreprise
            </label>
            <select
              name="companySize"
              value={formData.companySize || ''}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            >
              <option value="50-200">50-200</option>
              <option value="200-500">200-500</option>
              <option value="500-1000">500-1000</option>
              <option value="1000+">1000+</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Nom du contact
            </label>
            <input
              type="text"
              name="contactName"
              placeholder="Ex: Marie Dupont"
              value={formData.contactName || ''}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Fonction
            </label>
            <input
              type="text"
              name="contactRole"
              placeholder="Ex: RH Director"
              value={formData.contactRole || ''}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              name="contactEmail"
              placeholder="Ex: marie@techcorp.com"
              value={formData.contactEmail || ''}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Téléphone
            </label>
            <input
              type="tel"
              name="contactPhone"
              placeholder="Ex: +33 1 23 45 67 89"
              value={formData.contactPhone || ''}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#F7F4EE',
                color: '#1A1A1A',
                border: 'none',
                borderRadius: '9999px',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading ? '#D1D5DB' : '#72C15F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                fontFamily: 'Plus Jakarta Sans',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Créer client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Pipeline Tab component
const PipelineTab: React.FC<{ clients: Client[]; onAddClient: () => void; stats: Stats }> = ({ clients, onAddClient, stats }) => {
  const prospectClients = clients.filter((c) => c.status === 'prospect');
  const propositionClients = clients.filter((c) => c.status === 'proposition');
  const negotiationClients = clients.filter((c) => c.status === 'negotiation');
  const activeClients = clients.filter((c) => c.status === 'active');
  const completedClients = clients.filter((c) => c.status === 'completed');

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <StatsCard icon={<Building2 size={20} />} label="Clients actifs" value={stats.activeClients} />
        <StatsCard icon={<Euro size={20} />} label="Revenus B2B" value={`€${stats.b2bRevenue.toLocaleString()}`} />
        <StatsCard icon={<CalendarDays size={20} />} label="Sessions ce mois" value={stats.sessionsMonthlly} />
        <StatsCard icon={<Star size={20} />} label="Satisfaction moy." value={`${stats.averageSatisfaction}%`} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={onAddClient}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#72C15F',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '9999px',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5DB847')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#72C15F')}
        >
          <Plus size={18} />
          Nouveau client
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
        <KanbanColumn title="Prospect" color="#A0AEC0" clients={prospectClients} />
        <KanbanColumn title="Proposition envoyée" color="#7C3AED" clients={propositionClients} />
        <KanbanColumn title="Négociation" color="#F59E0B" clients={negotiationClients} />
        <KanbanColumn title="Actif" color="#72C15F" clients={activeClients} />
        <KanbanColumn title="Terminé" color="#10B981" clients={completedClients} />
      </div>
    </div>
  );
};

// Propositions Tab component
const PropositionsTab: React.FC<{ clients: Client[] }> = ({ clients }) => {
  const [formData, setFormData] = useState({
    clientSelection: '',
    companyDetails: '',
    specificNeeds: '',
    budgetRange: '20000-50000',
    format: 'complet' as const,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!showPreview ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
          <div>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
              Générer une proposition
            </h3>

            <form onSubmit={handleGenerateProposal}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Sélectionner un client
                </label>
                <select
                  name="clientSelection"
                  value={formData.clientSelection}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Sélectionner --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Ou détails de l'entreprise
                </label>
                <input
                  type="text"
                  name="companyDetails"
                  placeholder="Ex: Nova Consulting"
                  value={formData.companyDetails}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Besoins spécifiques
                </label>
                <textarea
                  name="specificNeeds"
                  placeholder="Décrivez les besoins du client..."
                  value={formData.specificNeeds}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '13px',
                    minHeight: '100px',
                    boxSizing: 'border-box',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Budget
                </label>
                <select
                  name="budgetRange"
                  value={formData.budgetRange}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="10000-20000">€10k - €20k</option>
                  <option value="20000-50000">€20k - €50k</option>
                  <option value="50000-100000">€50k - €100k</option>
                  <option value="100000+">€100k+</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Format de la proposition
                </label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="ateliers">Ateliers</option>
                  <option value="seances">Séances individuelles</option>
                  <option value="complet">Programme complet</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: loading ? '#D1D5DB' : '#72C15F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Générer la proposition'}
              </button>
            </form>
          </div>

          <div>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
              Propositions passées
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                  TechCorp Solutions
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  24 février 2024
                </div>
                <div style={{ marginTop: '12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    Acceptée
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                  FinanceGroup
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  10 février 2024
                </div>
                <div style={{ marginTop: '12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: '#F59E0B',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    En attente
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                  SantéPlus Hospital
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  5 janvier 2024
                </div>
                <div style={{ marginTop: '12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    Acceptée
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setShowPreview(false)}
            style={{
              marginBottom: '24px',
              padding: '8px 16px',
              backgroundColor: '#F7F4EE',
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '9999px',
              fontFamily: 'Plus Jakarta Sans',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retour à la génération
          </button>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>
              Proposition - TechCorp Solutions
            </h2>

            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Résumé exécutif
              </h3>
              <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>
                TechCorp Solutions cherche à améliorer le bien-être des salariés et réduire le stress professionnel. Nous proposons un
                programme complet de 6 mois incluant ateliers, séances individuelles et coaching d'équipe.
              </p>
            </div>

            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                Services inclus
              </h3>
              <ul style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', color: '#6B7280', lineHeight: 1.8 }}>
                <li>Ateliers de gestion du stress (12 sessions)</li>
                <li>Séances individuelles de coaching</li>
                <li>Programmes de méditation guidée</li>
                <li>Évaluations et rapports mensuels</li>
                <li>Support continu et suivi</li>
              </ul>
            </div>

            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Calendrier
              </h3>
              <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>
                Démarrage: Mai 2024 | Durée: 6 mois | Conclusion: Novembre 2024
              </p>
            </div>

            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
                Packages de tarification
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    Essentiel
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '20px', fontWeight: 600, color: '#72C15F', marginBottom: '16px' }}>
                    €15,000
                  </div>
                  <ul style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '11px', color: '#6B7280', textAlign: 'left', lineHeight: 1.8 }}>
                    <li>4 ateliers</li>
                    <li>Rapport mensuel</li>
                    <li>Support email</li>
                  </ul>
                </div>

                <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '20px', textAlign: 'center', borderLeft: '3px solid #72C15F' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    Premium
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '20px', fontWeight: 600, color: '#72C15F', marginBottom: '16px' }}>
                    €35,000
                  </div>
                  <ul style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '11px', color: '#6B7280', textAlign: 'left', lineHeight: 1.8 }}>
                    <li>12 ateliers</li>
                    <li>Séances individuelles</li>
                    <li>Rapports mensuels</li>
                    <li>Support prioritaire</li>
                  </ul>
                </div>

                <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    Sur-mesure
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '20px', fontWeight: 600, color: '#72C15F', marginBottom: '16px' }}>
                    €50,000+
                  </div>
                  <ul style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '11px', color: '#6B7280', textAlign: 'left', lineHeight: 1.8 }}>
                    <li>Programme complet</li>
                    <li>Coaching d'équipe</li>
                    <li>Suivi mensuel</li>
                    <li>Support 24/7</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
                Prévisions ROI
              </h3>
              <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '28px', fontWeight: 600, color: '#72C15F', marginBottom: '8px' }}>
                  €120,000
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', color: '#6B7280' }}>
                  Économies estimées (réduction absentéisme, productivité)
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                Indicateurs clés
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '11px', color: '#6B7280' }}>
                    Satisfaction moyenne
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, color: '#72C15F' }}>
                    +45%
                  </div>
                </div>
                <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '11px', color: '#6B7280' }}>
                    Réduction stress
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, color: '#72C15F' }}>
                    +38%
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F7F4EE',
                  color: '#1A1A1A',
                  border: 'none',
                  borderRadius: '9999px',
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Télécharger PDF
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#72C15F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Send size={16} />
                Envoyer au client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sessions Tab component
const SessionsTab: React.FC<{ clients: Client[] }> = ({ clients }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    type: SESSION_TYPES[0],
    date: '',
    time: '09:00',
    location: '',
    isRemote: false,
    maxParticipants: 20,
    rate: 0,
  });
  const [showForm, setShowForm] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      clientId: '1',
      clientName: 'TechCorp Solutions',
      title: 'Gestion du stress - Module 1',
      type: 'Gestion du stress',
      date: '2024-04-10',
      time: '14:00',
      location: 'Salle de conférence A',
      isRemote: false,
      maxParticipants: 25,
      rate: 500,
      participants: 22,
      satisfactionScore: 88,
    },
    {
      id: '2',
      clientId: '3',
      clientName: 'SantéPlus Hospital',
      title: 'Méditation guidée hebdo',
      type: 'Méditation guidée',
      date: '2024-04-15',
      time: '11:00',
      location: 'En ligne',
      isRemote: true,
      maxParticipants: 50,
      rate: 300,
      participants: 38,
      satisfactionScore: 92,
    },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? parseInt(value) : value,
    }));
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: Session = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: formData.clientId,
      clientName: clients.find((c) => c.id === formData.clientId)?.companyName || 'Unknown',
      title: formData.title,
      type: formData.type,
      date: formData.date,
      time: formData.time,
      location: formData.isRemote ? 'En ligne' : formData.location,
      isRemote: formData.isRemote,
      maxParticipants: formData.maxParticipants,
      rate: formData.rate,
      participants: 0,
      satisfactionScore: 0,
    };
    setSessions([...sessions, newSession]);
    setShowForm(false);
    setFormData({
      clientId: '',
      title: '',
      type: SESSION_TYPES[0],
      date: '',
      time: '09:00',
      location: '',
      isRemote: false,
      maxParticipants: 20,
      rate: 0,
    });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
            Sessions à venir
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.map((session) => (
              <div key={session.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                      {session.title}
                    </div>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                      {session.clientName}
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      backgroundColor: '#E0F2FE',
                      color: '#0369A1',
                      borderRadius: '6px',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                  >
                    {session.type}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280' }}>
                    <Clock size={14} />
                    {session.date} à {session.time}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280' }}>
                    {session.isRemote ? <Video size={14} /> : <MapPin size={14} />}
                    {session.location}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280' }}>
                    <Users size={14} />
                    {session.participants}/{session.maxParticipants}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#72C15F', fontWeight: 600 }}>
                    <Star size={14} />
                    {session.satisfactionScore}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
            {showForm ? 'Créer une session' : 'Templates d\'ateliers'}
          </h3>

          {!showForm ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {WORKSHOP_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    style={{
                      backgroundColor: '#F7F4EE',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E8E5DD')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F7F4EE')}
                  >
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>
                      {template.name}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowForm(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#72C15F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Plus size={16} />
                Créer une session
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitSession} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Client
                </label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Sélectionner --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Titre
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                >
                  {SESSION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Heure
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" name="isRemote" checked={formData.isRemote} onChange={handleChange} />
                  Session en ligne
                </label>
              </div>

              {!formData.isRemote && (
                <div>
                  <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Lieu
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Participants max
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  min={1}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Tarif (€)
                </label>
                <input
                  type="number"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  min={0}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#F7F4EE',
                    color: '#1A1A1A',
                    border: 'none',
                    borderRadius: '9999px',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#72C15F',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Créer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Rapports Tab component
const RapportsTab: React.FC<{ clients: Client[] }> = ({ clients }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    dateFrom: '',
    dateTo: '',
    reportType: 'mensuel' as const,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!showPreview ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          <div>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
              Générer un rapport
            </h3>

            <form onSubmit={handleGenerateReport}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Client
                </label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Sélectionner --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Type de rapport
                </label>
                <select
                  name="reportType"
                  value={formData.reportType}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="mensuel">Mensuel</option>
                  <option value="trimestriel">Trimestriel</option>
                  <option value="annuel">Annuel</option>
                  <option value="post-programme">Post-programme</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Date de début
                </label>
                <input
                  type="date"
                  name="dateFrom"
                  value={formData.dateFrom}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Date de fin
                </label>
                <input
                  type="date"
                  name="dateTo"
                  value={formData.dateTo}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: loading ? '#D1D5DB' : '#72C15F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Générer le rapport'}
              </button>
            </form>
          </div>

          <div>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
              Rapports récents
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                  TechCorp Solutions - Mars 2024
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  Rapport mensuel
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#FFFFFF',
                      color: '#72C15F',
                      border: '1px solid #72C15F',
                      borderRadius: '6px',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Afficher
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#72C15F',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    PDF
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                  SantéPlus Hospital - Q1 2024
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  Rapport trimestriel
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#FFFFFF',
                      color: '#72C15F',
                      border: '1px solid #72C15F',
                      borderRadius: '6px',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Afficher
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#72C15F',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setShowPreview(false)}
            style={{
              marginBottom: '24px',
              padding: '8px 16px',
              backgroundColor: '#F7F4EE',
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '9999px',
              fontFamily: 'Plus Jakarta Sans',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retour à la génération
          </button>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
              Rapport mensuel - Mars 2024
            </h2>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', color: '#6B7280', marginBottom: '32px' }}>
              TechCorp Solutions
            </div>

            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Résumé exécutif
              </h3>
              <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>
                Mars 2024 a marqué une progression significative dans la mise en œuvre du programme de bien-être. L'engagement des salariés s'est
                renforcé avec une participation accrue aux sessions et une satisfaction très positive. Les indicateurs de stress et d'équilibre
                vie-travail montrent des améliorations mesurables.
              </p>
            </div>

            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
                Métriques principales
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '28px', fontWeight: 600, color: '#72C15F' }}>
                    8
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                    Sessions
                  </div>
                </div>
                <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '28px', fontWeight: 600, color: '#72C15F' }}>
                    156
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                    Participants
                  </div>
                </div>
                <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '28px', fontWeight: 600, color: '#72C15F' }}>
                    91%
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                    Satisfaction
                  </div>
                </div>
                <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '28px', fontWeight: 600, color: '#72C15F' }}>
                    +28%
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                    Well-being
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
                Retour sur investissement
              </h3>
              <div style={{ backgroundColor: '#F7F4EE', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '32px', fontWeight: 600, color: '#72C15F', marginBottom: '8px' }}>
                  €28,500
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', color: '#6B7280' }}>
                  Économies estimées (réduction absentéisme, productivité)
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
                Évaluation par dimension
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { name: 'Gestion du stress', before: 45, after: 72 },
                  { name: 'Équilibre vie-travail', before: 52, after: 78 },
                  { name: 'Satisfaction au travail', before: 58, after: 84 },
                  { name: 'Confiance d\'équipe', before: 62, after: 89 },
                  { name: 'Qualité du sommeil', before: 48, after: 71 },
                  { name: 'Résilience', before: 55, after: 80 },
                ].map((dimension) => (
                  <div key={dimension.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                        {dimension.name}
                      </span>
                      <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280' }}>
                        {dimension.before}% → {dimension.after}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', height: '8px' }}>
                      <div style={{ flex: dimension.before, backgroundColor: '#D1D5DB', borderRadius: '4px' }} />
                      <div style={{ flex: dimension.after, backgroundColor: '#72C15F', borderRadius: '4px' }} />
                      <div style={{ flex: 100 - dimension.after, backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                Recommandations
              </h3>
              <ul style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', color: '#6B7280', lineHeight: 1.8 }}>
                <li>Poursuivre les ateliers de gestion du stress avec une fréquence accrue</li>
                <li>Intégrer des sessions de méditation guidée en débuts de journée</li>
                <li>Renforcer le coaching d'équipe dans les départements avec plus de charge</li>
                <li>Implémenter un programme mensuel de suivi et d'ajustement</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F7F4EE',
                  color: '#1A1A1A',
                  border: 'none',
                  borderRadius: '9999px',
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Télécharger PDF
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#72C15F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Send size={16} />
                Envoyer au client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main CorporateDashboard component
export default function CorporateDashboard() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'propositions' | 'sessions' | 'rapports'>('pipeline');
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);

  const stats: Stats = {
    activeClients: clients.filter((c) => c.status === 'active').length,
    b2bRevenue: clients.reduce((sum, c) => sum + (c.status === 'active' ? c.contractValue : 0), 0),
    sessionsMonthlly: 12,
    averageSatisfaction: 89,
  };

  const handleAddClient = (data: Partial<Client>) => {
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      status: 'prospect',
      contractValue: 0,
      createdAt: new Date().toISOString().split('T')[0],
    } as Client;

    setClients([...clients, newClient]);
    const toastId = Math.random().toString(36).substr(2, 9);
    setToasts([...toasts, { id: toastId, message: `${newClient.companyName} ajouté avec succès`, type: 'success' }]);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F4EE', padding: '32px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Building2 size={28} color="#72C15F" />
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '28px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            Tableau de bord Entreprise
          </h1>
        </div>
        <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', color: '#6B7280', margin: '0' }}>
          Gérez vos clients B2B, propositions, sessions et rapports
        </p>
      </div>

      {/* Tab navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {[
          { id: 'pipeline' as const, label: 'Pipeline', icon: TrendingUp },
          { id: 'propositions' as const, label: 'Propositions', icon: FileText },
          { id: 'sessions' as const, label: 'Sessions', icon: CalendarDays },
          { id: 'rapports' as const, label: 'Rapports', icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: activeTab === id ? '#72C15F' : 'transparent',
              color: activeTab === id ? '#FFFFFF' : '#6B7280',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'Plus Jakarta Sans',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== id) {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {activeTab === 'pipeline' && (
          <PipelineTab clients={clients} onAddClient={() => setShowNewClientForm(true)} stats={stats} />
        )}
        {activeTab === 'propositions' && <PropositionsTab clients={clients} />}
        {activeTab === 'sessions' && <SessionsTab clients={clients} />}
        {activeTab === 'rapports' && <RapportsTab clients={clients} />}
      </div>

      {/* New Client Form Modal */}
      {showNewClientForm && (
        <NewClientFormModal
          onClose={() => setShowNewClientForm(false)}
          onSubmit={(data) => {
            handleAddClient(data);
            setShowNewClientForm(false);
          }}
        />
      )}

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToasts(toasts.filter((t) => t.id !== toast.id))}
        />
      ))}
    </div>
  );
}
