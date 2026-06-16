import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { origin, destination, currentLocation, timeOfDay, currentAddress } = body

    console.log('[threat-predict] Request:', { destination, timeOfDay })

    if (!destination) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      safetySettings,
      systemInstruction: `You are SafeHer's AI Safety Analyst for women in India.
Your job is to assess route safety and give practical advice.
Always respond in this exact JSON format, nothing else, no markdown, no backticks:
{
  "safetyScore": 7,
  "riskLevel": "LOW",
  "summary": "Two sentence summary here.",
  "risks": ["risk 1", "risk 2", "risk 3"],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "bestTimeToTravel": "Before 9 PM",
  "alternativeSuggestion": "One sentence suggestion here."
}
Base your analysis on: time of day, typical safety of Indian cities/areas, lighting conditions at night, crowdedness, transport options.`,
    })

    const prompt = `Analyze safety for this route:
- From: ${origin || currentAddress || 'Current location'}
- To: ${destination}
- Current time: ${timeOfDay || new Date().toLocaleTimeString('en-IN')}
- City context: India

Respond ONLY with the JSON object, no markdown, no backticks.`

    console.log('[threat-predict] Calling Gemini...')
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    console.log('[threat-predict] Gemini raw response:', text)

    // Strip markdown backticks if present
    const cleaned = text.replace(/```json|```/g, '').trim()

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[threat-predict] No JSON found in response:', text)
      throw new Error('Invalid response format from AI')
    }

    const analysis = JSON.parse(jsonMatch[0])
    console.log('[threat-predict] Parsed analysis:', analysis)

    return NextResponse.json({ success: true, analysis })
  } catch (err: any) {
    console.error('[threat-predict] FULL ERROR:', err?.message || JSON.stringify(err))
    return NextResponse.json({ error: 'Failed to analyze route', detail: err?.message }, { status: 500 })
  }
}