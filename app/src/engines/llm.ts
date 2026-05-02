/**
 * LLM Engine — llama.rn Wrapper
 *
 * Handles model initialization, streaming text completion,
 * and context lifecycle management.
 *
 * Phase 2 implementation.
 */

import { initLlama, LlamaContext } from 'llama.rn';
import { APP, LLM_CONFIG } from '@/utils/constants';
import { SYSTEM_PROMPT } from '@/utils/system-prompt';

export interface LLMEngine {
  isLoaded: boolean;
  context: LlamaContext | null;
  init(modelPath: string): Promise<void>;
  complete(messages: Array<{ role: string; content: string }>, onToken: (token: string) => void, systemPrompt?: string): Promise<string>;
  release(): Promise<void>;
}

/**
 * llama.rn LLM engine implementation.
 * Initializes the model with GPU acceleration and handles streaming text generation.
 */
export const llmEngine: LLMEngine = {
  isLoaded: false,
  context: null,

  async init(modelPath: string): Promise<void> {
    if (this.context) {
      await this.release();
    }

    try {
      this.context = await initLlama({
        model: modelPath,
        use_mlock: LLM_CONFIG.use_mlock,
        n_ctx: LLM_CONFIG.n_ctx,
        n_gpu_layers: LLM_CONFIG.n_gpu_layers,
      });
      this.isLoaded = true;
    } catch (error) {
      console.error('[LLMEngine] Failed to load model:', error);
      throw error;
    }
  },

  async complete(
    messages: Array<{ role: string; content: string }>,
    onToken: (token: string) => void,
    systemPrompt?: string,
  ): Promise<string> {
    if (!this.context) {
      throw new Error('LLM Context is not initialized');
    }

    const promptSys = systemPrompt ?? SYSTEM_PROMPT;

    // Convert OpenAI format to ChatML
    let prompt = '';
    
    // Inject system prompt if not present
    if (messages.length === 0 || messages[0].role !== 'system') {
      prompt += `<|im_start|>system\n${promptSys}<|im_end|>\n`;
    }

    for (const msg of messages) {
      prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
    }
    prompt += '<|im_start|>assistant\n';

    let result;
    try {
      result = await this.context.completion(
        {
          prompt,
          n_predict: LLM_CONFIG.max_tokens,
          temperature: LLM_CONFIG.temperature,
          top_k: LLM_CONFIG.top_k,
          penalty_repeat: LLM_CONFIG.repeat_penalty,
          stop: ['<|im_end|>', '<|im_start|>'],
        },
        (data) => {
          onToken(data.token);
        }
      );
    } catch (error) {
      console.error('[LLMEngine] Completion error:', error);
      if (error instanceof Error && (error.message.includes('context') || error.message.includes('memory') || error.message.includes('OOM'))) {
        return "I'm running low on context. Let's start a new conversation.";
      }
      throw error;
    }

    return result.text;
  },

  async release(): Promise<void> {
    if (this.context) {
      await this.context.release();
      this.context = null;
    }
    this.isLoaded = false;
  },
};
