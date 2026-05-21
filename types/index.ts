// ============================================================
// SafeHer — Global TypeScript Types
// ============================================================

export interface User {
  id: string
  full_name: string
  email: string
  phone: string
  profile_image?: string
  emergency_pin: string
  created_at: string
}

export interface EmergencyContact {
  id: string
  user_id: string
  name: string
  phone: string
  relationship: string
  priority: 1 | 2 | 3
  created_at: string
}

export type SOSTriggerType = 'manual' | 'shake' | 'ai_keyword' | 'voice'
export type SOSStatus = 'active' | 'resolved' | 'cancelled'

export interface SOSAlert {
  id: string
  user_id: string
  trigger_type: SOSTriggerType
  latitude: number
  longitude: number
  address?: string
  audio_url?: string
  status: SOSStatus
  duration_seconds?: number
  ai_summary?: string
  created_at: string
  resolved_at?: string
}

export interface LiveTracking {
  id: string
  user_id: string
  latitude: number
  longitude: number
  speed?: number
  battery_level?: number
  timestamp: string
}

export interface SafeCheckIn {
  id: string
  user_id: string
  label: string
  expected_time: string
  status: 'pending' | 'completed' | 'missed' | 'alerted'
  created_at: string
}

export interface SafeZone {
  id: string
  name: string
  type: 'police' | 'hospital' | 'cafe' | 'public' | 'pharmacy'
  latitude: number
  longitude: number
  address: string
  is_verified: boolean
  contributed_by?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface SOSState {
  isActive: boolean
  startTime?: Date
  triggerType?: SOSTriggerType
  alertId?: string
  locationShared: boolean
  smsSent: boolean
  recordingActive: boolean
}

export interface LocationState {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
  address?: string
}

export interface AppSettings {
  silentMode: boolean
  shakeDetection: boolean
  shakeThreshold: number
  aiKeywordDetection: boolean
  language: 'en' | 'hi' | 'mr'
  theme: 'dark' | 'light'
  lowBatteryMode: boolean
  accessibilityMode: boolean
}

export type RouteSegmentSafety = 'safe' | 'moderate' | 'unsafe'

export interface RouteSegment {
  from: LocationState
  to: LocationState
  safety: RouteSegmentSafety
  safetyScore: number
  reason?: string
}

export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'id' | 'created_at'>; Update: Partial<User> }
      emergency_contacts: { Row: EmergencyContact; Insert: Omit<EmergencyContact, 'id' | 'created_at'>; Update: Partial<EmergencyContact> }
      sos_alerts: { Row: SOSAlert; Insert: Omit<SOSAlert, 'id' | 'created_at'>; Update: Partial<SOSAlert> }
      live_tracking: { Row: LiveTracking; Insert: Omit<LiveTracking, 'id'>; Update: Partial<LiveTracking> }
      safe_checkins: { Row: SafeCheckIn; Insert: Omit<SafeCheckIn, 'id' | 'created_at'>; Update: Partial<SafeCheckIn> }
      safe_zones: { Row: SafeZone; Insert: Omit<SafeZone, 'id'>; Update: Partial<SafeZone> }
    }
  }
}
