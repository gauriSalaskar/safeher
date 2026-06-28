'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import {
  Shield, MapPin, Phone, Mic, Lock,
  ChevronRight, AlertTriangle, MessageCircle
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

const WORDS = ['Guardian', 'Protector', 'Shield', 'Defender']

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  width: (((i * 7) % 18) + 5) + 'px',
  height: (((i * 7) % 18) + 5) + 'px',
  left: ((i * 5.1) % 100) + '%',
  animationDuration: ((i * 1.1) % 8 + 6) + 's',
  animationDelay: ((i * 0.7) % 8) + 's',
}))

// ── Typewriter hook ──────────────────────────────────────────────
function useTypewriter(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const t = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { setDone(true); clearInterval(t) }
    }, speed)
    return () => clearInterval(t)
  }, [text, speed])
  return { displayed, done }
}

// ── Animated counter with elastic bounce ────────────────────────
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const duration = 1200
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      // Elastic ease out
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress) * Math.cos((progress * 10 - 0.75) * ((2 * Math.PI) / 3))
      setDisplay(Math.round(ease * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, value])

  return <span ref={ref}>{display}{suffix}</span>
}

// ── Scroll reveal ───────────────────────────────────────────────
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

// ── Staggered letter reveal ──────────────────────────────────────
function SplitText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={className} style={style}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40, rotateX: -60 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.5, delay: 0.3 + i * 0.035, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}>
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}

// ── Magnetic button ──────────────────────────────────────────────
function MagneticButton({ children, onClick, className, style }: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    setPos({ x: (e.clientX - cx) * 0.25, y: (e.clientY - cy) * 0.25 })
  }
  const handleMouseLeave = () => setPos({ x: 0, y: 0 })

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileTap={{ scale: 0.97 }}
      className={className}
      style={style}>
      {children}
    </motion.button>
  )
}

// ── Tilt card ────────────────────────────────────────────────────
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14
    setTilt({ x, y })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false) }}
      animate={{ rotateX: tilt.y, rotateY: tilt.x, scale: hovered ? 1.03 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ transformStyle: 'preserve-3d', perspective: 800 }}
      className={className}>
      {children}
    </motion.div>
  )
}

// ── Glowing divider ──────────────────────────────────────────────
function GlowDivider() {
  return (
    <div className="relative flex items-center justify-center my-2 mb-8">
      <div style={{
        height: '1px',
        width: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,45,85,0.5), rgba(255,45,85,0.8), rgba(255,45,85,0.5), transparent)',
        boxShadow: '0 0 12px rgba(255,45,85,0.4)',
      }} />
      <div className="absolute w-2 h-2 rounded-full bg-brand-red"
        style={{ boxShadow: '0 0 10px rgba(255,45,85,0.9), 0 0 20px rgba(255,45,85,0.5)' }} />
    </div>
  )
}

// ── Page transition overlay ──────────────────────────────────────
function usePageTransition() {
  const [transitioning, setTransitioning] = useState(false)
  const router = useRouter()

  const navigate = useCallback((path: string) => {
    setTransitioning(true)
    setTimeout(() => router.push(path), 400)
  }, [router])

  return { transitioning, navigate }
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)
  const cursorRef = useRef<HTMLDivElement>(null)
  const { transitioning, navigate } = usePageTransition()

  // Scroll progress bar
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  // Typewriter for subheading
  const subText = 'SafeHer protects you through silent SOS, live location sharing, AI danger detection, and hidden evidence collection.'
  const { displayed } = useTypewriter(subText, 22)

  useEffect(() => { setMounted(true) }, [])

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

  if (!mounted) return null

  return (
    <div className="min-h-screen overflow-x-hidden transition-colors duration-300"
      style={{ background: 'var(--page-bg, #080B14)', color: 'var(--page-text, #F0F4FF)' }}>

      {/* ── Page transition overlay ── */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-brand-red"
            initial={{ scaleY: 0, originY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0, originY: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ── Scroll progress bar ── */}
      <motion.div
        style={{ scaleX, transformOrigin: '0%' }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-brand-red z-[9998]"
        sx={{ boxShadow: '0 0 10px rgba(255,45,85,0.8)' }}
      />

      {/* ── Grain texture overlay ── */}
      <div className="fixed inset-0 z-[2] pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }} />

      {/* Cursor trail */}
      <div ref={cursorRef} className="cursor-trail hidden lg:block" />

      {/* Aurora */}
      <div className="aurora" />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <div key={p.id} className="particle" style={{
          width: p.width, height: p.height, left: p.left,
          animationDuration: p.animationDuration, animationDelay: p.animationDelay, opacity: 0.7,
        }} />
      ))}

      {/* Ambient blobs */}
      <div className="bg-blob bg-blob-red" />
      <div className="bg-blob bg-blob-blue" />

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}>
          <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-syne font-bold text-lg" style={{ color: 'var(--page-text, #F0F4FF)' }}>SafeHer</span>
        </motion.div>

        {/* Floating live badge */}
        <motion.div
          className="hidden md:flex items-center gap-2 bg-brand-red/10 border border-brand-red/20 rounded-full px-3 py-1"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <div className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
          <span className="text-[10px] text-brand-red font-semibold">Live Protection Active</span>
        </motion.div>

        <motion.button
          onClick={() => navigate('/auth/login')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-sm text-brand-muted hover:text-brand-red transition-colors">
          Sign In
        </motion.button>
      </nav>

      {/* ── Hero ── */}
      <section className="relative px-6 pt-16 pb-12 text-center overflow-hidden z-10">
        {/* Ripple rings */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={`ripple-${i}`} className="absolute rounded-full"
              style={{ top: '50%', left: '50%', border: '1.5px solid rgba(255,45,85,0.8)', boxShadow: '0 0 15px rgba(255,45,85,0.4)' }}
              initial={{ width: 100, height: 100, marginTop: -50, marginLeft: -50, opacity: 0.9 }}
              animate={{ width: 700, height: 700, marginTop: -350, marginLeft: -350, opacity: 0 }}
              transition={{ duration: 4, delay: i * 1, repeat: Infinity, ease: 'easeOut', opacity: { duration: 4, ease: [0.2, 0, 0.8, 1] } }}
            />
          ))}
          <div className="absolute rounded-full blur-[80px]"
            style={{ width: 300, height: 300, marginTop: -150, marginLeft: -150, background: 'radial-gradient(circle, rgba(255,45,85,0.4), transparent 70%)' }} />
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-brand-red/10 border border-brand-red/20 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
            <span className="text-xs text-brand-red font-semibold tracking-wide">AI-Powered Women Safety Platform</span>
          </motion.div>

          {/* Staggered letter hero title */}
          <h1 className="font-syne text-5xl font-extrabold leading-[1.05] mb-4" style={{ color: 'var(--page-text, #F0F4FF)', perspective: '600px' }}>
            <SplitText text="Your Silent" /><br />
            <span className="relative inline-block cursor-pointer select-none"
              onMouseEnter={() => setWordIndex(i => (i + 1) % WORDS.length)}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 20, rotateX: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, y: -20, rotateX: 90 }}
                  transition={{ duration: 0.4 }}
                  className="text-brand-red inline-block"
                  style={{ textShadow: '0 0 30px rgba(255,45,85,0.5)' }}>
                  {WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span><br />
            <SplitText text="Always Near" />
          </h1>

          {/* Typewriter subheading */}
          <p className="text-brand-muted text-base leading-relaxed mb-8 max-w-sm mx-auto min-h-[4rem]">
            {displayed}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
              className="inline-block w-[2px] h-4 bg-brand-red ml-0.5 align-middle" />
          </p>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            {/* Magnetic CTA button */}
            <MagneticButton
              onClick={() => navigate('/auth/register')}
              className="w-full py-4 bg-brand-red rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 relative overflow-hidden"
              style={{ boxShadow: '0 0 40px rgba(255,45,85,0.3)' }}>
              <motion.div className="absolute inset-0 bg-white/10"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.4 }} />
              Get Protected — Free <ChevronRight size={18} />
            </MagneticButton>

            <button onClick={() => navigate('/auth/login')}
              className="w-full py-4 rounded-2xl text-sm transition-all"
              style={{ border: '1px solid rgba(200,150,120,0.35)', color: 'var(--page-text, #F0F4FF)', opacity: 0.7 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}>
              Sign In to Your Account
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 mb-4 relative z-10 stats-section-divider">
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: 3, suffix: 's', label: 'Alert Response Time' },
            { num: 24, suffix: '/7', label: 'AI Guardian Active' },
            { num: 100, suffix: '%', label: 'Free to Use' },
          ].map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1}>
              <TiltCard className="glass-card p-4 text-center">
                <div className="font-syne text-2xl font-extrabold text-brand-red">
                  <AnimatedCounter value={stat.num} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] text-brand-muted mt-1 leading-tight">{stat.label}</div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <div className="px-6"><GlowDivider /></div>

      {/* ── Features ── */}
      <section className="px-6 mb-4 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-6">
            <p className="text-xs text-brand-red font-bold tracking-widest uppercase mb-2">Features</p>
            <h2 className="font-syne text-2xl font-bold" style={{ color: 'var(--page-text, #F0F4FF)' }}>How SafeHer Protects You</h2>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.08}>
              <TiltCard className="glass-card p-4 h-full">
                <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <f.icon size={18} className={f.color} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--page-text, #F0F4FF)' }}>{f.title}</p>
                <p className="text-xs text-brand-muted leading-relaxed">{f.desc}</p>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <div className="px-6"><GlowDivider /></div>

      {/* ── How it works ── */}
      <section className="px-6 mb-4 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-6">
            <p className="text-xs text-brand-red font-bold tracking-widest uppercase mb-2">Simple Setup</p>
            <h2 className="font-syne text-2xl font-bold" style={{ color: 'var(--page-text, #F0F4FF)' }}>What Happens During SOS</h2>
          </div>
        </ScrollReveal>
        <div className="space-y-3">
          {[
            { icon: AlertTriangle, title: 'SOS Triggers Silently', desc: 'Button, shake, or AI keyword — no sound made', color: 'text-brand-red', bg: 'bg-brand-red/10' },
            { icon: MapPin, title: 'Location Broadcasts Live', desc: 'GPS updates every 3 seconds to your guardians', color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
            { icon: MessageCircle, title: 'Contacts Get WhatsApp Alerts', desc: 'Instant message with your location and tracking link', color: 'text-brand-green', bg: 'bg-brand-green/10' },
            { icon: Mic, title: 'Audio Recorded Secretly', desc: 'Evidence captured and encrypted in cloud storage', color: 'text-brand-amber', bg: 'bg-brand-amber/10' },
            { icon: Shield, title: 'AI Guides You to Safety', desc: 'Real-time suggestions for escape and safe zones', color: 'text-brand-red', bg: 'bg-brand-red/10' },
          ].map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 0.08}>
              <motion.div whileHover={{ x: 6 }} className="flex items-center gap-4 glass-card p-4 transition-colors">
                <div className={`w-10 h-10 ${step.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <step.icon size={18} className={step.color} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--page-text, #F0F4FF)' }}>{step.title}</p>
                  <p className="text-xs text-brand-muted">{step.desc}</p>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <div className="px-6"><GlowDivider /></div>

      {/* ── Get started ── */}
      <section className="px-6 mb-4 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-6">
            <p className="text-xs text-brand-red font-bold tracking-widest uppercase mb-2">Get Started</p>
            <h2 className="font-syne text-2xl font-bold" style={{ color: 'var(--page-text, #F0F4FF)' }}>3 Steps to Stay Safe</h2>
          </div>
        </ScrollReveal>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 0.15}>
              <TiltCard className="flex items-center gap-4 glass-card p-4">
                <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="font-syne font-bold text-brand-red text-sm">{step.num}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--page-text, #F0F4FF)' }}>{step.title}</p>
                  <p className="text-xs text-brand-muted">{step.desc}</p>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <div className="px-6"><GlowDivider /></div>

      {/* ── Privacy Promise ── */}
      <section className="px-6 mb-12 relative z-10">
        <ScrollReveal>
          <div className="glass-card p-6 text-center"
            style={{ background: 'rgba(255,45,85,0.05)', borderColor: 'rgba(255,45,85,0.15)' }}>
            <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <Lock size={28} className="text-brand-red mx-auto mb-3" />
            </motion.div>
            <h3 className="font-syne font-bold text-lg mb-2" style={{ color: 'var(--page-text, #F0F4FF)' }}>Your Privacy is Sacred</h3>
            <p className="text-sm text-brand-muted leading-relaxed">
              No ads. No data selling. No tracking beyond your safety needs. Your location and recordings are encrypted and only shared with contacts you choose.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-16 relative z-10">
        <ScrollReveal>
          <div className="glass-card p-8 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,45,85,0.15), rgba(255,45,85,0.05))', borderColor: 'rgba(255,45,85,0.2)' }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Shield size={40} className="text-brand-red mx-auto mb-4" />
            </motion.div>
            <h2 className="font-syne text-2xl font-extrabold mb-2" style={{ color: 'var(--page-text, #F0F4FF)' }}>Start Staying Safe Today</h2>
            <p className="text-brand-muted text-sm mb-6">Free forever. No credit card. Works offline.</p>
            <MagneticButton
              onClick={() => navigate('/auth/register')}
              className="w-full py-4 bg-brand-red rounded-2xl font-bold text-white text-base relative overflow-hidden"
              style={{ boxShadow: '0 0 40px rgba(255,45,85,0.4)' }}>
              <motion.div className="absolute inset-0 bg-white/10"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.4 }} />
              Get Protected — It's Free
            </MagneticButton>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <div className="text-center pb-8 text-xs text-brand-muted relative z-10">
        SafeHer v2.4 · Made with ❤️ for every woman's safety
      </div>

    </div>
  )
}