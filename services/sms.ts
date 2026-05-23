import type { EmergencyContact, SOSAlert } from '@/types'

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY!

export interface SMSPayload {
  userName: string
  alert: SOSAlert
  contacts: EmergencyContact[]
  trackingLink: string
}

function buildEmergencyMessage(payload: SMSPayload): string {
  const { userName, alert, trackingLink } = payload
  const trigger = alert.trigger_type === 'manual' ? 'pressed the SOS button'
    : alert.trigger_type === 'shake' ? 'used shake detection'
    : alert.trigger_type === 'ai_keyword' ? 'AI detected danger'
    : 'triggered an emergency'

  return `SAFEHER EMERGENCY! ${userName} ${trigger}. Location: ${alert.address || `${alert.latitude}, ${alert.longitude}`}. Track live: ${trackingLink}`
}

async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    // Remove +91 prefix for Fast2SMS
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '')
    
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: cleanPhone,
      }),
    })

    const data = await response.json()
    console.log('Fast2SMS response:', data)
    return data.return === true
  } catch (error) {
    console.error('Fast2SMS error:', error)
    return false
  }
}

export async function sendEmergencyAlerts(payload: SMSPayload): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const message = buildEmergencyMessage(payload)
  const results = { sent: 0, failed: 0, errors: [] as string[] }

  const priorityContacts = payload.contacts.filter(c => c.priority === 1)
  const otherContacts = payload.contacts.filter(c => c.priority > 1)

  const sendToContact = async (contact: EmergencyContact) => {
    const success = await sendSMS(contact.phone, message)
    if (success) {
      results.sent++
    } else {
      results.failed++
      results.errors.push(`Failed to send to ${contact.name}`)
    }
  }

  await Promise.all(priorityContacts.map(sendToContact))

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
  const message = `SafeHer Alert: ${params.userName} was expected to check in by ${params.expectedTime} but hasn't responded. ${params.lastLocation ? `Last location: ${params.lastLocation}` : ''} Please check on her immediately.`
  return sendSMS(params.contactPhone, message)
}

export async function sendTestAlert(phone: string, userName: string): Promise<boolean> {
  const message = `SafeHer Test Alert: Hi! This is a test from SafeHer for ${userName}. In a real emergency, you would receive her live location here.`
  return sendSMS(phone, message)
}
