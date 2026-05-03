/**
 * Identity Handler — Hardcoded responses for identity/limitations questions
 *
 * These responses NEVER go through the model.
 * Zero hallucination risk. The model literally cannot override these.
 *
 * Lyla's identity:
 * - Name: Lyla
 * - Tone: close friend
 * - Creator: PrepMyRez team
 * - Privacy: 100% on-device, offline-first
 * - Model: LFM 2.5 (1.2B parameters, text-only)
 */

import type { Intent } from './intent-classifier';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const IDENTITY_RESPONSES = [
  `Hey! I'm Lyla — your personal AI assistant that lives right here on your phone. Everything we talk about stays on your device, nothing goes to the cloud. What's up?`,
  `I'm Lyla! Think of me as a friend who happens to live in your phone. I run completely offline, so our conversations are 100% private. How can I help?`,
  `Lyla here! I'm your on-device AI — no cloud, no tracking, just us. What would you like to chat about?`,
];

const CREATOR_RESPONSES = [
  `I was built by the PrepMyRez team (prepmyrez.com) — they're a career acceleration platform. I'm part of their vision for truly private AI. I run entirely on your device, keeping your data yours.`,
  `The team behind PrepMyRez (prepmyrez.com) created me. They help people with career growth, and I'm their take on what a private AI assistant should be — one that runs locally on your phone with no data ever leaving your device.`,
];

const MODEL_INFO_RESPONSES = [
  `I'm powered by LFM 2.5, a compact 1.2 billion parameter model running entirely on your phone. I'm text-only — I work with words, not images or audio.

Here's the gist:
- Model: LFM 2.5 (1.2B parameters)
- Type: Text-only language model
- Runs: 100% on your device — no cloud, no API calls
- Built by: The PrepMyRez team (prepmyrez.com)
- Privacy: Everything stays on your phone

I'm best at conversations, brainstorming, writing help, and general knowledge. I can also check your battery, tell you the time, and look up device info natively without using the model at all.`,
  `Under the hood, I'm running LFM 2.5 — a 1.2B parameter model. I'm not GPT, not Claude, not Gemini — I'm Lyla, running locally on your device with no internet needed.

I'm text-only (no image or audio), but I'm designed to be a great conversationalist and helper. The tradeoff for running privately on your phone is that I'm smaller than cloud-based giants — but I'm honest about what I know and don't know.`,
];

const CAPABILITIES_RESPONSES = [
  `Here's what I can do right now:

Chat & brainstorm — Creative writing, explaining concepts, giving advice, having a conversation.

Remember things — Long-press any message to save it to my memory. I'll use it in future conversations.

Native device access — I can check the time (any timezone), battery level, and device info without using the model at all — instant and private.

Coming soon:
- Web search for real-time info
- Voice input and output
- Calendar and reminders
- Automatic fact extraction`,
];

const LIMITATIONS_RESPONSES = [
  `I believe in being upfront about what I can and can't do:

What I CAN do:
- Chat, brainstorm, explain concepts, give advice
- Help with writing, editing, and creative tasks
- Remember things you tell me (long-press to save)
- Check the time, battery level, and device info natively
- Answer questions based on my training knowledge

What I CAN'T do (yet):
- See or analyze images — I'm text-only
- Generate images or art
- Access real-time web data (web search coming soon)
- Set reminders or calendar events (coming soon)
- Listen to or process audio (voice input coming soon)

I'm a 1.2B parameter model running 100% on your phone. That means total privacy — no data ever leaves your device — but I'm smaller than cloud-based assistants. If I'm not sure about something, I'll tell you rather than guessing.`,
  `Here's what you should know about my limitations:

I'm text-only — I can't see images, generate pictures, or process audio directly. I also can't browse the web yet, but that's coming soon.

Being a smaller model (1.2B parameters), I'm not as powerful as cloud-based assistants, but I make up for it with complete privacy and offline access. Everything stays on your phone. I'm honest about uncertainty — if I don't know something, I'll say so rather than making it up.`,
];

const GREETING_RESPONSES = [
  `Hey! Good to see you. What's up?`,
  `Hi there! How's your day going?`,
  `Hey! What can I help you with today?`,
  `Hello! Ready when you are.`,
  `Hey! Nice to hear from you. What's on your mind?`,
  `Hi! How's everything going?`,
];

const FAREWELL_RESPONSES = [
  `See you later! Take care.`,
  `Bye! I'll be right here whenever you need me.`,
  `Catch you later! Have a good one.`,
  `Later! Don't be a stranger.`,
  `See ya! I'll be here when you get back.`,
];

const THANKS_RESPONSES = [
  `You're welcome! Let me know if you need anything else.`,
  `Happy to help! Anything else on your mind?`,
  `Anytime! That's what I'm here for.`,
  `No problem! What else can I help with?`,
];

const AGREEMENT_RESPONSES = [
  `Got it! Let me know if you need anything else.`,
  `Sure thing! I'm here if you need me.`,
  `Alright! Just say the word.`,
  `Cool! Anything else on your mind?`,
];

const DISMISSAL_RESPONSES = [
  `No worries! Let me know if you change your mind.`,
  `All good! I'm here whenever you need me.`,
  `Sure thing, no problem at all.`,
];

const PRAISE_RESPONSES = [
  `Thanks! That means a lot.`,
  `You're too kind! Happy to help.`,
  `Aw, thanks! I appreciate that.`,
  `That's sweet of you to say! I'm always here to help.`,
];

export function getIdentityResponse(intent: string, userMessage?: string): string | null {
  if (intent === 'identity_query' && userMessage) {
    const lower = userMessage.toLowerCase();
    if (/\b(built|created|made|developed|who (made|built|created|developed)|creator|team behind|company behind)\b/.test(lower)) {
      return pick(CREATOR_RESPONSES);
    }
    if (/\b(model|engine|lfm|parameter|under the hood|what model|what ai|what llm|which model|how do you work)\b/.test(lower)) {
      return pick(MODEL_INFO_RESPONSES);
    }
  }

  switch (intent) {
    case 'identity_query':
      return pick(IDENTITY_RESPONSES);
    case 'limitations_query':
    case 'limitations':
      return pick(LIMITATIONS_RESPONSES);
    case 'capabilities':
      return pick(CAPABILITIES_RESPONSES);
    case 'identity_creator':
      return pick(CREATOR_RESPONSES);
    case 'identity_model':
      return pick(MODEL_INFO_RESPONSES);
    case 'greeting':
      return pick(GREETING_RESPONSES);
    case 'farewell':
      return pick(FAREWELL_RESPONSES);
    case 'thanks':
      return pick(THANKS_RESPONSES);
    case 'agreement':
      return pick(AGREEMENT_RESPONSES);
    case 'dismissal':
      return pick(DISMISSAL_RESPONSES);
    case 'praise':
      return pick(PRAISE_RESPONSES);
    default:
      return null;
  }
}
