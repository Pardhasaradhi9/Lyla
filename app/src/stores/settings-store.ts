/**
 * Settings state store.
 * User preferences: model selection, voice settings, theme.
 */
import { create } from 'zustand';

interface SettingsState {
  // ── Model ───────────────────────────────────────────────────────
  selectedModel: 'primary' | 'speed';
  enableThinking: boolean;

  // ── Voice ───────────────────────────────────────────────────────
  autoPlayTTS: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsLanguage: string;

  // ── Privacy ─────────────────────────────────────────────────────
  memoryEnabled: boolean;

  // ── Actions ─────────────────────────────────────────────────────
  setSelectedModel: (model: 'primary' | 'speed') => void;
  setEnableThinking: (enable: boolean) => void;
  setAutoPlayTTS: (autoPlay: boolean) => void;
  setTTSRate: (rate: number) => void;
  setTTSPitch: (pitch: number) => void;
  setTTSLanguage: (language: string) => void;
  setMemoryEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  selectedModel: 'primary',
  enableThinking: false,
  autoPlayTTS: false,
  ttsRate: 0.9,
  ttsPitch: 1.0,
  ttsLanguage: 'en-US',
  memoryEnabled: true,

  setSelectedModel: (model) => set({ selectedModel: model }),
  setEnableThinking: (enable) => set({ enableThinking: enable }),
  setAutoPlayTTS: (autoPlay) => set({ autoPlayTTS: autoPlay }),
  setTTSRate: (rate) => set({ ttsRate: rate }),
  setTTSPitch: (pitch) => set({ ttsPitch: pitch }),
  setTTSLanguage: (language) => set({ ttsLanguage: language }),
  setMemoryEnabled: (enabled) => set({ memoryEnabled: enabled }),
}));
