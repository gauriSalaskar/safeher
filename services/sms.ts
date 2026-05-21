import twilio from 'twilio'
import type { EmergencyContact, SOSAlert } from '@/types'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER!

export interface SMSPayload {
  userName: string
  alert: SOSAlert
  contacts: EmergencyContact[]
  trackingLink: string
}

function buildEmergencyMessage(payload: SMSPayload): string {
  const { userName, alert, trackingLink } = payload
  const time = new Date(alert.created_at).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'short',
    timeStyle: 'short',
  })
  const trigger = alert.trigger_type === 'manual' ? 'pressed the SOS button'
    : alert.trigger_type === 'shake' ? 'used shake detection'
    : alert.trigger_type === 'ai_keyword' ? 'AI detected danger'
    : 'triggered an emergency'

  return `🚨 SAFEHER EMERGENCY ALERT 🚨

${userName} ${trigger} at ${time}.

📍 Location: ${alert.address || `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`}

🔴 Track her LIVE: ${trackingLink}

Reply SAFE if you've reached her.
— SafeHer Emergency System`
}

export async function sendEmergencyAlerts(payload: SMSPayload): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const message = buildEmergencyMessage(payload)
  const results = { sent: 0, failed: 0, errors: [] as string[] }

  // Send to priority 1 contacts first (in parallel), then priority 2+
  const priorityContacts = payload.contacts.filter(c => c.priority === 1)
  const otherContacts = payload.contacts.filter(c => c.priority > 1)

  const sendToContact = async (contact: EmergencyContact) => {
    try {
      await client.messages.create({
        body: message,
        from: FROM_NUMBER,
        to: contact.phone,
      })
      results.sent++
    } catch (error) {
      results.failed++
      results.errors.push(`Failed to send to ${contact.name}: ${error}`)
      console.error(`SMS failed for ${contact.name}:`, error)
    }
  }

  // Send priority 1 contacts immediately
  await Promise.all(priorityContacts.map(sendToContact))

  // Send others with slight delay
  if (otherContacts.length > 0) {
    await new Promise(resolve => setTimeout(resolve, 500))
    await Promise.all(otherContacts.map(sendToContact))
  }

  return results
}

export async function sendSafeCheckInMissedAlert(params: {
  userName: string
  contactPhone: string
  contactName: string
  expectedTime: string
  lastLocation?: string
}): Promise<boolean> {
  try {
    await client.messages.create({
      body: `⚠️ SafeHer Check-in Alert

${params.userName} was expected to check in by ${params.expectedTime} but hasn't responded.

${params.lastLocation ? `Last known location: ${params.lastLocation}` : 'Location unknown.'}

Please check on her immediately.
— SafeHer Safety System`,
      from: FROM_NUMBER,
      to: params.contactPhone,
    })
    return true
  } catch (error) {
    console.error('Check-in alert SMS failed:', error)
    return false
  }
}

export async function sendTestAlert(phone: string, userName: string): Promise<boolean> {
  try {
    await client.messages.create({
      body: `✅ SafeHer Test Alert

Hi! This is a test from SafeHer for ${userName}.

In a real emergency, you would receive her live location and a tracking link here.

Your number is registered as an emergency contact. 🛡️`,
      from: FROM_NUMBER,
      to: phone,
    })
    return true
  } catch (error) {
    console.error('Test alert SMS failed:', error)
    return false
  }
}
