'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, Loader2, MapPin, ChevronDown, ChevronUp } from 'lucide-react'

interface ThreatAnalysis {
  safetyScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  summary: string
  risks: string[]
  tips: string[]
  bestTimeToTravel: string
  alternativeSuggestion: string
}

interface ThreatPredictorProps {
  currentAddress?: string
}

export default function ThreatPredictor({ currentAddress }: ThreatPredictorProps) {
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<ThreatAnalysis | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    if (!destination.trim()) return
    setLoading(true)
    setError('')
    setAnalysis(null)

    const timeOfDay = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    try {
      const res = await fetch('/api/threat-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          currentAddress,
          timeOfDay,
        }),
      })

      const data = await res.json()
      if (data.analysis) {
        setAnalysis(data.analysis)
        setExpanded(true)
      } else {
        setError('Could not analyze route. Try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Score color
  const scoreColor =
    !analysis ? 'text-gray-400' :
    analysis.safetyScore >= 7 ? 'text-brand-green' :
    analysis.safetyScore >= 4 ? 'text-brand-amber' :
    'text-brand-red'

  const riskBg =
    !analysis ? '' :
    analysis.riskLevel === 'LOW' ? 'bg-brand-green/10 border-brand-green/30' :
    analysis.riskLevel === 'MEDIUM' ? 'bg-brand-amber/10 border-brand-amber/30' :
    'bg-brand-red/10 border-brand-red/30'

  const riskColor =
    !analysis ? '' :
    analysis.riskLevel === 'LOW' ? 'text-brand-green' :
    analysis.riskLevel === 'MEDIUM' ? 'text-brand-amber' :
    'text-brand-red'

  const RiskIcon =
    !analysis ? Shield :
    analysis.riskLevel === 'LOW' ? CheckCircle :
    AlertTriangle

  return (
    <div className="mx-4 mb-4">
      {/* Input card */}
      <div className="glass-card p-4 border border-brand-border">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-brand-blue" />
          <p className="text-sm font-semibold">AI Route Safety Check</p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-brand-dark3 border border-brand-border rounded-xl px-3 py-2.5">
            <MapPin size={14} className="text-brand-muted shrink-0" />
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              placeholder="Where are you going?"
              className="flex-1 bg-transparent text-sm outline-none text-brand-text placeholder:text-brand-muted"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !destination.trim()}
            className="px-4 py-2.5 bg-brand-blue rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Check'}
          </button>
        </div>

        {error && (
          <p className="text-xs text-brand-red mt-2">{error}</p>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`glass-card border mt-2 overflow-hidden ${riskBg}`}
          >
            {/* Summary row - always visible */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full p-4 flex items-center gap-3 text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${riskBg} shrink-0`}>
                <RiskIcon size={18} className={riskColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${riskColor}`}>
                    {analysis.riskLevel} RISK
                  </span>
                  <span className={`text-lg font-bold ${scoreColor}`}>
                    {analysis.safetyScore}/10
                  </span>
                </div>
                <p className="text-xs text-brand-muted truncate">{analysis.summary}</p>
              </div>
              {expanded
                ? <ChevronUp size={16} className="text-brand-muted shrink-0" />
                : <ChevronDown size={16} className="text-brand-muted shrink-0" />
              }
            </button>

            {/* Expanded details */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-brand-border/50 pt-3">

                    {/* Best time */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-muted">Best time to travel:</span>
                      <span className="text-xs font-semibold text-brand-text">{analysis.bestTimeToTravel}</span>
                    </div>

                    {/* Risks */}
                    <div>
                      <p className="text-xs font-semibold text-brand-red mb-1.5">⚠️ Potential risks</p>
                      <div className="space-y-1">
                        {analysis.risks.map((r, i) => (
                          <p key={i} className="text-xs text-brand-muted flex gap-1.5">
                            <span className="text-brand-red shrink-0">•</span>{r}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div>
                      <p className="text-xs font-semibold text-brand-green mb-1.5">✅ Safety tips</p>
                      <div className="space-y-1">
                        {analysis.tips.map((t, i) => (
                          <p key={i} className="text-xs text-brand-muted flex gap-1.5">
                            <span className="text-brand-green shrink-0">•</span>{t}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Alternative */}
                    {analysis.riskLevel !== 'LOW' && (
                      <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl px-3 py-2">
                        <p className="text-xs text-brand-blue">
                          💡 {analysis.alternativeSuggestion}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
