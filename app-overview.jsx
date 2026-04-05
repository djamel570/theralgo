import { useState } from "react";
import {
  BarChart3, Users, Zap, Brain, Video, FileText, Calendar, PenTool,
  Share2, ShoppingBag, Rocket, Target, TrendingUp, ArrowRight,
  CheckCircle2, Sparkles, Globe, Mail, Mic2, Package, MousePointer,
  UserPlus, Euro, BarChart2, Shield, Clock, Layers, Database,
  Code, Cpu, Activity, Star, ChevronDown, ChevronRight as ChevronR,
  ExternalLink, Layout, Settings, Bell, BookOpen
} from "lucide-react";

const G = "#72C15F";
const GA = "#5DB847";
const D = "#1A1A1A";
const M = "#6B7280";
const C = "#F7F4EE";
const W = "#FFFFFF";
const F = "'Plus Jakarta Sans', system-ui, sans-serif";

const stats = [
  { label: "Fichiers TypeScript", value: "178", icon: Code },
  { label: "Lignes de code", value: "46 762", icon: Layers },
  { label: "Routes API", value: "68", icon: Database },
  { label: "Pages", value: "27", icon: Layout },
  { label: "Migrations SQL", value: "11", icon: Database },
  { label: "Tables DB", value: "30+", icon: Cpu },
];

const modules = [
  {
    id: "targeting",
    icon: Target,
    title: "Ciblage Algorithmique",
    color: "#3B82F6",
    tagline: "L'intelligence qui transforme chaque euro en patients",
    features: [
      {
        name: "Signal Accelerator",
        desc: "14 micro-événements envoyés au Meta Conversions API pour 8x plus de signaux — la phase d'apprentissage passe de 50 à 6 conversions",
        icon: Zap,
      },
      {
        name: "Creative Director AI",
        desc: "Claude analyse les vidéos du thérapeute sur 6 dimensions (authenticité, émotion, clarté, hook, CTA, technique) et génère des scripts optimisés",
        icon: Video,
      },
      {
        name: "Adaptive Funnel",
        desc: "Landing pages dynamiques qui s'adaptent en temps réel selon le segment d'intention du visiteur (urgence, curiosité, recommandation, chronique)",
        icon: Activity,
      },
      {
        name: "Agent d'Optimisation",
        desc: "Agent autonome qui analyse les campagnes toutes les 6h, ajuste les budgets, pause les sous-performants, et alerte via Slack",
        icon: Brain,
      },
    ],
  },
  {
    id: "products",
    icon: ShoppingBag,
    title: "Produits Digitaux",
    color: "#A855F7",
    tagline: "Transformez votre expertise en revenus passifs",
    features: [
      {
        name: "Product Builder AI",
        desc: "Claude génère des programmes audio, mini-cours, ateliers live et abonnements complets — modules, scripts, exercices, page de vente",
        icon: Sparkles,
      },
      {
        name: "Storefront Stripe",
        desc: "Checkout intégré, webhooks de livraison automatique, gestion des accès par token sécurisé, emails de séquence post-achat",
        icon: Euro,
      },
      {
        name: "Launch Engine",
        desc: "Création automatique de campagnes Meta Ads pour le lancement de chaque produit — audiences, créatifs, budget optimisé",
        icon: Rocket,
      },
      {
        name: "Revenue Dashboard",
        desc: "Suivi en temps réel : ventes, revenus, flywheel health (quand les ventes digitales couvrent le budget pub)",
        icon: TrendingUp,
      },
    ],
  },
  {
    id: "content",
    icon: PenTool,
    title: "Content Engine",
    color: "#EC4899",
    tagline: "Une machine à contenu organique personnalisée",
    features: [
      {
        name: "Voice DNA",
        desc: "Capture la voix unique du thérapeute via interview et analyse vidéo — tons, expressions, métaphores, style. Chaque contenu sonne comme lui, pas comme une IA",
        icon: Mic2,
      },
      {
        name: "SEO Intelligence",
        desc: "Stratégie de mots-clés par spécialité/ville, clusters pilier+satellites, topics saisonniers, optimisation meta — du SEO d'agence, automatisé",
        icon: Globe,
      },
      {
        name: "Calendrier Éditorial",
        desc: "Planning hebdomadaire intelligent : blog lundi, LinkedIn mardi, email mercredi, Instagram jeudi, Reel vendredi, Google samedi",
        icon: Calendar,
      },
      {
        name: "Product Bridge",
        desc: "Contenu organique qui fait le pont vers les produits digitaux — 5 stratégies (mention douce → promo directe), séquences de lancement 5 semaines, nurturing email",
        icon: Package,
      },
    ],
  },
  {
    id: "referral",
    icon: Share2,
    title: "Parrainage Patient",
    color: "#F97316",
    tagline: "Le bouche-à-oreille digitalisé et récompensé",
    features: [
      {
        name: "Liens de Partage",
        desc: "Chaque patient reçoit un lien unique à partager via WhatsApp, email ou SMS — message pré-rédigé, naturel, un clic suffit",
        icon: ExternalLink,
      },
      {
        name: "Landing Personnalisée",
        desc: "Le proche clique et voit : 'Recommandé par {prénom}' + profil du thérapeute + formulaire de booking ou produit digital",
        icon: UserPlus,
      },
      {
        name: "Campagnes Auto",
        desc: "Déclenche le partage au bon moment : après la 3ème séance, après un achat, ou manuellement. Le timing fait tout",
        icon: Clock,
      },
      {
        name: "Récompenses",
        desc: "Le patient qui parraine reçoit une réduction, séance offerte, ou produit gratuit. Tout est tracké : clics, conversions, revenus",
        icon: Star,
      },
    ],
  },
  {
    id: "booking",
    icon: Calendar,
    title: "Rendez-vous & Leads",
    color: "#06B6D4",
    tagline: "Du clic au cabinet, sans friction",
    features: [
      {
        name: "Booking Intégré",
        desc: "Calendrier avec disponibilités, widget embeddable sur les landing pages, webhook Calendly, gestion complète du cycle de vie",
        icon: Calendar,
      },
      {
        name: "Lead Manager",
        desc: "Capture, qualification, scoring, suivi des leads avec filtres et actions — de la pub au premier rendez-vous",
        icon: Users,
      },
      {
        name: "Notifications",
        desc: "Alertes en temps réel : nouveau lead, vente produit, rendez-vous confirmé — badge dans la cloche, jamais un lead perdu",
        icon: Bell,
      },
      {
        name: "Intégrations Webhook",
        desc: "Stripe (paiements), Calendly (bookings), Meta CAPI (signals) — tout se synchronise automatiquement",
        icon: Settings,
      },
    ],
  },
  {
    id: "dashboard",
    icon: Layout,
    title: "Dashboard Thérapeute",
    color: "#10B981",
    tagline: "Tout piloter depuis un seul écran",
    features: [
      {
        name: "Command Center",
        desc: "Vue unifiée : patients acquis, leads en attente, revenus produits, ROI, statut campagnes, signal multiplier, recommandations IA",
        icon: BarChart3,
      },
      {
        name: "Onboarding 3 Tracks",
        desc: "Parcours adapté : 'Remplir mon agenda' (acquisition), 'Produits digitaux', ou les deux — la navigation et les métriques s'adaptent",
        icon: BookOpen,
      },
      {
        name: "Vidéothèque",
        desc: "Upload drag-and-drop, analyse automatique par Creative Director AI, bibliothèque de scripts générés",
        icon: Video,
      },
      {
        name: "Pages Publiques",
        desc: "Landing dynamique /t/{slug}, page produit /p/{slug}, calculateur ROI, pages SEO par spécialité — tout généré par l'IA",
        icon: Globe,
      },
    ],
  },
];

const techStack = [
  { name: "Next.js 16", desc: "App Router, Server Components", color: "#000" },
  { name: "Supabase", desc: "Auth, PostgreSQL, RLS, Storage", color: "#3ECF8E" },
  { name: "Claude API", desc: "claude-sonnet-4, multimodal", color: "#D4A574" },
  { name: "Meta API", desc: "Marketing API v21, CAPI, Pixel", color: "#1877F2" },
  { name: "Stripe", desc: "Checkout, Connect, Webhooks", color: "#635BFF" },
  { name: "Vercel", desc: "Deploy, Cron, Edge", color: "#000" },
];

const infrastructure = [
  "Circuit breaker + retry exponential backoff",
  "Zod validation sur toutes les routes API",
  "Row Level Security (47 policies)",
  "Rate limiting (public/auth/admin)",
  "CSRF double-submit cookie",
  "CSP + HSTS + security headers",
  "Structured JSON logging",
  "Alertes Slack automatiques",
  "96 tests (Vitest)",
];

const routes = [
  { path: "/", desc: "Landing page Theralgo" },
  { path: "/login · /signup", desc: "Auth Supabase" },
  { path: "/dashboard", desc: "Command Center" },
  { path: "/dashboard/onboarding", desc: "Wizard 3 tracks" },
  { path: "/dashboard/leads", desc: "Gestion des leads" },
  { path: "/dashboard/bookings", desc: "Calendrier RDV" },
  { path: "/dashboard/products", desc: "Produits digitaux" },
  { path: "/dashboard/videos", desc: "Vidéothèque" },
  { path: "/dashboard/content", desc: "Content Engine (5 onglets)" },
  { path: "/dashboard/referrals", desc: "Parrainage patient" },
  { path: "/admin/targeting", desc: "Ciblage algorithmique" },
  { path: "/admin/products", desc: "Product Builder" },
  { path: "/t/[slug]", desc: "Landing thérapeute (adaptive)" },
  { path: "/p/[slug]", desc: "Page vente produit" },
  { path: "/r/[slug]", desc: "Landing parrainage" },
  { path: "/calculateur", desc: "Calculateur ROI public" },
  { path: "/pour/[specialty]", desc: "Pages SEO par spécialité" },
];

function Section({ children, bg = W }) {
  return (
    <div style={{ backgroundColor: bg, padding: "48px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 40, textAlign: "center" }}>
      <h2 style={{ fontFamily: F, fontSize: 32, fontWeight: 800, color: D, margin: 0 }}>{children}</h2>
      {sub && <p style={{ fontFamily: F, fontSize: 16, color: M, marginTop: 8 }}>{sub}</p>}
    </div>
  );
}

export default function AppOverview() {
  const [expandedModule, setExpandedModule] = useState("targeting");
  const [showAllRoutes, setShowAllRoutes] = useState(false);

  return (
    <div style={{ fontFamily: F, color: D, backgroundColor: C, minHeight: "100vh" }}>
      {/* ═══ HERO ═══ */}
      <div style={{
        background: `linear-gradient(135deg, ${D} 0%, #2D2D2D 100%)`,
        padding: "64px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "rgba(114,193,95,0.15)",
            padding: "8px 20px",
            borderRadius: 9999,
            marginBottom: 24,
          }}>
            <Sparkles size={16} style={{ color: G }} />
            <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: G, letterSpacing: 1 }}>
              APERÇU PLATEFORME
            </span>
          </div>
          <h1 style={{ fontFamily: F, fontSize: 52, fontWeight: 800, color: W, margin: "0 0 16px", lineHeight: 1.1 }}>
            Theralgo
          </h1>
          <p style={{ fontFamily: F, fontSize: 20, color: "rgba(255,255,255,0.7)", maxWidth: 600, margin: "0 auto 32px", lineHeight: 1.5 }}>
            La plateforme marketing complète pour thérapeutes — du ciblage algorithmique aux produits digitaux, en passant par le contenu organique et le parrainage patient.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: F, fontSize: 28, fontWeight: 800, color: G }}>{s.value}</div>
                  <div style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    <Icon size={12} /> {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ FLYWHEEL ═══ */}
      <Section bg={W}>
        <SectionTitle sub="Chaque composant alimente les autres — plus ça tourne, plus c'est puissant">
          Le Flywheel Theralgo
        </SectionTitle>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
          {[
            { icon: Target, label: "Ciblage\nAlgorithmique", color: "#3B82F6", arrow: true },
            { icon: Users, label: "Patients\nAcquis", color: "#06B6D4", arrow: true },
            { icon: Share2, label: "Parrainage\nPatient", color: "#F97316", arrow: true },
            { icon: ShoppingBag, label: "Produits\nDigitaux", color: "#A855F7", arrow: true },
            { icon: Euro, label: "Revenus\nPassifs", color: "#10B981", arrow: true },
            { icon: PenTool, label: "Contenu\nOrganique", color: "#EC4899", arrow: false },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ textAlign: "center", width: 120 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    backgroundColor: `${step.color}15`, border: `2px solid ${step.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 8px",
                  }}>
                    <Icon size={28} style={{ color: step.color }} />
                  </div>
                  <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: D, whiteSpace: "pre-line", lineHeight: 1.3 }}>
                    {step.label}
                  </div>
                </div>
                {step.arrow && (
                  <ArrowRight size={20} style={{ color: "#D1D5DB", flexShrink: 0, margin: "0 4px" }} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ fontFamily: F, fontSize: 12, color: M, fontStyle: "italic" }}>
            Le contenu organique nourrit le pixel Meta → le ciblage s'améliore → plus de patients → plus de parrainages → cycle vertueux
          </span>
        </div>
      </Section>

      {/* ═══ MODULES ═══ */}
      <Section bg={C}>
        <SectionTitle sub="6 modules interconnectés, chacun alimenté par l'IA">
          Architecture Fonctionnelle
        </SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isOpen = expandedModule === mod.id;
            return (
              <div
                key={mod.id}
                style={{
                  backgroundColor: W,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: isOpen ? `0 4px 20px ${mod.color}20` : "0 1px 3px rgba(0,0,0,0.06)",
                  border: isOpen ? `2px solid ${mod.color}40` : "2px solid transparent",
                  transition: "all 0.3s",
                }}
              >
                <div
                  onClick={() => setExpandedModule(isOpen ? null : mod.id)}
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    backgroundColor: `${mod.color}12`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={24} style={{ color: mod.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: D }}>{mod.title}</div>
                    <div style={{ fontFamily: F, fontSize: 13, color: M }}>{mod.tagline}</div>
                  </div>
                  <ChevronDown
                    size={20}
                    style={{
                      color: M,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>
                {isOpen && (
                  <div style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {mod.features.map((feat, i) => {
                      const FIcon = feat.icon;
                      return (
                        <div key={i} style={{
                          padding: 16, borderRadius: 12, backgroundColor: C,
                          border: "1px solid #E5E7EB",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <FIcon size={16} style={{ color: mod.color }} />
                            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: D }}>{feat.name}</span>
                          </div>
                          <div style={{ fontFamily: F, fontSize: 12, color: M, lineHeight: 1.5 }}>{feat.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ═══ ROUTES ═══ */}
      <Section bg={W}>
        <SectionTitle sub="27 pages, 68 routes API">
          Structure de l'Application
        </SectionTitle>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 8,
        }}>
          {(showAllRoutes ? routes : routes.slice(0, 8)).map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px", borderRadius: 10,
              backgroundColor: C, border: "1px solid #E5E7EB",
            }}>
              <code style={{
                fontFamily: "monospace", fontSize: 12, fontWeight: 600,
                color: G, backgroundColor: `${G}12`,
                padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap",
              }}>
                {r.path}
              </code>
              <span style={{ fontFamily: F, fontSize: 12, color: M }}>{r.desc}</span>
            </div>
          ))}
        </div>
        {!showAllRoutes && routes.length > 8 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={() => setShowAllRoutes(true)}
              style={{
                fontFamily: F, fontSize: 13, fontWeight: 600,
                color: G, backgroundColor: "transparent", border: `1px solid ${G}`,
                padding: "8px 20px", borderRadius: 9999, cursor: "pointer",
              }}
            >
              Voir les {routes.length - 8} routes restantes
            </button>
          </div>
        )}
      </Section>

      {/* ═══ TECH STACK ═══ */}
      <Section bg={C}>
        <SectionTitle sub="Stack moderne, production-ready">
          Technologies
        </SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
          {techStack.map((t, i) => (
            <div key={i} style={{
              padding: 20, borderRadius: 12, backgroundColor: W,
              border: "1px solid #E5E7EB", textAlign: "center",
            }}>
              <div style={{ fontFamily: F, fontSize: 18, fontWeight: 800, color: t.color }}>{t.name}</div>
              <div style={{ fontFamily: F, fontSize: 12, color: M, marginTop: 4 }}>{t.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: W, borderRadius: 16, padding: 24, border: "1px solid #E5E7EB" }}>
          <div style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: D, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={18} style={{ color: G }} /> Infrastructure & Sécurité
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {infrastructure.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <CheckCircle2 size={14} style={{ color: G, marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontFamily: F, fontSize: 12, color: M, lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ DATA MODEL ═══ */}
      <Section bg={W}>
        <SectionTitle sub="11 migrations, 30+ tables, 47 RLS policies">
          Modèle de Données
        </SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { title: "Core", tables: ["therapists", "campaigns", "ad_sets", "ads", "campaign_metrics", "leads"], color: "#3B82F6" },
            { title: "Ciblage", tables: ["micro_events", "session_scores", "video_analyses", "video_scripts", "funnel_variants"], color: "#F97316" },
            { title: "Produits", tables: ["digital_products", "purchases", "scheduled_emails", "product_analytics"], color: "#A855F7" },
            { title: "Booking", tables: ["bookings", "therapist_availability", "notifications", "onboarding_progress"], color: "#06B6D4" },
            { title: "Content", tables: ["voice_profiles", "seo_keywords", "content_pieces", "editorial_calendar", "content_analytics", "content_templates"], color: "#EC4899" },
            { title: "Referral", tables: ["referral_links", "referral_clicks", "referral_rewards", "referral_campaigns", "referral_messages"], color: "#F97316" },
          ].map((group, i) => (
            <div key={i} style={{
              padding: 16, borderRadius: 12, backgroundColor: C,
              border: `1px solid ${group.color}30`,
            }}>
              <div style={{
                fontFamily: F, fontSize: 13, fontWeight: 700,
                color: group.color, marginBottom: 8,
                textTransform: "uppercase", letterSpacing: 0.5,
              }}>
                {group.title}
              </div>
              {group.tables.map((t, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: group.color, opacity: 0.5 }} />
                  <code style={{ fontFamily: "monospace", fontSize: 11, color: D }}>{t}</code>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* ═══ FOOTER ═══ */}
      <div style={{
        background: `linear-gradient(135deg, ${D} 0%, #2D2D2D 100%)`,
        padding: "40px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: F, fontSize: 24, fontWeight: 800, color: W, marginBottom: 8 }}>
          Theralgo
        </div>
        <div style={{ fontFamily: F, fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
          La plateforme qui transforme chaque thérapeute isolé en machine d'acquisition et de revenus
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {[
            { label: "Fichiers", value: "178" },
            { label: "Lignes", value: "46 762" },
            { label: "APIs", value: "68" },
            { label: "Tables", value: "30+" },
            { label: "Tests", value: "96" },
            { label: "Migrations", value: "11" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: F, fontSize: 20, fontWeight: 800, color: G }}>{s.value}</div>
              <div style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 24 }}>
          Next.js 16 · Supabase · Claude API · Meta Marketing API · Stripe · Vercel
        </div>
      </div>
    </div>
  );
}
