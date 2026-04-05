'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, User, Video, BarChart2, Settings, LogOut, Menu, X, Calendar, Users, Package, PenTool, Share2, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import NotificationBell from '@/components/ui/NotificationBell'
import { OnboardingTrack } from '@/lib/onboarding'

/* ── Design tokens (MindMarket-inspired) ──────────────── */
const G  = '#72C15F'   // lime green
const GN = '#5DB847'   // green accent
const T  = '#1A1A1A'   // text dark
const M  = '#6B7280'   // muted
const C  = '#F7F4EE'   // cream bg
const W  = '#FFFFFF'   // white

const baseNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/dashboard/content', icon: PenTool, label: 'Mon Contenu' },
  { href: '/dashboard/corporate', icon: Building2, label: 'Entreprises' },
  { href: '/dashboard/videos', icon: Video, label: 'Ma Vidéothèque' },
  { href: '/dashboard/profile', icon: User, label: 'Mon Profil' },
]

const acquisitionNav = [
  { href: '/dashboard/leads', icon: Users, label: 'Mes leads' },
  { href: '/dashboard/bookings', icon: Calendar, label: 'Mes rendez-vous' },
  { href: '/dashboard/referrals', icon: Share2, label: 'Parrainage' },
]

const digitalProductsNav = [
  { href: '/dashboard/products', icon: Package, label: 'Mes produits' },
  { href: '/dashboard/sales', icon: BarChart2, label: 'Mes ventes' },
  { href: '/dashboard/referrals', icon: Share2, label: 'Parrainage' },
]

function getNavItemsForTrack(track: OnboardingTrack | null) {
  const nav = [...baseNav]

  if (track === 'acquisition') {
    return [...nav.slice(0, 1), ...acquisitionNav, ...nav.slice(1)]
  } else if (track === 'digital_products') {
    return [...nav.slice(0, 1), ...digitalProductsNav, ...nav.slice(1)]
  } else if (track === 'both') {
    return [...nav.slice(0, 1), ...acquisitionNav, ...digitalProductsNav, ...nav.slice(1)]
  }

  return nav
}

function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" fill={GN}/>
      <path d="M9 14 Q14 7 19 14 Q14 21 9 14Z" fill="white"/>
    </svg>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: { id?: string; name?: string; email?: string }
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userTrack, setUserTrack] = useState<OnboardingTrack | null>(null)
  const [navLoading, setNavLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserTrack = async () => {
      if (!user?.id) {
        setNavLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('onboarding_progress')
          .select('selected_track')
          .eq('user_id', user.id)
          .single()

        setUserTrack((data?.selected_track as OnboardingTrack) || null)
      } catch (err) {
        console.error('Error fetching user track:', err)
      } finally {
        setNavLoading(false)
      }
    }

    fetchUserTrack()
  }, [user?.id, supabase])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = (user?.name?.[0] || user?.email?.[0] || 'T').toUpperCase()

  const Sidebar = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:W, borderRight:`1px solid rgba(0,0,0,.07)` }}>
      {/* Logo */}
      <div style={{ padding:'1.5rem 1.25rem 1.25rem', borderBottom:'1px solid rgba(0,0,0,.07)' }}>
        <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:10, textDecoration:'none', background:C, borderRadius:999, padding:'.5rem 1rem' }}>
          <LogoMark size={22}/>
          <span style={{ fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", fontWeight:800, fontSize:'.9rem', color:T }}>
            Ther<span style={{ color:GN }}>algo</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'1rem .75rem', display:'flex', flexDirection:'column', gap:4 }}>
        {!navLoading && getNavItemsForTrack(userTrack).map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'.65rem 1rem', borderRadius:999,
                textDecoration:'none', fontSize:'.86rem', fontWeight:600,
                transition:'all .22s ease',
                background: active ? T : 'transparent',
                color: active ? 'white' : M,
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = C; (e.currentTarget as HTMLElement).style.color = T } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = M } }}
            >
              <div style={{ width:28, height:28, borderRadius:8, background:active?'rgba(255,255,255,.12)':'rgba(0,0,0,.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon style={{ width:14, height:14 }}/>
              </div>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Status dot */}
      <div style={{ margin:'0 .75rem', padding:'1rem', borderRadius:20, background:C, marginBottom:'.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'.5rem' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:GN }}/>
          <span style={{ fontSize:'.72rem', fontWeight:700, color:GN, letterSpacing:'.06em' }}>Système actif</span>
        </div>
        <p style={{ fontSize:'.72rem', color:M, lineHeight:1.6 }}>Vos campagnes sont en cours d'optimisation.</p>
      </div>

      {/* User */}
      <div style={{ padding:'.75rem', borderTop:'1px solid rgba(0,0,0,.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'.5rem 1rem', marginBottom:4 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:T, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'.85rem', flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'.82rem', fontWeight:700, color:T, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.name || 'Thérapeute'}
            </p>
            <p style={{ fontSize:'.7rem', color:M, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button onClick={logout}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'.5rem 1rem', borderRadius:999, border:'none', background:'transparent', fontSize:'.8rem', color:M, cursor:'pointer', transition:'all .2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,.08)'; (e.currentTarget as HTMLElement).style.color = '#EF4444' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = M }}
        >
          <LogOut style={{ width:14, height:14 }} />
          Se déconnecter
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', background:C, overflow:'hidden', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:block" style={{ width:248, flexShrink:0 }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden" style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }}>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.25)', backdropFilter:'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ position:'relative', width:248, boxShadow:'4px 0 24px rgba(0,0,0,.12)' }}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Desktop topbar */}
        <div className="hidden lg:flex" style={{ background:W, borderBottom:'1px solid rgba(0,0,0,.07)', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'1rem' }}>
          {user?.id && <NotificationBell userId={user.id} />}
        </div>

        {/* Mobile topbar */}
        <div className="lg:hidden" style={{ background:W, borderBottom:'1px solid rgba(0,0,0,.07)', padding:'1rem 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ border:'none', background:'transparent', cursor:'pointer', color:T, padding:'.4rem', borderRadius:8 }}>
            <Menu style={{ width:22, height:22 }} />
          </button>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
            <LogoMark size={20}/>
            <span style={{ fontWeight:800, fontSize:'.9rem', color:T }}>Ther<span style={{ color:GN }}>algo</span></span>
          </div>
          {user?.id && <NotificationBell userId={user.id} />}
        </div>

        <main style={{ flex:1, overflowY:'auto', padding:'2.5rem 2rem', background:C }}>
          <div style={{ maxWidth:980, margin:'0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>
    </div>
  )
}
