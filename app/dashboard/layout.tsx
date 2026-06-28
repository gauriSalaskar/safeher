'use client'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Home, MapPin, Users, Clock, Settings, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard/home',     icon: Home,     label: 'Home'     },
  { href: '/dashboard/map',      icon: MapPin,   label: 'Track'    },
  { href: '/dashboard/contacts', icon: Users,    label: 'Contacts' },
  { href: '/dashboard/history',  icon: Clock,    label: 'History'  },
  { href: '/dashboard/settings', icon: Settings, label: 'Profile'  },
]

// --- Grain texture overlay (covers entire dashboard) ---
function GrainOverlay() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[60] w-full h-full opacity-[0.04] mix-blend-overlay"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="grain-dashboard">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-dashboard)" />
    </svg>
  )
}

// --- Scroll progress bar tied to the main scroll container ---
function ScrollProgressBar({ targetRef }: { targetRef: React.RefObject<HTMLElement> }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const max = scrollHeight - clientHeight
      setProgress(max > 0 ? Math.min(1, scrollTop / max) : 0)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [targetRef])

  return (
    <div className="fixed top-0 left-0 lg:left-[220px] right-0 h-[3px] z-[70] bg-transparent">
      <motion.div
        className="h-full bg-brand-red"
        style={{
          width: `${progress * 100}%`,
          boxShadow: '0 0 8px rgba(255,45,85,0.7)',
        }}
        transition={{ duration: 0.1 }}
      />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.replace('/auth/login')
    }
    checkAuth()
  }, [router])

  return (
    <div className="flex min-h-screen bg-brand-dark">
      <GrainOverlay />
      <ScrollProgressBar targetRef={mainRef} />

      {/* ── SIDEBAR (desktop only, lg+) ── */}
      <aside className="
        hidden lg:flex flex-col
        w-[220px] shrink-0
        fixed inset-y-0 left-0 z-50
        bg-brand-dark2 border-r border-brand-border
      ">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-6 py-6 border-b border-brand-border">
          <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-syne font-bold text-white text-lg tracking-tight">SafeHer</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="relative flex items-center gap-3 px-3 py-3 rounded-xl text-left w-full transition-all"
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute inset-0 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    style={{
                      background: 'linear-gradient(90deg, rgba(255,45,85,0.15), rgba(255,45,85,0.05))',
                      border: '1px solid rgba(255,45,85,0.25)',
                      boxShadow: '0 0 16px rgba(255,45,85,0.15), inset 0 0 12px rgba(255,45,85,0.05)',
                    }}
                  />
                )}

                {/* Left accent bar */}
                {active && (
                  <motion.div
                    layoutId="sidebar-bar"
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                    style={{ background: 'linear-gradient(180deg, #FF2D55, #c0003c)', boxShadow: '0 0 8px rgba(255,45,85,0.8)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}

                <Icon
                  size={20}
                  className={active ? 'text-brand-red relative z-10' : 'text-brand-muted relative z-10'}
                  style={active ? { filter: 'drop-shadow(0 0 6px rgba(255,45,85,0.8))' } : {}}
                />
                <span className={`text-sm font-semibold relative z-10 ${active ? 'text-brand-red' : 'text-brand-muted'}`}
                  style={active ? { textShadow: '0 0 12px rgba(255,45,85,0.5)' } : {}}>
                  {label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
      <div className="px-4 py-4 border-t border-brand-border flex items-center justify-between">
  <p className="text-[10px] text-brand-muted/50 font-dm">SafeHer v2.4</p>
  <ThemeToggle />
</div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="
        flex flex-col flex-1
        lg:ml-[220px]
        min-h-screen
      ">
        <main
          ref={mainRef}
          className="
            flex-1 overflow-y-auto
            pb-24 lg:pb-0
            w-full
            max-w-[430px] mx-auto lg:max-w-none lg:mx-0
          "
        >
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile only, hidden on lg+) ── */}
      <nav className="
        lg:hidden
        fixed bottom-0 left-0 right-0
        bg-brand-dark/95 backdrop-blur-xl
        border-t border-brand-border
        z-50
      ">
        <div className="flex justify-around items-center px-2 pt-2 pb-4">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all relative"
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,45,85,0.15), rgba(255,45,85,0.05))',
                      border: '1px solid rgba(255,45,85,0.25)',
                      boxShadow: '0 0 12px rgba(255,45,85,0.2)',
                    }}
                  />
                )}
                <Icon
                  size={22}
                  className={active ? 'text-brand-red' : 'text-brand-muted'}
                  style={active ? { filter: 'drop-shadow(0 0 6px rgba(255,45,85,0.8))' } : {}}
                />
                <span className={`text-[10px] font-semibold ${active ? 'text-brand-red' : 'text-brand-muted'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

    </div>
  )
}