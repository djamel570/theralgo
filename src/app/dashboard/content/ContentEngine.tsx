'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  PenTool,
  Mic2,
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Package,
  Rocket,
  ShoppingBag,
  Mail,
  TrendingUp,
} from 'lucide-react';

const DESIGN_SYSTEM = {
  colors: {
    green: '#72C15F',
    greenAccent: '#5DB847',
    cream: '#F7F4EE',
    dark: '#1A1A1A',
    muted: '#6B7280',
    white: '#FFFFFF',
    blue: '#3B82F6',
    purple: '#A855F7',
    pink: '#EC4899',
    orange: '#F97316',
    red: '#EF4444',
    yellow: '#FBBF24',
  },
  font: 'Plus Jakarta Sans, sans-serif',
};

const CONTENT_TYPES = [
  { id: 'blog', label: 'Blog', icon: '📝', length: '800-1200 mots', bestDay: 'Lundi' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', length: '200-300 mots', bestDay: 'Mercredi' },
  { id: 'instagram', label: 'Instagram', icon: '📸', length: '100-150 mots', bestDay: 'Mardi' },
  { id: 'carousel', label: 'Carousel', icon: '🎨', length: '5-7 slides', bestDay: 'Jeudi' },
  { id: 'reel', label: 'Reel', icon: '🎬', length: '15-30 sec', bestDay: 'Vendredi' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', length: '15-60 sec', bestDay: 'Jeudi' },
  { id: 'email', label: 'Email', icon: '✉️', length: '150-300 mots', bestDay: 'Samedi' },
  { id: 'google', label: 'Google Business', icon: '🏢', length: '50-100 mots', bestDay: 'Lundi' },
];

interface CalendarWeek {
  weekStart: string;
  theme: string;
  days: Array<{
    date: string;
    dayName: string;
    content?: {
      type: string;
      status: 'planned' | 'in_progress' | 'completed' | 'skipped';
      preview: string;
    };
  }>;
}

interface ContentPiece {
  id: string;
  type: string;
  title: string;
  content: string;
  hashtags: string[];
  visualSuggestions: string[];
  cta: string;
  voiceScore: number;
  date?: string;
  status: string;
  metrics?: {
    views: number;
    engagement: number;
    clicks: number;
  };
}

interface VoiceProfile {
  tones: {
    warmth: number;
    authority: number;
    empathy: number;
    humor: number;
    directness: number;
  };
  preferredExpressions: string[];
  avoidedExpressions: string[];
  signaturePhrases: string[];
  metaphorStyle: string;
  formalityLevel: string;
  confidenceScore: number;
}

interface Analytics {
  totalViews: number;
  totalEngagement: number;
  leadsFromContent: number;
  avgScore: number;
  topContent: ContentPiece[];
  breakdown: Array<{ type: string; count: number; performance: number }>;
  insights: string[];
}

export default function ContentEngine() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'create' | 'products' | 'voice' | 'performance'>('calendar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calendar state
  const [calendarData, setCalendarData] = useState<CalendarWeek[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<{ week: number; day: number } | null>(null);

  // Create content state
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [contentTopic, setContentTopic] = useState('');
  const [contentIntention, setContentIntention] = useState('educate');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generatedContent, setGeneratedContent] = useState<ContentPiece | null>(null);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);

  // Voice state
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [showVoiceInterview, setShowVoiceInterview] = useState(false);
  const [interviewQuestion, setInterviewQuestion] = useState(0);
  const [interviewResponses, setInterviewResponses] = useState<string[]>([]);
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productStrategy, setProductStrategy] = useState<'soft_mention' | 'educational_bridge' | 'direct_promo' | 'launch' | 'testimonial'>('educational_bridge');
  const [productContentType, setProductContentType] = useState<string>('instagram_post');
  const [generatedProductContent, setGeneratedProductContent] = useState<ContentPiece | null>(null);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [launchDate, setLaunchDate] = useState('');
  const [launchSequence, setLaunchSequence] = useState<any | null>(null);
  const [productInsights, setProductInsights] = useState<any | null>(null);
  const [nurturingEmails, setNurturingEmails] = useState<any[]>([]);

  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const INTERVIEW_QUESTIONS = [
    'Décrivez votre style de communication naturel. Comment parlez-vous habituellement à vos clients ?',
    'Quels sont les sujets ou expressions que vous aimez utiliser pour engager votre audience ?',
    'Y a-t-il des termes, jargon ou expressions que vous évitez absolument ?',
    'Comment décririez-vous votre degré de formalité ? Êtes-vous plus direct ou plus nuancé ?',
    'Parlez-nous de votre approche thérapeutique. Quelles sont vos valeurs fondamentales ?',
  ];

  // Fetch calendar data
  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchCalendarData();
    }
  }, [activeTab]);

  // Fetch voice profile
  useEffect(() => {
    if (activeTab === 'voice') {
      fetchVoiceProfile();
    }
  }, [activeTab]);

  // Fetch products
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

  // Fetch analytics
  useEffect(() => {
    if (activeTab === 'performance') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/content/calendar', { method: 'GET' });
      if (!response.ok) throw new Error('Erreur lors du chargement du calendrier');
      const data = await response.json();
      setCalendarData(data.weeks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      // Mock data for demo
      setCalendarData(generateMockCalendarData());
    } finally {
      setLoading(false);
    }
  };

  const fetchVoiceProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/content/voice', { method: 'GET' });
      if (!response.ok) {
        setShowVoiceInterview(true);
        return;
      }
      const data = await response.json();
      setVoiceProfile(data.profile);
    } catch (err) {
      setShowVoiceInterview(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/content/analytics', { method: 'GET' });
      if (!response.ok) throw new Error('Erreur lors du chargement des analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setAnalytics(generateMockAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products/revenue', { method: 'GET' });
      if (!response.ok) throw new Error('Erreur lors du chargement des produits');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setProducts([
        { id: 'p1', title: 'Programme Anti-Stress en 21 Jours', type: 'audio_program', status: 'active', price: 47, sales: 23, slug: 'anti-stress-21-jours' },
        { id: 'p2', title: 'Mini-cours : Confiance en Soi', type: 'mini_course', status: 'active', price: 29, sales: 45, slug: 'confiance-en-soi' },
        { id: 'p3', title: 'Atelier Live : Gérer ses Émotions', type: 'live_workshop', status: 'draft', price: 67, sales: 0, slug: 'gerer-emotions-live' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProductContent = async () => {
    if (!selectedProduct || !productContentType) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: productContentType,
          productId: selectedProduct,
          customInstructions: `Stratégie : ${productStrategy}. Créer du contenu qui fait le pont naturellement vers ce produit digital.`,
        }),
      });
      if (!response.ok) throw new Error('Erreur lors de la génération');
      const data = await response.json();
      setGeneratedProductContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      const product = products.find(p => p.id === selectedProduct);
      setGeneratedProductContent({
        id: 'demo',
        type: productContentType,
        title: `Comment surmonter le stress au quotidien`,
        content: `Le stress est une réaction naturelle du corps face aux défis. Mais quand il devient chronique, il peut affecter profondément votre qualité de vie.\n\nVoici 3 techniques simples que je recommande à mes patients :\n\n1. La respiration 4-7-8 : inspirez 4 secondes, retenez 7, expirez 8\n2. Le scan corporel : 5 minutes par jour suffisent\n3. Le journaling émotionnel : écrire libère l'esprit\n\nCes techniques sont un excellent point de départ. Si vous souhaitez aller plus loin, j'ai créé un programme complet en 21 jours qui vous guide pas à pas vers une gestion durable du stress.\n\n🔗 Découvrez "${product?.title}" — lien en bio`,
        hashtags: ['#stress', '#bienetre', '#psychologie', '#santemental', '#developpementpersonnel'],
        visualSuggestions: ['Photo apaisante nature', 'Infographie 3 techniques'],
        cta: `Découvrir ${product?.title}`,
        voiceScore: 87,
        status: 'draft',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLaunchSequence = async () => {
    if (!selectedProduct || !launchDate) return;
    setLoading(true);
    try {
      const response = await fetch('/api/content/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: launchDate,
          productId: selectedProduct,
          type: 'launch',
        }),
      });
      if (!response.ok) throw new Error('Erreur lors de la création de la séquence');
      const data = await response.json();
      setLaunchSequence(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      const product = products.find(p => p.id === selectedProduct);
      setLaunchSequence({
        productTitle: product?.title,
        phases: [
          { name: 'Autorité', weekOffset: -2, theme: 'Construire la crédibilité', pieces: 3 },
          { name: 'Problème', weekOffset: -1, theme: 'Révéler le problème', pieces: 4 },
          { name: 'Lancement', weekOffset: 0, theme: 'Annonce officielle', pieces: 5 },
          { name: 'Preuve sociale', weekOffset: 1, theme: 'Témoignages & résultats', pieces: 4 },
          { name: 'Dernière chance', weekOffset: 2, theme: 'Urgence & clôture', pieces: 3 },
        ],
        totalPieces: 19,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNurture = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'email_newsletter',
          productId: selectedProduct,
          customInstructions: 'Générer une séquence de nurturing email en 5 emails',
        }),
      });
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setNurturingEmails(data.emails || []);
    } catch (err) {
      setNurturingEmails([
        { subject: 'Comprendre le stress : ce que personne ne vous dit', strategy: 'Valeur pure', preview: 'Aucune mention du produit. Contenu éducatif pur sur les mécanismes du stress.' },
        { subject: 'La technique que j\'utilise avec mes patients', strategy: 'Mention subtile', preview: 'Technique concrète + mention en passant du programme.' },
        { subject: 'Ce qui change quand on comprend son stress', strategy: 'Pont éducatif', preview: 'Approfondissement + extrait du programme comme exemple.' },
        { subject: 'Ils ont transformé leur rapport au stress', strategy: 'Preuve sociale', preview: 'Témoignages + présentation du programme.' },
        { subject: 'Votre invitation personnelle', strategy: 'Offre directe', preview: 'Présentation complète + offre de lancement.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const PRODUCT_STRATEGIES = [
    { id: 'soft_mention', label: 'Mention douce', desc: 'Contenu éducatif avec mention discrète en fin', icon: '🌱' },
    { id: 'educational_bridge', label: 'Pont éducatif', desc: 'Enseigne une partie, crée le désir pour la suite', icon: '🎓' },
    { id: 'direct_promo', label: 'Promo directe', desc: 'Promotion explicite (lancement, offre spéciale)', icon: '📣' },
    { id: 'launch', label: 'Lancement', desc: 'Séquence complète de lancement produit', icon: '🚀' },
    { id: 'testimonial', label: 'Témoignage', desc: 'Contenu basé sur les résultats et transformations', icon: '⭐' },
  ];

  const PRODUCT_TYPE_LABELS: Record<string, string> = {
    audio_program: '🎧 Programme Audio',
    mini_course: '📚 Mini-Cours',
    live_workshop: '🎥 Atelier Live',
    subscription: '🔄 Abonnement',
  };

  const generateMockCalendarData = (): CalendarWeek[] => {
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(2026, 3, 6 + i * 7);
      weeks.push({
        weekStart: weekStart.toISOString().split('T')[0],
        theme: ['Gestion du stress', 'Confiance en soi', 'Relations saines', 'Bien-être mental'][i],
        days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, idx) => ({
          date: new Date(weekStart.getTime() + idx * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dayName: day,
          content:
            idx % 2 === 0
              ? {
                  type: ['blog', 'linkedin', 'instagram', 'reel', 'email'][idx % 5],
                  status: ['planned', 'in_progress', 'completed'][Math.floor(Math.random() * 3)] as any,
                  preview: `Contenu prévu pour ${day}`,
                }
              : undefined,
        })),
      });
    }
    return weeks;
  };

  const generateMockAnalytics = (): Analytics => ({
    totalViews: 12450,
    totalEngagement: 1842,
    leadsFromContent: 34,
    avgScore: 82,
    topContent: [
      {
        id: '1',
        type: 'blog',
        title: 'Guide complet de la gestion du stress',
        content: 'Contenu...',
        hashtags: ['#stress', '#bien-être'],
        visualSuggestions: [],
        cta: 'Lire plus',
        voiceScore: 92,
        metrics: { views: 3200, engagement: 450, clicks: 120 },
        status: 'completed',
      },
    ],
    breakdown: [
      { type: 'blog', count: 12, performance: 88 },
      { type: 'linkedin', count: 18, performance: 76 },
      { type: 'instagram', count: 24, performance: 82 },
    ],
    insights: [
      'Votre contenu blog génère 3x plus d\'engagement que les posts LinkedIn',
      'Les publications le mercredi ont un meilleur taux d\'engagement',
      'Vos articles sur la confiance en soi ont le score vocal le plus élevé',
    ],
  });

  const handlePlanWeek = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'week' }),
      });
      if (!response.ok) throw new Error('Erreur lors de la planification');
      await fetchCalendarData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWeek = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', weekIndex: currentWeekIndex }),
      });
      if (!response.ok) throw new Error('Erreur lors de l\'approbation');
      await fetchCalendarData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestTopics = async () => {
    setSuggestionsLoading(true);
    try {
      const response = await fetch('/api/content/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedContentType }),
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des suggestions');
      const data = await response.json();
      setTopicSuggestions(data.suggestions || []);
    } catch (err) {
      setTopicSuggestions(['Gestion du stress', 'Confiance en soi', 'Relations saines']);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!selectedContentType || !contentTopic) {
      setError('Veuillez sélectionner un type et un sujet');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedContentType,
          topic: contentTopic,
          intention: contentIntention,
          instructions: customInstructions,
        }),
      });
      if (!response.ok) throw new Error('Erreur lors de la génération');
      const data = await response.json();
      setGeneratedContent(data.content);
      setEditedContent(data.content.content);
      setIsEditingContent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      // Mock content
      setGeneratedContent({
        id: 'temp-' + Date.now(),
        type: selectedContentType,
        title: `Titre sur ${contentTopic}`,
        content: `Contenu généré sur le sujet: ${contentTopic}\n\nCeci est un aperçu du contenu qui sera généré basé sur votre sujet et vos intentions.`,
        hashtags: ['#therapy', '#' + contentTopic.toLowerCase().replace(/\s+/g, '')],
        visualSuggestions: ['Image illustrant ' + contentTopic, 'Graphique informatif'],
        cta: 'Découvrir plus',
        voiceScore: 85,
        status: 'draft',
      });
      setEditedContent(`Contenu généré sur le sujet: ${contentTopic}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInterview = async () => {
    setInterviewLoading(true);
    try {
      const response = await fetch('/api/content/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'interview',
          responses: interviewResponses,
        }),
      });
      if (!response.ok) throw new Error('Erreur lors de la soumission');
      const data = await response.json();
      setVoiceProfile(data.profile);
      setShowVoiceInterview(false);
      setInterviewResponses([]);
      setInterviewQuestion(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleNextInterviewQuestion = () => {
    if (interviewQuestion < INTERVIEW_QUESTIONS.length - 1) {
      setInterviewQuestion(interviewQuestion + 1);
    }
  };

  const handleInterviewResponse = (text: string) => {
    const newResponses = [...interviewResponses];
    newResponses[interviewQuestion] = text;
    setInterviewResponses(newResponses);
  };

  // ===== RENDER CALENDAR TAB =====
  const renderCalendarTab = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader2 style={{ color: DESIGN_SYSTEM.colors.green, animation: 'spin 1s linear infinite' }} size={40} />
        </div>
      );
    }

    const currentWeek = calendarData[currentWeekIndex];
    if (!currentWeek) {
      return <div style={{ padding: '20px', textAlign: 'center' }}>Aucune donnée de calendrier disponible</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: DESIGN_SYSTEM.colors.white,
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <button
            onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
            disabled={currentWeekIndex === 0}
            style={{
              background: 'none',
              border: 'none',
              cursor: currentWeekIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentWeekIndex === 0 ? 0.5 : 1,
            }}
          >
            <ChevronLeft color={DESIGN_SYSTEM.colors.green} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
              {new Date(currentWeek.weekStart).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })} -{' '}
              {new Date(new Date(currentWeek.weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <div
              style={{
                fontSize: '14px',
                color: DESIGN_SYSTEM.colors.muted,
                fontStyle: 'italic',
              }}
            >
              Thème: {currentWeek.theme}
            </div>
          </div>

          <button
            onClick={() => setCurrentWeekIndex(Math.min(calendarData.length - 1, currentWeekIndex + 1))}
            disabled={currentWeekIndex === calendarData.length - 1}
            style={{
              background: 'none',
              border: 'none',
              cursor: currentWeekIndex === calendarData.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentWeekIndex === calendarData.length - 1 ? 0.5 : 1,
            }}
          >
            <ChevronRight color={DESIGN_SYSTEM.colors.green} />
          </button>
        </div>

        {/* Weekly calendar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '12px',
          }}
        >
          {currentWeek.days.map((day, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedSlot({ week: currentWeekIndex, day: idx })}
              style={{
                padding: '16px',
                backgroundColor: DESIGN_SYSTEM.colors.white,
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                border:
                  selectedSlot?.week === currentWeekIndex && selectedSlot?.day === idx
                    ? `2px solid ${DESIGN_SYSTEM.colors.green}`
                    : '1px solid #E5E7EB',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '600', color: DESIGN_SYSTEM.colors.muted, marginBottom: '8px' }}>
                {day.dayName}
              </div>
              <div style={{ fontSize: '11px', color: DESIGN_SYSTEM.colors.muted, marginBottom: '12px' }}>
                {new Date(day.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })}
              </div>

              {day.content ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: getContentTypeColor(day.content.type),
                      color: DESIGN_SYSTEM.colors.white,
                      width: 'fit-content',
                    }}
                  >
                    {day.content.type}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor:
                        day.content.status === 'completed'
                          ? '#D1FAE5'
                          : day.content.status === 'in_progress'
                            ? '#FEF3C7'
                            : day.content.status === 'skipped'
                              ? '#FEE2E2'
                              : '#F3F4F6',
                      width: 'fit-content',
                    }}
                  >
                    {day.content.status === 'completed' && <Check size={12} color="#10B981" />}
                    {day.content.status === 'in_progress' && <Clock size={12} color="#D97706" />}
                    <span
                      style={{
                        fontSize: '10px',
                        color: getStatusColor(day.content.status),
                        fontWeight: '500',
                      }}
                    >
                      {day.content.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: DESIGN_SYSTEM.colors.muted, fontStyle: 'italic' }}>Vide</div>
              )}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handlePlanWeek}
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              backgroundColor: DESIGN_SYSTEM.colors.green,
              color: DESIGN_SYSTEM.colors.white,
              border: 'none',
              fontFamily: DESIGN_SYSTEM.font,
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={18} /> Planifier la semaine
          </button>

          <button
            onClick={handleApproveWeek}
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              backgroundColor: DESIGN_SYSTEM.colors.greenAccent,
              color: DESIGN_SYSTEM.colors.white,
              border: 'none',
              fontFamily: DESIGN_SYSTEM.font,
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={18} /> Approuver
          </button>
        </div>

        {/* Selected slot preview */}
        {selectedSlot && currentWeek.days[selectedSlot.day]?.content && (
          <div
            style={{
              padding: '20px',
              backgroundColor: DESIGN_SYSTEM.colors.white,
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${DESIGN_SYSTEM.colors.green}`,
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
              Aperçu du contenu
            </h4>
            <p style={{ margin: '0', color: DESIGN_SYSTEM.colors.dark }}>
              {currentWeek.days[selectedSlot.day].content?.preview}
            </p>
          </div>
        )}
      </div>
    );
  };

  // ===== RENDER CREATE CONTENT TAB =====
  const renderCreateContentTab = () => {
    if (!selectedContentType) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ margin: '0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
            Sélectionnez un type de contenu
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
            }}
          >
            {CONTENT_TYPES.map((type) => (
              <div
                key={type.id}
                onClick={() => setSelectedContentType(type.id)}
                style={{
                  padding: '20px',
                  backgroundColor: DESIGN_SYSTEM.colors.white,
                  borderRadius: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = DESIGN_SYSTEM.colors.green;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{type.icon}</div>
                <h4 style={{ margin: '0 0 8px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
                  {type.label}
                </h4>
                <div style={{ fontSize: '12px', color: DESIGN_SYSTEM.colors.muted, marginBottom: '8px' }}>
                  {type.length}
                </div>
                <div style={{ fontSize: '11px', color: DESIGN_SYSTEM.colors.green, fontWeight: '600' }}>
                  Meilleur jour: {type.bestDay}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (generatedContent) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <button
            onClick={() => {
              setGeneratedContent(null);
              setSelectedContentType(null);
              setContentTopic('');
              setEditedContent('');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: 'transparent',
              color: DESIGN_SYSTEM.colors.green,
              border: `1px solid ${DESIGN_SYSTEM.colors.green}`,
              fontFamily: DESIGN_SYSTEM.font,
              fontWeight: '600',
              cursor: 'pointer',
              width: 'fit-content',
            }}
          >
            ← Retour
          </button>

          <div
            style={{
              padding: '20px',
              backgroundColor: DESIGN_SYSTEM.colors.white,
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
                {generatedContent.title}
              </h3>

              {isEditingContent ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: `1px solid #E5E7EB`,
                    fontFamily: DESIGN_SYSTEM.font,
                    fontSize: '14px',
                    color: DESIGN_SYSTEM.colors.dark,
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <p
                  style={{
                    margin: '0',
                    color: DESIGN_SYSTEM.colors.dark,
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {editedContent}
                </p>
              )}
            </div>

            {/* Voice Score */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark }}>Score vocal</span>
                <div
                  style={{
                    width: '100px',
                    height: '8px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${generatedContent.voiceScore}%`,
                      backgroundColor: DESIGN_SYSTEM.colors.green,
                    }}
                  />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.green }}>
                  {generatedContent.voiceScore}%
                </span>
              </div>
            </div>

            {/* Hashtags */}
            {generatedContent.hashtags.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, marginBottom: '12px' }}>
                  Hashtags
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {generatedContent.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        backgroundColor: DESIGN_SYSTEM.colors.cream,
                        color: DESIGN_SYSTEM.colors.green,
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Suggestions */}
            {generatedContent.visualSuggestions.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, marginBottom: '12px' }}>
                  Suggestions visuelles
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {generatedContent.visualSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        backgroundColor: DESIGN_SYSTEM.colors.cream,
                        borderRadius: '12px',
                        fontSize: '14px',
                        color: DESIGN_SYSTEM.colors.dark,
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {generatedContent.cta && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, marginBottom: '8px' }}>
                  Appel à l'action
                </div>
                <button
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    backgroundColor: DESIGN_SYSTEM.colors.green,
                    color: DESIGN_SYSTEM.colors.white,
                    border: 'none',
                    fontFamily: DESIGN_SYSTEM.font,
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {generatedContent.cta}
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setIsEditingContent(!isEditingContent)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  backgroundColor: 'transparent',
                  color: DESIGN_SYSTEM.colors.green,
                  border: `1px solid ${DESIGN_SYSTEM.colors.green}`,
                  fontFamily: DESIGN_SYSTEM.font,
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <PenTool size={16} /> {isEditingContent ? 'Terminer' : 'Modifier'}
              </button>

              <button
                style={{
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  backgroundColor: DESIGN_SYSTEM.colors.green,
                  color: DESIGN_SYSTEM.colors.white,
                  border: 'none',
                  fontFamily: DESIGN_SYSTEM.font,
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Check size={16} /> Publier
              </button>

              <button
                style={{
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  backgroundColor: DESIGN_SYSTEM.colors.greenAccent,
                  color: DESIGN_SYSTEM.colors.white,
                  border: 'none',
                  fontFamily: DESIGN_SYSTEM.font,
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Clock size={16} /> Planifier
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button
          onClick={() => setSelectedContentType(null)}
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            backgroundColor: 'transparent',
            color: DESIGN_SYSTEM.colors.green,
            border: `1px solid ${DESIGN_SYSTEM.colors.green}`,
            fontFamily: DESIGN_SYSTEM.font,
            fontWeight: '600',
            cursor: 'pointer',
            width: 'fit-content',
          }}
        >
          ← Changer de type
        </button>

        <div
          style={{
            padding: '20px',
            backgroundColor: DESIGN_SYSTEM.colors.white,
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ margin: '0 0 20px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
            Créer un {CONTENT_TYPES.find((t) => t.id === selectedContentType)?.label}
          </h3>

          {/* Topic field */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: DESIGN_SYSTEM.colors.dark,
              }}
            >
              Sujet
            </label>
            <input
              type="text"
              value={contentTopic}
              onChange={(e) => setContentTopic(e.target.value)}
              placeholder="Ex: Gestion du stress quotidien"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid #E5E7EB`,
                fontFamily: DESIGN_SYSTEM.font,
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Suggestions button */}
          <button
            onClick={handleSuggestTopics}
            disabled={suggestionsLoading}
            style={{
              marginBottom: '20px',
              padding: '10px 16px',
              borderRadius: '9999px',
              backgroundColor: 'transparent',
              color: DESIGN_SYSTEM.colors.green,
              border: `1px solid ${DESIGN_SYSTEM.colors.green}`,
              fontFamily: DESIGN_SYSTEM.font,
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
            }}
          >
            {suggestionsLoading ? <Loader2 size={16} /> : <Sparkles size={16} />}
            Suggestions IA
          </button>

          {/* Topic suggestions */}
          {topicSuggestions.length > 0 && (
            <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {topicSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setContentTopic(suggestion)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '9999px',
                    backgroundColor: DESIGN_SYSTEM.colors.cream,
                    color: DESIGN_SYSTEM.colors.green,
                    border: 'none',
                    fontFamily: DESIGN_SYSTEM.font,
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Intention dropdown */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: DESIGN_SYSTEM.colors.dark,
              }}
            >
              Intention
            </label>
            <select
              value={contentIntention}
              onChange={(e) => setContentIntention(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid #E5E7EB`,
                fontFamily: DESIGN_SYSTEM.font,
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            >
              <option value="educate">Éduquer</option>
              <option value="inspire">Inspirer</option>
              <option value="engage">Engager</option>
              <option value="promote">Promouvoir</option>
            </select>
          </div>

          {/* Custom instructions */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: DESIGN_SYSTEM.colors.dark,
              }}
            >
              Instructions personnalisées
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ajouter des instructions spécifiques pour la génération..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid #E5E7EB`,
                fontFamily: DESIGN_SYSTEM.font,
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateContent}
            disabled={loading || !contentTopic}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '9999px',
              backgroundColor: DESIGN_SYSTEM.colors.green,
              color: DESIGN_SYSTEM.colors.white,
              border: 'none',
              fontFamily: DESIGN_SYSTEM.font,
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px',
              opacity: loading || !contentTopic ? 0.6 : 1,
            }}
          >
            {loading ? <Loader2 size={18} /> : <Sparkles size={18} />}
            {loading ? 'Génération...' : 'Générer'}
          </button>
        </div>
      </div>
    );
  };

  // ===== RENDER VOICE TAB =====
  const renderVoiceTab = () => {
    if (showVoiceInterview) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              padding: '20px',
              backgroundColor: DESIGN_SYSTEM.colors.white,
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
              Interview vocale - Créez votre profil vocal
            </h3>

            {/* Progress bar */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${((interviewQuestion + 1) / INTERVIEW_QUESTIONS.length) * 100}%`,
                    backgroundColor: DESIGN_SYSTEM.colors.green,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: DESIGN_SYSTEM.colors.muted,
                }}
              >
                Question {interviewQuestion + 1} sur {INTERVIEW_QUESTIONS.length}
              </div>
            </div>

            {/* Question */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font, fontSize: '16px' }}>
                {INTERVIEW_QUESTIONS[interviewQuestion]}
              </h4>

              <textarea
                value={interviewResponses[interviewQuestion] || ''}
                onChange={(e) => handleInterviewResponse(e.target.value)}
                placeholder="Votre réponse..."
                style={{
                  width: '100%',
                  minHeight: '180px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1px solid #E5E7EB`,
                  fontFamily: DESIGN_SYSTEM.font,
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  color: DESIGN_SYSTEM.colors.dark,
                }}
              />
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setInterviewQuestion(Math.max(0, interviewQuestion - 1))}
                disabled={interviewQuestion === 0}
                style={{
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  backgroundColor: 'transparent',
                  color: DESIGN_SYSTEM.colors.green,
                  border: `1px solid ${DESIGN_SYSTEM.colors.green}`,
                  fontFamily: DESIGN_SYSTEM.font,
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: interviewQuestion === 0 ? 0.5 : 1,
                }}
              >
                ← Précédente
              </button>

              {interviewQuestion < INTERVIEW_QUESTIONS.length - 1 ? (
                <button
                  onClick={handleNextInterviewQuestion}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    backgroundColor: DESIGN_SYSTEM.colors.green,
                    color: DESIGN_SYSTEM.colors.white,
                    border: 'none',
                    fontFamily: DESIGN_SYSTEM.font,
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  Suivante → <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmitInterview}
                  disabled={interviewLoading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    backgroundColor: DESIGN_SYSTEM.colors.green,
                    color: DESIGN_SYSTEM.colors.white,
                    border: 'none',
                    fontFamily: DESIGN_SYSTEM.font,
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: interviewLoading ? 0.6 : 1,
                  }}
                >
                  {interviewLoading ? <Loader2 size={16} /> : <Check size={16} />}
                  {interviewLoading ? 'Soumission...' : 'Soumettre'}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader2 style={{ color: DESIGN_SYSTEM.colors.green, animation: 'spin 1s linear infinite' }} size={40} />
        </div>
      );
    }

    if (!voiceProfile) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <AlertCircle size={32} color={DESIGN_SYSTEM.colors.green} style={{ marginBottom: '12px' }} />
          <p style={{ color: DESIGN_SYSTEM.colors.muted }}>Profil vocal non trouvé. Veuillez compléter l'interview.</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <button
          onClick={() => {
            setShowVoiceInterview(true);
            setInterviewQuestion(0);
            setInterviewResponses([]);
          }}
          style={{
            padding: '12px 24px',
            borderRadius: '9999px',
            backgroundColor: DESIGN_SYSTEM.colors.green,
            color: DESIGN_SYSTEM.colors.white,
            border: 'none',
            fontFamily: DESIGN_SYSTEM.font,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: 'fit-content',
          }}
        >
          <RefreshCw size={16} /> Recalibrer
        </button>

        {/* Tone sliders */}
        <div
          style={{
            padding: '20px',
            backgroundColor: DESIGN_SYSTEM.colors.white,
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h4 style={{ margin: '0 0 20px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
            Tonalité
          </h4>

          {Object.entries(voiceProfile.tones).map(([tone, value]) => (
            <div key={tone} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, textTransform: 'capitalize' }}>
                  {tone}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.green }}>{value}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${value}%`,
                    backgroundColor: DESIGN_SYSTEM.colors.green,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Expressions */}
        <div
          style={{
            padding: '20px',
            backgroundColor: DESIGN_SYSTEM.colors.white,
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h4 style={{ margin: '0 0 16px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
            Expressions préférées
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {voiceProfile.preferredExpressions.map((expr, idx) => (
              <span
                key={idx}
                style={{
                  padding: '8px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#D1FAE5',
                  color: DESIGN_SYSTEM.colors.green,
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {expr}
              </span>
            ))}
          </div>

          <h4 style={{ margin: '0 0 16px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
            Expressions à éviter
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {voiceProfile.avoidedExpressions.map((expr, idx) => (
              <span
                key={idx}
                style={{
                  padding: '8px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {expr}
              </span>
            ))}
          </div>
        </div>

        {/* Signature phrases */}
        {voiceProfile.signaturePhrases.length > 0 && (
          <div
            style={{
              padding: '20px',
              backgroundColor: DESIGN_SYSTEM.colors.white,
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h4 style={{ margin: '0 0 16px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
              Phrases signature
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {voiceProfile.signaturePhrases.map((phrase, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: DESIGN_SYSTEM.colors.cream,
                    borderRadius: '12px',
                    fontStyle: 'italic',
                    color: DESIGN_SYSTEM.colors.dark,
                  }}
                >
                  "{phrase}"
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Style badges */}
        <div
          style={{
            padding: '20px',
            backgroundColor: DESIGN_SYSTEM.colors.white,
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '9999px',
              backgroundColor: DESIGN_SYSTEM.colors.cream,
              fontSize: '14px',
              fontWeight: '600',
              color: DESIGN_SYSTEM.colors.green,
            }}
          >
            Style métaphorique: {voiceProfile.metaphorStyle}
          </div>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '9999px',
              backgroundColor: DESIGN_SYSTEM.colors.cream,
              fontSize: '14px',
              fontWeight: '600',
              color: DESIGN_SYSTEM.colors.green,
            }}
          >
            Formalité: {voiceProfile.formalityLevel}
          </div>
        </div>

        {/* Confidence score */}
        <div
          style={{
            padding: '20px',
            backgroundColor: DESIGN_SYSTEM.colors.white,
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, marginBottom: '8px' }}>
              Score de confiance
            </div>
            <p style={{ margin: '0', fontSize: '12px', color: DESIGN_SYSTEM.colors.muted }}>
              Votre profil vocal est complet et correspond bien à votre style naturel.
            </p>
          </div>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: DESIGN_SYSTEM.colors.cream,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `conic-gradient(${DESIGN_SYSTEM.colors.green} 0deg ${voiceProfile.confidenceScore * 3.6}deg, #E5E7EB ${voiceProfile.confidenceScore * 3.6}deg)`,
              }}
            />
            <span
              style={{
                position: 'relative',
                fontSize: '20px',
                fontWeight: '700',
                color: DESIGN_SYSTEM.colors.green,
              }}
            >
              {voiceProfile.confidenceScore}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ===== RENDER PRODUCTS TAB =====
  const renderProductsTab = () => {
    if (loading && products.length === 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader2 style={{ color: DESIGN_SYSTEM.colors.green, animation: 'spin 1s linear infinite' }} size={40} />
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Product selector */}
        <div style={{ backgroundColor: DESIGN_SYSTEM.colors.white, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '18px', fontWeight: '700', color: DESIGN_SYSTEM.colors.dark, margin: '0 0 16px' }}>
            <Package size={20} style={{ marginRight: '8px', verticalAlign: 'middle', color: DESIGN_SYSTEM.colors.green }} />
            Mes Produits Digitaux
          </h3>
          {products.length === 0 ? (
            <p style={{ fontFamily: DESIGN_SYSTEM.font, color: DESIGN_SYSTEM.colors.muted, textAlign: 'center', padding: '32px' }}>
              Aucun produit digital trouvé. Créez votre premier produit dans l'onglet "Mes produits".
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => { setSelectedProduct(product.id); setGeneratedProductContent(null); setLaunchSequence(null); setNurturingEmails([]); }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: selectedProduct === product.id ? `2px solid ${DESIGN_SYSTEM.colors.green}` : '2px solid #E5E7EB',
                    backgroundColor: selectedProduct === product.id ? '#F0FDF4' : DESIGN_SYSTEM.colors.white,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '12px', color: DESIGN_SYSTEM.colors.muted, marginBottom: '4px' }}>
                    {PRODUCT_TYPE_LABELS[product.type] || product.type}
                  </div>
                  <div style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '15px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, marginBottom: '8px' }}>
                    {product.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '16px', fontWeight: '700', color: DESIGN_SYSTEM.colors.green }}>
                      {product.price}€
                    </span>
                    <span style={{
                      fontFamily: DESIGN_SYSTEM.font,
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: product.status === 'active' ? '#DCFCE7' : '#FEF3C7',
                      color: product.status === 'active' ? '#166534' : '#92400E',
                    }}>
                      {product.status === 'active' ? 'Actif' : 'Brouillon'} · {product.sales} ventes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content generation for selected product */}
        {selectedProduct && (
          <>
            {/* Strategy selector */}
            <div style={{ backgroundColor: DESIGN_SYSTEM.colors.white, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '18px', fontWeight: '700', color: DESIGN_SYSTEM.colors.dark, margin: '0 0 16px' }}>
                <Sparkles size={20} style={{ marginRight: '8px', verticalAlign: 'middle', color: DESIGN_SYSTEM.colors.green }} />
                Stratégie de contenu
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {PRODUCT_STRATEGIES.map((strategy) => (
                  <div
                    key={strategy.id}
                    onClick={() => setProductStrategy(strategy.id as any)}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: productStrategy === strategy.id ? `2px solid ${DESIGN_SYSTEM.colors.green}` : '2px solid #E5E7EB',
                      backgroundColor: productStrategy === strategy.id ? '#F0FDF4' : DESIGN_SYSTEM.colors.white,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{strategy.icon}</div>
                    <div style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark }}>
                      {strategy.label}
                    </div>
                    <div style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '12px', color: DESIGN_SYSTEM.colors.muted, marginTop: '4px' }}>
                      {strategy.desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* Content type selector for product */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, display: 'block', marginBottom: '8px' }}>
                  Format du contenu
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CONTENT_TYPES.map((ct) => (
                    <button
                      key={ct.id}
                      onClick={() => setProductContentType(ct.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '9999px',
                        border: productContentType === ct.id ? `2px solid ${DESIGN_SYSTEM.colors.green}` : '1px solid #D1D5DB',
                        backgroundColor: productContentType === ct.id ? '#F0FDF4' : DESIGN_SYSTEM.colors.white,
                        fontFamily: DESIGN_SYSTEM.font,
                        fontSize: '13px',
                        fontWeight: '500',
                        color: productContentType === ct.id ? DESIGN_SYSTEM.colors.green : DESIGN_SYSTEM.colors.muted,
                        cursor: 'pointer',
                      }}
                    >
                      {ct.icon} {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleGenerateProductContent}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    backgroundColor: DESIGN_SYSTEM.colors.green,
                    color: DESIGN_SYSTEM.colors.white,
                    border: 'none',
                    fontFamily: DESIGN_SYSTEM.font,
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                  Générer le contenu
                </button>
                <button
                  onClick={handleGenerateNurture}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    backgroundColor: DESIGN_SYSTEM.colors.white,
                    color: DESIGN_SYSTEM.colors.green,
                    border: `2px solid ${DESIGN_SYSTEM.colors.green}`,
                    fontFamily: DESIGN_SYSTEM.font,
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Mail size={16} />
                  Séquence Nurturing
                </button>
              </div>
            </div>

            {/* Generated content preview */}
            {generatedProductContent && (
              <div style={{ backgroundColor: DESIGN_SYSTEM.colors.white, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '18px', fontWeight: '700', color: DESIGN_SYSTEM.colors.dark, margin: '0 0 16px' }}>
                  Contenu généré
                </h3>
                <div style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '16px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, marginBottom: '12px' }}>
                  {generatedProductContent.title}
                </div>
                <div style={{
                  fontFamily: DESIGN_SYSTEM.font,
                  fontSize: '14px',
                  color: DESIGN_SYSTEM.colors.dark,
                  lineHeight: '1.7',
                  whiteSpace: 'pre-line',
                  backgroundColor: DESIGN_SYSTEM.colors.cream,
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                }}>
                  {generatedProductContent.content}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {generatedProductContent.hashtags.map((tag, i) => (
                    <span key={i} style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: '#DCFCE7',
                      fontFamily: DESIGN_SYSTEM.font,
                      fontSize: '12px',
                      color: '#166534',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${generatedProductContent.voiceScore}%`,
                      height: '100%',
                      backgroundColor: generatedProductContent.voiceScore > 80 ? DESIGN_SYSTEM.colors.green : DESIGN_SYSTEM.colors.yellow,
                      borderRadius: '4px',
                    }} />
                  </div>
                  <span style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '13px', color: DESIGN_SYSTEM.colors.muted }}>
                    Voix : {generatedProductContent.voiceScore}%
                  </span>
                </div>
              </div>
            )}

            {/* Nurturing email sequence */}
            {nurturingEmails.length > 0 && (
              <div style={{ backgroundColor: DESIGN_SYSTEM.colors.white, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '18px', fontWeight: '700', color: DESIGN_SYSTEM.colors.dark, margin: '0 0 16px' }}>
                  <Mail size={20} style={{ marginRight: '8px', verticalAlign: 'middle', color: DESIGN_SYSTEM.colors.green }} />
                  Séquence Nurturing — 5 emails
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {nurturingEmails.map((email, i) => (
                    <div key={i} style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start',
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: DESIGN_SYSTEM.colors.green,
                        color: DESIGN_SYSTEM.colors.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: DESIGN_SYSTEM.font,
                        fontWeight: '700',
                        fontSize: '14px',
                        flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, marginBottom: '4px' }}>
                          {email.subject}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          backgroundColor: ['#DBEAFE', '#E0E7FF', '#FEF3C7', '#DCFCE7', '#FCE7F3'][i],
                          fontFamily: DESIGN_SYSTEM.font,
                          fontSize: '11px',
                          fontWeight: '600',
                          color: ['#1E40AF', '#3730A3', '#92400E', '#166534', '#9D174D'][i],
                          marginBottom: '6px',
                        }}>
                          {email.strategy}
                        </div>
                        <div style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '13px', color: DESIGN_SYSTEM.colors.muted }}>
                          {email.preview}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Launch sequence planner */}
            <div style={{ backgroundColor: DESIGN_SYSTEM.colors.white, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '18px', fontWeight: '700', color: DESIGN_SYSTEM.colors.dark, margin: '0 0 16px' }}>
                <Rocket size={20} style={{ marginRight: '8px', verticalAlign: 'middle', color: DESIGN_SYSTEM.colors.green }} />
                Planifier un Lancement
              </h3>
              <p style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '14px', color: DESIGN_SYSTEM.colors.muted, marginBottom: '16px' }}>
                Créez une séquence de 19 contenus sur 5 semaines pour un lancement optimisé de votre produit.
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '13px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, display: 'block', marginBottom: '6px' }}>
                    Date de lancement
                  </label>
                  <input
                    type="date"
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: '1px solid #D1D5DB',
                      fontFamily: DESIGN_SYSTEM.font,
                      fontSize: '14px',
                    }}
                  />
                </div>
                <button
                  onClick={handleCreateLaunchSequence}
                  disabled={loading || !launchDate}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    backgroundColor: launchDate ? DESIGN_SYSTEM.colors.green : '#D1D5DB',
                    color: DESIGN_SYSTEM.colors.white,
                    border: 'none',
                    fontFamily: DESIGN_SYSTEM.font,
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: launchDate ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Rocket size={16} />}
                  Créer la séquence
                </button>
              </div>

              {/* Launch sequence visualization */}
              {launchSequence && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '15px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, marginBottom: '16px' }}>
                    Séquence pour "{launchSequence.productTitle}" — {launchSequence.totalPieces} contenus
                  </div>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {launchSequence.phases.map((phase: any, i: number) => (
                      <div key={i} style={{
                        minWidth: '180px',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: i === 2 ? '#F0FDF4' : DESIGN_SYSTEM.colors.cream,
                        border: i === 2 ? `2px solid ${DESIGN_SYSTEM.colors.green}` : '1px solid #E5E7EB',
                        flexShrink: 0,
                      }}>
                        <div style={{
                          fontFamily: DESIGN_SYSTEM.font,
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase' as const,
                          color: DESIGN_SYSTEM.colors.muted,
                          letterSpacing: '0.5px',
                          marginBottom: '6px',
                        }}>
                          {phase.weekOffset < 0 ? `S${phase.weekOffset}` : phase.weekOffset === 0 ? '🚀 Jour J' : `S+${phase.weekOffset}`}
                        </div>
                        <div style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, marginBottom: '4px' }}>
                          {phase.name}
                        </div>
                        <div style={{ fontFamily: DESIGN_SYSTEM.font, fontSize: '12px', color: DESIGN_SYSTEM.colors.muted, marginBottom: '8px' }}>
                          {phase.theme}
                        </div>
                        <div style={{
                          fontFamily: DESIGN_SYSTEM.font,
                          fontSize: '20px',
                          fontWeight: '700',
                          color: DESIGN_SYSTEM.colors.green,
                        }}>
                          {phase.pieces} <span style={{ fontSize: '12px', fontWeight: '500', color: DESIGN_SYSTEM.colors.muted }}>contenus</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // ===== RENDER PERFORMANCE TAB =====
  const renderPerformanceTab = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader2 style={{ color: DESIGN_SYSTEM.colors.green, animation: 'spin 1s linear infinite' }} size={40} />
        </div>
      );
    }

    if (!analytics) {
      return <div style={{ padding: '20px', textAlign: 'center' }}>Pas de données de performance disponible</div>;
    }

    // Calculate max value for bar charts
    const maxMetric = Math.max(
      analytics.totalViews,
      analytics.totalEngagement,
      analytics.leadsFromContent * 100
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Overview cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div
            style={{
              padding: '20px',
              backgroundColor: DESIGN_SYSTEM.colors.white,
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Eye size={20} color={DESIGN_SYSTEM.colors.green} />
              <span style={{ fontSize: '12px', color: DESIGN_SYSTEM.colors.muted, fontWeight: '600' }}>Vues totales</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: DESIGN_SYSTEM.colors.dark }}>
              {analytics.totalViews.toLocaleString('fr-FR')}
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              backgroundColor: DESIGN_SYSTEM.colors.white,
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Heart size={20} color={DESIGN_SYSTEM.colors.green} />
              <span style={{ fontSize: '12px', color: DESIGN_SYSTEM.colors.muted, fontWeight: '600' }}>Engagements</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: DESIGN_SYSTEM.colors.dark }}>
              {analytics.totalEngagement.toLocaleString('fr-FR')}
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              backgroundColor: DESIGN_SYSTEM.colors.white,
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <MessageCircle size={20} color={DESIGN_SYSTEM.colors.green} />
              <span style={{ fontSize: '12px', color: DESIGN_SYSTEM.colors.muted, fontWeight: '600' }}>Leads</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: DESIGN_SYSTEM.colors.dark }}>
              {analytics.leadsFromContent}
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              backgroundColor: DESIGN_SYSTEM.colors.white,
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Sparkles size={20} color={DESIGN_SYSTEM.colors.green} />
              <span style={{ fontSize: '12px', color: DESIGN_SYSTEM.colors.muted, fontWeight: '600' }}>Score moyen</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: DESIGN_SYSTEM.colors.dark }}>
              {analytics.avgScore}%
            </div>
          </div>
        </div>

        {/* Content type breakdown */}
        <div
          style={{
            padding: '20px',
            backgroundColor: DESIGN_SYSTEM.colors.white,
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h4 style={{ margin: '0 0 20px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
            Performance par type de contenu
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {analytics.breakdown.map((item) => (
              <div key={item.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark, textTransform: 'capitalize' }}>
                    {item.type}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.green }}>
                    {item.count} contenus • {item.performance}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${item.performance}%`,
                      backgroundColor: DESIGN_SYSTEM.colors.green,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top performing content */}
        <div
          style={{
            padding: '20px',
            backgroundColor: DESIGN_SYSTEM.colors.white,
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h4 style={{ margin: '0 0 20px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
            Top 5 contenus performants
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.topContent.map((content, idx) => (
              <div
                key={content.id}
                style={{
                  padding: '16px',
                  backgroundColor: DESIGN_SYSTEM.colors.cream,
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: DESIGN_SYSTEM.colors.dark }}>
                    #{idx + 1} {content.title}
                  </div>
                  <div style={{ fontSize: '12px', color: DESIGN_SYSTEM.colors.muted, marginTop: '4px' }}>
                    {content.type} • {content.metrics?.views.toLocaleString('fr-FR')} vues • {content.metrics?.engagement} engagements
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: DESIGN_SYSTEM.colors.green,
                  }}
                >
                  {content.voiceScore}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div
          style={{
            padding: '20px',
            backgroundColor: DESIGN_SYSTEM.colors.white,
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h4 style={{ margin: '0 0 16px 0', color: DESIGN_SYSTEM.colors.dark, fontFamily: DESIGN_SYSTEM.font }}>
            Insights IA
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  backgroundColor: DESIGN_SYSTEM.colors.cream,
                  borderRadius: '12px',
                  borderLeft: `4px solid ${DESIGN_SYSTEM.colors.green}`,
                  fontSize: '14px',
                  color: DESIGN_SYSTEM.colors.dark,
                  lineHeight: '1.5',
                }}
              >
                {insight}
              </div>
            ))}
          </div>
        </div>

        {/* Full report button */}
        <button
          style={{
            padding: '14px 24px',
            borderRadius: '9999px',
            backgroundColor: DESIGN_SYSTEM.colors.green,
            color: DESIGN_SYSTEM.colors.white,
            border: 'none',
            fontFamily: DESIGN_SYSTEM.font,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <BarChart3 size={18} /> Générer le rapport complet
        </button>
      </div>
    );
  };

  // ===== MAIN RENDER =====
  return (
    <div
      style={{
        backgroundColor: DESIGN_SYSTEM.colors.cream,
        minHeight: '100vh',
        padding: '32px',
        fontFamily: DESIGN_SYSTEM.font,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1
            style={{
              margin: '0 0 8px 0',
              color: DESIGN_SYSTEM.colors.dark,
              fontSize: '32px',
              fontWeight: '700',
            }}
          >
            Moteur de Contenu
          </h1>
          <p style={{ margin: '0', color: DESIGN_SYSTEM.colors.muted, fontSize: '16px' }}>
            Gérez votre contenu organique avec l'intelligence artificielle
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#FEE2E2',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: `1px solid #FCA5A5`,
            }}
          >
            <AlertCircle size={18} color="#DC2626" />
            <div style={{ color: '#991B1B', fontSize: '14px', fontWeight: '500' }}>{error}</div>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#991B1B',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            borderBottom: `2px solid #E5E7EB`,
            paddingBottom: '0',
          }}
        >
          {[
            { id: 'calendar', label: 'Calendrier Éditorial', icon: Calendar },
            { id: 'create', label: 'Créer du contenu', icon: PenTool },
            { id: 'products', label: 'Produits Digitaux', icon: Package },
            { id: 'voice', label: 'Ma Voix', icon: Mic2 },
            { id: 'performance', label: 'Performance', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `3px solid ${DESIGN_SYSTEM.colors.green}` : '3px solid transparent',
                  color: activeTab === tab.id ? DESIGN_SYSTEM.colors.green : DESIGN_SYSTEM.colors.muted,
                  fontFamily: DESIGN_SYSTEM.font,
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'calendar' && renderCalendarTab()}
          {activeTab === 'create' && renderCreateContentTab()}
          {activeTab === 'products' && renderProductsTab()}
          {activeTab === 'voice' && renderVoiceTab()}
          {activeTab === 'performance' && renderPerformanceTab()}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Helper functions
function getContentTypeColor(type: string): string {
  const colors: Record<string, string> = {
    blog: '#3B82F6',
    linkedin: '#A855F7',
    instagram: '#EC4899',
    carousel: '#F97316',
    reel: '#EF4444',
    tiktok: '#06B6D4',
    email: '#F97316',
    google: '#22C55E',
  };
  return colors[type] || '#6B7280';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: '#10B981',
    in_progress: '#D97706',
    skipped: '#EF4444',
    planned: '#6B7280',
  };
  return colors[status] || '#6B7280';
}
