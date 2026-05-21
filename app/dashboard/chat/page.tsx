'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Shield, AlertTriangle } from 'lucide-react'
import { detectPanicKeywords } from '@/lib/ai/gemini'
import { useSOSStore } from '@/hooks/useSOSStore'
import { useRouter } from 'next/navigation'
import type { ChatMessage } from '@/types'

const QUICK_PROMPTS = [
  "I think someone is following me",
  "I feel unsafe right now",
  "How do I activate SOS silently?",
  "Find nearest police station",
]

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1', role: 'assistant',
    content: "👋 Hi! I'm your AI Guardian, powered by Gemini AI.\n\nI'm here 24/7 to help you stay safe. You can:\n• Tell me if you feel unsafe\n• Ask for safety tips\n• Get guidance in emergencies\n• Request nearest safe zones\n\nHow can I protect you right now?",
    timestamp: new Date(),
  },
]

export default function ChatPage() {
  const router = useRouter()
  const { sos, activateSOS } = useSOSStore()
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Check for panic keywords
    const isDangerous = detectPanicKeywords(text)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, isEmergency: sos.isActive }),
      })
      const data = await res.json()
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: data.response || "I'm here to help. Please stay calm and tell me what's happening.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])

      // Auto-trigger SOS if AI detects danger
      if (isDangerous && !sos.isActive) {
        setTimeout(() => {
          const warnMsg: ChatMessage = {
            id: (Date.now() + 2).toString(), role: 'assistant',
            content: "🚨 I've detected you may be in danger. Should I activate your SOS and alert your emergency contacts now?",
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, warnMsg])
        }, 1000)
      }
    } catch {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: "🛡️ Stay calm — I'm experiencing a brief connection issue. If you're in danger, please press the SOS button immediately or call 112.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-brand-border flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-rose-800 flex items-center justify-center">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-lg">AI Guardian</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            <span className="text-xs text-brand-green">Online · Powered by Gemini</span>
          </div>
        </div>
        {sos.isActive && (
          <button onClick={() => router.push('/emergency/sos-active')}
            className="ml-auto flex items-center gap-1.5 bg-brand-red/15 border border-brand-red/30 rounded-full px-3 py-1.5 text-xs text-brand-red font-semibold animate-pulse">
            <AlertTriangle size={12} /> SOS Active
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] ${msg.role === 'user'
                ? 'bg-brand-red rounded-2xl rounded-br-sm text-white'
                : 'glass-card rounded-2xl rounded-bl-sm'} px-4 py-3`}>
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/60' : 'text-brand-muted'}`}>
                  {fmtTime(msg.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-brand-muted"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none flex-shrink-0">
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => sendMessage(p)}
            className="flex-shrink-0 text-xs px-3 py-2 glass-card rounded-full text-brand-muted hover:border-brand-red/40 hover:text-brand-red transition-colors">
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2.5 px-4 pb-4 pt-2 flex-shrink-0 border-t border-brand-border bg-brand-dark">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Tell me what's happening..."
          className="flex-1 bg-brand-card2 border border-brand-border rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-red transition-colors"
        />
        <motion.button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
          whileTap={{ scale: 0.9 }}
          className="w-11 h-11 bg-brand-red rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          style={{ boxShadow: '0 0 16px rgba(255,45,85,0.3)' }}>
          <Send size={16} className="text-white" />
        </motion.button>
      </div>
    </div>
  )
}
