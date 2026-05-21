import { getSupabaseClient } from './client'
import type { EmergencyContact, SOSAlert, LiveTracking, SafeCheckIn, User } from '@/types'

// ---- Users ----
export async function getUserProfile(userId: string): Promise<User | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) { console.error('getUserProfile error:', error); return null }
  return data
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  const supabase = getSupabaseClient()
  return supabase.from('users').update(updates).eq('id', userId)
}

// ---- Emergency Contacts ----
export async function getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: true })
  if (error) { console.error('getEmergencyContacts error:', error); return [] }
  return data || []
}

export async function addEmergencyContact(contact: Omit<EmergencyContact, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient()
  return supabase.from('emergency_contacts').insert(contact).select().single()
}

export async function deleteEmergencyContact(contactId: string) {
  const supabase = getSupabaseClient()
  return supabase.from('emergency_contacts').delete().eq('id', contactId)
}

// ---- SOS Alerts ----
export async function createSOSAlert(alert: Omit<SOSAlert, 'id' | 'created_at'>): Promise<SOSAlert | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sos_alerts')
    .insert(alert)
    .select()
    .single()
  if (error) { console.error('createSOSAlert error:', error); return null }
  return data
}

export async function updateSOSAlert(alertId: string, updates: Partial<SOSAlert>) {
  const supabase = getSupabaseClient()
  return supabase.from('sos_alerts').update(updates).eq('id', alertId)
}

export async function getSOSHistory(userId: string): Promise<SOSAlert[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) { console.error('getSOSHistory error:', error); return [] }
  return data || []
}

// ---- Live Tracking ----
export async function upsertLiveLocation(tracking: Omit<LiveTracking, 'id'>) {
  const supabase = getSupabaseClient()
  return supabase.from('live_tracking').upsert(tracking, { onConflict: 'user_id' })
}

export async function getLiveLocation(userId: string): Promise<LiveTracking | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('live_tracking')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return data
}

// ---- Safe Check-ins ----
export async function createCheckIn(checkIn: Omit<SafeCheckIn, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient()
  return supabase.from('safe_checkins').insert(checkIn).select().single()
}

export async function updateCheckIn(checkInId: string, updates: Partial<SafeCheckIn>) {
  const supabase = getSupabaseClient()
  return supabase.from('safe_checkins').update(updates).eq('id', checkInId)
}

export async function getPendingCheckIns(userId: string): Promise<SafeCheckIn[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('safe_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('expected_time', { ascending: true })
  if (error) return []
  return data || []
}

// ---- Realtime Subscriptions ----
export function subscribeToLiveTracking(userId: string, callback: (tracking: LiveTracking) => void) {
  const supabase = getSupabaseClient()
  return supabase
    .channel(`live_tracking:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'live_tracking',
      filter: `user_id=eq.${userId}`,
    }, (payload) => callback(payload.new as LiveTracking))
    .subscribe()
}

export function subscribeToSOSAlerts(userId: string, callback: (alert: SOSAlert) => void) {
  const supabase = getSupabaseClient()
  return supabase
    .channel(`sos_alerts:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'sos_alerts',
      filter: `user_id=eq.${userId}`,
    }, (payload) => callback(payload.new as SOSAlert))
    .subscribe()
}
