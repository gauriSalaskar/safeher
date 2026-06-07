'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { requestNotificationPermission, saveFCMToken, onForegroundMessage } from '@/lib/firebase/config'
import toast from 'react-hot-toast'

export function useNotifications() {
  useEffect(() => {
    const setup = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Request permission and get token
        const token = await requestNotificationPermission()
        if (token) {
          await saveFCMToken(user.id, token)
          console.log('Push notifications enabled!')
        }

        // Handle foreground messages
        const unsubscribe = onForegroundMessage((payload) => {
          const { title, body } = payload.notification || {}
          toast(
            `🔔 ${title || 'SafeHer'}: ${body || 'New alert'}`,
            { duration: 5000, icon: '🚨' }
          )
        })

        return unsubscribe
      } catch (error) {
        console.error('Notification setup error:', error)
      }
    }

    setup()
  }, [])
}
