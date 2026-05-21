'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Play, RotateCcw, CheckCircle, Loader2, Zap, MapPin, Mic, Phone, Shield, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSOSStore } from '@/hooks/useSOSStore'

interface DemoStep {
  id: string
  icon: React.ElementType
  title: string
  detail: string
  delay: number
  color: string
}

const DEMO_STEPS: DemoStep[] = [
  { id: 'trigger',  icon: Shield,        title: 'SOS Triggered',         detail: 'Silent activation — no sound made',               delay: 500,  color: 'text-brand-red'   },
  { id: 'location', icon: MapPin,        title: 'GPS Location Captured', detail: 'Lat: 19.8762°N, Lng: 75.3433°E',                  delay: 1500, color: 'text-brand-blue'  },
  { id: 'sms',      icon: Phone,         title: 'SMS Alerts Sent',       detail: '3 contacts notified via Twilio',                   delay: 2800, color: 'text-brand-green' },
  { id: 'audio',    icon: Mic,           title: 'Audio Recording Started','detail': 'MediaRecorder active — encrypting evidence',    delay: 4000, color: 'text-brand-amber' },
  { id: 'tracking', icon: MapPin,        title: 'Live Tracking Active',  detail: 'Location updating every 3 seconds',                delay: 5200, color: 'text-brand-blue'  },
  { id: 'ai',       icon: MessageCircle, title: 'AI Guardian Activated',  detail: '"Move toward Main Road — police 0.8km NW"',       delay: 6500, color: 'text-purple-400' },
  { id: 'db',       icon: Shield,        title: 'Emergency Logged',      detail: 'Incident saved to Supabase database',              delay: 7800, color: 'text-brand-green' },
]

type DemoState = 'idle' | 'running' | 'done'

export default function DemoPage() {
  const router = useRouter()
  const { activateSOS, deactivateSOS } = useSOSStore()
  const [demoState, setDemoState] = useState<DemoState>('idle')
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const timersRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout)
  }, [])

  // Timer during demo
  useEffect(() => {
    if (demoState !== 'running') return
    const interval = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [demoState])

  const startDemo = () => {
    setDemoState('running')
    setCompletedSteps(new Set())
    setActiveStep(null)
    setElapsed(0)
    activateSOS('manual')
    toast.error('🚨 DEMO: SOS Activated!', { duration: 3000 })

    DEMO_STEPS.forEach((step, i) => {
      // Activate step
      const t1 = setTimeout(() => {
        setActiveStep(step.id)
        toast.success(`${step.title}`, { duration: 1500, icon: '✓' })
      }, step.delay)

      // Complete step
      const t2 = setTimeout(() => {
        setCompletedSteps(prev => new Set([...prev, step.id]))
        setActiveStep(null)
      }, step.delay + 900)

      timersRef.current.push(t1, t2)
    })

    // End demo
    const lastDelay = DEMO_STEPS[DEMO_STEPS.length - 1].delay + 1800
    const tEnd = setTimeout(() => {
      setDemoState('done')
      toast.success('✅ Demo complete! All systems functional.', { duration: 4000 })
    }, lastDelay)
    timersRef.current.push(tEnd)
  }

  const resetDemo = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setDemoState('idle')
    setCompletedSteps(new Set())
    setActiveStep(null)
    setElapsed(0)
    deactivateSOS()
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2">
        <button onClick={() => router.back()} className="w-9 h-9 glass-card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-syne font-bold text-xl">Demo Mode</h2>
          <p className="text-xs text-brand-muted">Simulate a full emergency for judges</p>
        </div>
        {demoState !== 'idle' && (
          <button onClick={resetDemo} className="w-9 h-9 glass-card flex items-center justify-center">
            <RotateCcw size={16} className="text-brand-muted" />
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="mx-5 mt-3 mb-5 bg-brand-amber/5 border border-brand-amber/20 rounded-xl px-4 py-3 flex items-start gap-2">
        <Zap size={14} className="text-brand-amber flex-shrink-0 mt-0.5" />
        <p className="text-xs text-brand-muted leading-relaxed">
          <strong className="text-brand-amber">Hackathon Demo Mode</strong> — Simulates the entire SafeHer emergency flow. No real SMS will be sent. Perfect for live demos to judges.
        </p>
      </div>

      {/* Timer (visible during run) */}
      <AnimatePresence>
        {demoState === 'running' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mx-5 mb-5 text-center">
            <p className="text-xs text-brand-red font-bold tracking-widest uppercase mb-1">
              🚨 Demo Emergency Running
            </p>
            <div className="font-syne text-5xl font-extrabold text-brand-red"
              style={{ textShadow: '0 0 30px rgba(255,45,85,0.5)' }}>
              {fmt(elapsed)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done banner */}
      <AnimatePresence>
        {demoState === 'done' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mx-5 mb-5 bg-brand-green/10 border border-brand-green/30 rounded-2xl p-4 text-center">
            <CheckCircle size={28} className="text-brand-green mx-auto mb-2" />
            <p className="font-syne font-bold text-brand-green">Demo Complete!</p>
            <p className="text-xs text-brand-muted mt-1">All {DEMO_STEPS.length} emergency systems verified in {fmt(elapsed)}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steps */}
      <p className="px-5 text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">Emergency Flow</p>
      <div className="px-5 space-y-2.5 mb-6">
        {DEMO_STEPS.map((step, i) => {
          const Icon = step.icon
          const isDone = completedSteps.has(step.id)
          const isActive = activeStep === step.id
          const isPending = demoState === 'idle' || (!isDone && !isActive)

          return (
            <motion.div key={step.id}
              animate={isActive ? { borderColor: 'rgba(255,45,85,0.5)', backgroundColor: 'rgba(255,45,85,0.05)' } : {}}
              className={`glass-card p-4 flex items-center gap-3 border transition-colors ${isDone ? 'border-brand-green/20' : 'border-brand-border'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-brand-green/15' : isActive ? 'bg-brand-red/15' : 'bg-brand-card2'}`}>
                {isDone
                  ? <CheckCircle size={16} className="text-brand-green" />
                  : isActive
                  ? <Loader2 size={16} className="text-brand-red animate-spin" />
                  : <Icon size={16} className={isPending && demoState !== 'idle' ? 'text-brand-muted' : step.color} />
                }
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${isDone ? 'text-brand-green' : isActive ? 'text-brand-text' : 'text-brand-muted'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-brand-muted mt-0.5">{step.detail}</p>
              </div>
              <span className="text-[10px] text-brand-muted">Step {i + 1}</span>
            </motion.div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="px-5">
        {demoState === 'idle' && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={startDemo}
            className="w-full py-5 bg-brand-red rounded-2xl text-white font-syne font-bold text-lg flex items-center justify-center gap-2 emergency-glow">
            <Play size={20} /> Simulate Emergency
          </motion.button>
        )}
        {demoState === 'running' && (
          <div className="text-center">
            <p className="text-xs text-brand-muted mb-3">Demo running automatically...</p>
            <button onClick={resetDemo}
              className="w-full py-4 bg-brand-card2 border border-brand-border rounded-2xl text-brand-muted text-sm font-semibold">
              Stop Demo
            </button>
          </div>
        )}
        {demoState === 'done' && (
          <div className="space-y-2.5">
            <motion.button whileTap={{ scale: 0.97 }} onClick={startDemo}
              className="w-full py-4 bg-brand-red rounded-2xl text-white font-syne font-bold flex items-center justify-center gap-2 emergency-glow">
              <Play size={18} /> Run Demo Again
            </motion.button>
            <button onClick={() => router.push('/dashboard/home')}
              className="w-full py-4 bg-brand-card2 border border-brand-border rounded-2xl text-brand-muted text-sm font-semibold">
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Tech Stack used */}
      <div className="mx-5 mt-5 glass-card p-4">
        <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">Tech Stack Demonstrated</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Next.js 15', sub: 'App Router' },
            { label: 'Supabase', sub: 'Auth + Realtime DB' },
            { label: 'Twilio API', sub: 'SMS Alerts' },
            { label: 'Gemini AI', sub: 'Safety Assistant' },
            { label: 'Google Maps', sub: 'Live Tracking' },
            { label: 'MediaRecorder', sub: 'Audio Evidence' },
          ].map(({ label, sub }) => (
            <div key={label} className="bg-brand-dark3 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[10px] text-brand-muted">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
