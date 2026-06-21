'use client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react'

type StatusType = 'safe' | 'warning' | 'danger'

interface StatusBarProps {
  status: StatusType
  title: string
  subtitle: string
}

const CONFIG = {
  safe: { icon: CheckCircle, dotColor: 'bg-brand-green', dotShadow: '0 0 10px #00E676', badgeText: 'SAFE', badgeClass: 'bg-brand-green/10 text-brand-green border-brand-green/20' },
  warning: { icon: AlertTriangle, dotColor: 'bg-brand-amber', dotShadow: '0 0 10px #FFB300', badgeText: 'ALERT', badgeClass: 'bg-brand-amber/10 text-brand-amber border-brand-amber/20' },
  danger: { icon: AlertOctagon, dotColor: 'bg-brand-red', dotShadow: '0 0 10px #8B0000', badgeText: 'SOS', badgeClass: 'bg-brand-red/10 text-brand-red border-brand-red/20 animate-pulse' },
}

export default function StatusBar({ status, title, subtitle }: StatusBarProps) {
  const cfg = CONFIG[status]
  return (
    <motion.div layout className="mx-5 mt-4 glass-card p-4 flex items-center gap-3">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dotColor}`}
        style={{ boxShadow: cfg.dotShadow }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-text truncate">{title}</p>
        <p className="text-xs text-brand-muted truncate">{subtitle}</p>
      </div>
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.badgeClass}`}>
        {cfg.badgeText}
      </span>
    </motion.div>
  )
}
