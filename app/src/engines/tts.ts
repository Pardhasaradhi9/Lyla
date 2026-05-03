import * as Speech from 'expo-speech';

export function speak(
  text: string,
  options?: {
    language?: string;
    pitch?: number;
    rate?: number;
    onDone?: () => void;
  },
): void {
  Speech.speak(text, {
    language: options?.language ?? 'en-US',
    pitch: options?.pitch ?? 1.0,
    rate: options?.rate ?? 0.9,
    onDone: options?.onDone,
    onStopped: options?.onDone,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
