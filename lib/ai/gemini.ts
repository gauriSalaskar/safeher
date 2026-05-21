import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

// ---- Emergency Chatbot ----
export async function getEmergencyGuidance(
  userMessage: string,
  context: { location?: string; isEmergency?: boolean }
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: `You are SafeHer AI Guardian — an emergency safety assistant for women.
Your ONLY purpose is to help women stay safe during dangerous situations.
Keep responses SHORT (3-5 lines max), CALM, and ACTIONABLE.
Always suggest: move to crowded areas, call trusted contacts, use SOS button.
Current location context: ${context.location || 'Unknown'}.
Emergency active: ${context.isEmergency ? 'YES' : 'NO'}.
Reply in a warm, reassuring tone. Use 1-2 emojis max. No markdown formatting.`,
    safetySettings,
  })

  const result = await model.generateContent(userMessage)
  return result.response.text()
}

// ---- Panic Keyword Detection ----
const PANIC_KEYWORDS = [
  'help', 'help me', 'save me', 'scared', "i'm scared", 'danger', 'following me',
  'someone following', 'please help', 'emergency', 'attacking', 'attacked',
  'unsafe', 'afraid', 'frightened', 'threatening', 'मदद', 'बचाओ', 'मदत करा',
]

export function detectPanicKeywords(text: string): boolean {
  const lower = text.toLowerCase()
  return PANIC_KEYWORDS.some(keyword => lower.includes(keyword))
}

export async function analyzeTextForDanger(text: string): Promise<{
  isDangerous: boolean
  confidence: number
  reason?: string
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', safetySettings })
    const prompt = `Analyze this text for signs of danger/emergency: "${text}"
Reply ONLY as JSON: {"isDangerous": boolean, "confidence": 0-1, "reason": "brief reason"}
Be conservative — only flag clear distress signals.`

    const result = await model.generateContent(prompt)
    const response = result.response.text().replace(/```json|```/g, '').trim()
    return JSON.parse(response)
  } catch {
    // Fallback to keyword detection
    return { isDangerous: detectPanicKeywords(text), confidence: 0.7 }
  }
}

// ---- Emergency Summary Generator ----
export async function generateEmergencySummary(params: {
  triggerType: string
  location: string
  durationSeconds: number
  timestamp: Date
}): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', safetySettings })

  const prompt = `Generate a concise emergency incident summary (2-3 sentences) for:
Trigger: ${params.triggerType}
Location: ${params.location}
Time: ${params.timestamp.toLocaleString()}
Duration: ${Math.floor(params.durationSeconds / 60)} minutes ${params.durationSeconds % 60} seconds

Write in past tense. Professional tone. No markdown.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ---- Safe Route Analysis ----
export async function analyzeRouteSafety(params: {
  origin: string
  destination: string
  timeOfDay: string
}): Promise<{ safetyScore: number; recommendation: string; tips: string[] }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', safetySettings })

  const prompt = `Analyze route safety for a woman traveling:
From: ${params.origin}
To: ${params.destination}
Time: ${params.timeOfDay}

Reply ONLY as JSON:
{
  "safetyScore": 0-100,
  "recommendation": "brief recommendation",
  "tips": ["tip1", "tip2", "tip3"]
}
Base on general urban safety principles.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json|```/g, '').trim()
    return JSON.parse(text)
  } catch {
    return {
      safetyScore: 65,
      recommendation: 'Stay on main roads and keep contacts informed.',
      tips: ['Share live location', 'Avoid isolated areas', 'Keep phone charged'],
    }
  }
}
