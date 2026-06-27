'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Phone, MessageCircle, Clock, Shield, Bell, Zap, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import SOSButton from '@/components/sos/SOSButton'
import StatusBar from '@/components/ui/StatusBar'
import { useSOSStore } from '@/hooks/useSOSStore'
import { useShakeDetector } from '@/hooks/useShakeDetector'
import { useBatteryAlert } from '@/hooks/useBatteryAlert'
import { useNotifications } from '@/hooks/useNotifications'
import { getCurrentLocation, reverseGeocode } from '@/services/location'
import { createClient } from '@/lib/supabase/client'
import { queueOfflineSOS, registerOfflineSyncListener, isOffline, saveLastKnownLocation } from '@/services/offline'
import type { User, EmergencyContact } from '@/types'

const QUICK_ACTIONS = [
  { icon: MapPin, label: 'Live Track', sub: 'Share location', color: 'text-brand-blue', bg: 'bg-brand-blue/15 border border-brand-blue/20', href: '/dashboard/map' },
  { icon: Phone, label: 'Fake Call', sub: 'Escape safely', color: 'text-brand-green', bg: 'bg-brand-green/15 border border-brand-green/20', href: '/emergency/fake-call' },
  { icon: MessageCircle, label: 'AI Guardian', sub: 'Get guidance', color: 'text-brand-amber', bg: 'bg-brand-amber/15 border border-brand-amber/20', href: '/dashboard/chat' },
  { icon: Clock, label: 'SOS History', sub: 'Past alerts', color: 'text-brand-red', bg: 'bg-brand-red/15 border border-brand-red/20', href: '/dashboard/history' },
  { icon: Shield, label: 'Safe Route', sub: 'AI safety scoring', color: 'text-brand-blue', bg: 'bg-brand-blue/15 border border-brand-blue/20', href: '/dashboard/safe-route' },
  { icon: Bell, label: 'Check-in', sub: 'Auto-alert if late', color: 'text-brand-amber', bg: 'bg-brand-amber/15 border border-brand-amber/20', href: '/dashboard/checkin' },
]

const AVATAR_COLORS = [
  'from-brand-red to-red-800', 'from-brand-blue to-blue-800',
  'from-brand-green to-green-800', 'from-brand-amber to-amber-700',
  'from-purple-500 to-purple-800',
]

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  width: (((i * 3) % 8) + 6) + 'px',
  height: (((i * 3) % 8) + 6) + 'px',
  left: ((i * 5.1) % 100) + '%',
  animationDuration: ((i * 1.1) % 8 + 6) + 's',
  animationDelay: ((i * 0.7) % 8) + 's',
  opacity: 0.8,
}))

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(value / 20) || 1
    const timer = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(start)
    }, 50)
    return () => clearInterval(timer)
  }, [value])
  return <>{display}</>
}

export default function HomePage() {
  const router = useRouter()
  const { sos, activateSOS, location, setLocation, settings, updateSettings } = useSOSStore()
  const [user, setUser] = useState<User | null>(null)
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [address, setAddress] = useState('Locating...')
  const [battery, setBattery] = useState<number | null>(null)
  const [safeDays, setSafeDays] = useState(0)
  const [sosCount, setSosCount] = useState(0)
  const cursorRef = useRef<HTMLDivElement>(null)

  useBatteryAlert()
  useNotifications()

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px'
        cursorRef.current.style.top = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (profile) setUser(profile as User)

      const { data: ctcts } = await supabase.from('emergency_contacts').select('*').eq('user_id', authUser.id).order('priority')
      if (ctcts) setContacts(ctcts as EmergencyContact[])

      // Fetch real SOS count
 const { data: sosEvents } = await supabase
  .from('sos_alerts')
  .select('id, created_at')
  .eq('user_id', authUser.id)
      const count = sosEvents?.length || 0
      setSosCount(count)

      // Calculate safe days — days since account created minus SOS days
      const createdAt = new Date(authUser.created_at || Date.now())
      const daysSince = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const safe = Math.max(0, daysSince - count)
      setSafeDays(safe)
    }
    load()
  }, [])

  useEffect(() => {
    getCurrentLocation().then(async (loc) => {
      setLocation(loc)
      const addr = await reverseGeocode(loc.latitude, loc.longitude)
      setAddress(addr)
    }).catch(() => setAddress('Location unavailable'))
  }, [setLocation])

  useEffect(() => {
    const cleanup = registerOfflineSyncListener()
    return cleanup
  }, [])

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as Navigator & { getBattery: () => Promise<{ level: number; addEventListener: Function }> }).getBattery().then((bat) => {
        const level = Math.round(bat.level * 100)
        setBattery(level)
        if (level < 15) updateSettings({ lowBatteryMode: true })
        bat.addEventListener('levelchange', () => {
          const newLevel = Math.round(bat.level * 100)
          setBattery(newLevel)
          if (newLevel < 15) updateSettings({ lowBatteryMode: true })
          else updateSettings({ lowBatteryMode: false })
        })
      })
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (location) saveLastKnownLocation(location.latitude, location.longitude)
  }, [location])

  const handleActivateSOS = useCallback(async () => {
    if (sos.isActive) { router.push('/emergency/sos-active'); return }
    activateSOS('manual')
    if (isOffline()) {
      toast.error('📵 Offline — SOS saved locally, will send when reconnected!', { duration: 5000 })
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      queueOfflineSOS({
        id: Date.now().toString(),
        userId: authUser?.id || 'unknown',
        triggerType: 'manual',
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        timestamp: new Date().toISOString(),
      })
    } else {
      toast.error('🚨 SOS ACTIVATED — Alerting contacts!', { duration: 4000, icon: '🚨' })
    }
    router.push('/emergency/sos-active')

    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUser.id, triggerType: "manual", latitude: location?.latitude || 0, longitude: location?.longitude || 0 }),
      })
    } catch (err) {
      console.error('SOS API error:', err)
    }
  }, [sos.isActive, activateSOS, router])

  useShakeDetector({
    threshold: settings.shakeThreshold,
    onShake: useCallback(() => {
      if (!sos.isActive && settings.shakeDetection) {
        toast.error('📳 Shake detected — Activating SOS!', { duration: 3000 })
        handleActivateSOS()
      }
    }, [sos.isActive, settings.shakeDetection, handleActivateSOS]),
  })

  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex flex-col pb-4 lg:pb-8 relative">
      {/* Cursor trail */}
      <div ref={cursorRef} className="cursor-trail hidden lg:block" />

      {/* Aurora */}
      <div className="aurora" />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <div key={p.id} className="particle" style={{
          width: p.width,
          height: p.height,
          left: p.left,
          animationDuration: p.animationDuration,
          animationDelay: p.animationDelay,
          opacity: p.opacity,
        }} />
      ))}

      <div className="bg-blob bg-blob-red" />
      <div className="bg-blob bg-blob-blue" />

      <div className="flex items-center justify-between px-5 lg:px-0 pt-6 pb-2 relative z-10">
        <div>
          <p className="text-brand-muted text-sm">{greeting},</p>
          <h1 className="font-syne font-bold text-2xl">{firstName} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          {battery !== null && (
            <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${battery < 15 ? 'bg-brand-red/15 text-brand-red' : 'bg-brand-card2 text-brand-muted'}`}>
              🔋{battery}%
            </div>
          )}
          <button onClick={() => router.push('/dashboard/settings')}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center font-bold text-sm">
            {firstName[0]?.toUpperCase()}
          </button>
        </div>
      </div>

      {battery !== null && battery < 15 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mx-5 lg:mx-0 mt-2 bg-brand-amber/10 border border-brand-amber/30 rounded-xl px-4 py-3 text-xs text-brand-amber font-semibold relative z-10">
          ⚡ Battery critical — Emergency optimization enabled. Your contacts have been notified!
        </motion.div>
      )}

      <div className="px-0 lg:px-0 relative z-10">
        <StatusBar
          status={sos.isActive ? 'danger' : 'safe'}
          title={sos.isActive ? '🚨 Emergency Active' : 'You are Safe'}
          subtitle={sos.isActive ? 'Contacts alerted · Location broadcasting' : `${address} · All systems active`}
        />
      </div>

      {/* SOS hero — full width, centered */}
      <div className="flex justify-center py-8 lg:py-12 relative z-10">
        <SOSButton onActivate={handleActivateSOS} isActive={sos.isActive} />
      </div>

      <div className="relative z-10">

        {/* Stats — real data */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-2 px-5 lg:px-0 mb-6">
          {[
            { num: safeDays, label: 'Safe Days', color: 'text-brand-green' },
            { num: contacts.length, label: 'Guardians', color: 'text-brand-blue' },
            { num: sosCount, label: 'SOS Sent', color: 'text-brand-red' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-3 text-center">
              <div className={`font-syne text-2xl font-bold ${stat.color}`}>
                <AnimatedCounter value={stat.num} />
              </div>
              <div className="text-[10px] text-brand-muted mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <p className="px-5 lg:px-0 text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">Quick Actions</p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 gap-2.5 px-5 lg:px-0 mb-6">
          {QUICK_ACTIONS.map(({ icon: Icon, label, sub, color, bg, href }) => (
            <motion.button key={label} whileTap={{ scale: 0.96 }}
              onClick={() => router.push(href)}
              className="glass-card p-4 text-left hover:border-brand-red/40 transition-colors">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-2.5`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-brand-muted mt-0.5">{sub}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Emergency Contacts */}
        <p className="px-5 lg:px-0 text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">Emergency Contacts</p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="flex gap-3 px-5 lg:px-0 overflow-x-auto scrollbar-none pb-1 mb-6">
          {contacts.slice(0, 5).map((c, i) => (
            <div key={c.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-base relative`}>
                {c.name[0].toUpperCase()}
                {c.priority === 1 && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-green rounded-full border-2 border-brand-dark" />
                )}
              </div>
              <span className="text-[10px] text-brand-muted text-center">{c.name.split(' ')[0]}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button onClick={() => router.push('/dashboard/contacts')}
              className="w-12 h-12 rounded-full border border-dashed border-brand-border flex items-center justify-center text-brand-muted hover:border-brand-red/50 transition-colors text-lg">
              +
            </button>
            <span className="text-[10px] text-brand-muted">Add</span>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <p className="px-5 lg:px-0 text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">Recent Activity</p>
        <div className="px-5 lg:px-0 space-y-2 pb-4">
          {[
            { icon: CheckCircle, iconBg: 'bg-brand-green/10', iconColor: 'text-brand-green', title: 'Safe check-in completed', sub: 'Reached home safely', time: '2h ago' },
            { icon: MapPin, iconBg: 'bg-brand-blue/10', iconColor: 'text-brand-blue', title: 'Location shared', sub: 'With 3 contacts · 2.4km tracked', time: 'Yesterday' },
            { icon: Shield, iconBg: 'bg-brand-red/10', iconColor: 'text-brand-red', title: 'SOS Alert Sent', sub: 'Manual trigger · Resolved', time: '3d ago' },
            { icon: Bell, iconBg: 'bg-brand-amber/10', iconColor: 'text-brand-amber', title: 'AI Guardian Active', sub: 'Keyword monitoring enabled', time: '5d ago' },
            { icon: Zap, iconBg: 'bg-brand-blue/10', iconColor: 'text-brand-blue', title: 'Shake detection configured', sub: 'Sensitivity: Medium', time: '1w ago' },
          ].map((item) => (
            <div key={item.title} className="glass-card p-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                <item.icon size={16} className={item.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-brand-muted truncate">{item.sub}</p>
              </div>
              <span className="text-[11px] text-brand-muted flex-shrink-0">{item.time}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}