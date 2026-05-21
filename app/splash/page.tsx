'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, MapPin, Mic, Phone, ChevronRight, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SLIDES = [
  {
    icon: Shield,
    color: 'text-brand-red',
    bg: 'bg-brand-red/10',
    glow: 'rgba(255,45,85,0.3)',
    title: 'Your Silent Guardian',
    desc: 'SafeHer protects you in dangerous situations — silently, instantly, and intelligently.',
  },
  {
    icon: Zap,
    color: 'text-brand-amber',
    bg: 'bg-brand-amber/10',
    glow: 'rgba(255,179,0,0.3)',
    title: 'One Tap. Triple Trigger.',
    desc: 'Activate SOS by tapping the button, shaking your phone, or using your voice — all completely silent.',
  },
  {
    icon: MapPin,
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/10',
    glow: 'rgba(61,142,255,0.3)',
    title: 'Live Location Sharing',
    desc: 'Your trusted guardians see your exact location in real-time the moment SOS activates.',
  },
  {
    icon: Mic,
    color: 'text-brand-green',
    bg: 'bg-brand-green/10',
    glow: 'rgba(0,230,118,0.3)',
    title: 'Hidden Evidence Collection',
    desc: 'Audio recording starts automatically in the background — encrypted and safely stored as evidence.',
  },
  {
    icon: Phone,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    glow: 'rgba(168,85,247,0.3)',
    title: 'Fake Call Escape',
    desc: 'Trigger a realistic fake incoming call to escape any uncomfortable or dangerous situation naturally.',
  },
]

export default function SplashPage() {
  const router = useRouter()
  const [slide, setSlide] = useState(0)
  const [checking, setChecking] = useState(true)

  // Check if already logged in
  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/dashboard/home')
      } else {
        setChecking(false)
      }
    }
    check()
  }, [router])

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1)
    else router.push('/auth/register')
  }

  const skip = () => router.push('/auth/login')

  if (checking) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen bg-brand-dark">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center"
        >
          <Shield size={32} className="text-brand-red" />
        </motion.div>
      </div>
    )
  }

  const current = SLIDES[slide]
  const Icon = current.icon

  return (
    <div className="page-container min-h-screen bg-brand-dark flex flex-col overflow-hidden">
      {/* Animated background glow */}
      <motion.div
        key={slide}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${current.glow} 0%, transparent 65%)`,
        }}
      />

      {/* Skip */}
      <div className="relative z-10 flex justify-end px-6 pt-6">
        <button onClick={skip} className="text-brand-muted text-sm font-medium px-3 py-1.5 rounded-xl hover:text-brand-text transition-colors">
          Skip → Login
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-10"
        >
          <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-syne font-bold text-xl">Safe<span className="text-brand-red">Her</span></span>
        </motion.div>

        {/* Icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -20 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
            className={`w-24 h-24 rounded-3xl ${current.bg} flex items-center justify-center mb-8`}
            style={{ boxShadow: `0 0 60px ${current.glow}` }}
          >
            <Icon size={44} className={current.color} />
          </motion.div>
        </AnimatePresence>

        {/* Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${slide}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="font-syne text-3xl font-extrabold mb-4 leading-tight">
              {current.title}
            </h2>
            <p className="text-brand-muted text-base leading-relaxed max-w-xs mx-auto">
              {current.desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + button */}
      <div className="relative z-10 px-6 pb-12">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setSlide(i)}
              animate={{ width: i === slide ? 24 : 8, opacity: i === slide ? 1 : 0.3 }}
              className="h-2 rounded-full bg-brand-red"
            />
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          className="w-full py-4 bg-brand-red rounded-2xl text-white font-syne font-bold text-lg flex items-center justify-center gap-2 emergency-glow"
        >
          {slide < SLIDES.length - 1 ? (
            <>Next <ChevronRight size={20} /></>
          ) : (
            <>Get Protected — Free <ChevronRight size={20} /></>
          )}
        </motion.button>

        {slide < SLIDES.length - 1 && (
          <p className="text-center text-brand-muted text-xs mt-4">
            Already have an account?{' '}
            <button onClick={skip} className="text-brand-red font-semibold">Sign in</button>
          </p>
        )}
      </div>
    </div>
  )
}
