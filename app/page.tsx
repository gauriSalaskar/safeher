'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Shield, MapPin, Phone, Mic, Zap, Lock,
  ChevronRight, Star, AlertTriangle, MessageCircle
} from 'lucide-react'

const FEATURES = [
  { icon: Shield, title: 'Silent SOS', desc: 'One tap triggers emergency alerts without making a sound', color: 'text-brand-red', bg: 'bg-brand-red/10' },
  { icon: MapPin, title: 'Live Tracking', desc: 'Real-time GPS shared with trusted guardians instantly', color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
  { icon: MessageCircle, title: 'AI Guardian', desc: 'Gemini AI monitors conversations for panic keywords', color: 'text-brand-amber', bg: 'bg-brand-amber/10' },
  { icon: Phone, title: 'Fake Call', desc: 'Realistic incoming call to escape dangerous situations', color: 'text-brand-green', bg: 'bg-brand-green/10' },
  { icon: Mic, title: 'Audio Evidence', desc: 'Hidden recording stored securely in encrypted cloud', color: 'text-brand-red', bg: 'bg-brand-red/10' },
  { icon: Lock, title: 'Panic Word', desc: 'Secret word in AI chat silently triggers SOS', color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
]

const STEPS = [
  { num: '01', title: 'Create Account', desc: 'Register in 30 seconds. No credit card needed.' },
  { num: '02', title: 'Add Guardians', desc: 'Add trusted contacts who will receive your emergency alerts.' },
  { num: '03', title: 'Stay Protected', desc: 'Press SOS or shake your phone — help is on the way instantly.' },
]

const STATS = [
  { num: '3s', label: 'Alert Response Time' },
  { num: '24/7', label: 'AI Guardian Active' },
  { num: '100%', label: 'Free to Use' },
]

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#080B14] text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-syne font-bold text-lg">SafeHer</span>
        </div>
        <button onClick={() => router.push('/auth/login')}
          className="text-sm text-brand-muted hover:text-white transition-colors">
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-16 pb-12 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-red/10 blur-[100px] rounded-full pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-brand-red/10 border border-brand-red/20 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
            <span className="text-xs text-brand-red font-semibold tracking-wide">AI-Powered Women Safety Platform</span>
          </div>

          <h1 className="font-syne text-5xl font-extrabold leading-[1.05] mb-4">
            Your Silent<br />
            <span className="text-brand-red">Guardian</span><br />
            Always Near
          </h1>

          <p className="text-brand-muted text-base leading-relaxed mb-8 max-w-sm mx-auto">
            SafeHer protects you through silent SOS, live location sharing, AI danger detection, and hidden evidence collection.
          </p>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/auth/register')}
              className="w-full py-4 bg-brand-red rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2"
              style={{ boxShadow: '0 0 40px rgba(255,45,85,0.3)' }}>
              Get Protected — Free <ChevronRight size={18} />
            </motion.button>
            <button onClick={() => router.push('/auth/login')}
              className="w-full py-4 border border-white/10 rounded-2xl text-brand-muted text-sm hover:border-white/20 hover:text-white transition-all">
              Sign In to Your Account
            </button>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="px-6 mb-12">
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.3 }}
              className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
              <div className="font-syne text-2xl font-extrabold text-brand-red">{stat.num}</div>
              <div className="text-[10px] text-brand-muted mt-1 leading-tight">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 mb-12">
        <div className="text-center mb-6">
          <p className="text-xs text-brand-red font-bold tracking-widest uppercase mb-2">Features</p>
          <h2 className="font-syne text-2xl font-bold">How SafeHer Protects You</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 + 0.2 }}
              className="bg-white/5 border border-white/5 rounded-2xl p-4">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-3`}>
                <f.icon size={18} className={f.color} />
              </div>
              <p className="font-semibold text-sm mb-1">{f.title}</p>
              <p className="text-xs text-brand-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 mb-12">
        <div className="text-center mb-6">
          <p className="text-xs text-brand-red font-bold tracking-widest uppercase mb-2">Simple Setup</p>
          <h2 className="font-syne text-2xl font-bold">What Happens During SOS</h2>
        </div>
        <div className="space-y-3">
          {[
            { icon: AlertTriangle, title: 'SOS Triggers Silently', desc: 'Button, shake, or AI keyword — no sound made', color: 'text-brand-red', bg: 'bg-brand-red/10' },
            { icon: MapPin, title: 'Location Broadcasts Live', desc: 'GPS updates every 3 seconds to your guardians', color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
            { icon: MessageCircle, title: 'Contacts Get WhatsApp Alerts', desc: 'Instant message with your location and tracking link', color: 'text-brand-green', bg: 'bg-brand-green/10' },
            { icon: Mic, title: 'Audio Recorded Secretly', desc: 'Evidence captured and encrypted in cloud storage', color: 'text-brand-amber', bg: 'bg-brand-amber/10' },
            { icon: Shield, title: 'AI Guides You to Safety', desc: 'Real-time suggestions for escape and safe zones', color: 'text-brand-red', bg: 'bg-brand-red/10' },
          ].map((step, i) => (
            <motion.div key={step.title}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.2 }}
              className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
              <div className={`w-10 h-10 ${step.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <step.icon size={18} className={step.color} />
              </div>
              <div>
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-brand-muted">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How to get started */}
      <section className="px-6 mb-12">
        <div className="text-center mb-6">
          <p className="text-xs text-brand-red font-bold tracking-widest uppercase mb-2">Get Started</p>
          <h2 className="font-syne text-2xl font-bold">3 Steps to Stay Safe</h2>
        </div>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <motion.div key={step.num}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 + 0.2 }}
              className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
              <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="font-syne font-bold text-brand-red text-sm">{step.num}</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-brand-muted">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Privacy Promise */}
      <section className="px-6 mb-12">
        <div className="bg-brand-red/5 border border-brand-red/15 rounded-2xl p-6 text-center">
          <Lock size={28} className="text-brand-red mx-auto mb-3" />
          <h3 className="font-syne font-bold text-lg mb-2">Your Privacy is Sacred</h3>
          <p className="text-sm text-brand-muted leading-relaxed">
            No ads. No data selling. No tracking beyond your safety needs. Your location and recordings are encrypted and only shared with contacts you choose.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16">
        <div className="bg-gradient-to-br from-brand-red/20 to-brand-red/5 border border-brand-red/20 rounded-3xl p-8 text-center">
          <Shield size={40} className="text-brand-red mx-auto mb-4" />
          <h2 className="font-syne text-2xl font-extrabold mb-2">Start Staying Safe Today</h2>
          <p className="text-brand-muted text-sm mb-6">Free forever. No credit card. Works offline.</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/auth/register')}
            className="w-full py-4 bg-brand-red rounded-2xl font-bold text-white text-base"
            style={{ boxShadow: '0 0 40px rgba(255,45,85,0.4)' }}>
            Get Protected — It's Free
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center pb-8 text-xs text-brand-muted">
        SafeHer v2.4 · Made with ❤️ for every woman's safety
      </div>

    </div>
  )
}
