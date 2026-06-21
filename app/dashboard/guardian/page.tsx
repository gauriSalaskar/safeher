'use client'
import { Suspense } from 'react'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, MapPin, Mic, Battery, Clock, Phone, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react'
import { Loader } from '@googlemaps/js-api-loader'
import { subscribeToLiveTracking, subscribeToSOSAlerts, getLiveLocation } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'
import type { LiveTracking, SOSAlert } from '@/types'

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1220' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#080b14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7b8db0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2d47' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#243554' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#080b14' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]

function GuardianDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trackedUserId = searchParams.get('userId')

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const pathRef = useRef<google.maps.Polyline | null>(null)
  const pathPointsRef = useRef<{ lat: number; lng: number }[]>([])

  const [tracking, setTracking] = useState<LiveTracking | null>(null)
  const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLive, setIsLive] = useState(false)
  const [userName, setUserName] = useState('Protected User')

  // Load map
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
    })
    loader.load().then(async () => {
      if (!mapRef.current) return
      const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary
      const center = { lat: 19.8762, lng: 75.3433 }
      const map = new Map(mapRef.current, {
        center, zoom: 15,
        styles: DARK_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
      })
      mapInstanceRef.current = map

      markerRef.current = new google.maps.Marker({
        position: center, map,
        icon: {
          url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="10" fill="%238B0000" stroke="white" stroke-width="3"/></svg>',
          scaledSize: new google.maps.Size(28, 28),
        },
      })

      pathRef.current = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#8B0000',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map,
      })
    })
  }, [])

  // Load initial location + subscribe to realtime
  useEffect(() => {
    if (!trackedUserId) return

    const supabase = createClient()

    // Get user name
    supabase.from('users').select('full_name').eq('id', trackedUserId).single()
      .then(({ data }) => { if (data) setUserName(data.full_name) })

    // Get last known location
    getLiveLocation(trackedUserId).then((loc) => {
      if (loc) {
        setTracking(loc)
        setIsLive(true)
        updateMapPosition(loc.latitude, loc.longitude)
      }
    })

    // Subscribe to live tracking
    const trackingSub = subscribeToLiveTracking(trackedUserId, (loc) => {
      setTracking(loc)
      setIsLive(true)
      updateMapPosition(loc.latitude, loc.longitude)
    })

    // Subscribe to SOS alerts
    const sosSub = subscribeToSOSAlerts(trackedUserId, (alert) => {
      setActiveAlert(alert)
    })

    return () => {
      supabase.removeChannel(trackingSub)
      supabase.removeChannel(sosSub)
    }
  }, [trackedUserId]) // eslint-disable-line

  // Timer for active SOS
  useEffect(() => {
    if (!activeAlert) return
    const start = new Date(activeAlert.created_at).getTime()
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeAlert])

  function updateMapPosition(lat: number, lng: number) {
    if (!mapInstanceRef.current || !markerRef.current) return
    const pos = { lat, lng }
    markerRef.current.setPosition(pos)
    mapInstanceRef.current.panTo(pos)
    pathPointsRef.current = [...pathPointsRef.current.slice(-50), pos]
    pathRef.current?.setPath(pathPointsRef.current)
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // Demo mode (no userId param)
  const isDemoMode = !trackedUserId

  return (
    <div className="page-container min-h-screen bg-brand-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-3">
        <button onClick={() => router.back()} className="w-9 h-9 glass-card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-syne font-bold text-xl">Guardian Dashboard</h2>
          <p className="text-xs text-brand-muted">Monitoring: {userName}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${(isLive || isDemoMode) ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-brand-border text-brand-muted border-brand-border'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${(isLive || isDemoMode) ? 'bg-brand-green animate-pulse' : 'bg-brand-muted'}`} />
          {(isLive || isDemoMode) ? 'Live' : 'Waiting'}
        </div>
      </div>

      {/* SOS Alert Banner */}
      {(activeAlert || isDemoMode) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3 bg-brand-red/10 border border-brand-red/40 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              <AlertTriangle size={16} className="text-brand-red" />
            </motion.div>
            <span className="text-brand-red font-bold text-sm">🚨 EMERGENCY SOS ACTIVE</span>
            <span className="ml-auto font-syne font-bold text-brand-red text-lg">{fmt(isDemoMode ? elapsedSeconds || 742 : elapsedSeconds)}</span>
          </div>
          <p className="text-xs text-brand-muted">
            Trigger: {activeAlert?.trigger_type || 'Manual SOS'} · Location broadcasting · Audio recording active
          </p>
          <div className="flex gap-2 mt-3">
            <a href={`tel:${isDemoMode ? '+91 98765 43210' : ''}`}
              className="flex-1 py-2.5 bg-brand-red rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5">
              <Phone size={13} /> Call Now
            </a>
            <button className="flex-1 py-2.5 bg-brand-card2 border border-brand-border rounded-xl text-brand-muted text-xs font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle size={13} /> Mark Safe
            </button>
          </div>
        </motion.div>
      )}

      {/* Map */}
      <div ref={mapRef} className="mx-4 rounded-2xl overflow-hidden border border-brand-border" style={{ height: '280px' }} />

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-2.5 px-4 mt-3">
        {[
          {
            icon: MapPin, iconBg: 'bg-brand-blue/10', iconColor: 'text-brand-blue',
            label: 'Last Location',
            value: tracking?.latitude ? `${tracking.latitude.toFixed(4)}°N` : isDemoMode ? '19.8762°N' : 'Waiting...',
            sub: tracking?.longitude ? `${tracking.longitude.toFixed(4)}°E` : isDemoMode ? '75.3433°E' : 'No signal',
          },
          {
            icon: Clock, iconBg: 'bg-brand-amber/10', iconColor: 'text-brand-amber',
            label: 'Last Update',
            value: tracking?.timestamp ? new Date(tracking.timestamp).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : isDemoMode ? 'Just now' : 'N/A',
            sub: isDemoMode || tracking ? 'Live tracking' : 'Not sharing',
          },
          {
            icon: Battery, iconBg: 'bg-brand-green/10', iconColor: 'text-brand-green',
            label: 'Battery',
            value: tracking?.battery_level ? `${tracking.battery_level}%` : isDemoMode ? '68%' : 'Unknown',
            sub: isDemoMode ? 'Sufficient' : 'From device',
          },
          {
            icon: Mic, iconBg: 'bg-brand-red/10', iconColor: 'text-brand-red',
            label: 'Recording',
            value: (activeAlert || isDemoMode) ? 'Active' : 'Inactive',
            sub: (activeAlert || isDemoMode) ? 'Evidence saved' : 'No SOS active',
          },
        ].map(({ icon: Icon, iconBg, iconColor, label, value, sub }) => (
          <div key={label} className="glass-card p-3.5">
            <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center mb-2`}>
              <Icon size={15} className={iconColor} />
            </div>
            <p className="text-xs text-brand-muted">{label}</p>
            <p className="text-sm font-semibold mt-0.5">{value}</p>
            <p className="text-[10px] text-brand-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Movement Trail */}
      <div className="mx-4 mt-3 mb-4 glass-card p-4">
        <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3">Movement Trail</p>
        <div className="space-y-2.5">
          {(isDemoMode ? [
            { time: 'Now', loc: 'MG Road, Aurangabad', type: '🔴 SOS Active' },
            { time: '2 min ago', loc: 'Station Road crossing', type: '📍 Location update' },
            { time: '5 min ago', loc: 'Near Kranti Chowk', type: '📍 Location update' },
            { time: '8 min ago', loc: 'Jalna Road, near hotel', type: '🟢 Journey started' },
          ] : [{ time: 'Waiting', loc: 'No movement recorded yet', type: '⏳ Standby' }]).map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <span className="text-brand-muted flex-shrink-0 w-16">{item.time}</span>
              <div>
                <p className="font-medium">{item.loc}</p>
                <p className="text-brand-muted mt-0.5">{item.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share link hint */}
      <div className="mx-4 mb-6 bg-brand-blue/5 border border-brand-blue/20 rounded-xl px-4 py-3">
        <p className="text-xs text-brand-blue">
          <strong>Guardian Link:</strong> Share this page URL with trusted contacts — they can monitor in real-time without logging in.
        </p>
      </div>
    </div>
  )
}

export default function GuardianPage() { return <Suspense fallback={<div>Loading...</div>}><GuardianDashboard /></Suspense> }
