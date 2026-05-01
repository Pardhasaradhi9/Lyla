/**
 * Settings state store.
 * User preferences: model selection, voice settings, theme.
 */
import { create } from 'zustand';

interface SettingsState {
  // ── Model ───────────────────────────────────────────────────────
  selectedModel: 'primary' | 'speed';

  // ── Voice ───────────────────────────────────────────────────────
  autoPlayTTS: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsLanguage: string;

  // ── Privacy ─────────────────────────────────────────────────────
  memoryEnabled: boolean;

  // ── Actions ─────────────────────────────────────────────────────
  setSelectedModel: (model: 'primary' | 'speed') => void;
  setAutoPlayTTS: (autoPlay: boolean) => void;
  setTTSRate: (rate: number) => void;
  setTTSPitch: (pitch: number) => void;
  setTTSLanguage: (language: string) => void;
  setMemoryEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  selectedModel: 'primary',
  autoPlayTTS: false,
  ttsRate: 0.9,
  ttsPitch: 1.0,
  ttsLanguage: 'en-US',
  memoryEnabled: true,

  setSelectedModel: (model) => set({ selectedModel: model }),
  setAutoPlayTTS: (autoPlay) => set({ autoPlayTTS: autoPlay }),
  setTTSRate: (rate) => set({ ttsRate: rate }),
  setTTSPitch: (pitch) => set({ ttsPitch: pitch }),
  setTTSLanguage: (language) => set({ ttsLanguage: language }),
  setMemoryEnabled: (enabled) => set({ memoryEnabled: enabled }),
}));
