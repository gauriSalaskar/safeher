'use client'

import { useEffect, useState } from 'react'
import { useSOSStore } from '@/hooks/useSOSStore'

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSOSStore()
  const [isOffline, setIsOffline] = useState(false)

  // Apply body classes based on settings
  useEffect(() => {
    const body = document.body
    if (settings.lowBatteryMode) {
      body.classList.add('low-battery-mode')
    } else {
      body.classList.remove('low-battery-mode')
    }
    if (settings.accessibilityMode) {
      body.classList.add('accessibility-mode')
    } else {
      body.classList.remove('accessibility-mode')
    }
  }, [settings.lowBatteryMode, settings.accessibilityMode])

  // Offline detection
  useEffect(() => {
    const handleOffline = () => setIsOffline(true)
    const handleOnline  = () => setIsOffline(false)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online',  handleOnline)
    setIsOffline(!navigator.onLine)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online',  handleOnline)
    }
  }, [])

  return (
    <>
      {isOffline && (
        <div className="offline-banner">
          📵 No Internet — Emergency features in offline mode
        </div>
      )}
      {children}
    </>
  )
}
