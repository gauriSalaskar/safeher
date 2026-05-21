'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, Clock, MapPin, Mic, PhoneCall } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSOSStore } from '@/hooks/useSOSStore'
import { getAudioRecorder } from '@/services/audio'
import { watchLocation } from '@/services/location'
import { upsertLiveLocation } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'

export default function SOSActivePage() {
  const router = useRouter()
  const { sos, deactivateSOS, updateSOSState, incrementTimer, resetTimer, timerSeconds, location, settings } = useSOSStore()
  const lowBattery = settings.lowBatteryMode
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recorderRef = useRef(getAudioRecorder())
  const stopWatchRef = useRef<(() => void) | null>(null)

  // Start timer
  useEffect(() => {
    timerRef.current = setInterval(() => incrementTimer(), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [incrementTimer])

  // Start audio recording
  useEffect(() => {
    recorderRef.current.start().then((started) => {
      if (started) updateSOSState({ recordingActive: true })
    })
    return () => { recorderRef.current.stop() }
  }, [updateSOSState])

  // Start location watch
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      stopWatchRef.current = watchLocation(async (loc) => {
        await upsertLiveLocation({ user_id: user.id, latitude: loc.latitude, longitude: loc.longitude, timestamp: new Date().toISOString() })
      })
    }
    load()
    return () => stopWatchRef.current?.()
  }, [])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleCancel = useCallback(async () => {
    // Stop recording and upload evidence
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user && sos.alertId) {
      const audioUrl = await recorderRef.current.stopAndUpload(user.id, sos.alertId)
      await supabase.from('sos_alerts').update({
        status: 'resolved',
        duration_seconds: timerSeconds,
        audio_url: audioUrl || undefined,
        resolved_at: new Date().toISOString(),
      }).eq('id', sos.alertId)
    }
    stopWatchRef.current?.()
    if (timerRef.current) clearInterval(timerRef.current)
    deactivateSOS()
    resetTimer()
    toast.success('Emergency resolved. Stay safe! 💚')
    router.push('/dashboard/home')
  }, [sos.alertId, timerSeconds, deactivateSOS, resetTimer, router])

  useEffect(() => {
    if (!sos.isActive) {
      router.replace('/dashboard/home')
    }
  }, [sos.isActive, router])

  if (!sos.isActive) {
    return null
  }

  const alertItems = [
    { id: 'location', icon: MapPin, label: 'Live Location Sharing', sub: 'GPS broadcasting every 3 seconds', done: sos.locationShared, sending: !sos.locationShared },
    { id: 'sms', icon: PhoneCall, label: 'SMS Alerts Sent', sub: 'All emergency contacts notified', done: sos.smsSent, sending: !sos.smsSent },
    { id: 'audio', icon: Mic, label: 'Audio Recording', sub: 'Evidence captured & encrypted', done: false, sending: sos.recordingActive },
    { id: 'police', icon: PhoneCall, label: 'Nearest Police Station', sub: 'Location: 0.8km away (Cantonment)', done: false, sending: true },
  ]

  return (
    <div className="page-container min-h-screen bg-gradient-to-b from-[#2a0010] via-brand-dark to-brand-dark px-5 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}
          className="text-xs text-brand-red font-bold tracking-widest uppercase mb-1">
          🚨 Emergency Active
        </motion.div>
        <h1 className="font-syne text-3xl font-extrabold">Help Is Coming</h1>
        <p className="text-brand-muted text-sm mt-1">{location ? `${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E` : 'Getting location...'}</p>
      </motion.div>

      {/* Timer */}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mb-6">
        <div className="font-syne text-7xl font-extrabold text-brand-red leading-none"
          style={{ textShadow: '0 0 40px rgba(255,45,85,0.5)' }}>
          {fmt(timerSeconds)}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2 text-brand-muted text-xs">
          <Clock size={12} />Emergency Duration
        </div>
      </motion.div>

      {/* Alert Status List */}
      <div className="space-y-2.5 mb-5">
        {alertItems.map((item, i) => (
          <motion.div key={item.id}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="glass-card p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-brand-green/15' : item.sending ? 'bg-brand-blue/15' : 'bg-brand-amber/15'}`}>
              {item.done
                ? <CheckCircle size={16} className="text-brand-green" />
                : item.sending
                ? <Loader2 size={16} className="text-brand-blue animate-spin" />
                : <item.icon size={16} className="text-brand-amber" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-brand-muted">{item.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Guidance Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-brand-red/5 border border-brand-red/30 rounded-2xl p-4 mb-4">
        <p className="text-xs text-brand-red font-bold mb-2">🤖 AI Guardian Says</p>
        <p className="text-sm leading-relaxed text-brand-text">
          Move toward the <strong>crowded area 200m ahead</strong>. Police station is <strong>0.8km NW</strong>.
          Keep walking, stay on main roads, and do <strong>not</strong> engage with anyone suspicious.
        </p>
      </motion.div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button onClick={() => router.push('/emergency/fake-call')}
          className="w-full py-4 bg-brand-blue/10 border border-brand-blue/30 rounded-2xl text-brand-blue font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-blue/15 transition-colors">
          <PhoneCall size={16} /> Trigger Fake Call
        </button>
        <button onClick={() => router.push('/dashboard/chat')}
          className="w-full py-4 bg-brand-card2 border border-brand-border rounded-2xl text-brand-muted font-semibold text-sm flex items-center justify-center gap-2 hover:border-brand-red/40 transition-colors">
          💬 Chat with AI Guardian
        </button>
        <AnimatePresence>
          <motion.button onClick={handleCancel} whileTap={{ scale: 0.97 }}
            className="w-full py-4 border border-brand-border rounded-2xl text-brand-muted text-sm font-semibold hover:border-brand-green/50 hover:text-brand-green transition-all">
            ✓ I Am Safe — Cancel Emergency
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  )
}
