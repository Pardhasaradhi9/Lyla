/**
 * TTS Engine — expo-speech Wrapper
 *
 * Handles text-to-speech output using OS native voices.
 * Will be upgraded to Piper TTS in V2.
 *
 * Phase 5 implementation.
 */
import * as Speech from 'expo-speech';

/**
 * Speak text aloud using the device's native TTS.
 */
export function speak(
  text: string,
  options?: {
    language?: string;
    pitch?: number;
    rate?: number;
  }
): void {
  Speech.speak(text, {
    language: options?.language ?? 'en-US',
    pitch: options?.pitch ?? 1.0,
    rate: options?.rate ?? 0.9,
  });
}

/**
 * Stop any ongoing speech.
 */
export function stopSpeaking(): void {
  Speech.stop();
}

/**
 * Check if TTS is currently speaking.
 */
export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
