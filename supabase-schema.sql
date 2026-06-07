

---

# 🚀 FINAL PROMPT — “HearMe” Full-Stack AI Accessibility App

Build a full-stack AI accessibility web application called **“HearMe”** that enables real-time communication between deaf/mute users and normal users using **Indian Sign Language (ISL)**.

The system must convert hand gestures captured from a webcam into **real-time text and speech**, using computer vision + machine learning + a modern accessibility-first UI.

---

# 🎯 CORE OBJECTIVE

Solve real-world communication barriers for deaf and mute individuals by translating ISL gestures into:

* readable text
* spoken voice output
* conversation history logs

The app must feel like a **real assistive technology product**, not a prototype.

---

# 🧠 CORE WORKFLOW

1. Capture live webcam video from user
2. Use MediaPipe to detect hand landmarks (21 points per hand)
3. Send landmark data to FastAPI backend
4. Backend ML model predicts ISL gesture
5. Convert gesture → sentence
6. Return response to frontend
7. Frontend displays text in real time
8. Use browser SpeechSynthesis API to speak output
9. Store conversation in Supabase database

---

# 🛠️ TECH STACK

## Frontend:

* React.js
* Tailwind CSS
* Axios
* MediaPipe Hands (for landmark detection)
* SpeechSynthesis API

## Backend:

* FastAPI (Python)
* scikit-learn (Random Forest / SVM model preferred)

## Database:

* Supabase (PostgreSQL)

## Deployment:

* Frontend: Vercel
* Backend: Local / ngrok for demo

---

# 🤖 AI MODEL REQUIREMENTS

Use MediaPipe hand landmarks (21 keypoints per frame) as input features.

Train a lightweight classifier for ISL gestures such as:

* HELLO
* THANK YOU
* HELP
* WATER
* FOOD
* YES
* NO
* STOP
* EMERGENCY
* DOCTOR
* PAIN
* I NEED HELP

Backend output format:

```json
{
  "gesture": "HELP",
  "sentence": "I need help",
  "confidence": 0.92
}
```

---

# 🔄 SYSTEM ARCHITECTURE FLOW

Frontend:

* Capture webcam feed
* Extract MediaPipe landmarks
* Send data to backend API every 300–500ms

Backend:

* Receive landmark array
* Run ML prediction
* Return gesture + sentence + confidence

Frontend:

* Display detected text in real time
* Speak sentence using SpeechSynthesis API
* Save conversation to Supabase

---

# 🗄️ SUPABASE DATABASE

Table: conversations

Fields:

* id (uuid, primary key)
* gesture (text)
* sentence (text)
* confidence (float)
* timestamp (datetime)

---

# 🎨 UI/UX DESIGN REQUIREMENTS (IMPORTANT)

Design must follow **Apple Accessibility Style**:

## Visual Style:

* Clean, minimal, light or soft dark mode
* No neon, no cyberpunk, no heavy gradients
* Soft shadows, blur glass panels
* Large rounded corners (12–20px)
* High readability and contrast

## Layout:

* Top bar: “HearMe” + status indicator
* Center: live webcam feed with hand tracking overlay
* Below camera:

  * Detected text (large font)
  * Confidence bar (smooth animation)
  * Speech toggle button
* Bottom:

  * Conversation history panel (scrollable)

## UX Principles:

* Real-time updates
* Smooth fade/slide transitions
* Accessibility-first design
* Large readable typography (SF Pro / Inter)
* Minimal clutter

---

# 🔊 SPEECH FEATURE

Use browser SpeechSynthesis API:

* Auto speak detected sentences
* Toggle speech ON/OFF
* Support English (en-IN)

---

# 🚨 ADVANCED FEATURES (FOR HACKATHON WINNING)

## 1. Emergency Mode

If gesture = HELP / EMERGENCY / DOCTOR:

* Show subtle red emergency banner
* Highlight UI state
* Optional alert sound

---

## 2. Sentence Builder Logic

Combine gestures into meaningful sentences:

* HELP + WATER → “I need water”
* PAIN + DOCTOR → “I need a doctor”

---

## 3. Multi-language Output (optional)

* English → Hindi
* English → Marathi

---

## 4. Confidence Visualization

* Animated progress bar
* Color transitions based on confidence level

---

# 🧾 BACKEND API

Endpoint:

```
POST /predict
```

Input:

```json
{
  "landmarks": [x1, y1, x2, y2, ...]
}
```

Output:

```json
{
  "gesture": "HELP",
  "sentence": "I need help",
  "confidence": 0.92
}
```

---

# 🏆 FINAL GOAL

The final product should:

* Work in real time
* Feel like a production-grade accessibility tool
* Demonstrate AI + Computer Vision + Full-stack integration
* Have a polished Apple-level UI
* Be demo-ready for hackathons
* Solve a real accessibility problem in India

