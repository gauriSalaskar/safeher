'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, Plus, CheckCircle, AlertTriangle, Bell, Trash2, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { createCheckIn, updateCheckIn, getPendingCheckIns } from '@/lib/supabase/queries'
import type { SafeCheckIn } from '@/types'

const PRESETS = [
  { label: 'Home in 30 min', minutes: 30 },
  { label: 'Home in 1 hour', minutes: 60 },
  { label: 'Home in 2 hours', minutes: 120 },
  { label: 'Custom time', minutes: -1 },
]

const STATUS_CONFIG = {
  pending:   { icon: Clock,         color: 'text-brand-amber',  bg: 'bg-brand-amber/10',  label: 'Pending' },
  completed: { icon: CheckCircle,   color: 'text-brand-green',  bg: 'bg-brand-green/10',  label: 'Safe ✓' },
  missed:    { icon: AlertTriangle, color: 'text-brand-red',    bg: 'bg-brand-red/10',    label: 'Missed!' },
  alerted:   { icon: Bell,          color: 'text-brand-red',    bg: 'bg-brand-red/10',    label: 'Alerted' },
}

const DEMO_CHECKINS: SafeCheckIn[] = [
  {
    id: '1',
    user_id: 'demo',
    label: 'Reach home from work',
    expected_time: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'demo',
    label: 'Night walk check-in',
    expected_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    created_at: new Date().toISOString(),
  },
]

function timeLeft(expected: string): string {
  const diff = new Date(expected).getTime() - Date.now()
  if (diff <= 0) return 'Overdue'
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m left`
  return `${Math.floor(m / 60)}h ${m % 60}m left`
}

export default function CheckInPage() {
  const router = useRouter()
  const [checkins, setCheckins] = useState<SafeCheckIn[]>(DEMO_CHECKINS)
  const [showAdd, setShowAdd] = useState(false)
  const [userId, setUserId] = useState('')
  const [label, setLabel] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const pending = await getPendingCheckIns(user.id)
      if (pending.length > 0) setCheckins(pending)
    }
    load()
  }, [])

  // Poll for missed check-ins every minute
  useEffect(() => {
    const check = () => {
      setCheckins(prev =>
        prev.map(c => {
          if (c.status === 'pending' && new Date(c.expected_time) < new Date()) {
            toast.error(`⏰ Missed check-in: "${c.label}" — alerting contacts!`, { duration: 5000 })
            return { ...c, status: 'alerted' }
          }
          return c
        })
      )
    }
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAdd = useCallback(async () => {
    if (!label.trim()) { toast.error('Please enter a label'); return }

    let expectedTime: Date
    if (selectedPreset !== null && selectedPreset >= 0) {
      expectedTime = new Date(Date.now() + selectedPreset * 60 * 1000)
    } else if (customTime) {
      expectedTime = new Date(customTime)
    } else {
      toast.error('Please select a time')
      return
    }

    const newCheckIn: Omit<SafeCheckIn, 'id' | 'created_at'> = {
      user_id: userId || 'demo',
      label,
      expected_time: expectedTime.toISOString(),
      status: 'pending',
    }

    if (userId) {
      const { data } = await createCheckIn(newCheckIn)
      if (data) {
        setCheckins(prev => [data as SafeCheckIn, ...prev])
        toast.success('Check-in scheduled! Contacts will be alerted if you miss it.')
      }
    } else {
      setCheckins(prev => [{ ...newCheckIn, id: Date.now().toString(), created_at: new Date().toISOString() }, ...prev])
      toast.success('Check-in scheduled!')
    }

    setLabel('')
    setCustomTime('')
    setSelectedPreset(null)
    setShowAdd(false)
  }, [label, selectedPreset, customTime, userId])

  const handleComplete = useCallback(async (id: string) => {
    setCheckins(prev => prev.map(c => c.id === id ? { ...c, status: 'completed' } : c))
    if (userId) await updateCheckIn(id, { status: 'completed' })
    toast.success('✅ Safe check-in confirmed! Contacts notified.')
  }, [userId])

  const handleDelete = useCallback((id: string) => {
    setCheckins(prev => prev.filter(c => c.id !== id))
  }, [])

  return (
    <div className="flex flex-col pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2">
        <button onClick={() => router.back()} className="w-9 h-9 glass-card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-syne font-bold text-xl">Safe Check-ins</h2>
          <p className="text-xs text-brand-muted">Auto-alert if you don't confirm</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="w-9 h-9 bg-brand-red rounded-xl flex items-center justify-center">
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* How it works */}
      <div className="mx-5 mt-3 mb-4 bg-brand-blue/5 border border-brand-blue/20 rounded-xl px-4 py-3 flex items-start gap-2">
        <Bell size={14} className="text-brand-blue flex-shrink-0 mt-0.5" />
        <p className="text-xs text-brand-muted leading-relaxed">
          Schedule a check-in time. If you don't confirm safe arrival, SafeHer <strong className="text-brand-blue">automatically alerts your emergency contacts</strong> with your last known location.
        </p>
      </div>

      {/* Add Check-in Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-5 mb-4 glass-card p-5 border border-brand-red/20"
          >
            <h3 className="font-syne font-bold text-base mb-4">Schedule Check-in</h3>

            <div className="mb-3">
              <p className="text-xs text-brand-muted mb-2">Label</p>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Reach home from college"
                className="w-full bg-brand-dark3 border border-brand-border rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-red/50 text-brand-text placeholder:text-brand-muted"
              />
            </div>

            <div className="mb-4">
              <p className="text-xs text-brand-muted mb-2">I should be safe by</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {PRESETS.map((p, i) => (
                  <button key={p.label}
                    onClick={() => setSelectedPreset(p.minutes === -1 ? -1 : p.minutes)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors ${selectedPreset === (p.minutes === -1 ? -1 : p.minutes) ? 'bg-brand-red/15 border-brand-red/40 text-brand-red' : 'bg-brand-dark3 border-brand-border text-brand-muted'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              {selectedPreset === -1 && (
                <input
                  type="datetime-local"
                  value={customTime}
                  onChange={e => setCustomTime(e.target.value)}
                  className="w-full bg-brand-dark3 border border-brand-border rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-red/50 text-brand-text"
                />
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setShowAdd(false); setLabel(''); setSelectedPreset(null) }}
                className="flex-1 py-3 bg-brand-card2 border border-brand-border rounded-xl text-brand-muted text-sm font-semibold">
                Cancel
              </button>
              <button onClick={handleAdd}
                className="flex-1 py-3 bg-brand-red rounded-xl text-white text-sm font-bold">
                Schedule ✓
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-in List */}
      <p className="px-5 text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">Your Check-ins</p>
      <div className="px-5 space-y-2.5">
        {checkins.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Clock size={32} className="text-brand-muted mx-auto mb-3 opacity-50" />
            <p className="text-sm text-brand-muted">No check-ins scheduled</p>
            <p className="text-xs text-brand-muted mt-1">Tap + to add one</p>
          </div>
        )}
        {checkins.map((c, i) => {
          const cfg = STATUS_CONFIG[c.status]
          const Icon = cfg.icon
          const overdue = c.status === 'pending' && new Date(c.expected_time) < new Date()
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass-card p-4 border ${overdue ? 'border-brand-red/30' : 'border-brand-border'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.label}</p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {new Date(c.expected_time).toLocaleTimeString('en-IN', { timeStyle: 'short' })} ·{' '}
                    <span className={overdue ? 'text-brand-red' : cfg.color}>
                      {c.status === 'pending' ? timeLeft(c.expected_time) : cfg.label}
                    </span>
                  </p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-brand-muted hover:text-brand-red transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              {c.status === 'pending' && (
                <button onClick={() => handleComplete(c.id)}
                  className="mt-3 w-full py-2.5 bg-brand-green/10 border border-brand-green/30 rounded-xl text-brand-green text-xs font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle size={13} /> I'm Safe — Confirm Check-in
                </button>
              )}
              {(c.status === 'missed' || c.status === 'alerted') && (
                <div className="mt-2 flex items-center gap-1.5 text-brand-red text-xs">
                  <AlertTriangle size={12} />
                  Emergency contacts have been alerted with your last known location
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
