/**
 * App-wide state store.
 * Tracks model loading, online status, and global app state.
 */
import { create } from 'zustand';

export type ModelStatus = 'not_downloaded' | 'downloading' | 'loading' | 'ready' | 'error';

interface AppState {
  // ── Model Status ────────────────────────────────────────────────
  modelStatus: ModelStatus;
  modelDownloadProgress: number; // 0-1
  activeModel: string | null;
  routerStatus: ModelStatus;
  brainStatus: ModelStatus;
  isSwapping: boolean;

  // ── Network ─────────────────────────────────────────────────────
  isOnline: boolean;

  // ── App Lifecycle ───────────────────────────────────────────────
  isAppReady: boolean;
  isOnboarded: boolean;

  // ── Actions ─────────────────────────────────────────────────────
  setModelStatus: (status: ModelStatus) => void;
  setModelDownloadProgress: (progress: number) => void;
  setActiveModel: (model: string | null) => void;
  setRouterStatus: (status: ModelStatus) => void;
  setBrainStatus: (status: ModelStatus) => void;
  setIsSwapping: (swapping: boolean) => void;
  setIsOnline: (online: boolean) => void;
  setIsAppReady: (ready: boolean) => void;
  setIsOnboarded: (onboarded: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  modelStatus: 'not_downloaded',
  modelDownloadProgress: 0,
  activeModel: null,
  routerStatus: 'not_downloaded',
  brainStatus: 'not_downloaded',
  isSwapping: false,
  isOnline: false,
  isAppReady: false,
  isOnboarded: false,

  // Actions
  setModelStatus: (status) => set({ modelStatus: status }),
  setModelDownloadProgress: (progress) => set({ modelDownloadProgress: progress }),
  setActiveModel: (model) => set({ activeModel: model }),
  setRouterStatus: (status) => set({ routerStatus: status }),
  setBrainStatus: (status) => set({ brainStatus: status }),
  setIsSwapping: (swapping) => set({ isSwapping: swapping }),
  setIsOnline: (online) => set({ isOnline: online }),
  setIsAppReady: (ready) => set({ isAppReady: ready }),
  setIsOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
}));
