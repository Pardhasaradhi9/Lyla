/**
 * Model Manager — Download, Cache, and Switch GGUF Models
 *
 * Handles downloading models from HuggingFace, tracking progress,
 * and managing the models directory on the device.
 *
 * Uses the new Expo SDK 54 FileSystem API (Paths, File, Directory)
 * plus legacy createDownloadResumable for large file downloads with progress.
 */
import { Paths, File, Directory } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';

function getModelsDir(): Directory {
  return new Directory(Paths.document, 'models');
}

export function ensureModelsDir(): void {
  const dir = getModelsDir();
  if (!dir.exists) {
    dir.create();
  }
}

export function getModelFile(fileName: string): File {
  return new File(getModelsDir(), fileName);
}

export function getModelPath(fileName: string): string {
  return getModelFile(fileName).uri;
}

export function modelExists(fileName: string): boolean {
  return getModelFile(fileName).exists;
}

export async function downloadModel(
  url: string,
  fileName: string,
  onProgress: (progress: number) => void,
): Promise<string> {
  ensureModelsDir();
  const targetUri = `${getModelsDir().uri}${fileName}`;

  const existingFile = getModelFile(fileName);
  if (existingFile.exists) {
    existingFile.delete();
  }

  const callback = (downloadProgress: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
    if (downloadProgress.totalBytesExpectedToWrite > 0) {
      onProgress(downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite);
    }
  };

  const downloadResumable = createDownloadResumable(url, targetUri, {}, callback);

  const result = await downloadResumable.downloadAsync();
  if (!result || !result.uri) {
    throw new Error('Download failed: no result returned');
  }

  onProgress(1);
  return result.uri;
}

export function deleteModel(fileName: string): void {
  const file = getModelFile(fileName);
  if (file.exists) {
    file.delete();
  }
}

export function getModelsDiskUsage(): number {
  const dir = getModelsDir();
  if (!dir.exists) return 0;

  const items = dir.list();
  let totalSize = 0;

  for (const item of items) {
    if (item instanceof File && item.exists) {
      totalSize += item.size ?? 0;
    }
  }

  return totalSize;
}
