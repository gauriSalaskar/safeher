'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Shield, Bell, Mic, MapPin, Phone, Globe, Moon, Accessibility,
  Lock, LogOut, ChevronRight, Zap, User, Edit2, Play, Clock,
  Calculator, Route, Users, CheckCircle, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useSOSStore } from '@/hooks/useSOSStore'
import type { AppSettings } from '@/types'
import type { User as UserType } from '@/types'

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${on ? 'bg-brand-red' : 'bg-brand-border'}`}>
      <motion.div animate={{ x: on ? 18 : 2 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow" />
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { settings, updateSettings } = useSOSStore()
  const [user, setUser] = useState<UserType | null>(null)
  const [safetyScore, setSafetyScore] = useState(94)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showLangModal, setShowLangModal] = useState(false)
  const [showPanicModal, setShowPanicModal] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [panicWord, setPanicWord] = useState('')
  const [newPanicWord, setNewPanicWord] = useState('')

  useEffect(() => {
    const calcScore = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { data: alerts } = await supabase.from('sos_alerts').select('status,created_at').eq('user_id', authUser.id)
      const { data: contacts } = await supabase.from('emergency_contacts').select('id').eq('user_id', authUser.id)
      const { data: checkins } = await supabase.from('safe_checkins').select('status').eq('user_id', authUser.id)
      let score = 60
      if ((contacts?.length || 0) >= 1) score += 10
      if ((contacts?.length || 0) >= 3) score += 5
      if ((checkins?.filter(c => c.status === 'completed').length || 0) > 0) score += 10
      const resolved = alerts?.filter(a => a.status === 'resolved').length || 0
      if (resolved > 0) score += 10
      if ((alerts?.length || 0) === 0) score += 5
      setSafetyScore(Math.min(100, score))
    }
    calcScore()
  }, [])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (data) {
        setUser(data as UserType)
        setPanicWord(data.panic_word || '')
      }
    }
    load()
  }, [])

  const handlePinChange = async () => {
    if (newPin.length !== 4) { toast.error('PIN must be 4 digits'); return }
    if (newPin !== confirmPin) { toast.error('PINs do not match'); return }
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    const { data: profile } = await supabase.from('users').select('emergency_pin').eq('id', authUser.id).single()
    if (profile?.emergency_pin && currentPin !== profile.emergency_pin) {
      toast.error('Current PIN is incorrect')
      return
    }
    await supabase.from('users').update({ emergency_pin: newPin }).eq('id', authUser.id)
    toast.success('Emergency PIN updated!')
    setShowPinModal(false)
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
  }

  const handlePanicWordSave = async () => {
    if (!newPanicWord.trim()) { toast.error('Please enter a panic word'); return }
    if (newPanicWord.trim().length < 3) { toast.error('Panic word must be at least 3 characters'); return }
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    await supabase.from('users').update({ panic_word: newPanicWord.trim().toLowerCase() }).eq('id', authUser.id)
    setPanicWord(newPanicWord.trim().toLowerCase())
    toast.success('Panic word saved! 🔒')
    setShowPanicModal(false)
    setNewPanicWord('')
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out safely')
    router.push('/')
  }

  const EMERGENCY_SETTINGS = [
    {
      icon: Shield, iconBg: 'bg-brand-red/10', iconColor: 'text-brand-red',
      title: 'Silent SOS Mode', sub: 'No sound or vibration when SOS activates',
      toggle: true, on: settings.silentMode, key: 'silentMode',
    },
    {
      icon: Zap, iconBg: 'bg-brand-amber/10', iconColor: 'text-brand-amber',
      title: 'Shake Detection', sub: `Sensitivity: ${settings.shakeThreshold > 18 ? 'Low' : settings.shakeThreshold > 12 ? 'Medium' : 'High'}`,
      toggle: true, on: settings.shakeDetection, key: 'shakeDetection',
    },
    {
      icon: Mic, iconBg: 'bg-brand-blue/10', iconColor: 'text-brand-blue',
      title: 'AI Keyword Detection', sub: 'Gemini AI monitors for panic phrases',
      toggle: true, on: settings.aiKeywordDetection, key: 'aiKeywordDetection',
    },
    {
      icon: Bell, iconBg: 'bg-brand-green/10', iconColor: 'text-brand-green',
      title: 'Push Notifications', sub: 'Safety alerts and guardian updates',
      toggle: true, on: true, key: null,
    },
    {
      icon: MapPin, iconBg: 'bg-brand-blue/10', iconColor: 'text-brand-blue',
      title: 'Background Location', sub: 'Required for live tracking',
      toggle: true, on: true, key: null,
    },
    {
      icon: Lock, iconBg: 'bg-brand-amber/10', iconColor: 'text-brand-amber',
      title: 'Change Emergency PIN', sub: 'Update your 4-digit cancel code',
      toggle: false, action: () => setShowPinModal(true),
    },
    {
      icon: AlertTriangle, iconBg: 'bg-brand-red/10', iconColor: 'text-brand-red',
      title: 'Panic Word', sub: panicWord ? `Set: "${panicWord}" — type in AI chat to trigger SOS` : 'Not set — tap to add secret word',
      toggle: false, action: () => setShowPanicModal(true),
    },
  ]

  const APP_SETTINGS = [
    { icon: Globe, iconBg: 'bg-brand-blue/10', iconColor: 'text-brand-blue', title: 'Language', sub: settings.language === 'en' ? '🇬🇧 English' : settings.language === 'hi' ? '🇮🇳 हिंदी' : '🇮🇳 मराठी', action: () => setShowLangModal(true) },
    { icon: Moon, iconBg: 'bg-brand-muted/10', iconColor: 'text-brand-muted', title: 'Theme', sub: isDark ? '🌙 Dark Mode' : '☀️ Light Mode', action: () => {
      setIsDark(!isDark)
      toast.success(isDark ? 'Light mode coming soon!' : 'Dark mode enabled!')
    } },
    { icon: Accessibility, iconBg: 'bg-brand-green/10', iconColor: 'text-brand-green', title: 'Accessibility', sub: 'Large text, voice navigation', action: () => { updateSettings({ accessibilityMode: !settings.accessibilityMode }); toast.success('Toggled accessibility') } },
    { icon: Phone, iconBg: 'bg-brand-blue/10', iconColor: 'text-brand-blue', title: 'Fake Call Settings', sub: 'Configure caller name & timing', action: () => router.push('/emergency/fake-call') },
  ]

  const firstName = user?.full_name?.split(' ')[0] || 'User'

  return (
    <div className="flex flex-col pb-4">
      {/* Profile Header */}
      <div className="px-5 pt-6 pb-5 flex flex-col items-center text-center border-b border-brand-border mb-2">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-red to-rose-800 flex items-center justify-center text-3xl font-bold">
            {firstName[0]?.toUpperCase()}
          </div>
          <button className="absolute bottom-0 right-0 w-6 h-6 glass-card rounded-full flex items-center justify-center border border-brand-border">
            <Edit2 size={10} className="text-brand-muted" />
          </button>
        </div>
        <h2 className="font-syne font-bold text-xl">{user?.full_name || 'Loading...'}</h2>
        <p className="text-brand-muted text-sm mt-0.5">{user?.email}</p>
        <p className="text-brand-muted text-sm">{user?.phone}</p>
        <div className="mt-3 flex items-center gap-2 bg-brand-green/8 border border-brand-green/20 rounded-full px-4 py-2">
          <Shield size={14} className="text-brand-green" />
          <span className="text-sm font-semibold text-brand-green">Safety Score: {safetyScore}/100</span>
        </div>
      </div>

      {/* Emergency Settings */}
      <div className="px-5 mt-4">
        <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">Emergency Settings</p>
        <div className="glass-card overflow-hidden mb-4">
          {EMERGENCY_SETTINGS.map((item, i) => (
            <div key={item.title} className={`flex items-center gap-3 p-4 ${i < EMERGENCY_SETTINGS.length - 1 ? 'border-b border-brand-border' : ''} cursor-pointer hover:bg-white/[0.02] transition-colors`}
              onClick={item.action}>
              <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                <item.icon size={16} className={item.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-brand-muted truncate">{item.sub}</p>
              </div>
              {item.toggle
                ? <Toggle on={item.on!} onToggle={() => item.key && updateSettings({ [item.key]: !item.on })} />
                : <ChevronRight size={16} className="text-brand-muted flex-shrink-0" />
              }
            </div>
          ))}
        </div>

        {/* App Settings */}
        <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">App Settings</p>
        <div className="glass-card overflow-hidden mb-4">
          {APP_SETTINGS.map((item, i) => (
            <div key={item.title} className={`flex items-center gap-3 p-4 ${i < APP_SETTINGS.length - 1 ? 'border-b border-brand-border' : ''} cursor-pointer hover:bg-white/[0.02] transition-colors`}
              onClick={item.action}>
              <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                <item.icon size={16} className={item.iconColor} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-brand-muted">{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-brand-muted flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* More Features */}
        <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">More Features</p>
        <div className="glass-card overflow-hidden mb-4">
          {[
            { icon: Play, iconBg: 'bg-brand-red/10', iconColor: 'text-brand-red', title: 'Demo Mode', sub: 'Simulate emergency for judges', href: '/dashboard/demo' },
            { icon: Route, iconBg: 'bg-brand-blue/10', iconColor: 'text-brand-blue', title: 'Safe Route', sub: 'AI route safety scoring', href: '/dashboard/safe-route' },
            { icon: Clock, iconBg: 'bg-brand-amber/10', iconColor: 'text-brand-amber', title: 'Safe Check-ins', sub: 'Auto-alert if you miss check-in', href: '/dashboard/checkin' },
            { icon: CheckCircle, iconBg: 'bg-brand-green/10', iconColor: 'text-brand-green', title: 'Safe Zones', sub: 'View community safe places', href: '/dashboard/safe-zones' },
            { icon: Users, iconBg: 'bg-brand-blue/10', iconColor: 'text-brand-blue', title: 'Guardian Dashboard', sub: 'Real-time monitoring link', href: '/dashboard/guardian' },
            { icon: Calculator, iconBg: 'bg-brand-muted/10', iconColor: 'text-brand-muted', title: 'App Disguise', sub: 'Hide app as calculator', href: '/emergency/disguise' },
          ].map((item, i, arr) => (
            <button key={item.title} onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 p-4 ${i < arr.length - 1 ? 'border-b border-brand-border' : ''} hover:bg-white/[0.02] transition-colors`}>
              <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                <item.icon size={16} className={item.iconColor} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-brand-muted">{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-brand-muted flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <div className="glass-card overflow-hidden mb-6">
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <LogOut size={16} className="text-brand-red" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-brand-muted">You will be redirected to login</p>
            </div>
            <ChevronRight size={16} className="text-brand-muted" />
          </button>
        </div>

        <p className="text-center text-xs text-brand-muted">SafeHer v2.4.1 · Made with ❤️ for every woman's safety</p>
      </div>

      {/* Panic Word Modal */}
      {showPanicModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-brand-dark2 border border-brand-border rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">🔒 Set Panic Word</h3>
            <p className="text-sm text-brand-muted mb-4">
              Set a secret word. When you type it in AI chat, SOS triggers <strong className="text-white">silently</strong> without showing any alert on screen!
            </p>
            <div className="bg-brand-amber/10 border border-brand-amber/30 rounded-xl p-3 mb-4">
              <p className="text-xs text-brand-amber">⚠️ Keep this word secret! Don't use common words like "help" or "danger".</p>
            </div>
            {panicWord && (
              <p className="text-xs text-brand-green mb-3">Current panic word: <strong>"{panicWord}"</strong></p>
            )}
            <input
              type="text"
              value={newPanicWord}
              onChange={e => setNewPanicWord(e.target.value)}
              placeholder="Enter secret panic word (e.g. pizza, rainbow)"
              className="w-full bg-brand-dark3 border border-brand-border rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-brand-red"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowPanicModal(false); setNewPanicWord('') }}
                className="flex-1 py-3 border border-brand-border rounded-xl text-brand-muted">Cancel</button>
              <button onClick={handlePanicWordSave}
                className="flex-1 py-3 bg-brand-red/20 border border-brand-red/40 rounded-xl text-brand-red font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLangModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-brand-dark2 border border-brand-border rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Select Language</h3>
            <div className="space-y-3">
              {[
                { code: 'en', label: 'English', flag: '🇬🇧', sub: 'English' },
                { code: 'hi', label: 'हिंदी', flag: '🇮🇳', sub: 'Hindi' },
                { code: 'mr', label: 'मराठी', flag: '🇮🇳', sub: 'Marathi' },
              ].map((lang) => (
                <button key={lang.code}
                  onClick={() => {
                    updateSettings({ language: lang.code as AppSettings['language'] })
                    toast.success(`Language changed to ${lang.sub}`)
                    setShowLangModal(false)
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${settings.language === lang.code ? 'border-brand-red bg-brand-red/10' : 'border-brand-border'}`}>
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className="font-semibold">{lang.label}</p>
                    <p className="text-xs text-brand-muted">{lang.sub}</p>
                  </div>
                  {settings.language === lang.code && <CheckCircle size={16} className="text-brand-red ml-auto" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowLangModal(false)}
              className="w-full mt-4 py-3 border border-brand-border rounded-xl text-brand-muted">Cancel</button>
          </div>
        </div>
      )}

      {/* PIN Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-brand-dark2 border border-brand-border rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Change Emergency PIN</h3>
            <input type="password" maxLength={4} value={currentPin} onChange={e => setCurrentPin(e.target.value)}
              className="w-full bg-brand-dark3 border border-brand-border rounded-xl px-4 py-3 text-center text-xl tracking-widest mb-3"
              placeholder="Current PIN" />
            <input type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value)}
              className="w-full bg-brand-dark3 border border-brand-border rounded-xl px-4 py-3 text-center text-xl tracking-widest mb-3"
              placeholder="New PIN" />
            <input type="password" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(e.target.value)}
              className="w-full bg-brand-dark3 border border-brand-border rounded-xl px-4 py-3 text-center text-xl tracking-widest mb-4"
              placeholder="Confirm New PIN" />
            <div className="flex gap-3">
              <button onClick={() => setShowPinModal(false)}
                className="flex-1 py-3 border border-brand-border rounded-xl text-brand-muted">Cancel</button>
              <button onClick={handlePinChange}
                className="flex-1 py-3 bg-brand-red/20 border border-brand-red/40 rounded-xl text-brand-red font-bold">Save PIN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
