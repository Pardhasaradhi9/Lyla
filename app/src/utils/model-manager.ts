/**
 * Model Manager — Download, Cache, and Switch GGUF Models
 *
 * Handles downloading models from HuggingFace, tracking progress,
 * and managing the models directory on the device.
 *
 * Uses the new Expo SDK 54 FileSystem API (Paths, File, Directory).
 */
import { Paths, File, Directory } from 'expo-file-system';

/**
 * Get the models directory (inside app's document directory).
 */
function getModelsDir(): Directory {
  return new Directory(Paths.document, 'models');
}

/**
 * Ensure the models directory exists.
 */
export function ensureModelsDir(): void {
  const dir = getModelsDir();
  if (!dir.exists) {
    dir.create();
  }
}

/**
 * Get a File reference for a model by filename.
 */
export function getModelFile(fileName: string): File {
  return new File(getModelsDir(), fileName);
}

/**
 * Get the full URI path for a model file.
 */
export function getModelPath(fileName: string): string {
  return getModelFile(fileName).uri;
}

/**
 * Check if a model file exists on disk.
 */
export function modelExists(fileName: string): boolean {
  return getModelFile(fileName).exists;
}

/**
 * Download a model file with progress tracking.
 * Uses expo/fetch + File.write for the new API.
 */
export async function downloadModel(
  url: string,
  fileName: string,
  onProgress: (progress: number) => void,
): Promise<string> {
  ensureModelsDir();
  const destination = getModelsDir();
  const targetFile = new File(destination, fileName);

  // Delete existing file if present (re-download scenario)
  if (targetFile.exists) {
    targetFile.delete();
  }

  try {
    // Use expo/fetch to download with progress-friendly approach
    const { fetch: expoFetch } = await import('expo/fetch');
    const response = await expoFetch(url);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const bytes = await response.bytes();
    targetFile.write(bytes);
    onProgress(1);

    return targetFile.uri;
  } catch (error) {
    // Fallback: try File.downloadFileAsync
    try {
      const output = await File.downloadFileAsync(url, destination);
      onProgress(1);
      // Move to correct filename if needed
      if (output.uri !== targetFile.uri) {
        output.move(targetFile);
      }
      return targetFile.uri;
    } catch {
      throw error; // Re-throw original error
    }
  }
}

/**
 * Delete a model file from disk.
 */
export function deleteModel(fileName: string): void {
  const file = getModelFile(fileName);
  if (file.exists) {
    file.delete();
  }
}

/**
 * Get the total size of all downloaded models in bytes.
 */
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
