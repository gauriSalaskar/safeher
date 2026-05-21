'use client'

import type { LocationState } from '@/types'

export async function getCurrentLocation(): Promise<LocationState> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    )
  })
}

export function watchLocation(callback: (loc: LocationState) => void): () => void {
  const id = navigator.geolocation.watchPosition(
    (pos) => callback({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    }),
    (err) => console.error('Location watch error:', err),
    { enableHighAccuracy: true, timeout: 15000 }
  )
  return () => navigator.geolocation.clearWatch(id)
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )
    const data = await res.json()
    if (data.results?.[0]) {
      // Return short address
      const components = data.results[0].address_components
      const area = components.find((c: { types: string[]; long_name: string }) => c.types.includes('sublocality'))?.long_name
      const city = components.find((c: { types: string[]; long_name: string }) => c.types.includes('locality'))?.long_name
      return [area, city].filter(Boolean).join(', ') || data.results[0].formatted_address
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

export function getTrackingLink(userId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://safeher.app'
  return `${baseUrl}/track/${userId}`
}
