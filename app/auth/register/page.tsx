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

  const validateStep1 = () => {
    // Full name — only letters and spaces
    if (!form.full_name.trim()) {
      toast.error('Please enter your full name'); return false
    }
    if (!/^[a-zA-Z\s]+$/.test(form.full_name.trim())) {
      toast.error('Full name should only contain letters'); return false
    }

    // Email
    if (!form.email) {
      toast.error('Please enter your email'); return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address'); return false
    }

    // Phone — only digits, exactly 10
    const phoneDigits = form.phone.replace(/\D/g, '')
    if (!form.phone) {
      toast.error('Please enter your phone number'); return false
    }
    if (phoneDigits.length !== 10) {
      toast.error('Phone number must be exactly 10 digits'); return false
    }

    // Password
    if (!form.password) {
      toast.error('Please enter a password'); return false
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters'); return false
    }
    if (!/[0-9]/.test(form.password)) {
      toast.error('Password must contain at least one number'); return false
    }
    if (!/[a-zA-Z]/.test(form.password)) {
      toast.error('Password must contain at least one letter'); return false
    }

    return true
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.emergency_pin.length !== 4) {
      toast.error('PIN must be exactly 4 digits'); return
    }
    if (form.emergency_pin === '1234' || form.emergency_pin === '0000') {
      toast.error('Please choose a stronger PIN'); return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, phone: form.phone, emergency_pin: form.emergency_pin } },
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
      router.push('/dashboard/setup')
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
      

        <form onSubmit={step === 1 ? handleStep1 : handleRegister} className="space-y-4">
          {step === 1 ? (
            <>
              {/* Full Name */}
              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => {
                      // Only allow letters and spaces
                      const val = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                      update('full_name', val)
                    }}
                    placeholder="Priya Sharma"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="your@email.com"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => {
                      // Only allow digits, max 10
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                      update('phone', val)
                    }}
                    placeholder="9876543210"
                    className={inputClass}
                    required
                    maxLength={10}
                  />
                </div>
                <p className="text-[10px] text-brand-muted mt-1 ml-1">10 digit mobile number without +91</p>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-2 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="Min 8 characters with a number"
                    className={`${inputClass} pr-11`}
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-brand-muted mt-1 ml-1">Min 8 characters, must include a letter and a number</p>
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
                type="number"
                value={form.emergency_pin}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                  update('emergency_pin', val)
                }}
                placeholder="e.g. 7392"
                className="w-full bg-brand-card2 border border-brand-border rounded-xl py-5 text-center text-brand-text text-3xl font-bold tracking-[1rem] outline-none focus:border-brand-red transition-colors"
                required
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