'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, MapPin, Mic, Phone, Zap, Bell, Star, ChevronRight } from 'lucide-react'

const features = [
  { icon: Shield, title: 'Silent SOS', desc: 'Trigger emergency alerts without making a sound', color: 'text-brand-red', bg: 'bg-brand-red/10' },
  { icon: MapPin, title: 'Live Tracking', desc: 'Real-time GPS shared with trusted guardians', color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
  { icon: Zap, title: 'AI Detection', desc: 'Gemini AI detects panic keywords automatically', color: 'text-brand-amber', bg: 'bg-brand-amber/10' },
  { icon: Phone, title: 'Fake Call', desc: 'Realistic incoming call to escape danger', color: 'text-brand-green', bg: 'bg-brand-green/10' },
  { icon: Mic, title: 'Audio Evidence', desc: 'Hidden recording stored securely in cloud', color: 'text-brand-red', bg: 'bg-brand-red/10' },
  { icon: Bell, title: 'Shake Trigger', desc: 'Shake phone 3x to instantly activate SOS', color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
]

const testimonials = [
  { text: '"SafeHer saved my life. I was being followed and shook my phone — my family got my location instantly."', name: 'Priya Sharma', location: 'Pune, Maharashtra', initial: 'P' },
  { text: '"The AI chat guided me step by step when I was scared alone at night. I felt protected the whole time."', name: 'Ananya Rao', location: 'Bengaluru, Karnataka', initial: 'A' },
]

const stats = [
  { num: '2.4M+', label: 'Women Protected' },
  { num: '1.2s', label: 'Alert Response' },
  { num: '98%', label: 'AI Accuracy' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
}

export default function LandingPage() {
  return (
    <div className="page-container bg-brand-dark overflow-y-auto">
      {/* HERO */}
      <section className="relative px-6 pt-12 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {/* Brand */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-syne font-bold text-xl">Safe<span className="text-brand-red">Her</span></span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-red/10 border border-brand-red/30 rounded-full px-4 py-2 text-brand-red text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
            AI-Powered Safety Platform
          </div>

          <h1 className="font-syne text-5xl font-extrabold leading-[1.05] mb-5">
            Your Silent<br />
            <span className="text-gradient-red">Guardian</span><br />
            Always Near
          </h1>

          <p className="text-brand-muted text-base leading-relaxed mb-8">
            SafeHer protects women through silent SOS, live location sharing, AI danger detection, and hidden evidence collection.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/splash">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 bg-brand-red rounded-2xl text-white font-syne font-bold text-lg flex items-center justify-center gap-2 emergency-glow"
              >
                Get Protected — Free <ChevronRight size={18} />
              </motion.button>
            </Link>
            <Link href="/auth/login">
              <button className="w-full py-4 bg-transparent border border-brand-border rounded-2xl text-brand-text font-semibold text-base">
                Sign In to Your Account
              </button>
            </Link>
          </div>
        </motion.div>
      </section>



      {/* FEATURES */}
      <section className="px-6 mb-8">
        <h2 className="font-syne text-xl font-bold mb-4">How SafeHer Protects You</h2>
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div key={f.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="glass-card p-4"
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-3`}>
                <f.icon size={20} className={f.color} />
              </div>
              <h4 className="text-sm font-semibold mb-1">{f.title}</h4>
              <p className="text-xs text-brand-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 mb-8">
        <h2 className="font-syne text-xl font-bold mb-4">What Happens During SOS</h2>
        <div className="glass-card p-5 space-y-4">
          {[
            { step: '01', title: 'SOS Triggers Silently', desc: 'Button, shake, or AI keyword — no sound made' },
            { step: '02', title: 'Location Broadcasts Live', desc: 'GPS updates every 3 seconds to your guardians' },
            { step: '03', title: 'Contacts Get SMS Alerts', desc: 'Instant messages with your location and tracking link' },
            { step: '04', title: 'Audio Recorded Secretly', desc: 'Evidence captured and encrypted in the cloud' },
            { step: '05', title: 'AI Guides You to Safety', desc: 'Real-time suggestions for escape and safe zones' },
          ].map((item, i) => (
            <div key={item.step} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-red text-xs font-bold">{item.step}</span>
              </div>
              <div>
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="text-xs text-brand-muted mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* CTA */}
      <section className="px-6 pb-12">
        <div className="bg-gradient-to-br from-brand-red/20 to-brand-red/5 border border-brand-red/30 rounded-2xl p-6 text-center">
          <Shield size={40} className="text-brand-red mx-auto mb-3" />
          <h3 className="font-syne text-xl font-bold mb-2">Start Staying Safe Today</h3>
          <p className="text-sm text-brand-muted mb-5">Free forever. No credit card. Works offline.</p>
          <Link href="/auth/register">
            <button className="w-full py-4 bg-brand-red rounded-2xl text-white font-syne font-bold text-base emergency-glow">
              Download SafeHer Free
            </button>
          </Link>
        </div>
        <p className="text-center text-xs text-brand-muted mt-4">
          SafeHer v2.4 · Made with ❤️ for every woman's safety
        </p>
      </section>
    </div>
  )
}
