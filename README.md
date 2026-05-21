# 🛡️ SafeHer — AI-Powered Women Safety Platform

> Silent SOS · Live Tracking · AI Guardian · Hidden Evidence · Fake Call

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/safeher
cd safeher
npm install
cp .env.example .env.local
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **Anon Key** into `.env.local`
3. Copy your **Service Role Key** into `.env.local`
4. Go to **SQL Editor** → paste contents of `supabase-schema.sql` → Run

### 3. Set Up Google Maps

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable: **Maps JavaScript API**, **Geocoding API**, **Places API**
3. Create API Key → paste into `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 4. Set Up Twilio (SMS Alerts)

1. Go to [twilio.com](https://twilio.com) → Create account
2. Get a phone number
3. Copy **Account SID**, **Auth Token**, **Phone Number** into `.env.local`

### 5. Set Up Gemini AI

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create API Key → paste as `GEMINI_API_KEY` in `.env.local`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
safeher/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/
│   │   ├── login/page.tsx          # Login
│   │   └── register/page.tsx       # Register (2-step)
│   ├── dashboard/
│   │   ├── layout.tsx              # Bottom nav layout
│   │   ├── home/page.tsx           # Main dashboard + SOS button
│   │   ├── map/page.tsx            # Live Google Maps tracking
│   │   ├── contacts/page.tsx       # Emergency contacts CRUD
│   │   ├── history/page.tsx        # SOS alert history
│   │   ├── settings/page.tsx       # Profile + toggles
│   │   └── chat/page.tsx           # AI Guardian chatbot
│   ├── emergency/
│   │   ├── sos-active/page.tsx     # Active emergency screen
│   │   └── fake-call/page.tsx      # Fake incoming call UI
│   └── api/
│       ├── sos/route.ts            # SOS trigger → SMS + DB
│       └── chat/route.ts           # Gemini AI chat endpoint
├── components/
│   ├── sos/SOSButton.tsx           # Pulsing SOS button
│   └── ui/StatusBar.tsx            # Safety status bar
├── hooks/
│   ├── useSOSStore.ts              # Zustand global state
│   └── useShakeDetector.ts         # DeviceMotion shake detection
├── lib/
│   ├── supabase/                   # DB client, server, queries
│   └── ai/gemini.ts                # Gemini AI functions
├── services/
│   ├── sms.ts                      # Twilio SMS service
│   ├── audio.ts                    # MediaRecorder evidence
│   └── location.ts                 # GPS + reverse geocoding
├── types/index.ts                  # All TypeScript types
└── supabase-schema.sql             # Full DB schema
```

---

## 🔑 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Gemini AI
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://safeher.vercel.app
```

---

## 🚀 Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add all environment variables in your Vercel dashboard under **Settings → Environment Variables**.

---

## 📱 PWA Installation

On mobile:
- Open the app in Chrome/Safari
- Tap **Share → Add to Home Screen**
- SafeHer is now installed as a native-like app

---

## 🗃️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles, emergency PIN |
| `emergency_contacts` | Trusted guardians with priority |
| `sos_alerts` | Emergency sessions with audio/location |
| `live_tracking` | Real-time GPS (upserted per user) |
| `safe_checkins` | Scheduled safety check-ins |
| `safe_zones` | Community-contributed safe places |

---

## ⚡ Core Emergency Flow

```
User taps SOS / Shakes phone / AI detects keyword
       ↓
SOSButton.tsx → useSOSStore.activateSOS()
       ↓
Router pushes to /emergency/sos-active
       ↓
POST /api/sos → creates DB record
       ↓
sendEmergencyAlerts() → Twilio SMS to all contacts
       ↓
AudioRecorder.start() → hidden microphone recording
       ↓
watchLocation() → upsertLiveLocation() every 3s
       ↓
User cancels → audio uploaded to Supabase Storage
       ↓
Gemini generates AI summary → saved to sos_alerts
```

---

## 🛡️ Features Checklist

- [x] Silent SOS activation (button + shake + AI keyword)
- [x] Live GPS tracking with Google Maps
- [x] Twilio SMS emergency alerts
- [x] Hidden audio recording → Supabase Storage
- [x] Emergency contacts management
- [x] Fake incoming call screen
- [x] AI Guardian chatbot (Gemini)
- [x] SOS history with expandable AI summaries
- [x] Settings with toggles (silent mode, shake, AI)
- [x] Shake detection (DeviceMotion API)
- [x] Dark futuristic UI + glassmorphism
- [x] PWA installable
- [x] Supabase Realtime tracking
- [x] Low battery emergency mode
- [x] Mobile-first responsive design
- [x] TypeScript throughout
- [x] Protected routes with Supabase Auth

---

## 🏆 Hackathon Demo Flow

1. Open app → **Landing page** (impressive hero)
2. Register → **Home Dashboard** (SOS button glowing)
3. Tap SOS → **SOS Active screen** (timer, alerts, AI guidance)
4. Show **Fake Call** (incoming call animation)
5. Navigate to **Live Map** (dark Google Maps)
6. Show **AI Chat** (type "I'm scared" → AI responds)
7. Show **History** → expand alert → AI summary
8. Show **Settings** → toggles working

---

## 🔮 Future Roadmap

- Smartwatch integration (WearOS / Apple Watch)
- Wearable safety band (BLE trigger)
- AI threat prediction (route danger scoring)
- Government emergency API integration (112 India)
- Advanced heatmap analytics
- WhatsApp alert fallback
- Community safe zone contributions

---

Made with ❤️ for every woman's safety · SafeHer v2.4
