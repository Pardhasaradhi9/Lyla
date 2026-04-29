/**
 * STT Engine — whisper.rn Wrapper
 *
 * Handles voice-to-text transcription using on-device Whisper.
 *
 * Phase 5 implementation.
 */

export interface STTEngine {
  isLoaded: boolean;
  init(modelPath: string): Promise<void>;
  transcribe(audioPath: string): Promise<string>;
  release(): Promise<void>;
}

/**
 * Placeholder STT engine.
 * Will be replaced with actual whisper.rn integration in Phase 5.
 */
export const sttEngine: STTEngine = {
  isLoaded: false,

  async init(): Promise<void> {
    this.isLoaded = true;
  },

  async transcribe(): Promise<string> {
    return '';
  },

  async release(): Promise<void> {
    this.isLoaded = false;
  },
};
