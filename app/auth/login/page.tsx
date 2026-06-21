'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
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
      router.push('/dashboard/home')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container min-h-screen flex flex-col justify-center px-6 py-12">
      {/* BG glow */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <span className="font-syne font-bold text-2xl">Safe<span className="text-brand-red">Her</span></span>
        </div>

        <h1 className="font-syne text-3xl font-extrabold mb-2">Welcome Back</h1>
        <p className="text-brand-muted text-sm mb-8">Sign in to activate your safety shield</p>

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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-xs text-brand-red hover:underline">
              Forgot Password?
            </Link>
          </div>

          <motion.button
            type="submit" disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 bg-brand-red rounded-2xl text-white font-syne font-bold text-base mt-2 disabled:opacity-60 emergency-glow"
          >
            {loading ? 'Signing In...' : 'Sign In Securely'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-brand-border" />
          <span className="text-xs text-brand-muted">or</span>
          <div className="flex-1 h-px bg-brand-border" />
        </div>

        {/* Demo access */}
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
