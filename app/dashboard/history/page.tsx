'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { getSOSHistory } from '@/lib/supabase/queries'
import type { SOSAlert } from '@/types'

const FILTERS = ['All', 'Manual', 'Shake', 'AI Detected', 'Resolved', 'Cancelled'] as const
type Filter = typeof FILTERS[number]

const TRIGGER_CONFIG = {
  manual: { label: 'Manual SOS', color: 'bg-brand-red/15 text-brand-red' },
  shake: { label: 'Shake Trigger', color: 'bg-brand-amber/15 text-brand-amber' },
  ai_keyword: { label: 'AI Detected', color: 'bg-brand-blue/15 text-brand-blue' },
  voice: { label: 'Voice Trigger', color: 'bg-purple-500/15 text-purple-400' },
}

const DEMO_ALERTS: SOSAlert[] = [
  { id: '1', user_id: 'demo', trigger_type: 'manual', latitude: 19.876, longitude: 75.343, address: 'MG Road, Aurangabad', status: 'resolved', duration_seconds: 720, audio_url: 'demo', ai_summary: 'User triggered SOS near MG Road at 10:42 PM. Emergency lasted 12 minutes. All contacts notified. Audio evidence saved.', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), resolved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 720000).toISOString() },
  { id: '2', user_id: 'demo', trigger_type: 'shake', latitude: 19.868, longitude: 75.351, address: 'Station Road, Aurangabad', status: 'cancelled', duration_seconds: 240, audio_url: 'demo', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '3', user_id: 'demo', trigger_type: 'ai_keyword', latitude: 19.882, longitude: 75.339, address: 'Chikalthana, Aurangabad', status: 'resolved', duration_seconds: 480, audio_url: 'demo', ai_summary: 'AI detected panic keywords at 9:30 PM. SOS automatically triggered near Chikalthana area. Emergency resolved in 8 minutes.', created_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '4', user_id: 'demo', trigger_type: 'manual', latitude: 19.874, longitude: 75.356, address: 'Jalna Road, Aurangabad', status: 'cancelled', duration_seconds: 120, created_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString() },
]

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

export default function HistoryPage() {
  const [alerts, setAlerts] = useState<SOSAlert[]>(DEMO_ALERTS)
  const [filter, setFilter] = useState<Filter>('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const history = await getSOSHistory(user.id)
      if (history.length > 0) setAlerts(history)
    }
    load()
  }, [])

  const filtered = alerts.filter(a => {
    if (filter === 'All') return true
    if (filter === 'Manual') return a.trigger_type === 'manual'
    if (filter === 'Shake') return a.trigger_type === 'shake'
    if (filter === 'AI Detected') return a.trigger_type === 'ai_keyword'
    if (filter === 'Resolved') return a.status === 'resolved'
    if (filter === 'Cancelled') return a.status === 'cancelled'
    return true
  })

  return (
    <div className="flex flex-col pb-4">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-syne font-extrabold text-2xl mb-1">SOS History</h1>
        <p className="text-brand-muted text-sm">{alerts.length} emergency sessions recorded</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-5 mb-5">
        {[
          { num: alerts.filter(a => a.status === 'resolved').length, label: 'Resolved', color: 'text-brand-green' },
          { num: alerts.filter(a => a.audio_url).length, label: 'With Audio', color: 'text-brand-blue' },
          { num: alerts.filter(a => a.status === 'cancelled').length, label: 'Cancelled', color: 'text-brand-amber' },
        ].map(s => (
          <div key={s.label} className="glass-card p-3 text-center">
            <div className={`font-syne text-xl font-bold ${s.color}`}>{s.num}</div>
            <div className="text-[10px] text-brand-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 overflow-x-auto scrollbar-none mb-4 pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full border transition-all ${filter === f ? 'bg-brand-red border-brand-red text-white' : 'border-brand-border text-brand-muted hover:border-brand-red/40'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      <div className="px-5 space-y-3">
        <AnimatePresence>
          {filtered.map((alert, i) => {
            const cfg = TRIGGER_CONFIG[alert.trigger_type] || TRIGGER_CONFIG.manual
            const isExpanded = expanded === alert.id
            return (
              <motion.div key={alert.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card overflow-hidden">
                <div className="p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : alert.id)}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-muted">{format(new Date(alert.created_at), 'MMM d, yyyy')}</span>
                      {isExpanded ? <ChevronUp size={14} className="text-brand-muted" /> : <ChevronDown size={14} className="text-brand-muted" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm font-medium mb-2.5">
                    <MapPin size={13} className="text-brand-muted" />
                    {alert.address || `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`}
                  </div>

                  <div className="flex gap-4 text-xs text-brand-muted">
                    <span className="flex items-center gap-1"><Clock size={11} />{alert.duration_seconds ? fmt(alert.duration_seconds) : 'N/A'}</span>
                    {alert.audio_url && <span className="flex items-center gap-1"><Mic size={11} />Audio saved</span>}
                    <span className={`font-semibold ${alert.status === 'resolved' ? 'text-brand-green' : 'text-brand-amber'}`}>
                      {alert.status === 'resolved' ? '✓ Resolved' : '↩ Cancelled'}
                    </span>
                  </div>
                </div>

                {/* Expanded AI Summary */}
                <AnimatePresence>
                  {isExpanded && alert.ai_summary && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-brand-border overflow-hidden">
                      <div className="p-4 bg-brand-red/3">
                        <p className="text-xs text-brand-red font-bold mb-1.5">🤖 AI Emergency Summary</p>
                        <p className="text-xs text-brand-muted leading-relaxed">{alert.ai_summary}</p>
                        {alert.audio_url && (
                          <div className="mt-3 flex items-center gap-2 glass-card p-2.5">
                            <Mic size={14} className="text-brand-blue" />
                            <span className="text-xs text-brand-muted flex-1">Audio evidence available</span>
                            <button className="text-xs text-brand-blue font-semibold">Play</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🕒</div>
            <p className="text-brand-muted text-sm">No alerts match this filter</p>
          </div>
        )}
      </div>
    </div>
  )
}
