'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SOSButtonProps {
  onActivate: () => void
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function SOSButton({ onActivate, isActive = false, size = 'lg' }: SOSButtonProps) {
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [holdInterval, setHoldInterval] = useState<NodeJS.Timeout | null>(null)

  const btnSize = size === 'lg' ? 140 : size === 'md' ? 110 : 80

  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern) } catch {}
    }
  }, [])

  const startHold = useCallback(() => {
    setIsHolding(true)
    vibrate(15)
    const interval = setInterval(() => {
      setHoldProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setIsHolding(false)
          setHoldProgress(0)
          vibrate([60, 40, 60, 40, 120])
          onActivate()
          return 0
        }
        const next = p + 4
        if (next % 20 === 0) vibrate(10)
        return next
      })
    }, 60)
    setHoldInterval(interval)
  }, [onActivate, vibrate])

  const cancelHold = useCallback(() => {
    setIsHolding(false)
    setHoldProgress(0)
    vibrate(8)
    if (holdInterval) { clearInterval(holdInterval); setHoldInterval(null) }
  }, [holdInterval, vibrate])

  useEffect(() => () => { if (holdInterval) clearInterval(holdInterval) }, [holdInterval])

  const circumference = 2 * Math.PI * (btnSize / 2 + 6)
  const strokeDash = circumference - (holdProgress / 100) * circumference

  // 4 rings, each offset by 1s so one is always at every stage
  const RINGS = [0, 1, 2, 3]
  const maxRingSize = btnSize + 160

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: btnSize + 180, height: btnSize + 180 }}>

        {/* Continuous outward ripple rings */}
       {RINGS.map((i) => (
  <motion.div
    key={i}
    className="absolute rounded-full"
    style={{
      border: '1.5px solid rgba(255, 45, 85, 0.8)',
      boxShadow: '0 0 10px rgba(255,45,85,0.4)',
    }}
    animate={{
      width: [btnSize, maxRingSize],
      height: [btnSize, maxRingSize],
      opacity: [0.8, 0],
    }}
    transition={{
      duration: 3,
      delay: i * 0.75,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'easeOut',
    }}
  />
))}

        {/* Rumble on hold */}
        {isHolding && (
          <motion.div
            className="absolute rounded-full"
            style={{ width: btnSize, height: btnSize }}
            animate={{ x: [0, -3, 3, -3, 3, 0] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
        )}

        {/* Progress ring while holding */}
        {isHolding && (
          <svg className="absolute" width={btnSize + 20} height={btnSize + 20}
            style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={(btnSize + 20) / 2} cy={(btnSize + 20) / 2} r={btnSize / 2 + 6}
              fill="none" stroke="#FF2D55" strokeWidth="3"
              strokeDasharray={circumference} strokeDashoffset={strokeDash}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.06s linear' }} />
          </svg>
        )}

        {/* Main SOS button */}
        <motion.button
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onClick={!isHolding ? onActivate : undefined}
          whileTap={{ scale: 0.94 }}
          animate={isActive ? { boxShadow: ['0 0 40px rgba(255,45,85,0.5)', '0 0 80px rgba(255,45,85,0.9)', '0 0 40px rgba(255,45,85,0.5)'] } : {}}
          transition={isActive ? { duration: 1, repeat: Infinity } : {}}
          aria-label={isActive ? 'Emergency SOS is active. Tap to view emergency screen.' : 'SOS emergency button. Tap or hold to call for help.'}
          aria-pressed={isActive}
          className="relative z-10 flex flex-col items-center justify-center rounded-full"
          style={{
            width: btnSize, height: btnSize,
            background: isActive
              ? 'linear-gradient(145deg, #c0003c, #8b0000)'
              : 'linear-gradient(145deg, #FF2D55, #c0003c)',
            boxShadow: '0 0 40px rgba(255,45,85,0.5), 0 0 80px rgba(255,45,85,0.2)',
          }}
        >
          <span className="font-syne font-extrabold text-white" style={{ fontSize: btnSize * 0.27, letterSpacing: '2px' }}>
            {isActive ? '●' : 'SOS'}
          </span>
          <span className="text-white/70 font-dm" style={{ fontSize: btnSize * 0.075, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {isActive ? 'Active' : isHolding ? `${holdProgress}%` : 'Hold'}
          </span>
        </motion.button>
      </div>

      <span className="sr-only" role="status" aria-live="assertive">
        {isHolding ? `Holding SOS button, ${holdProgress} percent` : isActive ? 'Emergency SOS activated. Contacts alerted.' : ''}
      </span>

      <AnimatePresence>
        {isHolding && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-brand-red text-xs font-semibold mt-2 animate-pulse">
            Hold to activate SOS...
          </motion.p>
        )}
        {!isHolding && !isActive && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-brand-muted text-xs mt-3 text-center">
            Tap once or hold for silent SOS
          </motion.p>
        )}
        {isActive && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-brand-red text-xs font-bold mt-3 animate-pulse">
            🚨 EMERGENCY ACTIVE — Contacts Alerted
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}