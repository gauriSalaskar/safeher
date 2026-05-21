import { create } from 'zustand'
import type { SOSState, LocationState, AppSettings } from '@/types'

interface SOSStore {
  sos: SOSState
  location: LocationState | null
  settings: AppSettings
  timerSeconds: number

  activateSOS: (triggerType: SOSState['triggerType']) => void
  deactivateSOS: () => void
  setLocation: (loc: LocationState) => void
  setAlertId: (id: string) => void
  updateSOSState: (update: Partial<SOSState>) => void
  incrementTimer: () => void
  resetTimer: () => void
  updateSettings: (settings: Partial<AppSettings>) => void
}

const defaultSOS: SOSState = {
  isActive: false,
  locationShared: false,
  smsSent: false,
  recordingActive: false,
}

const defaultSettings: AppSettings = {
  silentMode: true,
  shakeDetection: true,
  shakeThreshold: 15,
  aiKeywordDetection: true,
  language: 'en',
  theme: 'dark',
  lowBatteryMode: false,
  accessibilityMode: false,
}

export const useSOSStore = create<SOSStore>((set) => ({
  sos: defaultSOS,
  location: null,
  settings: defaultSettings,
  timerSeconds: 0,

  activateSOS: (triggerType) =>
    set((state) => ({
      sos: { ...state.sos, isActive: true, startTime: new Date(), triggerType },
      timerSeconds: 0,
    })),

  deactivateSOS: () =>
    set({ sos: defaultSOS, timerSeconds: 0 }),

  setLocation: (loc) => set({ location: loc }),

  setAlertId: (id) =>
    set((state) => ({ sos: { ...state.sos, alertId: id } })),

  updateSOSState: (update) =>
    set((state) => ({ sos: { ...state.sos, ...update } })),

  incrementTimer: () =>
    set((state) => ({ timerSeconds: state.timerSeconds + 1 })),

  resetTimer: () => set({ timerSeconds: 0 }),

  updateSettings: (settings) =>
    set((state) => ({ settings: { ...state.settings, ...settings } })),
}))
