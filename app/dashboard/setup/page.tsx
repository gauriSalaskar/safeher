'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CheckCircle, MessageCircle, Phone, Shield, ArrowRight, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const steps = [
  {
    id: 1,
    icon: Shield,
    title: 'Welcome to SafeHer',
    description: 'Your personal AI-powered safety companion. Let\'s set up your emergency alerts in 3 simple steps.',
    color: 'text-brand-red',
    bg: 'bg-brand-red/10',
  },
  {
    id: 2,
    icon: Phone,
    title: 'Add Emergency Contacts',
    description: 'Go to Contacts tab and add your trusted family members or friends with their WhatsApp numbers.',
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/10',
    action: '/dashboard/contacts',
    actionLabel: 'Add Contacts',
  },
  {
    id: 3,
    icon: MessageCircle,
    title: 'Activate WhatsApp Alerts',
    description: 'Ask your emergency contacts to send the join code to activate instant WhatsApp emergency alerts.',
    color: 'text-brand-green',
    bg: 'bg-brand-green/10',
    whatsapp: true,
  },
]

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const step = steps[currentStep]

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  return (
    <div className="page-container min-h-screen bg-brand-dark px-5 py-8 flex flex-col">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className={`h-1 flex-1 rounded-full transition-all ${i <= currentStep ? 'bg-brand-red' : 'bg-brand-border'}`} />
        ))}
      </div>

      {/* Step Content */}
      <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
        <div className={`w-16 h-16 ${step.bg} rounded-2xl flex items-center justify-center mb-6`}>
          <step.icon size={32} className={step.color} />
        </div>

        <h1 className="font-syne text-2xl font-bold mb-3">{step.title}</h1>
        <p className="text-brand-muted leading-relaxed mb-6">{step.description}</p>

        {/* WhatsApp Setup */}
        {step.whatsapp && (
          <div className="space-y-4">
            <div className="bg-brand-green/5 border border-brand-green/20 rounded-2xl p-4">
              <p className="text-sm font-semibold text-brand-green mb-3">📱 Send this on WhatsApp to:</p>
              <div className="bg-brand-dark3 rounded-xl p-3 flex items-center justify-between gap-3">
                <p className="font-bold text-brand-green">+1 415 523 8886</p>
                <button onClick={() => handleCopy('+14155238886')} className="p-2 bg-brand-green/10 rounded-lg">
                  <Copy size={16} className="text-brand-green" />
                </button>
              </div>
            </div>

            <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-4">
              <p className="text-sm font-semibold text-brand-blue mb-3">💬 Join code to send:</p>
              <div className="bg-brand-dark3 rounded-xl p-3 flex items-center justify-between gap-3">
                <p className="font-bold text-brand-blue text-lg">join drive-itself</p>
                <button onClick={() => handleCopy('join drive-itself')} className="p-2 bg-brand-blue/10 rounded-lg">
                  <Copy size={16} className="text-brand-blue" />
                </button>
              </div>
            </div>

            <div className="bg-brand-amber/5 border border-brand-amber/20 rounded-2xl p-4">
              <p className="text-sm font-semibold text-brand-amber mb-2">⚡ What happens:</p>
              <ul className="space-y-1">
                {['Contact sends the join code on WhatsApp', 'They receive a confirmation message', 'When you press SOS — they get instant WhatsApp alert!'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-brand-muted">
                    <CheckCircle size={12} className="text-brand-green flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <a href="https://wa.me/14155238886?text=join%20drive-itself" target="_blank"
              className="w-full py-4 bg-brand-green/10 border border-brand-green/30 rounded-2xl text-brand-green font-semibold text-sm flex items-center justify-center gap-2">
              <MessageCircle size={16} /> Open WhatsApp to Join
            </a>
          </div>
        )}

        {step.action && (
          <button onClick={() => router.push(step.action!)}
            className="w-full py-4 bg-brand-blue/10 border border-brand-blue/30 rounded-2xl text-brand-blue font-semibold text-sm flex items-center justify-center gap-2 mt-4">
            {step.actionLabel} <ArrowRight size={16} />
          </button>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {currentStep > 0 && (
          <button onClick={() => setCurrentStep(currentStep - 1)}
            className="flex-1 py-4 border border-brand-border rounded-2xl text-brand-muted font-semibold">
            Back
          </button>
        )}
        {currentStep < steps.length - 1 ? (
          <button onClick={() => setCurrentStep(currentStep + 1)}
            className="flex-1 py-4 bg-brand-red rounded-2xl text-white font-bold flex items-center justify-center gap-2">
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={() => router.push('/dashboard/home')}
            className="flex-1 py-4 bg-brand-red rounded-2xl text-white font-bold flex items-center justify-center gap-2">
            Start Using SafeHer <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
