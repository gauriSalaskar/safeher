import { NextRequest, NextResponse } from 'next/server'
import { getEmergencyGuidance } from '@/lib/ai/gemini'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { message, isEmergency } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    // Get user location context if available
    let locationContext = 'Aurangabad, Maharashtra, India'
    try {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: tracking } = await supabase
          .from('live_tracking')
          .select('latitude, longitude')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()
        if (tracking && typeof tracking === 'object' && 'latitude' in tracking && 'longitude' in tracking) {
          const t = tracking as { latitude: number; longitude: number }
          locationContext = `${t.latitude.toFixed(4)}°N, ${t.longitude.toFixed(4)}°E`
        }
      }
    } catch { /* optional context */ }

    const response = await getEmergencyGuidance(message, {
      location: locationContext,
      isEmergency,
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({
      response: "🛡️ I'm here with you. If you're in immediate danger, please call 112 or press the SOS button.",
    })
  }
}
