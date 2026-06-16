import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

export async function POST(req: NextRequest) {
  try {
    const { origin, destination, currentLocation, timeOfDay, currentAddress } = await req.json()

    if (!destination) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      safetySettings,
      systemInstruction: `You are SafeHer's AI Safety Analyst for women in India.
Your job is to assess route safety and give practical advice.
Always respond in this exact JSON format, nothing else:
{
  "safetyScore": <number 1-10, where 10 is safest>,
  "riskLevel": "<LOW | MEDIUM | HIGH>",
  "summary": "<2 sentence summary of safety assessment>",
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "tips": ["<safety tip 1>", "<safety tip 2>", "<safety tip 3>"],
  "bestTimeToTravel": "<e.g. Before 8 PM | Daytime only | Avoid late night>",
  "alternativeSuggestion": "<one sentence alternative if risky>"
}
Base your analysis on: time of day, typical safety of Indian cities/areas, 
lighting conditions at night, crowdedness, transport options.
Be realistic and helpful, not overly alarming.`,
    })

    const prompt = `Analyze safety for this route:
- From: ${origin || currentAddress || 'Current location'}
- To: ${destination}
- Current time: ${timeOfDay}
- City context: India

Provide a safety assessment in the exact JSON format specified.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse JSON from Gemini response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI')
    }

    const analysis = JSON.parse(jsonMatch[0])

    return NextResponse.json({ success: true, analysis })
  } catch (err) {
    console.error('[threat-predict]', err)
    return NextResponse.json({ error: 'Failed to analyze route' }, { status: 500 })
  }
}
