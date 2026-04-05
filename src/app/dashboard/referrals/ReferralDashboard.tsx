'use client';

import React, { useState, useEffect } from 'react';
import {
  Link,
  MousePointer,
  UserPlus,
  Euro,
  Copy,
  QrCode,
  MessageSquare,
  Mail,
  Phone,
  Send,
  Loader2,
  Check,
  X,
  Plus,
  BarChart3,
  Gift,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

// Types
interface ReferralLink {
  id: string;
  referrerName: string;
  url: string;
  type: 'consultation' | 'product' | 'both';
  productId?: string;
  productName?: string;
  rewardType: 'none' | 'discount' | 'free_session' | 'free_product' | 'credit';
  rewardValue?: number;
  rewardUnit?: '%' | '€';
  clicks: number;
  conversions: number;
  revenue: number;
  status: 'active' | 'expired';
  createdAt: string;
  patientEmail?: string;
  patientPhone?: string;
}

interface Campaign {
  id: string;
  name: string;
  trigger: 'after_session' | 'after_purchase' | 'milestone' | 'manual';
  delayHours: number;
  channel: 'whatsapp' | 'email' | 'sms';
  message: string;
  rewardType: 'none' | 'discount' | 'free_session' | 'free_product' | 'credit';
  rewardValue?: number;
  rewardUnit?: '%' | '€';
  active: boolean;
  createdAt: string;
}

interface Stats {
  totalLinks: number;
  totalClicks: number;
  conversions: number;
  revenue: number;
  previousClicks?: number;
  previousConversions?: number;
  previousRevenue?: number;
}

interface PendingReward {
  id: string;
  patientName: string;
  rewardType: string;
  value: number;
  unit: string;
  status: 'pending' | 'sent';
}

interface ConversionFunnelStep {
  label: string;
  count: number;
  percentage: number;
}

const ReferralDashboard = () => {
  // State
  const [activeTab, setActiveTab] = useState<'links' | 'campaigns' | 'stats'>('links');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalLinks: 0,
    totalClicks: 0,
    conversions: 0,
    revenue: 0,
  });
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7j' | '30j' | '90j' | 'all'>('30j');
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnelStep[]>([
    { label: 'Clics', count: 0, percentage: 100 },
    { label: 'Page consultation', count: 0, percentage: 0 },
    { label: 'Formulaire rempli', count: 0, percentage: 0 },
    { label: 'Rendez-vous confirmé', count: 0, percentage: 0 },
  ]);
  const [channelBreakdown, setChannelBreakdown] = useState<
    Array<{ channel: string; clicks: number; color: string }>
  >([
    { channel: 'WhatsApp', clicks: 0, color: '#25D366' },
    { channel: 'Email', clicks: 0, color: '#4A90E2' },
    { channel: 'SMS', clicks: 0, color: '#FFA500' },
    { channel: 'Copier le lien', clicks: 0, color: '#6B7280' },
  ]);

  // Form states
  const [newLinkForm, setNewLinkForm] = useState({
    patientName: '',
    email: '',
    phone: '',
    type: 'consultation' as 'consultation' | 'product' | 'both',
    productId: '',
    rewardType: 'none' as 'none' | 'discount' | 'free_session' | 'free_product' | 'credit',
    rewardValue: '',
    rewardUnit: '€' as '%' | '€',
  });

  const [newCampaignForm, setNewCampaignForm] = useState({
    name: '',
    trigger: 'after_session' as 'after_session' | 'after_purchase' | 'milestone' | 'manual',
    delayHours: 1,
    channel: 'email' as 'whatsapp' | 'email' | 'sms',
    message: '',
    rewardType: 'none' as 'none' | 'discount' | 'free_session' | 'free_product' | 'credit',
    rewardValue: '',
    rewardUnit: '€' as '%' | '€',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Refetch stats when period changes
  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats(selectedPeriod);
    }
  }, [selectedPeriod, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - replace with real endpoints
      const [statsRes, linksRes, campaignsRes] = await Promise.all([
        fetch('/api/referral/stats').catch(() => null),
        fetch('/api/referral/links').catch(() => null),
        fetch('/api/referral/campaigns').catch(() => null),
      ]);

      // Mock data for development
      setStats({
        totalLinks: 12,
        totalClicks: 847,
        conversions: 34,
        revenue: 2480,
        previousClicks: 702,
        previousConversions: 28,
        previousRevenue: 1980,
      });

      setLinks([
        {
          id: '1',
          referrerName: 'Marie Dupont',
          url: 'https://theralgo.fr/ref/marie-2024',
          type: 'both',
          productName: 'Atelier de méditation',
          rewardType: 'discount',
          rewardValue: 15,
          rewardUnit: '%',
          clicks: 156,
          conversions: 8,
          revenue: 320,
          status: 'active',
          createdAt: '2024-02-15',
          patientEmail: 'marie@example.com',
          patientPhone: '+33612345678',
        },
        {
          id: '2',
          referrerName: 'Jean Martin',
          url: 'https://theralgo.fr/ref/jean-2024',
          type: 'consultation',
          rewardType: 'free_session',
          clicks: 89,
          conversions: 5,
          revenue: 250,
          status: 'active',
          createdAt: '2024-03-01',
        },
        {
          id: '3',
          referrerName: 'Sophie Bernard',
          url: 'https://theralgo.fr/ref/sophie-2024',
          type: 'product',
          productName: 'Guide de développement personnel',
          rewardType: 'credit',
          rewardValue: 50,
          rewardUnit: '€',
          clicks: 45,
          conversions: 2,
          revenue: 100,
          status: 'expired',
          createdAt: '2024-01-10',
        },
      ]);

      setCampaigns([
        {
          id: '1',
          name: 'Campagne post-séance',
          trigger: 'after_session',
          delayHours: 24,
          channel: 'email',
          message: 'Bonjour {nom_patient}, merci pour votre confiance lors de votre séance avec {nom_therapeute}. Partager cette expérience ? {lien}',
          rewardType: 'discount',
          rewardValue: 10,
          rewardUnit: '%',
          active: true,
          createdAt: '2024-02-10',
        },
        {
          id: '2',
          name: 'Campagne produit',
          trigger: 'after_purchase',
          delayHours: 48,
          channel: 'whatsapp',
          message: 'Vous aimez ? Partagez à vos amis : {lien}',
          rewardType: 'credit',
          rewardValue: 25,
          rewardUnit: '€',
          active: true,
          createdAt: '2024-02-20',
        },
      ]);

      setPendingRewards([
        {
          id: '1',
          patientName: 'Alice Desai',
          rewardType: 'Réduction 15%',
          value: 15,
          unit: '%',
          status: 'pending',
        },
        {
          id: '2',
          patientName: 'Marc Leclerc',
          rewardType: 'Crédit',
          value: 50,
          unit: '€',
          status: 'pending',
        },
      ]);

      setConversionFunnel([
        { label: 'Clics', count: 847, percentage: 100 },
        { label: 'Page consultation', count: 623, percentage: 73.5 },
        { label: 'Formulaire rempli', count: 178, percentage: 21 },
        { label: 'Rendez-vous confirmé', count: 34, percentage: 4 },
      ]);

      setChannelBreakdown([
        { channel: 'WhatsApp', clicks: 312, color: '#25D366' },
        { channel: 'Email', clicks: 289, color: '#4A90E2' },
        { channel: 'SMS', clicks: 156, color: '#FFA500' },
        { channel: 'Copier le lien', clicks: 90, color: '#6B7280' },
      ]);
    } catch (error) {
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (period: string) => {
    // Simulate fetching period-specific stats
    const multipliers = {
      '7j': 0.25,
      '30j': 1,
      '90j': 2.8,
      all: 5.2,
    };
    const mult = multipliers[period as keyof typeof multipliers] || 1;
    setStats({
      totalLinks: 12,
      totalClicks: Math.floor(847 * mult),
      conversions: Math.floor(34 * mult),
      revenue: Math.floor(2480 * mult),
      previousClicks: Math.floor(702 * mult),
      previousConversions: Math.floor(28 * mult),
      previousRevenue: Math.floor(1980 * mult),
    });
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkForm.patientName) {
      showToast('Veuillez remplir le nom du patient', 'error');
      return;
    }
    try {
      // API call would go here
      showToast('Lien créé avec succès !');
      setNewLinkForm({
        patientName: '',
        email: '',
        phone: '',
        type: 'consultation',
        productId: '',
        rewardType: 'none',
        rewardValue: '',
        rewardUnit: '€',
      });
      fetchData();
    } catch (error) {
      showToast('Erreur lors de la création du lien', 'error');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignForm.name || !newCampaignForm.message) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    try {
      // API call would go here
      showToast('Campagne créée avec succès !');
      setNewCampaignForm({
        name: '',
        trigger: 'after_session',
        delayHours: 1,
        channel: 'email',
        message: '',
        rewardType: 'none',
        rewardValue: '',
        rewardUnit: '€',
      });
      fetchData();
    } catch (error) {
      showToast('Erreur lors de la création de la campagne', 'error');
    }
  };

  const handleDeactivateLink = async (linkId: string) => {
    try {
      // API call would go here
      setLinks(links.filter(l => l.id !== linkId));
      showToast('Lien désactivé');
    } catch (error) {
      showToast('Erreur lors de la désactivation', 'error');
    }
  };

  const handleToggleCampaign = async (campaignId: string) => {
    try {
      setCampaigns(
        campaigns.map(c =>
          c.id === campaignId ? { ...c, active: !c.active } : c
        )
      );
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('Copié !');
  };

  const handleShareWhatsApp = (url: string, name: string) => {
    const message = `Bonjour ! J'aimerais te recommander mon thérapeute ${name}. Cliquez ici : ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = (url: string, name: string) => {
    const subject = `Recommandation de thérapeute - ${name}`;
    const body = `Bonjour,\n\nJ'aimerais te recommander un excellent thérapeute. Cliquez ici pour en savoir plus :\n${url}\n\nCordialement`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSendReward = async (rewardId: string) => {
    try {
      setPendingRewards(pendingRewards.filter(r => r.id !== rewardId));
      showToast('Récompense envoyée !');
    } catch (error) {
      showToast('Erreur lors de l\'envoi', 'error');
    }
  };

  const useCampaignTemplate = (templateTrigger: string) => {
    const templates = {
      'post-session': {
        name: 'Campagne post-séance',
        trigger: 'after_session' as const,
        delayHours: 24,
        message: 'Bonjour {nom_patient}, merci d\'avoir participé à votre séance avec {nom_therapeute}. Si vous avez apprécié cette expérience, n\'hésitez pas à la recommander ! {lien}',
      },
      'post-purchase': {
        name: 'Campagne post-achat',
        trigger: 'after_purchase' as const,
        delayHours: 48,
        message: 'Merci {nom_patient} pour votre achat ! Si vous l\'avez apprécié, partagez-le avec vos proches : {lien}',
      },
      'satisfied': {
        name: 'Campagne patient satisfait',
        trigger: 'manual' as const,
        delayHours: 0,
        message: 'Bonjour {nom_patient}, vos résultats vous satisfont ? Aidez d\'autres personnes en partageant votre expérience : {lien}',
      },
    };

    const template = templates[templateTrigger as keyof typeof templates];
    if (template) {
      setNewCampaignForm(prev => ({
        ...prev,
        name: template.name,
        trigger: template.trigger,
        delayHours: template.delayHours,
        message: template.message,
      }));
      setActiveTab('campaigns');
    }
  };

  // Helper functions for calculating trends
  const getClicksTrend = () => {
    if (!stats.previousClicks) return null;
    const change = ((stats.totalClicks - stats.previousClicks) / stats.previousClicks) * 100;
    return change;
  };

  const getConversionsTrend = () => {
    if (!stats.previousConversions) return null;
    const change = ((stats.conversions - stats.previousConversions) / stats.previousConversions) * 100;
    return change;
  };

  const getRevenueTrend = () => {
    if (!stats.previousRevenue) return null;
    const change = ((stats.revenue - stats.previousRevenue) / stats.previousRevenue) * 100;
    return change;
  };

  const maxChannelClicks = Math.max(...channelBreakdown.map(c => c.clicks), 1);

  if (loading && activeTab === 'links') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Loader2 style={{ animation: 'spin 1s linear infinite', width: 32, height: 32, color: '#72C15F' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F4EE', padding: '32px 24px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A', margin: 0, marginBottom: '8px' }}>
          Tableau de bord référrals
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
          Gérez vos liens de recommandation et vos campagnes
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid #E5E7EB' }}>
        {['links', 'campaigns', 'stats'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'links' | 'campaigns' | 'stats')}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: activeTab === tab ? '#72C15F' : '#6B7280',
              borderBottom: activeTab === tab ? '2px solid #72C15F' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {tab === 'links' && 'Mes Liens'}
            {tab === 'campaigns' && 'Campagnes'}
            {tab === 'stats' && 'Statistiques'}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: toast.type === 'success' ? '#72C15F' : '#EF4444',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            zIndex: 50,
            animation: 'slideUp 0.3s ease',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* TAB 1: MES LIENS */}
      {activeTab === 'links' && (
        <div>
          {/* Stats Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Liens créés', value: stats.totalLinks, icon: Link },
              { label: 'Clics totaux', value: stats.totalClicks, icon: MousePointer },
              { label: 'Conversions', value: stats.conversions, icon: UserPlus },
              { label: 'Revenus', value: `${stats.revenue}€`, icon: Euro },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '20px',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, marginBottom: '8px' }}>
                        {stat.label}
                      </p>
                      <p style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                        {stat.value}
                      </p>
                    </div>
                    <Icon style={{ width: 24, height: 24, color: '#72C15F' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create New Link Form */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '32px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: 0, marginBottom: '20px' }}>
              Créer un nouveau lien
            </h2>
            <form onSubmit={handleCreateLink}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Nom du patient"
                  value={newLinkForm.patientName}
                  onChange={e => setNewLinkForm({ ...newLinkForm, patientName: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                />
                <input
                  type="email"
                  placeholder="Email (optionnel)"
                  value={newLinkForm.email}
                  onChange={e => setNewLinkForm({ ...newLinkForm, email: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                />
                <input
                  type="tel"
                  placeholder="Téléphone (optionnel)"
                  value={newLinkForm.phone}
                  onChange={e => setNewLinkForm({ ...newLinkForm, phone: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <select
                  value={newLinkForm.type}
                  onChange={e => setNewLinkForm({ ...newLinkForm, type: e.target.value as 'consultation' | 'product' | 'both' })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  <option value="consultation">Consultation</option>
                  <option value="product">Produit digital</option>
                  <option value="both">Les deux</option>
                </select>

                {(newLinkForm.type === 'product' || newLinkForm.type === 'both') && (
                  <select
                    value={newLinkForm.productId}
                    onChange={e => setNewLinkForm({ ...newLinkForm, productId: e.target.value })}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    <option value="">Sélectionner un produit</option>
                    <option value="meditation">Atelier de méditation</option>
                    <option value="guide">Guide de développement personnel</option>
                    <option value="course">Cours en ligne</option>
                  </select>
                )}

                <select
                  value={newLinkForm.rewardType}
                  onChange={e => setNewLinkForm({ ...newLinkForm, rewardType: e.target.value as 'none' | 'discount' | 'free_session' | 'free_product' | 'credit' })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  <option value="none">Aucune récompense</option>
                  <option value="discount">Réduction</option>
                  <option value="free_session">Séance offerte</option>
                  <option value="free_product">Produit offert</option>
                  <option value="credit">Crédit</option>
                </select>
              </div>

              {newLinkForm.rewardType !== 'none' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <input
                    type="number"
                    placeholder="Valeur"
                    value={newLinkForm.rewardValue}
                    onChange={e => setNewLinkForm({ ...newLinkForm, rewardValue: e.target.value })}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  />
                  <select
                    value={newLinkForm.rewardUnit}
                    onChange={e => setNewLinkForm({ ...newLinkForm, rewardUnit: e.target.value as '%' | '€' })}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    <option value="€">€</option>
                    <option value="%">%</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                style={{
                  backgroundColor: '#72C15F',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 9999,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#5DB847')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#72C15F')}
              >
                Créer le lien
              </button>
            </form>
          </div>

          {/* Active Links List */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px 0' }}>
              Liens actifs
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {links.map(link => (
                <div
                  key={link.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '20px',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                          {link.referrerName}
                        </h3>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            backgroundColor: link.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                            color: link.status === 'active' ? '#166534' : '#991B1B',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {link.status === 'active' ? 'Actif' : 'Expiré'}
                        </span>
                        {link.type === 'consultation' && (
                          <span style={{ fontSize: '11px', backgroundColor: '#E0E7FF', color: '#3730A3', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            Consultation
                          </span>
                        )}
                        {link.type === 'product' && (
                          <span style={{ fontSize: '11px', backgroundColor: '#FEFCE8', color: '#854D0E', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            Produit
                          </span>
                        )}
                        {link.type === 'both' && (
                          <span style={{ fontSize: '11px', backgroundColor: '#F3E8FF', color: '#6B21A8', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            Les deux
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          padding: '8px 12px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                          wordBreak: 'break-all',
                        }}
                      >
                        <code>{link.url}</code>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px 0' }}>Clics</p>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{link.clicks}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px 0' }}>Conv.</p>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{link.conversions}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px 0' }}>Revenus</p>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{link.revenue}€</p>
                      </div>
                    </div>
                  </div>

                  {/* Reward Info */}
                  {link.rewardType !== 'none' && (
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px', padding: '8px 12px', backgroundColor: '#F3E8FF', borderRadius: '8px' }}>
                      {link.rewardType === 'discount' && `Réduction ${link.rewardValue}${link.rewardUnit}`}
                      {link.rewardType === 'free_session' && 'Séance offerte'}
                      {link.rewardType === 'free_product' && 'Produit offert'}
                      {link.rewardType === 'credit' && `Crédit ${link.rewardValue}${link.rewardUnit}`}
                    </div>
                  )}

                  {/* Share Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleShareWhatsApp(link.url, link.referrerName)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: '#25D366',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <MessageSquare style={{ width: 16, height: 16 }} />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleShareEmail(link.url, link.referrerName)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: '#4A90E2',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <Mail style={{ width: 16, height: 16 }} />
                      Email
                    </button>
                    <button
                      onClick={() => handleCopyLink(link.url)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: '#6B7280',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <Copy style={{ width: 16, height: 16 }} />
                      Copier
                    </button>
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: '#F3F4F6',
                        color: '#1A1A1A',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <QrCode style={{ width: 16, height: 16 }} />
                      QR Code
                    </button>
                    {link.status === 'active' && (
                      <button
                        onClick={() => handleDeactivateLink(link.id)}
                        style={{
                          marginLeft: 'auto',
                          padding: '8px 12px',
                          backgroundColor: '#FEE2E2',
                          color: '#991B1B',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        Désactiver
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAGNES */}
      {activeTab === 'campaigns' && (
        <div>
          {/* Active Campaigns */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px 0' }}>
              Campagnes actives
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {campaigns.map(campaign => (
                <div
                  key={campaign.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '16px',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: 0, marginBottom: '4px' }}>
                      {campaign.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                      Déclenché {campaign.trigger === 'after_session' ? 'après une séance' : campaign.trigger === 'after_purchase' ? 'après un achat' : campaign.trigger === 'milestone' ? 'à une étape importante' : 'manuellement'} via {campaign.channel}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleCampaign(campaign.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {campaign.active ? (
                      <ToggleRight style={{ width: 32, height: 32, color: '#72C15F' }} />
                    ) : (
                      <ToggleLeft style={{ width: 32, height: 32, color: '#D1D5DB' }} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Create Campaign Form */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '32px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: 0, marginBottom: '20px' }}>
              Créer une nouvelle campagne
            </h2>
            <form onSubmit={handleCreateCampaign}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Nom de la campagne"
                  value={newCampaignForm.name}
                  onChange={e => setNewCampaignForm({ ...newCampaignForm, name: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                />
                <select
                  value={newCampaignForm.trigger}
                  onChange={e => setNewCampaignForm({ ...newCampaignForm, trigger: e.target.value as 'after_session' | 'after_purchase' | 'milestone' | 'manual' })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  <option value="after_session">Après une séance</option>
                  <option value="after_purchase">Après un achat</option>
                  <option value="milestone">Étape importante</option>
                  <option value="manual">Manuel</option>
                </select>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>Envoyer après</label>
                  <input
                    type="number"
                    min="0"
                    value={newCampaignForm.delayHours}
                    onChange={e => setNewCampaignForm({ ...newCampaignForm, delayHours: parseInt(e.target.value) || 0 })}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      width: '80px',
                    }}
                  />
                  <label style={{ fontSize: '12px', color: '#6B7280' }}>heures</label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <select
                  value={newCampaignForm.channel}
                  onChange={e => setNewCampaignForm({ ...newCampaignForm, channel: e.target.value as 'whatsapp' | 'email' | 'sms' })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                </select>
                <select
                  value={newCampaignForm.rewardType}
                  onChange={e => setNewCampaignForm({ ...newCampaignForm, rewardType: e.target.value as 'none' | 'discount' | 'free_session' | 'free_product' | 'credit' })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  <option value="none">Aucune récompense</option>
                  <option value="discount">Réduction</option>
                  <option value="free_session">Séance offerte</option>
                  <option value="free_product">Produit offert</option>
                  <option value="credit">Crédit</option>
                </select>
              </div>

              {newCampaignForm.rewardType !== 'none' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <input
                    type="number"
                    placeholder="Valeur"
                    value={newCampaignForm.rewardValue}
                    onChange={e => setNewCampaignForm({ ...newCampaignForm, rewardValue: e.target.value })}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  />
                  <select
                    value={newCampaignForm.rewardUnit}
                    onChange={e => setNewCampaignForm({ ...newCampaignForm, rewardUnit: e.target.value as '%' | '€' })}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    <option value="€">€</option>
                    <option value="%">%</option>
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                  Message (personnalisez avec {'{nom_patient}'}, {'{nom_therapeute}'}, {'{lien}'})
                </label>
                <textarea
                  placeholder="Écrivez votre message..."
                  value={newCampaignForm.message}
                  onChange={e => setNewCampaignForm({ ...newCampaignForm, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    minHeight: '120px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#72C15F',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 9999,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#5DB847')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#72C15F')}
              >
                Créer la campagne
              </button>
            </form>
          </div>

          {/* Default Templates */}
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px 0' }}>
              Modèles par défaut
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {[
                {
                  id: 'post-session',
                  title: 'Post-séance',
                  description: 'Déclenché après la 3e séance',
                  trigger: 'post-session',
                },
                {
                  id: 'post-purchase',
                  title: 'Post-achat',
                  description: 'Déclenché après un achat produit',
                  trigger: 'post-purchase',
                },
                {
                  id: 'satisfied',
                  title: 'Patient satisfait',
                  description: 'Déclenchement manuel pour les patients heureux',
                  trigger: 'satisfied',
                },
              ].map(template => (
                <div
                  key={template.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '20px',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px 0' }}>
                    {template.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 16px 0' }}>
                    {template.description}
                  </p>
                  <button
                    onClick={() => useCampaignTemplate(template.trigger)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: '#F3F4F6',
                      color: '#1A1A1A',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#72C15F';
                      e.currentTarget.style.color = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#72C15F';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                      e.currentTarget.style.color = '#1A1A1A';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    Utiliser ce modèle
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STATISTIQUES */}
      {activeTab === 'stats' && (
        <div>
          {/* Period Selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {['7j', '30j', '90j', 'all'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as '7j' | '30j' | '90j' | 'all')}
                style={{
                  padding: '8px 16px',
                  border: selectedPeriod === period ? '2px solid #72C15F' : '1px solid #E5E7EB',
                  backgroundColor: selectedPeriod === period ? '#F0FAE8' : '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: selectedPeriod === period ? '#72C15F' : '#6B7280',
                  transition: 'all 0.2s ease',
                }}
              >
                {period === '7j' ? '7 jours' : period === '30j' ? '30 jours' : period === '90j' ? '90 jours' : 'Tout'}
              </button>
            ))}
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Clics totaux', value: stats.totalClicks, trend: getClicksTrend(), icon: MousePointer },
              { label: 'Conversions', value: stats.conversions, trend: getConversionsTrend(), icon: UserPlus },
              { label: 'Revenus', value: `${stats.revenue}€`, trend: getRevenueTrend(), icon: Euro },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              const trend = stat.trend;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '20px',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                      {stat.label}
                    </p>
                    <Icon style={{ width: 20, height: 20, color: '#72C15F' }} />
                  </div>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px 0' }}>
                    {stat.value}
                  </p>
                  {trend !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {trend >= 0 ? (
                        <TrendingUp style={{ width: 16, height: 16, color: '#72C15F' }} />
                      ) : (
                        <TrendingDown style={{ width: 16, height: 16, color: '#EF4444' }} />
                      )}
                      <span style={{ fontSize: '12px', color: trend >= 0 ? '#72C15F' : '#EF4444', fontWeight: 600 }}>
                        {trend >= 0 ? '+' : ''}{trend?.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Top Referrers Table */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '32px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px 0' }}>
              Meilleurs référents
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
                      Nom
                    </th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
                      Liens
                    </th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
                      Clics
                    </th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
                      Conversions
                    </th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
                      Revenus
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {links.map(link => (
                    <tr key={link.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#1A1A1A', fontWeight: 500 }}>
                        {link.referrerName}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '13px', color: '#1A1A1A' }}>
                        1
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '13px', color: '#1A1A1A' }}>
                        {link.clicks}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '13px', color: '#1A1A1A' }}>
                        {link.conversions}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '13px', color: '#1A1A1A', fontWeight: 600 }}>
                        {link.revenue}€
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '32px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 20px 0' }}>
              Entonnage de conversion
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {conversionFunnel.map((step, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                      {step.label}
                    </span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                        {step.count}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                        {step.percentage}%
                      </span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '24px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${step.percentage}%`,
                        backgroundColor: '#72C15F',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  {idx < conversionFunnel.length - 1 && (
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', textAlign: 'right' }}>
                      Taux de conversion: {(
                        (conversionFunnel[idx + 1].percentage / step.percentage) *
                        100
                      ).toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Channel Breakdown */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '32px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 20px 0' }}>
              Performance par canal
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {channelBreakdown.map((channel, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                      {channel.channel}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                      {channel.clicks}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '24px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(channel.clicks / maxChannelClicks) * 100}%`,
                        backgroundColor: channel.color,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Rewards */}
          {pendingRewards.length > 0 && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px 0' }}>
                Récompenses en attente
              </h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {pendingRewards.map(reward => (
                  <div
                    key={reward.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', margin: 0, marginBottom: '4px' }}>
                        {reward.patientName}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                        {reward.rewardType} - {reward.value}{reward.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSendReward(reward.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: '#72C15F',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#5DB847')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#72C15F')}
                    >
                      <Send style={{ width: 14, height: 14 }} />
                      Envoyer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ReferralDashboard;
