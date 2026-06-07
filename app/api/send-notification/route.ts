import { NextRequest, NextResponse } from 'next/server'

async function getAccessToken(): Promise<string> {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
  
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  }

  // Create JWT
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signingInput = `${header}.${body}`

  const { createSign } = await import('crypto')
  const sign = createSign('RSA-SHA256')
  sign.update(signingInput)
  const signature = sign.sign(serviceAccount.private_key, 'base64url')
  const jwt = `${signingInput}.${signature}`

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

export async function POST(req: NextRequest) {
  try {
    const { token, title, body, data } = await req.json()
    if (!token) return NextResponse.json({ error: 'FCM token required' }, { status: 400 })

    const accessToken = await getAccessToken()
    const projectId = 'safeher-a0b8d'

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: title || '🚨 SafeHer Alert',
              body: body || 'Emergency alert triggered',
            },
            webpush: {
              notification: {
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-72.png',
                vibrate: [200, 100, 200],
              },
              fcm_options: {
                link: 'https://safeher-opal.vercel.app/dashboard/home',
              },
            },
            data: data || {},
          },
        }),
      }
    )

    const result = await response.json()
    console.log('FCM v1 response:', result)
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
