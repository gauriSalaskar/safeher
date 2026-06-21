'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, AlertTriangle, MapPin, Clock, Zap, Navigation, Loader2, CheckCircle } from 'lucide-react'
import { useSOSStore } from '@/hooks/useSOSStore'

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

interface NearbyPlace {
  name: string
  type: string
  emoji: string
  distance: string
  placeId: string
  lat: number
  lng: number
}

interface ThreatAnalysis {
  safetyScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  summary: string
  risks: string[]
  tips: string[]
  bestTimeToTravel: string
  alternativeSuggestion: string
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

const SAFETY_CONFIG: Record<Safety, { label: string; color: string; bg: string; border: string; ring: string }> = {
  safe:     { label: 'Safe',     color: 'text-brand-green', bg: 'bg-brand-green/10', border: 'border-brand-green/30', ring: '#00E676' },
  moderate: { label: 'Moderate', color: 'text-brand-amber', bg: 'bg-brand-amber/10', border: 'border-brand-amber/30', ring: '#FFB300' },
  unsafe:   { label: 'Unsafe',   color: 'text-brand-red',   bg: 'bg-brand-red/10',   border: 'border-brand-red/30',   ring: '#8B0000' },
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? '#00E676' : score >= 50 ? '#FFB300' : '#8B0000'
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

// ── Google Places nearby safe zones ─────────────────────────────────────────
async function fetchNearbySafeZones(lat: number, lng: number): Promise<NearbyPlace[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  const radius = 1500
  const types = [
    { type: 'police', emoji: '🚔', label: 'Police Station' },
    { type: 'hospital', emoji: '🏥', label: 'Hospital' },
    { type: 'cafe', emoji: '☕', label: 'Safe Cafe' },
    { type: 'shopping_mall', emoji: '🏪', label: 'Public Space' },
  ]

  const results: NearbyPlace[] = []

  for (const { type, emoji, label } of types) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`
      const res = await fetch(`/api/places-proxy?url=${encodeURIComponent(url)}`)
      const data = await res.json()

      if (data.results?.[0]) {
        const place = data.results[0]
        const placeLat = place.geometry.location.lat
        const placeLng = place.geometry.location.lng
        // Calculate distance in km
        const dist = calcDistance(lat, lng, placeLat, placeLng)
        results.push({
          name: place.name,
          type: label,
          emoji,
          distance: `${dist} km`,
          placeId: place.place_id,
          lat: placeLat,
          lng: placeLng,
        })
      }
    } catch {
      // silently skip failed type
    }
  }

  return results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (R * c).toFixed(1)
}

function openGoogleMapsNav(lat: number, lng: number) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
}

// ── AI Threat Predictor ──────────────────────────────────────────────────────
function ThreatPredictor({ currentAddress }: { currentAddress: string }) {
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<ThreatAnalysis | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    if (!destination.trim()) return
    setLoading(true)
    setError('')
    setAnalysis(null)

    const timeOfDay = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

    try {
      const res = await fetch('/api/threat-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, currentAddress, timeOfDay }),
      })
      const data = await res.json()
      if (data.analysis) {
        setAnalysis(data.analysis)
        setExpanded(true)
      } else {
        setError('Could not analyze. Try again.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = !analysis ? '' : analysis.riskLevel === 'LOW' ? 'text-brand-green' : analysis.riskLevel === 'MEDIUM' ? 'text-brand-amber' : 'text-brand-red'
  const riskBorder = !analysis ? '' : analysis.riskLevel === 'LOW' ? 'border-brand-green/30' : analysis.riskLevel === 'MEDIUM' ? 'border-brand-amber/30' : 'border-brand-red/30'

  return (
    <div className="px-5 mb-4">
      <div className="glass-card p-4 border border-brand-border">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-brand-blue" />
          <p className="text-xs font-semibold text-brand-blue uppercase tracking-wide">AI Safety Check</p>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-brand-dark3 border border-brand-border rounded-xl px-3 py-2.5">
            <MapPin size={13} className="text-brand-muted shrink-0" />
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              placeholder="Where are you going?"
              className="flex-1 bg-transparent text-sm outline-none text-brand-text placeholder:text-brand-muted"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !destination.trim()}
            className="px-4 py-2.5 bg-brand-blue rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : 'Check'}
          </button>
        </div>
        {error && <p className="text-xs text-brand-red mt-2">{error}</p>}
      </div>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card border mt-2 ${riskBorder}`}
        >
          <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center gap-3 text-left">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${analysis.riskLevel === 'LOW' ? 'bg-brand-green/10' : analysis.riskLevel === 'MEDIUM' ? 'bg-brand-amber/10' : 'bg-brand-red/10'}`}>
              {analysis.riskLevel === 'LOW'
                ? <CheckCircle size={16} className="text-brand-green" />
                : <AlertTriangle size={16} className={riskColor} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${riskColor}`}>{analysis.riskLevel} RISK</span>
                <span className={`text-base font-bold ${riskColor}`}>{analysis.safetyScore}/10</span>
              </div>
              <p className="text-xs text-brand-muted line-clamp-1">{analysis.summary}</p>
            </div>
            <span className="text-brand-muted text-xs">{expanded ? '▲' : '▼'}</span>
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-brand-border/50 pt-3">
              <p className="text-xs text-brand-muted">
                Best time: <span className="text-brand-text font-semibold">{analysis.bestTimeToTravel}</span>
              </p>
              <div>
                <p className="text-xs font-semibold text-brand-red mb-1">⚠️ Risks</p>
                {analysis.risks.map((r, i) => (
                  <p key={i} className="text-xs text-brand-muted flex gap-1.5 mb-0.5"><span className="text-brand-red">•</span>{r}</p>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-green mb-1">✅ Tips</p>
                {analysis.tips.map((t, i) => (
                  <p key={i} className="text-xs text-brand-muted flex gap-1.5 mb-0.5"><span className="text-brand-green">•</span>{t}</p>
                ))}
              </div>
              {analysis.riskLevel !== 'LOW' && (
                <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl px-3 py-2">
                  <p className="text-xs text-brand-blue">💡 {analysis.alternativeSuggestion}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SafeRoutePage() {
  const router = useRouter()
  const { location } = useSOSStore()
  const [selected, setSelected] = useState<string | null>('1')
  const [from, setFrom] = useState('My Current Location')
  const [to, setTo] = useState('')
  const [safeZones, setSafeZones] = useState<NearbyPlace[]>([])
  const [loadingZones, setLoadingZones] = useState(false)
  const [currentAddress, setCurrentAddress] = useState('Current location')

  const selectedRoute = ROUTES.find(r => r.id === selected)

  // Fetch real nearby safe zones when location is available
  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return

    setLoadingZones(true)
    fetchNearbySafeZones(location.latitude, location.longitude)
      .then(zones => {
        if (zones.length > 0) setSafeZones(zones)
      })
      .finally(() => setLoadingZones(false))
  }, [location])

  // Get current address for AI predictor
  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
      .then(r => r.json())
      .then(d => {
        if (d.results?.[0]) setCurrentAddress(d.results[0].formatted_address)
      })
      .catch(() => {})
  }, [location])

  // Fallback safe zones (shown before real data loads)
  const displayZones = safeZones.length > 0 ? safeZones : [
    { emoji: '🚔', name: 'Cantonment Police Station', distance: '0.8 km', type: 'Police', placeId: '', lat: 0, lng: 0 },
    { emoji: '🏥', name: 'Government Hospital', distance: '1.2 km', type: 'Hospital', placeId: '', lat: 0, lng: 0 },
    { emoji: '☕', name: 'Café Coffee Day (24hr)', distance: '0.3 km', type: 'Safe Cafe', placeId: '', lat: 0, lng: 0 },
    { emoji: '🏪', name: 'D-Mart Supermarket', distance: '0.5 km', type: 'Public Space', placeId: '', lat: 0, lng: 0 },
  ]

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

      {/* AI Threat Predictor */}
      <ThreatPredictor currentAddress={currentAddress} />

      {/* Safety Heatmap Visual */}
      <div className="px-5 mb-4">
        <div className="glass-card p-4 overflow-hidden relative" style={{ height: 140 }}>
          <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2">Area Safety Heatmap</p>
          <div className="absolute inset-0 mt-7 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-brand-dark2 opacity-80" />
            <div className="absolute rounded-full opacity-30" style={{ width: 80, height: 80, background: '#00E676', filter: 'blur(20px)', top: 20, left: 30 }} />
            <div className="absolute rounded-full opacity-25" style={{ width: 60, height: 60, background: '#00E676', filter: 'blur(15px)', top: 40, left: 160 }} />
            <div className="absolute rounded-full opacity-30" style={{ width: 70, height: 70, background: '#FFB300', filter: 'blur(18px)', top: 10, left: 110 }} />
            <div className="absolute rounded-full opacity-35" style={{ width: 60, height: 60, background: '#8B0000', filter: 'blur(15px)', top: 30, left: 240 }} />
            <div className="absolute rounded-full opacity-20" style={{ width: 40, height: 40, background: '#8B0000', filter: 'blur(12px)', top: 50, left: 290 }} />
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute w-4 h-4 rounded-full bg-white border-2 border-brand-blue"
              style={{ top: 45, left: 60, boxShadow: '0 0 12px rgba(61,142,255,0.8)' }} />
          </div>
          <div className="absolute bottom-3 right-3 flex gap-3 text-[10px]">
            {[{ c: '#00E676', l: 'Safe' }, { c: '#FFB300', l: 'Moderate' }, { c: '#8B0000', l: 'Danger' }].map(({ c, l }) => (
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
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
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
            className="w-full py-4 bg-brand-indigo rounded-2xl text-white font-syne font-bold text-base flex items-center justify-center gap-2 indigo-glow"
          >
            <Zap size={18} />
            Start {selectedRoute.name}
          </motion.button>
          {selectedRoute.safety !== 'safe' && (
            <p className="text-center text-xs text-brand-amber mt-2">⚠️ SOS will auto-arm during navigation</p>
          )}
        </div>
      )}

      {/* Nearby Safe Zones — Real Google Places */}
      <div className="flex items-center justify-between px-5 mb-3">
        <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider">Nearby Safe Zones</p>
        {loadingZones && <Loader2 size={12} className="text-brand-muted animate-spin" />}
        {safeZones.length > 0 && <span className="text-[10px] text-brand-green">● Live</span>}
      </div>
      <div className="px-5 space-y-2">
        {displayZones.map((zone, i) => (
          <motion.div key={zone.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card p-3.5 flex items-center gap-3">
            <span className="text-2xl">{zone.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{zone.name}</p>
              <p className="text-xs text-brand-muted">{zone.type}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-brand-blue">{zone.distance}</p>
              <button
                onClick={() => zone.lat && zone.lng ? openGoogleMapsNav(zone.lat, zone.lng) : null}
                className="text-[10px] text-brand-muted mt-0.5 hover:text-brand-blue transition-colors"
              >
                Navigate →
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Safety Tip */}
      <div className="mx-5 mt-4 bg-brand-indigo/5 border border-brand-indigo/20 rounded-xl px-4 py-3 flex items-start gap-2">
        <Shield size={14} className="text-brand-indigo flex-shrink-0 mt-0.5" />
        <p className="text-xs text-brand-muted leading-relaxed">
          <span className="text-brand-indigo font-semibold">AI Tip: </span>
          It's after 8 PM — Main Road Route has 3x better safety than others. Share your live location before starting.
        </p>
      </div>
    </div>
  )
}