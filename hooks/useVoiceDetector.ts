// hooks/useVoiceDetector.ts
// Drop this file into your /hooks folder alongside useShakeDetector.ts

import { useEffect, useRef, useCallback } from 'react';

// ─── Distress keywords (add more as needed) ───────────────────────────────────
const DISTRESS_KEYWORDS = [
  // English
  'help me', 'help', 'save me', 'emergency', 'danger',
  // Hindi / Marathi
  'bachao', 'madad karo', 'madad', 'mujhe bachao', 'help karo',
  // Marathi
  'wachwaa', 'mala wachwaa',
];

interface UseVoiceDetectorOptions {
  enabled: boolean;           // from settings toggle
  onKeywordDetected: () => void; // callback → trigger SOS
  sensitivity?: 'low' | 'medium' | 'high'; // how strict the match is
}

export function useVoiceDetector({
  enabled,
  onKeywordDetected,
  sensitivity = 'medium',
}: UseVoiceDetectorOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Match logic based on sensitivity ────────────────────────────────────────
  const checkForKeyword = useCallback(
    (transcript: string): boolean => {
      const lower = transcript.toLowerCase().trim();

      if (sensitivity === 'high') {
        // Exact keyword match
        return DISTRESS_KEYWORDS.some((kw) => lower === kw);
      } else if (sensitivity === 'medium') {
        // Transcript contains keyword as a word
        return DISTRESS_KEYWORDS.some((kw) => lower.includes(kw));
      } else {
        // Low sensitivity — fuzzy: starts with any keyword
        return DISTRESS_KEYWORDS.some(
          (kw) => lower.startsWith(kw) || lower.includes(kw)
        );
      }
    },
    [sensitivity]
  );

  // ─── Start listening ──────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    // Browser support check
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[SafeHer Voice] SpeechRecognition not supported on this browser.');
      return;
    }

    if (isListeningRef.current) return; // already running

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // ── Config ─────────────────────────────────────────────────────────────────
    recognition.continuous = true;        // keep listening non-stop
    recognition.interimResults = true;    // catch mid-sentence matches
    recognition.lang = 'hi-IN';          // Hindi-India (also catches English words)
    recognition.maxAlternatives = 3;      // check multiple interpretations

    // ── On result ──────────────────────────────────────────────────────────────
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        // Check all alternatives
        for (let j = 0; j < result.length; j++) {
          const transcript = result[j].transcript;
          console.log('[SafeHer Voice] Heard:', transcript); // remove in prod

          if (checkForKeyword(transcript)) {
            console.warn('[SafeHer Voice] 🚨 Distress keyword detected:', transcript);
            onKeywordDetected(); // ← triggers SOS
            return;
          }
        }
      }
    };

    // ── Auto-restart on end (browser stops after silence) ─────────────────────
    recognition.onend = () => {
      isListeningRef.current = false;
      if (enabled) {
        // Restart after 500ms to avoid rapid loops
        restartTimerRef.current = setTimeout(() => {
          startListening();
        }, 500);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are normal — restart silently
      if (event.error === 'no-speech' || event.error === 'aborted') {
        isListeningRef.current = false;
        return;
      }
      console.error('[SafeHer Voice] Error:', event.error);
      isListeningRef.current = false;
    };

    try {
      recognition.start();
      isListeningRef.current = true;
    } catch (err) {
      console.error('[SafeHer Voice] Failed to start:', err);
    }
  }, [enabled, checkForKeyword, onKeywordDetected]);

  // ─── Stop listening ───────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // prevent auto-restart
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
  }, []);

  // ─── Effect: start/stop based on `enabled` toggle ────────────────────────────
  useEffect(() => {
    if (enabled) {
      // Small delay so it doesn't fight with page load
      const timer = setTimeout(startListening, 1000);
      return () => {
        clearTimeout(timer);
        stopListening();
      };
    } else {
      stopListening();
    }
  }, [enabled, startListening, stopListening]);

  return {
    isListening: isListeningRef.current,
    stopListening,
    startListening,
  };
}
