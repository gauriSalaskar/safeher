'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Shield, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

// --- Magnetic button wrapper ---
function MagneticButton({
  children,
  className,
  onClick,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = e.clientX - rect.left - rect.width / 2
    const relY = e.clientY - rect.top - rect.height / 2
    setPos({ x: relX * 0.25, y: relY * 0.3 })
  }

  const handleMouseLeave = () => setPos({ x: 0, y: 0 })

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 12, mass: 0.5 }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.button>
  )
}

// --- Staggered letter reveal ---
function LetterReveal({ text, className }: { text: string; className?: string }) {
  const letters = text.split('')
  return (
    <h1 className={className} aria-label={text}>
      {letters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.025, ease: 'easeOut' }}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </h1>
  )
}

// --- Grain texture overlay ---
function GrainOverlay() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[60] w-full h-full opacity-[0.045] mix-blend-overlay"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="grain-login">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-login)" />
    </svg>
  )
}

// --- Red curtain wipe transition ---
function CurtainWipe({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          style={{ originY: 0 }}
          className="fixed inset-0 z-[100] bg-brand-red flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <Shield size={22} className="text-white" />
            <span className="font-syne font-bold text-xl text-white">Welcome back</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill all fields'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Welcome back! Staying safe 🛡️')
      setTransitioning(true)
      setTimeout(() => router.push('/dashboard/home'), 550)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast.error(msg)
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `https://safeher-opal.vercel.app/dashboard/home`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google login failed'
      toast.error(msg)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="page-container min-h-screen flex flex-col justify-center px-6 py-12 relative overflow-hidden">
      <GrainOverlay />
      <CurtainWipe active={transitioning} />
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <span className="font-syne font-bold text-2xl">Safe<span className="text-brand-red">Her</span></span>
        </div>

        <LetterReveal text="Welcome Back" className="font-syne text-3xl font-extrabold mb-2" />
        <p className="text-brand-muted text-sm mb-8">Sign in to activate your safety shield</p>

        {/* Google Login Button */}
        <MagneticButton
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-4 bg-white rounded-2xl text-gray-800 font-bold text-sm flex items-center justify-center gap-3 mb-6 disabled:opacity-60 hover:bg-gray-100 transition-colors"
        >
          {googleLoading ? (
            <span className="text-gray-600">Connecting to Google...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </MagneticButton>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-brand-border" />
          <span className="text-xs text-brand-muted">or sign in with email</span>
          <div className="flex-1 h-px bg-brand-border" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-brand-card2 border border-brand-border rounded-xl py-4 pl-11 pr-4 text-brand-text text-sm outline-none focus:border-brand-red transition-colors"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-brand-card2 border border-brand-border rounded-xl py-4 pl-11 pr-11 text-brand-text text-sm outline-none focus:border-brand-red transition-colors"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-xs text-brand-red hover:underline">
              Forgot Password?
            </Link>
          </div>

          <MagneticButton
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-red rounded-2xl text-white font-syne font-bold text-base mt-2 disabled:opacity-60 emergency-glow"
          >
            {loading ? 'Signing In...' : 'Sign In Securely'}
          </MagneticButton>
        </form>

        {/* Demo access */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-brand-border" />
          <span className="text-xs text-brand-muted">or</span>
          <div className="flex-1 h-px bg-brand-border" />
        </div>

        <button
          onClick={() => { setEmail('demo@safeher.app'); setPassword('demo1234') }}
          className="w-full py-3.5 bg-brand-card2 border border-brand-border rounded-xl text-sm font-semibold text-brand-muted hover:border-brand-red/50 transition-colors"
        >
          🎮 Use Demo Account
        </button>

        <p className="text-center text-sm text-brand-muted mt-6">
          New to SafeHer?{' '}
          <Link href="/auth/register" className="text-brand-red font-semibold hover:underline">
            Create Account
          </Link>
        </p>
      </motion.div>
    </div>
  )
}