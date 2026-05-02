import * as ExpoDevice from 'expo-device';
import { llmEngine } from './llm';
import { routerEngine } from './router';
import { MODELS, LLM_CONFIG } from '@/utils/constants';
import { modelExists, getModelPath } from '@/utils/model-manager';

export type ActiveModel = 'none' | 'router' | 'brain';

export interface DeviceProfile {
  totalMemoryMB: number;
  brainQuant: 'Q4_K_M' | 'Q6_K';
  canLoadBoth: boolean;
}

let _profile: DeviceProfile | null = null;

export async function getDeviceProfile(): Promise<DeviceProfile> {
  if (_profile) return _profile;

  let totalMemoryMB = 4096;
  try {
    if (ExpoDevice.totalMemory) {
      totalMemoryMB = Math.round(ExpoDevice.totalMemory / (1024 * 1024));
    }
  } catch {}

  const canLoadBoth = totalMemoryMB >= 7168;
  const brainQuant = totalMemoryMB >= 6144 ? 'Q6_K' : 'Q4_K_M';

  _profile = {
    totalMemoryMB,
    brainQuant,
    canLoadBoth,
  };

  console.log(`[ModelSwapper] Device profile: ${totalMemoryMB}MB, brain=${brainQuant}, both=${canLoadBoth}`);
  return _profile;
}

export async function loadRouter(): Promise<void> {
  const fileName = MODELS.SPEED_LLM.fileName;
  if (!(await modelExists(fileName))) {
    throw new Error(`Router model not downloaded: ${fileName}`);
  }
  const path = await getModelPath(fileName);
  await routerEngine.init(path);
  console.log('[ModelSwapper] Router loaded');
}

export async function loadBrain(): Promise<void> {
  const profile = await getDeviceProfile();
  const fileName = profile.brainQuant === 'Q6_K'
    ? MODELS.PRIMARY_LLM.fileName
    : MODELS.PRIMARY_LLM.fileName;

  if (!(await modelExists(fileName))) {
    throw new Error(`Brain model not downloaded: ${fileName}`);
  }
  const path = await getModelPath(fileName);
  await llmEngine.init(path);
  console.log('[ModelSwapper] Brain loaded');
}

export async function ensureRouterLoaded(): Promise<void> {
  if (routerEngine.isLoaded) return;
  await loadRouter();
}

export async function swapToBrain(): Promise<void> {
  const profile = await getDeviceProfile();

  if (!profile.canLoadBoth && routerEngine.isLoaded) {
    await routerEngine.release();
    console.log('[ModelSwapper] Router released (swap)');
  }

  if (!llmEngine.isLoaded) {
    await loadBrain();
  }
}

export async function swapToRouter(): Promise<void> {
  const profile = await getDeviceProfile();

  if (!profile.canLoadBoth && llmEngine.isLoaded) {
    await llmEngine.release();
    console.log('[ModelSwapper] Brain released (swap)');
  }

  if (!routerEngine.isLoaded) {
    await loadRouter();
  }
}

export async function releaseAll(): Promise<void> {
  if (llmEngine.isLoaded) await llmEngine.release();
  if (routerEngine.isLoaded) await routerEngine.release();
}

export function getActiveModel(): ActiveModel {
  if (llmEngine.isLoaded) return 'brain';
  if (routerEngine.isLoaded) return 'router';
  return 'none';
}
