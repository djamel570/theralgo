'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Logo component ──────────────────────────────────────────────────────── */
function TherAlgoLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {/* Leaf icon */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 2C16 2 28 8 28 18C28 24.627 22.627 30 16 30C9.373 30 4 24.627 4 18C4 8 16 2 16 2Z"
          fill="#4A7C59"
          fillOpacity="0.15"
          stroke="#4A7C59"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M16 4C16 4 16 16 16 28" stroke="#4A7C59" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M16 12C16 12 11 14 8 18" stroke="#4A7C59" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.4" />
        <path d="M16 16C16 16 21 18 24 22" stroke="#4A7C59" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.4" />
        <path d="M16 20C16 20 12 21 10 23" stroke="#4A7C59" strokeWidth="0.7" strokeLinecap="round" strokeOpacity="0.3" />
      </svg>
      {/* Wordmark */}
      <span className={cn("font-bold text-xl tracking-wide", dark ? "text-[#2D4A38]" : "text-[#2D4A38]")}>
        Ther<span style={{ color: '#4A7C59' }}>algo</span>
      </span>
    </div>
  )
}

export { TherAlgoLogo }

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-700',
      scrolled
        ? 'bg-[#F7F3EE]/95 backdrop-blur-xl border-b border-[#4A7C59]/10 shadow-sm'
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/"><TherAlgoLogo /></Link>

          <div className="hidden md:flex items-center gap-10">
            {[
              { label: 'Système', href: '#systeme' },
              { label: 'Notre équipe', href: '#technologie' },
              { label: 'Tarifs', href: '#tarifs' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="text-sm font-medium text-[#5C6B5E] hover:text-[#2D4A38] transition-colors">
                {label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <button className="text-sm text-[#5C6B5E] hover:text-[#2D4A38] transition-colors font-medium px-4 py-2">
                Connexion
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-5 py-2.5 text-sm font-semibold rounded-full bg-[#2D4A38] text-white hover:bg-[#4A7C59] transition-all duration-300 shadow-sm hover:shadow-md">
                Commencer →
              </button>
            </Link>
          </div>

          <button className="md:hidden text-[#4A7C59]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-[#F7F3EE] border border-[#4A7C59]/10 rounded-2xl mb-4 p-6 flex flex-col gap-4">
            <TherAlgoLogo />
            {[
              { label: 'Système', href: '#systeme' },
              { label: 'Notre équipe', href: '#technologie' },
              { label: 'Tarifs', href: '#tarifs' },
            ].map(({ label, href }) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} className="text-[#5C6B5E] text-sm py-1">{label}</a>
            ))}
            <div className="flex gap-3 pt-2 border-t border-[#4A7C59]/10">
              <Link href="/login" className="flex-1">
                <button className="w-full px-4 py-2 text-sm border border-[#4A7C59]/30 text-[#2D4A38] rounded-full">Connexion</button>
              </Link>
              <Link href="/signup" className="flex-1">
                <button className="w-full px-4 py-2 text-sm bg-[#2D4A38] text-white rounded-full font-semibold">Commencer</button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
