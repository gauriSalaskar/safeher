import type { EmergencyContact, SOSAlert } from '@/types'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886'

export interface SMSPayload {
  userName: string
  alert: SOSAlert
  contacts: EmergencyContact[]
  trackingLink: string
}

function buildEmergencyMessage(payload: SMSPayload): string {
  const { userName, alert, trackingLink } = payload

  let locationText = ''
  if (alert.address && alert.address !== 'Location unavailable') {
    locationText = alert.address
  } else if (alert.latitude && alert.longitude && (alert.latitude !== 0 || alert.longitude !== 0)) {
    locationText = `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
  } else {
    locationText = 'Location not available'
  }

  return `🚨 *SAFEHER EMERGENCY!*\n\n*${userName}* needs help!\n📍 Location: ${locationText}\n🔗 Track live: ${trackingLink}\n\nPlease respond immediately!`
}

function cleanPhone(phone: string): string {
  // Remove all spaces and non-digit characters except leading +
  const cleaned = phone.replace(/\s/g, '').replace(/[^\d+]/g, '')
  // Ensure it starts with +91 for Indian numbers
  if (cleaned.startsWith('+91')) return cleaned
  if (cleaned.startsWith('91')) return '+' + cleaned
  if (cleaned.length === 10) return '+91' + cleaned
  return cleaned
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const cleanedPhone = cleanPhone(phone)
    const toWhatsApp = `whatsapp:${cleanedPhone}`

    console.log('Sending WhatsApp to:', toWhatsApp)

    const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_FROM,
          To: toWhatsApp,
          Body: message,
        }).toString(),
      }
    )

    const data = await response.json()
    console.log('Twilio WhatsApp response:', JSON.stringify(data))
    return data.sid ? true : false
  } catch (error) {
    console.error('Twilio WhatsApp error:', error)
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

  for (const contact of payload.contacts) {
    const success = await sendWhatsApp(contact.phone, message)
    if (success) {
      results.sent++
    } else {
      results.failed++
      results.errors.push(`Failed to send to ${contact.name}`)
    }
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
  const message = `SafeHer: ${params.userName} missed check-in at ${params.expectedTime}. Please check on her immediately.`
  return sendWhatsApp(params.contactPhone, message)
}

export async function sendTestAlert(phone: string, userName: string): Promise<boolean> {
  const message = `SafeHer Test: This is a test alert for ${userName}.`
  return sendWhatsApp(phone, message)
}
