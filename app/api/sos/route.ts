import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { sendEmergencyAlerts } from '@/services/sms'
import { generateEmergencySummary } from '@/lib/ai/gemini'
import { reverseGeocode, getTrackingLink } from '@/services/location'

export async function POST(req: NextRequest) {
  try {
    const { userId, triggerType, latitude, longitude } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()

    // Get user profile
    const { data: user } = await supabase
      .from('users')
      .select('full_name, phone')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get emergency contacts
    const { data: contacts } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true })

    // Reverse geocode
    let address = 'Location unavailable'
    if (latitude && longitude) {
      address = await reverseGeocode(latitude, longitude)
    }

    // Create SOS alert in DB
    const { data: alert, error: alertError } = await supabase
      .from('sos_alerts')
      .insert({
        user_id: userId,
        trigger_type: triggerType || 'manual',
        latitude: latitude || 0,
        longitude: longitude || 0,
        address,
        status: 'active',
      })
      .select()
      .single()

    if (alertError) {
      console.error('SOS alert insert error:', alertError)
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
    }

    // Send SMS alerts if Twilio is configured
    let smsResult = { sent: 0, failed: 0, errors: [] as string[] }
    if (contacts && contacts.length > 0 && process.env.TWILIO_ACCOUNT_SID) {
      const trackingLink = getTrackingLink(userId)
      smsResult = await sendEmergencyAlerts({
        userName: user.full_name,
        alert,
        contacts,
        trackingLink,
      })
    }

    return NextResponse.json({
      success: true,
      alertId: alert.id,
      address,
      smsResult,
    })
  } catch (error) {
    console.error('SOS API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: resolve/cancel an SOS alert
export async function PATCH(req: NextRequest) {
  try {
    const { alertId, status, durationSeconds, userId } = await req.json()
    const supabase = await createServiceSupabaseClient()

    // Generate AI summary
    let aiSummary: string | undefined
    if (status === 'resolved' && userId) {
      const { data: alert } = await supabase
        .from('sos_alerts')
        .select('trigger_type, address, created_at')
        .eq('id', alertId)
        .single()

      if (alert) {
        try {
          aiSummary = await generateEmergencySummary({
            triggerType: alert.trigger_type,
            location: alert.address || 'Unknown location',
            durationSeconds: durationSeconds || 0,
            timestamp: new Date(alert.created_at),
          })
        } catch { /* AI summary optional */ }
      }
    }

    const { error } = await supabase
      .from('sos_alerts')
      .update({
        status,
        duration_seconds: durationSeconds,
        ai_summary: aiSummary,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, aiSummary })
  } catch (error) {
    console.error('SOS PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
