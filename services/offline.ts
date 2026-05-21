'use client'

// ============================================================
// SafeHer — Offline Emergency Service
// Saves emergency data locally when offline, retries on reconnect
// ============================================================

import type { SOSTriggerType } from '@/types'

const STORAGE_KEY = 'safeher_offline_sos'
const LAST_LOCATION_KEY = 'safeher_last_location'

export interface OfflineSOSRecord {
  id: string
  userId: string
  triggerType: SOSTriggerType
  latitude: number | null
  longitude: number | null
  timestamp: string
  synced: boolean
}

// Save last known location whenever it updates
export function saveLastKnownLocation(lat: number, lng: number): void {
  try {
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ lat, lng, ts: Date.now() }))
  } catch {}
}

export function getLastKnownLocation(): { lat: number; lng: number; ts: number } | null {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// Queue an SOS for retry when offline
export function queueOfflineSOS(record: Omit<OfflineSOSRecord, 'synced'>): void {
  try {
    const existing = getOfflineQueue()
    existing.push({ ...record, synced: false })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    console.warn('[SafeHer Offline] SOS queued for retry:', record.id)
  } catch {}
}

export function getOfflineQueue(): OfflineSOSRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function markSynced(id: string): void {
  try {
    const queue = getOfflineQueue().map(r => r.id === id ? { ...r, synced: true } : r)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {}
}

export function clearSyncedRecords(): void {
  try {
    const queue = getOfflineQueue().filter(r => !r.synced)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {}
}

// Try to sync pending offline SOS records to server
export async function syncOfflineQueue(): Promise<void> {
  const queue = getOfflineQueue().filter(r => !r.synced)
  if (queue.length === 0) return

  console.log(`[SafeHer Offline] Syncing ${queue.length} offline SOS records...`)

  for (const record of queue) {
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: record.userId,
          triggerType: record.triggerType,
          latitude: record.latitude,
          longitude: record.longitude,
          offlineTimestamp: record.timestamp,
        }),
      })
      if (res.ok) {
        markSynced(record.id)
        console.log('[SafeHer Offline] Synced:', record.id)
      }
    } catch (err) {
      console.warn('[SafeHer Offline] Sync failed for', record.id, err)
    }
  }

  clearSyncedRecords()
}

// Register network listener to auto-sync when connection restored
export function registerOfflineSyncListener(): () => void {
  const handleOnline = () => {
    console.log('[SafeHer Offline] Network restored — syncing...')
    syncOfflineQueue()
  }
  window.addEventListener('online', handleOnline)
  return () => window.removeEventListener('online', handleOnline)
}

// Check if currently offline
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine
}
