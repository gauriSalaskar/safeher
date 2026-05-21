'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Volume2, VolumeX, MicOff } from 'lucide-react'

const PRESET_CALLERS = [
  { name: 'Mom', relation: 'Mobile', color: 'from-red-500 to-rose-700', initial: 'M' },
  { name: 'Rahul Bhai', relation: 'Brother', color: 'from-blue-500 to-blue-700', initial: 'R' },
  { name: 'Sneha', relation: 'Best Friend', color: 'from-purple-500 to-purple-700', initial: 'S' },
  { name: 'Dad', relation: 'Mobile', color: 'from-amber-500 to-amber-700', initial: 'D' },
  { name: 'Police Control', relation: 'Emergency', color: 'from-brand-red to-red-900', initial: '🚔' },
]

type CallState = 'ringing' | 'active' | 'ended'

export default function FakeCallPage() {
  const router = useRouter()
  const [callerIdx, setCallerIdx] = useState(0)
  const [callState, setCallState] = useState<CallState>('ringing')
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const caller = PRESET_CALLERS[callerIdx]

  useEffect(() => {
    if (callState !== 'active') return
    const t = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(t)
  }, [callState])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const accept = () => setCallState('active')
  const decline = () => { setCallState('ended'); setTimeout(() => router.back(), 1500) }
  const hangup = () => { setCallState('ended'); setTimeout(() => router.back(), 1500) }

  return (
    <div className="page-container min-h-screen bg-gradient-to-b from-[#0a1628] to-brand-dark flex flex-col">
      {/* Caller Picker (top sheet) */}
      <div className="absolute top-4 right-4 z-20">
        <button onClick={() => setShowPicker(s => !s)}
          className="text-xs text-brand-muted bg-brand-card2 border border-brand-border rounded-xl px-3 py-1.5">
          Change Caller
        </button>
        <AnimatePresence>
          {showPicker && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-9 glass-card p-2 w-44 space-y-1">
              {PRESET_CALLERS.map((c, i) => (
                <button key={c.name} onClick={() => { setCallerIdx(i); setShowPicker(false) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${i === callerIdx ? 'bg-brand-red/15 text-brand-red' : 'text-brand-text hover:bg-brand-card2'}`}>
                  {c.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Status */}
        <p className="text-xs text-brand-muted uppercase tracking-widest mb-10">
          {callState === 'ringing' ? 'Incoming Call' : callState === 'active' ? 'On Call' : 'Call Ended'}
        </p>

        {/* Avatar */}
        <motion.div
          animate={callState === 'ringing' ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          className={`w-28 h-28 rounded-full bg-gradient-to-br ${caller.color} flex items-center justify-center text-4xl font-bold mb-6 shadow-2xl`}
          style={{ boxShadow: '0 0 50px rgba(61,142,255,0.3)' }}>
          {caller.initial}
        </motion.div>

        <h2 className="font-syne text-4xl font-bold mb-2">{caller.name}</h2>
        <p className="text-brand-muted text-base mb-3">{caller.relation}</p>

        {callState === 'ringing' && (
          <div className="flex gap-1.5 items-end h-5 mb-12">
            {[8, 16, 10, 18, 6, 14, 8].map((h, i) => (
              <motion.div key={i} className="w-0.5 bg-brand-muted rounded-full"
                animate={{ scaleY: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                style={{ height: h }} />
            ))}
          </div>
        )}

        {callState === 'active' && (
          <p className="text-brand-green text-xl font-mono font-semibold mb-10 mt-2">{fmt(duration)}</p>
        )}

        {callState === 'ended' && (
          <p className="text-brand-muted text-sm mb-10">Call ended</p>
        )}
      </div>

      {/* Controls */}
      <div className="px-8 pb-16">
        {callState === 'ringing' ? (
          <div className="flex justify-around items-center">
            <div className="flex flex-col items-center gap-2">
              <motion.button onClick={decline} whileTap={{ scale: 0.9 }}
                className="w-18 h-18 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl"
                style={{ boxShadow: '0 0 20px rgba(220,38,38,0.5)' }}>
                <PhoneOff size={28} className="text-white" />
              </motion.button>
              <span className="text-xs text-brand-muted">Decline</span>
            </div>

            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
              <Phone size={32} className="text-brand-green opacity-50" />
            </motion.div>

            <div className="flex flex-col items-center gap-2">
              <motion.button onClick={accept} whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shadow-xl"
                style={{ boxShadow: '0 0 20px rgba(22,163,74,0.5)' }}>
                <Phone size={28} className="text-white" />
              </motion.button>
              <span className="text-xs text-brand-muted">Accept</span>
            </div>
          </div>
        ) : callState === 'active' ? (
          <div>
            <div className="flex justify-around mb-8">
              {[
                { icon: muted ? MicOff : MicOff, label: muted ? 'Unmute' : 'Mute', action: () => setMuted(m => !m), active: muted },
                { icon: speaker ? Volume2 : VolumeX, label: 'Speaker', action: () => setSpeaker(s => !s), active: speaker },
              ].map(({ icon: Icon, label, action, active }) => (
                <button key={label} onClick={action}
                  className={`flex flex-col items-center gap-2 w-16 h-16 rounded-full ${active ? 'bg-brand-text/20' : 'bg-brand-card2'} items-center justify-center border border-brand-border`}>
                  <Icon size={22} className="text-brand-text" />
                  <span className="text-[10px] text-brand-muted">{label}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <motion.button onClick={hangup} whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center"
                style={{ boxShadow: '0 0 24px rgba(220,38,38,0.5)' }}>
                <PhoneOff size={28} className="text-white" />
              </motion.button>
            </div>
          </div>
        ) : null}
      </div>

      {/* SafeHer hint */}

    </div>
  )
}
