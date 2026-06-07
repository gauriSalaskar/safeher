import { NextRequest, NextResponse } from 'next/server'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886'

function cleanPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '').replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+91')) return cleaned
  if (cleaned.startsWith('91')) return '+' + cleaned
  if (cleaned.length === 10) return '+91' + cleaned
  return cleaned
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const cleanedPhone = cleanPhone(phone)
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
          To: `whatsapp:${cleanedPhone}`,
          Body: message,
        }).toString(),
      }
    )
    const data = await response.json()
    return data.sid ? true : false
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userName, batteryLevel, contacts } = await req.json()

    const message = `🔋 *SafeHer Battery Alert*\n\n*${userName}'s* phone battery is critically low at *${batteryLevel}%*.\n\nShe may become unreachable soon. Please check on her! 📱`

    for (const contact of contacts) {
      await sendWhatsApp(contact.phone, message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Battery alert API error:', error)
    return NextResponse.json({ error: 'Failed to send battery alert' }, { status: 500 })
  }
}
