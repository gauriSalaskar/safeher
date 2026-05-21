'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Phone, Edit2, Shield, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { getEmergencyContacts, addEmergencyContact, deleteEmergencyContact } from '@/lib/supabase/queries'
import type { EmergencyContact } from '@/types'

const AVATAR_COLORS = ['from-red-500 to-rose-700', 'from-blue-500 to-blue-700', 'from-purple-500 to-purple-700', 'from-amber-500 to-amber-700', 'from-green-500 to-green-700']

export default function ContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', relationship: '', priority: '1' as '1' | '2' | '3' })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const ctcts = await getEmergencyContacts(user.id)
      setContacts(ctcts)
      setLoading(false)
    }
    load()
  }, [])

  const handleAdd = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return }
    const { data, error } = await addEmergencyContact({
      user_id: userId, name: form.name, phone: form.phone,
      relationship: form.relationship, priority: Number(form.priority) as 1 | 2 | 3,
    })
    if (error) { toast.error('Failed to add contact'); return }
    setContacts(prev => [...prev, data as EmergencyContact])
    setForm({ name: '', phone: '', relationship: '', priority: '1' })
    setShowAdd(false)
    toast.success(`${form.name} added as emergency contact!`)

    // Send test SMS
    try {
      await fetch('/api/contacts/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactPhone: form.phone, contactName: form.name, userId }),
      })
    } catch {}
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from emergency contacts?`)) return
    await deleteEmergencyContact(id)
    setContacts(prev => prev.filter(c => c.id !== id))
    toast.success(`${name} removed`)
  }

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-syne font-extrabold text-2xl mb-1">Emergency Contacts</h1>
        <p className="text-brand-muted text-sm">These contacts receive instant SOS alerts with your live location</p>
      </div>

      {/* Info Banner */}
      <div className="mx-5 mb-5 bg-brand-blue/8 border border-brand-blue/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <Shield size={16} className="text-brand-blue mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-brand-blue font-semibold">Priority 1 contacts are alerted first</p>
          <p className="text-xs text-brand-muted mt-0.5">They receive your GPS link before Priority 2+ contacts</p>
        </div>
      </div>

      {/* Contacts List */}
      {loading ? (
        <div className="px-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="px-5 space-y-2.5 mb-4">
          <AnimatePresence>
            {contacts.map((c, i) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.08 }}
                className="glass-card p-4 flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.priority === 1 ? 'bg-brand-red/15 text-brand-red' : 'bg-brand-amber/15 text-brand-amber'}`}>
                      P{c.priority}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted">{c.phone}</p>
                  {c.relationship && <p className="text-xs text-brand-muted">{c.relationship}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a href={`tel:${c.phone}`}
                    className="w-8 h-8 glass-card flex items-center justify-center hover:border-brand-green/50 transition-colors">
                    <Phone size={14} className="text-brand-green" />
                  </a>
                  <button onClick={() => handleDelete(c.id, c.name)}
                    className="w-8 h-8 glass-card flex items-center justify-center hover:border-brand-red/50 transition-colors">
                    <Trash2 size={14} className="text-brand-muted" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {contacts.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-brand-muted text-sm">No emergency contacts yet</p>
              <p className="text-brand-muted text-xs mt-1">Add your trusted guardians below</p>
            </div>
          )}
        </div>
      )}

      {/* Add Button */}
      <div className="px-5">
        <button onClick={() => setShowAdd(true)}
          className="w-full py-4 bg-brand-red/8 border border-dashed border-brand-red/40 rounded-2xl text-brand-red text-sm font-semibold flex items-center justify-center gap-2 hover:bg-brand-red/12 transition-colors">
          <Plus size={16} /> Add Emergency Contact
        </button>
      </div>

      {/* Safe Check-in */}
      <div className="mx-5 mt-4 bg-brand-green/6 border border-brand-green/20 rounded-xl px-4 py-3">
        <p className="text-xs text-brand-green font-bold mb-1">✓ Safe Check-in Active</p>
        <p className="text-xs text-brand-muted">Expected home by <strong className="text-brand-text">10:00 PM tonight</strong>. Contacts alerted if missed.</p>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-[430px] mx-auto bg-brand-dark2 border-t border-brand-border rounded-t-3xl p-6 overflow-y-auto max-h-[90vh] pb-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-syne font-bold text-xl">Add Contact</h3>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 glass-card flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'Mom, Rahul, Sneha...', type: 'text' },
                  { key: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210', type: 'tel' },
                  { key: 'relationship', label: 'Relationship', placeholder: 'Mother, Brother, Friend...', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-1.5 block">{f.label}</label>
                    <input type={f.type} value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-brand-card2 border border-brand-border rounded-xl py-3.5 px-4 text-sm outline-none focus:border-brand-red transition-colors" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-brand-muted font-semibold uppercase tracking-wide mb-1.5 block">Priority</label>
                  <div className="flex gap-2">
                    {(['1', '2', '3'] as const).map(p => (
                      <button key={p} onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${form.priority === p ? 'bg-brand-red text-white' : 'glass-card text-brand-muted'}`}>
                        P{p}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleAdd}
                  className="w-full py-4 bg-brand-red rounded-2xl text-white font-syne font-bold text-base mt-2"
                  style={{ boxShadow: '0 0 20px rgba(255,45,85,0.3)' }}>
                  Add & Send Test Alert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
