'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Home, MapPin, Users, Clock, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard/home', icon: Home, label: 'Home' },
  { href: '/dashboard/map', icon: MapPin, label: 'Track' },
  { href: '/dashboard/contacts', icon: Users, label: 'Contacts' },
  { href: '/dashboard/history', icon: Clock, label: 'History' },
  { href: '/dashboard/settings', icon: Settings, label: 'Profile' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.replace('/auth/login')
    }
    checkAuth()
  }, [router])

  return (
    <div className="page-container flex flex-col min-h-screen bg-brand-dark">
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-brand-dark/95 backdrop-blur-xl border-t border-brand-border z-50">
        <div className="flex justify-around items-center px-2 pt-2 pb-safe pb-4">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <button key={href} onClick={() => router.push(href)}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all relative">
                {active && (
                  <motion.div layoutId="nav-indicator"
                    className="absolute inset-0 bg-brand-red/10 rounded-xl border border-brand-red/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                )}
                <Icon size={22} className={active ? 'text-brand-red' : 'text-brand-muted'} />
                <span className={`text-[10px] font-semibold ${active ? 'text-brand-red' : 'text-brand-muted'}`}>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
