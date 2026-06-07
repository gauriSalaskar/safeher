'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useBatteryAlert() {
  const alertSentRef = useRef(false)

  useEffect(() => {
    const checkBattery = async () => {
      try {
        // @ts-ignore - Battery API
        const battery = await navigator.getBattery()

        const handleBatteryChange = async () => {
          const level = Math.round(battery.level * 100)
          const isCharging = battery.charging

          // Only alert when battery is low and not charging
          if (level <= 15 && !isCharging && !alertSentRef.current) {
            alertSentRef.current = true
            await sendBatteryAlert(level)
          }

          // Reset alert if battery is charged above 20%
          if (level > 20) {
            alertSentRef.current = false
          }
        }

        battery.addEventListener('levelchange', handleBatteryChange)
        battery.addEventListener('chargingchange', handleBatteryChange)

        // Check immediately
        handleBatteryChange()

        return () => {
          battery.removeEventListener('levelchange', handleBatteryChange)
          battery.removeEventListener('chargingchange', handleBatteryChange)
        }
      } catch {
        console.log('Battery API not supported')
      }
    }

    checkBattery()
  }, [])
}

async function sendBatteryAlert(level: number) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { data: contacts } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })

    if (!contacts || contacts.length === 0) return

    const userName = profile?.full_name || 'Your contact'

    await fetch('/api/battery-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        userName,
        batteryLevel: level,
        contacts,
      }),
    })
  } catch (error) {
    console.error('Battery alert error:', error)
  }
}
