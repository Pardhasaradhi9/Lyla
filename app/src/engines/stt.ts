// @ts-ignore - The types from whisper.rn are not fully resolved by standard TS without building the lib
import { initWhisper, WhisperContext, releaseAllWhisper } from 'whisper.rn';

export interface STTEngine {
  isLoaded: boolean;
  init(modelPath: string): Promise<void>;
  transcribe(audioPath: string): Promise<string>;
  release(): Promise<void>;
}

class WhisperSTTEngine implements STTEngine {
  isLoaded = false;
  private context: WhisperContext | null = null;

  async init(modelPath: string): Promise<void> {
    if (this.isLoaded && this.context) return;
    
    try {
      this.context = await initWhisper({
        filePath: modelPath,
        useGpu: true,
      });
      this.isLoaded = true;
      console.log('Whisper STT engine initialized');
    } catch (error) {
      console.error('Failed to initialize Whisper STT:', error);
      throw error;
    }
  }

  async transcribe(audioPath: string): Promise<string> {
    if (!this.isLoaded || !this.context) {
      throw new Error('STT Engine not initialized');
    }

    try {
      // Return the raw text result from the transcription
      const { promise } = this.context.transcribe(audioPath, {
        language: 'en',
        maxLen: 1,
        tokenTimestamps: false,
      });
      const result = await promise;
      return result.result.trim();
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  }

  async release(): Promise<void> {
    await releaseAllWhisper();
    this.context = null;
    this.isLoaded = false;
  }
}

export const sttEngine: STTEngine = new WhisperSTTEngine();
