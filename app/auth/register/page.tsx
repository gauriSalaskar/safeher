'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield, Lock, Mail, User, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', emergency_pin: '',
  })
  const router = useRouter()

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.emergency_pin.length !== 4) { toast.error('PIN must be exactly 4 digits'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, phone: form.phone } },
      })
      if (error) throw error
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          emergency_pin: form.emergency_pin,
        })
      }
      toast.success('Account created! You are now protected 🛡️')
      router.push('/dashboard/home')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-brand-card2 border border-brand-border rounded-xl py-4 pl-11 pr-4 text-brand-text text-sm outline-none focus:border-brand-red transition-colors"

  return (
    <div className="page-container min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <span className="font-syne font-bold text-2xl">Safe<span className="text-brand-red">Her</span></span>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-brand-red' : 'bg-brand-border'}`} />
          ))}
        </div>

        <h1 className="font-syne text-3xl font-extrabold mb-1">
          {step === 1 ? 'Create Account' : 'Set Your PIN'}
        </h1>
        <p className="text-brand-muted text-sm mb-7">
          {step === 1 ? 'Join 2.4M+ women who trust SafeHer' : 'Your 4-digit emergency PIN'}
        </p>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleRegister} className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)}
                    placeholder="Priya Sharma" className={inputClass} required />
                </div>
              </div>
              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                    placeholder="your@email.com" className={inputClass} required />
                </div>
              </div>
              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                    placeholder="+91 98765 43210" className={inputClass} required />
                </div>
              </div>
              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="Min 8 characters" className={`${inputClass} pr-11`} required minLength={8} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="glass-card p-5 mb-5 text-center">
                <div className="text-3xl mb-2">🔐</div>
                <p className="text-sm text-brand-muted">This PIN cancels false SOS triggers. Keep it private and memorable.</p>
              </div>
              <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">4-Digit Emergency PIN</label>
              <input
                type="number" value={form.emergency_pin}
                onChange={e => update('emergency_pin', e.target.value.slice(0, 4))}
                placeholder="e.g. 7392"
                className="w-full bg-brand-card2 border border-brand-border rounded-xl py-5 text-center text-brand-text text-3xl font-bold tracking-[1rem] outline-none focus:border-brand-red transition-colors"
                required maxLength={4}
              />
              <p className="text-xs text-brand-muted mt-2 text-center">Do NOT use your birthday or 1234</p>
            </div>
          )}

          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
            className="w-full py-4 bg-brand-red rounded-2xl text-white font-syne font-bold text-base mt-2 disabled:opacity-60 emergency-glow">
            {loading ? 'Creating Account...' : step === 1 ? 'Continue →' : 'Activate Protection 🛡️'}
          </motion.button>

          {step === 2 && (
            <button type="button" onClick={() => setStep(1)}
              className="w-full py-3 text-brand-muted text-sm hover:text-brand-text transition-colors">
              ← Back
            </button>
          )}
        </form>

        <p className="text-center text-sm text-brand-muted mt-6">
          Already protected?{' '}
          <Link href="/auth/login" className="text-brand-red font-semibold hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  )
}
