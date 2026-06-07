import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyC7eNguFJhBniVjqVlU1DGSUkjWBCBIP88",
  authDomain: "safeher-a0b8d.firebaseapp.com",
  projectId: "safeher-a0b8d",
  storageBucket: "safeher-a0b8d.firebasestorage.app",
  messagingSenderId: "1032455116409",
  appId: "1:1032455116409:web:c6caffee8a7025a148e6a8"
}

const VAPID_KEY = "BHRvLu85AzCp1uDzjJQaDKqSdwPsFYkC3dLxHgoc-peEIFR6chgaJH70r6e1UmQXtT8YKkhwnh8m6Z3hScNB664"

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null
    if (!('Notification' in window)) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    console.log('FCM Token:', token)
    return token
  } catch (error) {
    console.error('Notification permission error:', error)
    return null
  }
}

export async function saveFCMToken(userId: string, token: string) {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('users').update({ fcm_token: token }).eq('id', userId)
  } catch (error) {
    console.error('Save FCM token error:', error)
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  try {
    const messaging = getMessaging(app)
    return onMessage(messaging, callback)
  } catch {
    return () => {}
  }
}
