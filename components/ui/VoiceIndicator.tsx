// components/ui/VoiceIndicator.tsx
// Place this alongside StatusBar.tsx in /components/ui/
// Shows a subtle animated mic icon when voice detection is active

'use client';

import { useState, useEffect } from 'react';

interface VoiceIndicatorProps {
  isActive: boolean;
  className?: string;
}

export function VoiceIndicator({ isActive, className = '' }: VoiceIndicatorProps) {
  const [pulse, setPulse] = useState(false);

  // Subtle pulse every 2s to show it's alive
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 ${className}`}
      title="Voice keyword detection active"
    >
      {/* Animated mic icon */}
      <div className="relative flex items-center justify-center w-4 h-4">
        {/* Pulse ring */}
        <span
          className={`absolute inset-0 rounded-full bg-red-500/40 transition-transform duration-1000 ${
            pulse ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
          }`}
        />
        {/* Mic SVG */}
        <svg
          className="w-3 h-3 text-red-400 relative z-10"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2zm7 9a1 1 0 0 1 1 1 8 8 0 0 1-7 7.938V23h-2v-2.062A8 8 0 0 1 4 13a1 1 0 1 1 2 0 6 6 0 1 0 12 0 1 1 0 0 1 1-1z" />
        </svg>
      </div>

      <span className="text-[10px] text-white/60 font-medium tracking-wide">
        LISTENING
      </span>
    </div>
  );
}
