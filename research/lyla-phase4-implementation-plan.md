# Lyla Phase 4: Intelligence & Performance Overhaul
**Goal:** Transition Lyla from a highly functional prototype into a blazing fast, highly intelligent, production-ready on-device Life OS. 

This phase eliminates routing latency via FastText, supercharges persistent memory via an LLM Extractor, and implements adaptive context windows.

---

## Step 1: FastText Classifier Integration (Routing Speed)
*Currently, Lyla uses a 229MB LLM to classify 27 intents, adding 1-2 seconds of latency per message. FastText will drop this latency to < 1ms and free up RAM.*

1. **Generate Training Data:**
   - Create a python script `scripts/train_fasttext.py`.
   - Generate synthetic training data for all 27 intents defined in `src/orchestrator/intent-classifier.ts`. We need ~100-200 variations per intent. Format: `__label__intent_name The user's query here`.
2. **Train & Quantize:**
   - Run the Facebook fastText CLI to train a supervised model.
   - Quantize the model using `fasttext quantize` to reduce the `.bin` size to ~2-5MB.
   - Place `lyla-router.ftz` into `app/assets/models/`.
3. **Native Bridge Integration:**
   - Install a React Native binding (e.g., `react-native-fast-text` or write a minimal C++ JSI binding if existing packages are outdated).
   - Modify `src/engines/router.ts`. Completely strip out the `llama.rn` logic and replace it with the FastText inference call.
   - Remove `MODELS.SPEED_LLM` from `utils/constants.ts` to prevent downloading the old 350M Router model.

---

## Step 2: Extraction Model Integration (Memory Intelligence)
*Currently, memory saves rely on brittle Regex. We will use the `LFM2-350M-Extract` model to intelligently parse free-form text and save JSON facts asynchronously.*

1. **Model Configuration:**
   - Add `LFM2-350M-Extract-Q4_K_M.gguf` to the `MODELS` constant.
   - Implement `src/engines/extractor.ts` using `llama.rn`. Set parameters: `n_predict: 256`, `temperature: 0.1`, and utilize Llama.cpp's JSON grammar enforcement if possible to guarantee structured output.
2. **Asynchronous Architecture:**
   - We MUST NOT block the UI or the main Brain model. 
   - In `src/orchestrator/index.ts`, implement a debounced observer. 5 seconds after a user sends a message, if the UI is idle, load the Extractor model into RAM.
3. **Prompt Engineering & DB Save:**
   - Feed the last 3 messages to the Extractor with the prompt: *"Extract permanent facts about the user from this conversation. Output strictly as JSON array: `[{ "entity": "...", "relation": "...", "fact": "..." }]`."*
   - Take the parsed JSON, run it through the Snowflake Arctic Embed model, and save it to `sqlite-vec` via `memoryRepository.addMemory()`.
   - Delete all old Regex logic from `device-handlers.ts`.

---

## Step 3: Adaptive Context Management (Token Optimization)
*Currently, Lyla enforces a hard 6000-character cutoff. This breaks narrative continuity. We need rolling summarization.*

1. **Context Window Monitor:**
   - In `src/orchestrator/index.ts`, monitor the total token/character count of the active `ConversationRow`.
   - Threshold trigger: When context exceeds 70% of max capacity.
2. **Background Summarization:**
   - Take the oldest 10 messages from the SQLite conversation thread.
   - Feed them to the 1.2B Brain model in the background with the prompt: *"Summarize the key context and facts of this conversation succinctly."*
   - Replace those 10 messages in SQLite with a single `system` message: `[System Summary of previous context: {summary}]`.
   - This ensures Lyla never "forgets" the start of a long conversation, but saves massive amounts of `n_ctx` space.

---

## Step 4: Production Polish & Auditing
*Final hardening before physical device deployment.*

1. **Performance Profiling:**
   - Run React Native Bundle Visualizer to strip out any unused massive JS libraries.
   - Audit `package.json` and remove development dependencies.
2. **Audio/TTS Hardening:**
   - In `chat.tsx`, ensure `expo-av` AudioSession is perfectly configured so that native device notifications or Spotify playback elegantly pause/duck when Lyla speaks, and resume afterward.
3. **App Store Readiness Checklist:**
   - Validate `app.json` for proper Info.plist permission strings (Camera, Mic, FaceID, Calendar, Contacts).
   - Run the final `python .agent/scripts/checklist.py .` audit. 
   - Execute a final physical iPhone test using `npx expo run:ios --configuration Release`.
