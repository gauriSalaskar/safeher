'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Shield, MapPin, CheckCircle, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { SafeZone } from '@/types'

const ZONE_CONFIG = {
  police:   { emoji: '🚔', label: 'Police Station', color: 'text-brand-blue',  bg: 'bg-brand-blue/10'  },
  hospital: { emoji: '🏥', label: 'Hospital',        color: 'text-brand-green', bg: 'bg-brand-green/10' },
  cafe:     { emoji: '☕', label: 'Safe Cafe',        color: 'text-brand-amber', bg: 'bg-brand-amber/10' },
  public:   { emoji: '🏪', label: 'Public Space',    color: 'text-brand-blue',  bg: 'bg-brand-blue/10'  },
  pharmacy: { emoji: '💊', label: 'Pharmacy',         color: 'text-brand-green', bg: 'bg-brand-green/10' },
}

const DEMO_ZONES: SafeZone[] = [
  { id: '1', name: 'Cantonment Police Station', type: 'police',   latitude: 19.8801, longitude: 75.3456, address: 'Station Road, Aurangabad', is_verified: true  },
  { id: '2', name: 'Government Medical College', type: 'hospital', latitude: 19.8750, longitude: 75.3387, address: 'Paithan Road, Aurangabad', is_verified: true  },
  { id: '3', name: 'Café Coffee Day (24hr)',     type: 'cafe',     latitude: 19.8734, longitude: 75.3521, address: 'MG Road, Aurangabad',     is_verified: true  },
  { id: '4', name: 'D-Mart Aurangabad',          type: 'public',   latitude: 19.8789, longitude: 75.3498, address: 'Jalna Road, Aurangabad',   is_verified: true  },
  { id: '5', name: 'Apollo Pharmacy',            type: 'pharmacy', latitude: 19.8762, longitude: 75.3411, address: 'Kranti Chowk, Aurangabad', is_verified: false },
  { id: '6', name: 'McDonald\'s (Open 24hr)',    type: 'cafe',     latitude: 19.8720, longitude: 75.3540, address: 'City Chowk, Aurangabad',   is_verified: false },
]

type ZoneType = SafeZone['type'] | 'all'

export default function SafeZonesPage() {
  const router = useRouter()
  const [zones, setZones] = useState<SafeZone[]>(DEMO_ZONES)
  const [filter, setFilter] = useState<ZoneType>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'cafe' as SafeZone['type'], address: '' })

  const filtered = zones.filter(z => filter === 'all' || z.type === filter)

  const handleContribute = () => {
    if (!form.name || !form.address) { toast.error('Please fill in name and address'); return }
    const newZone: SafeZone = {
      id: Date.now().toString(),
      name: form.name,
      type: form.type,
      latitude: 19.876 + (Math.random() - 0.5) * 0.02,
      longitude: 75.343 + (Math.random() - 0.5) * 0.02,
      address: form.address,
      is_verified: false,
    }
    setZones(prev => [newZone, ...prev])
    toast.success('Thank you! Safe zone submitted for community review.')
    setForm({ name: '', type: 'cafe', address: '' })
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-2">
        <button onClick={() => router.back()} className="w-9 h-9 glass-card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-syne font-bold text-xl">Community Safe Zones</h2>
          <p className="text-xs text-brand-muted">{zones.filter(z => z.is_verified).length} verified · {zones.filter(z => !z.is_verified).length} pending</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-9 h-9 bg-brand-red rounded-xl flex items-center justify-center">
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Info Banner */}
      <div className="mx-5 mt-3 mb-4 bg-brand-green/5 border border-brand-green/20 rounded-xl px-4 py-3 flex items-start gap-2">
        <Shield size={14} className="text-brand-green flex-shrink-0 mt-0.5" />
        <p className="text-xs text-brand-muted leading-relaxed">
          Community-contributed safe places. During emergencies, AI will guide you to the nearest verified safe zone. <strong className="text-brand-green">Tap + to contribute.</strong>
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-none pb-1">
        {(['all', 'police', 'hospital', 'cafe', 'public', 'pharmacy'] as ZoneType[]).map(type => (
          <button key={type}
            onClick={() => setFilter(type)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === type ? 'bg-brand-red/15 border-brand-red/40 text-brand-red' : 'bg-brand-card2 border-brand-border text-brand-muted'}`}>
            {type === 'all' ? 'All' : (ZONE_CONFIG[type as SafeZone['type']]?.emoji + ' ' + ZONE_CONFIG[type as SafeZone['type']]?.label)}
          </button>
        ))}
      </div>

      {/* Add Zone Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mx-5 mb-4 glass-card p-5 border border-brand-red/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne font-bold text-base">Contribute Safe Zone</h3>
              <button onClick={() => setShowAdd(false)}><X size={18} className="text-brand-muted" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Place name (e.g. City Mall)"
                className="w-full bg-brand-dark3 border border-brand-border rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-red/50 text-brand-text placeholder:text-brand-muted" />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as SafeZone['type'] }))}
                className="w-full bg-brand-dark3 border border-brand-border rounded-xl px-4 py-3 text-sm outline-none text-brand-text">
                {Object.entries(ZONE_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.emoji} {val.label}</option>
                ))}
              </select>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Address / Landmark"
                className="w-full bg-brand-dark3 border border-brand-border rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-red/50 text-brand-text placeholder:text-brand-muted" />
              <button onClick={handleContribute}
                className="w-full py-3 bg-brand-red rounded-xl text-white text-sm font-bold">
                Submit Safe Zone
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone List */}
      <div className="px-5 space-y-2.5">
        {filtered.map((zone, i) => {
          const cfg = ZONE_CONFIG[zone.type]
          return (
            <motion.div key={zone.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-4 flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 text-xl`}>
                {cfg.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-semibold truncate">{zone.name}</p>
                  {zone.is_verified
                    ? <CheckCircle size={12} className="text-brand-green flex-shrink-0" />
                    : <AlertTriangle size={12} className="text-brand-amber flex-shrink-0" />
                  }
                </div>
                <p className="text-xs text-brand-muted">{zone.address}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>
                    {cfg.label}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${zone.is_verified ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-amber/10 text-brand-amber'}`}>
                    {zone.is_verified ? 'Verified' : 'Community Added'}
                  </span>
                </div>
              </div>
              <button onClick={() => router.push('/dashboard/map')}
                className="flex-shrink-0 p-2 glass-card">
                <MapPin size={14} className="text-brand-blue" />
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
