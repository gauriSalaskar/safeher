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
  
  let locationText = ''
  if (alert.address && alert.address !== 'Location unavailable') {
    locationText = alert.address
  } else if (alert.latitude && alert.longitude && (alert.latitude !== 0 || alert.longitude !== 0)) {
    locationText = `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
  } else {
    locationText = 'Location not available'
  }

  return `SAFEHER EMERGENCY! ${userName} needs help! Location: ${locationText}. Track live: ${trackingLink}`
}

async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '')
    
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${cleanPhone}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'cache-control': 'no-cache',
      },
    })

    const data = await response.json()
    console.log('Fast2SMS response:', JSON.stringify(data))
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

  for (const contact of payload.contacts) {
    const success = await sendSMS(contact.phone, message)
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
  return sendSMS(params.contactPhone, message)
}

export async function sendTestAlert(phone: string, userName: string): Promise<boolean> {
  const message = `SafeHer Test: This is a test alert for ${userName}.`
  return sendSMS(phone, message)
}
