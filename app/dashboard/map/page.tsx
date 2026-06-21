'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Navigation, Shield, Zap } from 'lucide-react'
import { Loader } from '@googlemaps/js-api-loader'
import { useSOSStore } from '@/hooks/useSOSStore'
import { watchLocation, reverseGeocode } from '@/services/location'
import { upsertLiveLocation } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1220' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#080b14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7b8db0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2d47' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#243554' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#080b14' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

export default function MapPage() {
  const router = useRouter()
  const { location, setLocation } = useSOSStore()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [address, setAddress] = useState('Locating...')
  const [speed, setSpeed] = useState(0)
  const [sharing, setSharing] = useState(true)

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places'],
    })

    loader.load().then(async () => {
      if (!mapRef.current) return
      const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary

      const center = location
        ? { lat: location.latitude, lng: location.longitude }
        : { lat: 19.8762, lng: 75.3433 } // Aurangabad default

      const map = new Map(mapRef.current, {
        center, zoom: 16,
        styles: DARK_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeId: 'roadmap',
      })
      mapInstanceRef.current = map

      // Custom user marker
      const markerEl = document.createElement('div')
      markerEl.innerHTML = `<div style="width:20px;height:20px;background:#3D8EFF;border-radius:50%;border:3px solid white;box-shadow:0 0 20px rgba(61,142,255,0.7)"></div>`
      markerRef.current = new google.maps.Marker({
        position: center, map,
        icon: { url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="8" fill="%233D8EFF" stroke="white" stroke-width="3"/></svg>', scaledSize: new google.maps.Size(24, 24) },
      })

      // Add nearby POI markers
      const pois = [
        { lat: center.lat + 0.005, lng: center.lng + 0.008, label: '🚔', title: 'Police Station' },
        { lat: center.lat - 0.006, lng: center.lng + 0.004, label: '🏥', title: 'Hospital' },
        { lat: center.lat + 0.003, lng: center.lng - 0.007, label: '☕', title: 'Safe Zone Cafe' },
      ]
      pois.forEach(poi => {
        new google.maps.Marker({
          position: { lat: poi.lat, lng: poi.lng }, map,
          label: { text: poi.label, fontSize: '18px' },
          title: poi.title,
        })
      })
    })
  }, []) // eslint-disable-line

  // Watch + update location
  useEffect(() => {
    const supabase = createClient()
    let userId: string

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      userId = user.id
      const stop = watchLocation(async (loc) => {
        setLocation(loc)
        setSpeed(Math.round((loc as { speed?: number }).speed || 0))

        if (mapInstanceRef.current) {
          const pos = { lat: loc.latitude, lng: loc.longitude }
          mapInstanceRef.current.panTo(pos)
          markerRef.current?.setPosition(pos)
        }

        const addr = await reverseGeocode(loc.latitude, loc.longitude)
        setAddress(addr)

        if (sharing && userId) {
          await upsertLiveLocation({ user_id: userId, latitude: loc.latitude, longitude: loc.longitude, timestamp: new Date().toISOString() })
        }
      })
      return stop
    })
  }, [sharing, setLocation])

  return (
    <div className="flex flex-col h-screen bg-brand-dark">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-3">
        <button onClick={() => router.back()} className="w-9 h-9 glass-card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-syne font-bold text-xl">Live Tracking</h2>
          <p className="text-xs text-brand-muted">{address}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${sharing ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-brand-border text-brand-muted border-brand-border'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${sharing ? 'bg-brand-green animate-pulse' : 'bg-brand-muted'}`} />
          {sharing ? 'Live' : 'Paused'}
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 mx-4 rounded-2xl overflow-hidden border border-brand-border" />

      {/* Stats Panel */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-4 mt-3 glass-card p-4">
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          {[
            { label: 'Speed', value: `${speed} km/h`, color: 'text-brand-text' },
            { label: 'Guardians', value: '3 watching', color: 'text-brand-blue' },
            { label: 'Status', value: sharing ? 'Broadcasting' : 'Paused', color: sharing ? 'text-brand-green' : 'text-brand-muted' },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-sm font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-brand-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5">
          <button onClick={() => setSharing(s => !s)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${sharing ? 'bg-brand-card2 border border-brand-border text-brand-muted hover:border-brand-red/40' : 'bg-brand-green/10 border border-brand-green/30 text-brand-green'}`}>
            <Navigation size={15} />
            {sharing ? 'Pause Sharing' : 'Resume Sharing'}
          </button>
          <button onClick={() => router.push('/emergency/sos-active')}
            className="flex-1 py-3 bg-brand-red rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
            style={{ boxShadow: '0 0 20px rgba(139,0,0,0.5)' }}>
            <Shield size={15} /> SOS Now
          </button>
        </div>
      </motion.div>

      {/* Safe Route hint */}
      <div className="mx-4 mt-2.5 mb-4 bg-brand-amber/8 border border-brand-amber/20 rounded-xl px-4 py-3 flex items-center gap-2">
        <Zap size={14} className="text-brand-amber flex-shrink-0" />
        <p className="text-xs text-brand-amber">
          <strong>AI Route Tip:</strong> Main road ahead is safer — avoid the lane on your left after 9 PM.
        </p>
      </div>
    </div>
  )
}
