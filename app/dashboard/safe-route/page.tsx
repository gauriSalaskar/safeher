'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, AlertTriangle, MapPin, Clock, Zap, Navigation } from 'lucide-react'

type Safety = 'safe' | 'moderate' | 'unsafe'

interface RouteOption {
  id: string
  name: string
  distance: string
  duration: string
  safetyScore: number
  safety: Safety
  highlights: string[]
  avoid?: string
}

const ROUTES: RouteOption[] = [
  {
    id: '1',
    name: 'Main Road Route',
    distance: '3.2 km',
    duration: '12 min',
    safetyScore: 92,
    safety: 'safe',
    highlights: ['Well-lit highway', 'CCTV coverage', 'High footfall'],
  },
  {
    id: '2',
    name: 'Market Lane Route',
    distance: '2.1 km',
    duration: '9 min',
    safetyScore: 64,
    safety: 'moderate',
    highlights: ['Shorter path', 'Busy till 9PM'],
    avoid: 'Avoid after 9 PM — low lighting after market closes',
  },
  {
    id: '3',
    name: 'Shortcut via Park',
    distance: '1.4 km',
    duration: '6 min',
    safetyScore: 28,
    safety: 'unsafe',
    highlights: ['Fastest path'],
    avoid: 'Isolated after dark. No CCTV. Reported incidents in last 30 days.',
  },
]

const SAFE_ZONES = [
  { emoji: '🚔', name: 'Cantonment Police Station', dist: '0.8 km', type: 'Police' },
  { emoji: '🏥', name: 'Government Hospital', dist: '1.2 km', type: 'Hospital' },
  { emoji: '☕', name: 'Café Coffee Day (24hr)', dist: '0.3 km', type: 'Safe Cafe' },
  { emoji: '🏪', name: 'D-Mart Supermarket', dist: '0.5 km', type: 'Public Space' },
]

const SAFETY_CONFIG: Record<Safety, { label: string; color: string; bg: string; border: string; ring: string }> = {
  safe:     { label: 'Safe',     color: 'text-brand-green',  bg: 'bg-brand-green/10',  border: 'border-brand-green/30',  ring: '#00E676' },
  moderate: { label: 'Moderate', color: 'text-brand-amber',  bg: 'bg-brand-amber/10',  border: 'border-brand-amber/30',  ring: '#FFB300' },
  unsafe:   { label: 'Unsafe',   color: 'text-brand-red',    bg: 'bg-brand-red/10',    border: 'border-brand-red/30',    ring: '#FF2D55' },
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? '#00E676' : score >= 50 ? '#FFB300' : '#FF2D55'
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 bg-brand-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

export default function SafeRoutePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>('1')
  const [from, setFrom] = useState('My Current Location')
  const [to, setTo] = useState('')

  const selectedRoute = ROUTES.find(r => r.id === selected)

  return (
    <div className="flex flex-col pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => router.back()} className="w-9 h-9 glass-card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-syne font-bold text-xl">Safe Route</h2>
          <p className="text-xs text-brand-muted">AI-powered safety scoring</p>
        </div>
      </div>

      {/* Input fields */}
      <div className="px-5 mb-4 space-y-2">
        <div className="glass-card px-4 py-3 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-green flex-shrink-0" />
          <input
            value={from}
            onChange={e => setFrom(e.target.value)}
            placeholder="From"
            className="flex-1 bg-transparent text-sm outline-none text-brand-text placeholder:text-brand-muted"
          />
        </div>
        <div className="glass-card px-4 py-3 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-red flex-shrink-0" />
          <input
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="Where are you going?"
            className="flex-1 bg-transparent text-sm outline-none text-brand-text placeholder:text-brand-muted"
          />
          <MapPin size={14} className="text-brand-muted" />
        </div>
      </div>

      {/* Safety Heatmap Visual */}
      <div className="px-5 mb-4">
        <div className="glass-card p-4 overflow-hidden relative" style={{ height: 140 }}>
          <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2">Area Safety Heatmap</p>
          {/* Simulated heatmap using colored blobs */}
          <div className="absolute inset-0 mt-7 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-brand-dark2 opacity-80" />
            {/* Green safe zones */}
            <div className="absolute rounded-full opacity-30" style={{ width: 80, height: 80, background: '#00E676', filter: 'blur(20px)', top: 20, left: 30 }} />
            <div className="absolute rounded-full opacity-25" style={{ width: 60, height: 60, background: '#00E676', filter: 'blur(15px)', top: 40, left: 160 }} />
            {/* Amber zones */}
            <div className="absolute rounded-full opacity-30" style={{ width: 70, height: 70, background: '#FFB300', filter: 'blur(18px)', top: 10, left: 110 }} />
            {/* Red danger zones */}
            <div className="absolute rounded-full opacity-35" style={{ width: 60, height: 60, background: '#FF2D55', filter: 'blur(15px)', top: 30, left: 240 }} />
            <div className="absolute rounded-full opacity-20" style={{ width: 40, height: 40, background: '#FF2D55', filter: 'blur(12px)', top: 50, left: 290 }} />
            {/* User dot */}
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute w-4 h-4 rounded-full bg-white border-2 border-brand-blue"
              style={{ top: 45, left: 60, boxShadow: '0 0 12px rgba(61,142,255,0.8)' }} />
          </div>
          {/* Legend */}
          <div className="absolute bottom-3 right-3 flex gap-3 text-[10px]">
            {[{ c: '#00E676', l: 'Safe' }, { c: '#FFB300', l: 'Moderate' }, { c: '#FF2D55', l: 'Danger' }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className="text-brand-muted">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Route Options */}
      <p className="px-5 text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">Route Options</p>
      <div className="px-5 space-y-2.5 mb-5">
        {ROUTES.map((route, i) => {
          const cfg = SAFETY_CONFIG[route.safety]
          const isSelected = selected === route.id
          return (
            <motion.button
              key={route.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelected(route.id)}
              className={`w-full text-left glass-card p-4 transition-all border ${isSelected ? `${cfg.border} bg-brand-card2` : 'border-brand-border'}`}
              style={isSelected ? { boxShadow: `0 0 20px ${cfg.ring}22` } : {}}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {route.id === '1' && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">Recommended</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-muted">
                  <Clock size={11} />{route.duration}
                  <Navigation size={11} />{route.distance}
                </div>
              </div>
              <p className="text-sm font-semibold mb-1">{route.name}</p>
              <ScoreBar score={route.safetyScore} />
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {route.highlights.map(h => (
                  <span key={h} className="text-[10px] bg-brand-dark3 text-brand-muted px-2 py-0.5 rounded-full">{h}</span>
                ))}
              </div>
              {route.avoid && (
                <div className="mt-2 flex items-start gap-1.5">
                  <AlertTriangle size={11} className={cfg.color + ' flex-shrink-0 mt-0.5'} />
                  <p className={`text-[11px] ${cfg.color}`}>{route.avoid}</p>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Go button */}
      {selectedRoute && (
        <div className="px-5 mb-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/dashboard/map')}
            className="w-full py-4 bg-brand-red rounded-2xl text-white font-syne font-bold text-base flex items-center justify-center gap-2 emergency-glow"
          >
            <Zap size={18} />
            Start {selectedRoute.name}
          </motion.button>
          {selectedRoute.safety !== 'safe' && (
            <p className="text-center text-xs text-brand-amber mt-2">
              ⚠️ SOS will auto-arm during navigation
            </p>
          )}
        </div>
      )}

      {/* Nearby Safe Zones */}
      <p className="px-5 text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">Nearby Safe Zones</p>
      <div className="px-5 space-y-2">
        {SAFE_ZONES.map((zone, i) => (
          <motion.div key={zone.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card p-3.5 flex items-center gap-3">
            <span className="text-2xl">{zone.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{zone.name}</p>
              <p className="text-xs text-brand-muted">{zone.type}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-brand-blue">{zone.dist}</p>
              <button className="text-[10px] text-brand-muted mt-0.5">Navigate →</button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Safety Tip */}
      <div className="mx-5 mt-4 bg-brand-red/5 border border-brand-red/20 rounded-xl px-4 py-3 flex items-start gap-2">
        <Shield size={14} className="text-brand-red flex-shrink-0 mt-0.5" />
        <p className="text-xs text-brand-muted leading-relaxed">
          <span className="text-brand-red font-semibold">AI Tip: </span>
          It's after 8 PM — Main Road Route has 3x better safety than others. Share your live location before starting.
        </p>
      </div>
    </div>
  )
}
