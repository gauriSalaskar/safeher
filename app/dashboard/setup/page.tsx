'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CheckCircle, MessageCircle, Phone, Shield, ArrowRight, Copy, Sparkles, Heart, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const steps = [
  {
    id: 1,
    icon: '🛡️',
    emoji: '✨',
    title: 'Welcome to SafeHer',
    subtitle: 'Your Safety. Reimagined.',
    description: 'An AI-powered guardian that\'s always with you. Let\'s get you set up in 3 simple steps.',
    color: '#FF2D55',
    gradient: 'from-[#FF2D55]/20 to-[#FF6B6B]/5',
    features: [
      { icon: '🚨', text: 'One-tap SOS alerts' },
      { icon: '📍', text: 'Live GPS tracking' },
      { icon: '🤖', text: 'AI safety guidance' },
      { icon: '📞', text: 'Fake call feature' },
    ]
  },
  {
    id: 2,
    icon: '👥',
    emoji: '💛',
    title: 'Add Your Guardians',
    subtitle: 'People who protect you.',
    description: 'Add trusted contacts who will receive instant alerts when you need help.',
    color: '#3D8EFF',
    gradient: 'from-[#3D8EFF]/20 to-[#3D8EFF]/5',
    action: '/dashboard/contacts',
    actionLabel: 'Add Emergency Contacts',
    tips: [
      'Add family members first',
      'Include at least 2-3 contacts',
      'Priority 1 contacts get alerted first',
    ]
  },
  {
    id: 3,
    icon: '💬',
    emoji: '💚',
    title: 'Activate WhatsApp Alerts',
    subtitle: 'Instant alerts via WhatsApp.',
    description: 'Your contacts need to join once to receive instant WhatsApp emergency alerts.',
    color: '#00E676',
    gradient: 'from-[#00E676]/20 to-[#00E676]/5',
    whatsapp: true,
  },
]

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const step = steps[currentStep]

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  return (
    <div className="min-h-screen bg-[#080B14] px-5 py-8 flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: step.color }} />
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
        {steps.map((s, i) => (
          <motion.div key={s.id}
            animate={{ width: i === currentStep ? 32 : 8, opacity: i <= currentStep ? 1 : 0.3 }}
            className="h-2 rounded-full"
            style={{ background: i <= currentStep ? step.color : '#1e2d47' }} />
        ))}
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div key={currentStep}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col relative z-10">

          {/* Icon */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 mx-auto"
            style={{ background: `${step.color}20`, border: `2px solid ${step.color}40` }}>
            <span className="text-5xl">{step.icon}</span>
          </motion.div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-center mb-6">
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: step.color }}>
              {step.emoji} {step.subtitle}
            </p>
            <h1 className="text-3xl font-extrabold text-white mb-3" style={{ fontFamily: 'system-ui' }}>
              {step.title}
            </h1>
            <p className="text-[#7B8DB0] leading-relaxed text-sm">{step.description}</p>
          </motion.div>

          {/* Step 1 - Features */}
          {step.features && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-3 mb-6">
              {step.features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-2xl p-4 border"
                  style={{ background: `${step.color}08`, borderColor: `${step.color}20` }}>
                  <span className="text-2xl mb-2 block">{f.icon}</span>
                  <p className="text-xs text-[#7B8DB0] font-medium">{f.text}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Step 2 - Tips */}
          {step.tips && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="space-y-3 mb-6">
              {step.tips.map((tip, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-2xl p-4"
                  style={{ background: `${step.color}08`, border: `1px solid ${step.color}20` }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: step.color }}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-white">{tip}</p>
                </motion.div>
              ))}
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                onClick={() => router.push(step.action!)}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mt-2"
                style={{ background: `${step.color}20`, border: `1px solid ${step.color}40`, color: step.color }}>
                <Phone size={18} /> {step.actionLabel}
              </motion.button>
            </motion.div>
          )}

          {/* Step 3 - WhatsApp */}
          {step.whatsapp && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="space-y-3 mb-6">
              {/* Number */}
              <div className="rounded-2xl p-4" style={{ background: '#00E67610', border: '1px solid #00E67630' }}>
                <p className="text-xs text-[#7B8DB0] mb-2">📱 Send WhatsApp message to:</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold" style={{ color: '#00E676' }}>+1 415 523 8886</p>
                  <button onClick={() => handleCopy('+14155238886', 'Number')}
                    className="p-2 rounded-xl" style={{ background: '#00E67620' }}>
                    <Copy size={16} color="#00E676" />
                  </button>
                </div>
              </div>

              {/* Join code */}
              <div className="rounded-2xl p-4" style={{ background: '#3D8EFF10', border: '1px solid #3D8EFF30' }}>
                <p className="text-xs text-[#7B8DB0] mb-2">💬 Message to send:</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold" style={{ color: '#3D8EFF' }}>join drive-itself</p>
                  <button onClick={() => handleCopy('join drive-itself', 'Join code')}
                    className="p-2 rounded-xl" style={{ background: '#3D8EFF20' }}>
                    <Copy size={16} color="#3D8EFF" />
                  </button>
                </div>
              </div>

              {/* Steps */}
              {['Your contact opens WhatsApp', 'Sends "join drive-itself" to +14155238886', 'Gets confirmation ✅ — done!'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={16} color="#00E676" />
                  <p className="text-sm text-[#7B8DB0]">{item}</p>
                </div>
              ))}

              {/* Open WhatsApp button */}
              <a href="https://wa.me/14155238886?text=join%20drive-itself" target="_blank"
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-2"
                style={{ background: '#00E67620', border: '1px solid #00E67640', color: '#00E676' }}>
                <MessageCircle size={18} /> Open WhatsApp & Join
              </a>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-4 relative z-10">
        {currentStep > 0 && (
          <button onClick={() => setCurrentStep(currentStep - 1)}
            className="flex-1 py-4 border border-[#1e2d47] rounded-2xl text-[#7B8DB0] font-semibold">
            Back
          </button>
        )}
        {currentStep < steps.length - 1 ? (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentStep(currentStep + 1)}
            className="flex-1 py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: step.color }}>
            Next <ArrowRight size={18} />
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/dashboard/home')}
            className="flex-1 py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: '#FF2D55' }}>
            Start SafeHer <Zap size={18} />
          </motion.button>
        )}
      </div>
    </div>
  )
}
