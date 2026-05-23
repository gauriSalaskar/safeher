'use client'

import { useEffect, useRef, useCallback } from 'react'

interface ShakeDetectorOptions {
  threshold?: number
  timeout?: number
  requiredShakes?: number
  onShake: () => void
}

export function useShakeDetector({ threshold = 40, timeout = 2000, requiredShakes = 3, onShake }: ShakeDetectorOptions) {
  const lastTime = useRef(0)
  const lastX = useRef(0)
  const lastY = useRef(0)
  const lastZ = useRef(0)
  const shakeCount = useRef(0)
  const shakeTimer = useRef<NodeJS.Timeout>()

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity
    if (!acc) return

    const now = Date.now()
    if (now - lastTime.current < 300) return

    const { x = 0, y = 0, z = 0 } = acc
    const deltaX = Math.abs((x ?? 0) - lastX.current)
    const deltaY = Math.abs((y ?? 0) - lastY.current)
    const deltaZ = Math.abs((z ?? 0) - lastZ.current)

    if (deltaX + deltaY + deltaZ > threshold) {
      lastTime.current = now
      shakeCount.current += 1

      // Reset shake count after 2 seconds
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => {
        shakeCount.current = 0
      }, timeout)

      // Only trigger after required number of shakes
      if (shakeCount.current >= requiredShakes) {
        shakeCount.current = 0
        onShake()
      }
    }

    lastX.current = x ?? 0
    lastY.current = y ?? 0
    lastZ.current = z ?? 0
  }, [threshold, timeout, requiredShakes, onShake])

  useEffect(() => {
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
    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
    }
  }, [handleMotion])
}
