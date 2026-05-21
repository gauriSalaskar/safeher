'use client'

import { useEffect, useRef, useCallback } from 'react'

interface ShakeDetectorOptions {
  threshold?: number // acceleration threshold (default: 15)
  timeout?: number   // ms between triggers (default: 1000)
  onShake: () => void
}

export function useShakeDetector({ threshold = 15, timeout = 1000, onShake }: ShakeDetectorOptions) {
  const lastTime = useRef(0)
  const lastX = useRef(0)
  const lastY = useRef(0)
  const lastZ = useRef(0)

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity
    if (!acc) return

    const now = Date.now()
    if (now - lastTime.current < timeout) return

    const { x = 0, y = 0, z = 0 } = acc
    const deltaX = Math.abs((x ?? 0) - lastX.current)
    const deltaY = Math.abs((y ?? 0) - lastY.current)
    const deltaZ = Math.abs((z ?? 0) - lastZ.current)

    if (deltaX + deltaY + deltaZ > threshold) {
      lastTime.current = now
      onShake()
    }

    lastX.current = x ?? 0
    lastY.current = y ?? 0
    lastZ.current = z ?? 0
  }, [threshold, timeout, onShake])

  useEffect(() => {
    // Request permission on iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
          if (permission !== 'granted') return
        } catch { return }
      }
      window.addEventListener('devicemotion', handleMotion)
    }

    requestPermission()
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [handleMotion])
}
