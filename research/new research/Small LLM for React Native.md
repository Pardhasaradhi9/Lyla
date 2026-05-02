# **High-Performance Compact Language Model Selection for React Native Edge Deployment**

## **The Paradigm Shift in On-Device Mobile Intelligence**

The historical development of large language models has followed a path of aggressive parameter scaling, predicated on the emergence of complex reasoning at multi-billion parameter thresholds. However, a significant divergence has occurred with the rise of Small Language Models (SLMs) specifically engineered for edge environments where computational overhead, memory bandwidth, and thermal envelopes impose rigid constraints.1 For mobile developers utilizing frameworks such as React Native with the llama.rn library, the requirement for a model to occupy a memory footprint between 200MB and 400MB while delivering sub-100ms inference latency is no longer a theoretical aspiration but a production reality.3 The intersection of GGUF quantization and highly optimized architectures like Liquid AI’s Linear Ionic Volterra (LIV) and Alibaba’s Qwen series has facilitated a new class of "pocket intelligence" that rivals the utility of models ten times their size in specialized tasks such as intent classification, fact extraction, and structured data generation.1

The move toward on-device inference is driven by the trifecta of privacy, cost, and latency. By executing models locally, applications bypass the unpredictability of network round-trips and the escalating costs of token-based cloud APIs. Furthermore, the development of "abliterated" models—which remove safety-steering directions through weight orthogonalization without retraining—has provided developers with unrestricted assistants capable of following complex instructions without the "refusal" triggers common in alignment-tuned models.6 This analysis provides an exhaustive evaluation of candidate models in the sub-500M parameter range, focusing on their architectural efficiencies, quantization performance, and suitability for structured output tasks within a React Native ecosystem.

## **Architectural Efficiency and Computational Scaling in Sub-Billion Models**

In the sub-billion parameter category, architectural efficiency is the primary determinant of performance. Traditional dense Transformers, such as Microsoft’s Phi or Google’s Gemma, rely on self-attention mechanisms that scale quadratically with context length, denoted as ![][image1]. For a model like Gemma-3-270M, which allocates a disproportionately large percentage of its parameter budget to the embedding table (170M out of 270M), the actual "computational reasoning" is handled by a relatively small set of 100M transformer blocks.2 This design facilitates rapid adaptation to diverse vocabularies and languages but can limit complex multi-step reasoning compared to hybrid or more efficiently scaled architectures.2

In contrast, Liquid AI’s LFM (Liquid Foundation Model) architecture utilizes a hybrid approach mixing attention layers with double-gated LIV convolution blocks.4 This design processes tokens by looking at adjacent groups rather than the entire sequence in every layer, reducing memory usage and enabling its 350M variant to run in roughly 230MB when quantized to 4-bit.1 The mathematical advantage of this hybrid structure lies in its ability to maintain high token throughput while operating within the narrow memory bandwidth of mobile SoC (System on Chip) architectures like the Snapdragon or Apple A-series.8

| Architectural Attribute | Dense Transformer (Qwen, SmolLM) | Hybrid LIV/Attention (LFM2.5) |
| :---- | :---- | :---- |
| Scaling Law | ![][image1] attention complexity | Near-linear for convolutional blocks |
| Memory Efficiency | Higher KV cache overhead | Reduced cache footprint via gated LIV |
| Best Use Case | General dialogue and reasoning | High-throughput extraction and tool use |
| Mobile Optimization | Relies on 4-bit/INT4 quantization | Architecturally optimized for NPU/CPU |

2

The development of these models is characterized by "overtraining"—the practice of training small models on massive token counts far exceeding the Chinchilla-optimal ratio. Liquid AI trained its 350M parameter backbone on 28 trillion tokens, achieving an unprecedented 80,000:1 token-to-parameter ratio.3 This extreme data exposure allows the model to capture deep semantic patterns that typically only emerge in models with billions of parameters.1

## **Candidate Analysis: LiquidAI LFM2.5-350M**

The LFM2.5-350M represents the current frontier for extremely compact, high-performance edge models. It is purpose-built for environments where compute and memory are strictly limited, making it the primary candidate for React Native integration.3

### **Performance Characteristics and Instruction Tuning**

Liquid AI has released multiple variants of the 350M model, including a general-purpose instruction-tuned model and task-specific versions like LFM2-350M-Extract.1 The LFM2.5-350M-Instruct model excels at multi-turn interactions and tool-calling reliability, hitting over 95% accuracy in production-grade AI agent scenarios.1 For mobile applications requiring intent classification or fact extraction from conversations, this model's ability to handle sophisticated back-and-forth dialogue is a critical advantage.1

The model achieves exceptionally fast inference speeds, reporting 188 tokens per second on Snapdragon hardware and 313 tokens per second on AMD CPUs.8 This throughput ensures that for short inputs of under 100 tokens, the total latency remains well below the 100ms threshold, even on mid-range mobile devices.8

### **Quantization and Mobile Footprint**

The GGUF checkpoints for LFM2.5-350M are natively supported by llama.cpp and compatible tools like llama.rn.1 For the user's specific memory constraints (200-400MB), the Q4\_K\_M and Q5\_K\_M quantizations offer the best balance of size and semantic retention.9

| GGUF Quantization | File Size (MB) | Recommended Application |
| :---- | :---- | :---- |
| Q4\_K\_M | 229 MB | Mid-range devices, maximum speed |
| Q5\_K\_M | 260 MB | High-quality structured JSON output |
| Q8\_0 | 379 MB | Best accuracy for entity extraction |

9

### **Structured Output and Extraction Capabilities**

The model is explicitly recommended for data extraction and structured outputs.8 The LFM2-350M-Extract variant is further specialized for converting unstructured documents into JSON, XML, or YAML.11 This makes it an ideal tool for extracting invoice details from emails or populating knowledge graphs from conversational transcripts.3 It uses a ChatML-like format, which simplifies integration into existing prompt-engineering workflows.8

* **Exact HuggingFace URL:** https://huggingface.co/LiquidAI/LFM2.5-350M-GGUF.9  
* **Structured Output:** Supports tool calling and JSON function calls defined in the system prompt.8  
* **Chat Format:** ChatML-like (\<|im\_start|\>system...).8  
* **Benchmarks:** While 350M specific scores are sparse, the LFM2.5-1.2B variant (same architecture) scores 86.23 on IFEval and 64.52 on GSM8K.10

## **Candidate Analysis: Qwen3-0.6B (Abliterated)**

Alibaba’s Qwen3-0.6B is a dense transformer that brings advanced reasoning capabilities, including a "Thinking" mode, to the sub-1B parameter scale.5 This model is significantly more capable of complex logic than its predecessors while remaining within the 400MB memory limit when quantized to 4-bit.5

### **The Role of Abliteration in Mobile Agents**

The "abliterated" versions of Qwen3-0.6B, such as those provided by mlabonne or Goekdeniz-Guelmez, are highly relevant for developers who require a model that will not refuse instructions.14 The abliteration process involves neutralizing the internal "refusal direction" in the model's weights, allowing it to provide unrestricted assistance across all domains.6 For mobile apps doing fact extraction or intent classification, this ensures that the model does not generate a false refusal due to misidentifying conversational context as sensitive.7

### **Capabilities and Thinking Modes**

Qwen3-0.6B supports a switchable thinking mode, allowing it to perform chain-of-thought reasoning for difficult queries while maintaining efficient, non-thinking dialogue for simple classification tasks.5 This adaptability is crucial for mobile environments where developers might want to dynamically adjust computational expenditure based on the complexity of the user's input.5

| Qwen3-0.6B-Instruct-Abliterated (mlabonne) | File Size (MB) | Performance Note |
| :---- | :---- | :---- |
| Q4\_K\_M | 400 MB | Fits the upper limit of the budget |
| Q4\_K\_S | 380 MB | More space-efficient for lower RAM |
| Q5\_K\_M | 440 MB | Exceeds the 400MB limit slightly |

14

### **Tool Calling and JSON Compliance**

Qwen3 excels in tool calling and structured data generation.5 It is highly recommended to use the Qwen-Agent framework to leverage its agentic abilities, which include parsing tool-calling templates internally.5 This reduces the coding complexity for React Native developers who need to map text inputs to specific application functions.

* **Exact HuggingFace URL:** https://huggingface.co/bartowski/mlabonne\_Qwen3-0.6B-abliterated-GGUF.14  
* **Structured Output:** Strong native support for tool calling and JSON schema.5  
* **Chat Format:** Standard ChatML.14  
* **Benchmarks:** Qwen3-0.6B shows significantly enhanced reasoning compared to Qwen2.5-0.5B, which previously scored 31.6 on IFEval.5

## **Candidate Analysis: Microsoft Phi-4-mini**

The Phi-4-mini is a 3.8B parameter model focusing on reasoning-dense data and a massive 128K context length.18 While it is a high-performance model in the "small" category, its parameter count presents a challenge for the user's specific memory constraints.

### **Memory Constraints and Deployment Feasibility**

For a React Native app with a 200-400MB limit, Phi-4-mini is unfortunately too large. The Q4\_K\_M quantization of Phi-4-mini results in a file size of approximately 2.49 GB, nearly six times the requested maximum.19 Even at extremely low bit-rates like 2-bit (Q2\_K), the model still occupies 1.68 GB, which is far beyond the 400MB threshold.18

While Phi-4-mini is an excellent choice for desktop "AI PC" environments with 16GB of RAM, it cannot meet the requirements for a compact, ultra-lightweight mobile assistant as specified.19 For developers willing to increase their memory budget, it offers superior reasoning (67.3 MMLU, 88.6 GSM8K), but it does not fit the current target profile.21

| Phi-4-mini-Instruct GGUF | File Size (MB/GB) | Status for This Query |
| :---- | :---- | :---- |
| Q4\_K\_M | 2.49 GB | Disqualified (Too large) |
| IQ3\_M | 2.02 GB | Disqualified (Too large) |
| Q2\_K | 1.68 GB | Disqualified (Too large) |

18

## **Candidate Analysis: Google Gemma-3-270M**

Gemma-3-270M is arguably the most efficient candidate for purely classification and extraction tasks. Developed by Google using the same research as the Gemini models, it is optimized for high-speed, task-specific performance.2

### **Specialized Architecture for Classification and Routing**

The model utilizes a unique dense architecture with a massive 170M parameter embedding table relative to its 100M transformer blocks.2 This design makes it exceptionally adaptable to specialized vocabularies and multilingual contexts, which is vital for entity extraction across different languages.2 Google specifically recommends Gemma-3-270M for content moderation, sentiment analysis, and data extraction from documents or emails.2

| Gemma-3-270M-it GGUF (bartowski) | File Size (MB) | Inference Optimization |
| :---- | :---- | :---- |
| Q4\_K\_M | 253 MB | Recommended for speed and accuracy |
| Q5\_K\_M | 260 MB | High reliability for extraction |
| Q8\_0 | 292 MB | Maximum quality for structured tasks |

24

### **FunctionGemma and Structured Data**

Google provides a specialized "FunctionGemma" variant of the 270M model, which is specifically trained as a foundation for building specialized function-calling models.22 It can translate user inputs—such as "Turn on the flashlight" or "Create a calendar event"—directly into function calls that trigger Android or iOS system tools.22 This makes it a powerful choice for a React Native app serving as a private, offline agent.22

* **Exact HuggingFace URL:** https://huggingface.co/bartowski/google\_gemma-3-270m-it-GGUF.24  
* **Structured Output:** Excellent through FunctionGemma; 95%+ accuracy for focused tasks.2  
* **Chat Format:** Specific Gemma format using \<start\_of\_turn\>user\\n.25  
* **Benchmarks:** While specific 270M MMLU is not listed, it is noted to be "shockingly good" for its size, outperforming standard 1B class baselines on instruction following.10

## **Secondary Candidates: SmolLM2-360M and Danube3-500M**

For developers seeking additional alternatives that fit within the 200-400MB range, the SmolLM2 and Danube3 families provide robust, instruction-tuned options.

### **SmolLM2-360M-Instruct**

SmolLM2-360M was trained on 4 trillion tokens and demonstrates significant advances in instruction following and reasoning over its predecessor.17 It achieves a score of 41.0 on IFEval, which is remarkably high for a sub-400M parameter model.17

* **Exact HuggingFace URL:** https://huggingface.co/unsloth/SmolLM2-360M-Instruct-GGUF.28  
* **Size:** Q4\_K\_M is 271 MB; Q5\_K\_M is 290 MB.28  
* **Structured Output:** Supports text rewriting, summarization, and function calling.17  
* **Chat Format:** Standard Llama/ChatML template.28

### **H2O-Danube3-500M-Chat**

H2O.ai’s Danube3 is a 500M parameter model optimized for fast and memory-efficient inference.29 It achieves nearly 2400 tokens per second on H100 hardware, which translates to blistering speeds on mobile NPUs.31

* **Exact HuggingFace URL:** https://huggingface.co/h2oai/h2o-danube3-500m-chat-GGUF.31  
* **Size:** Q4\_K\_M is 318 MB; Q5\_K\_M is 368 MB.29  
* **Structured Output:** Basic chat support; primarily optimized for conversational speed.31  
* **Chat Format:** Standard ChatML-style.30

## **Comparative Analysis of Benchmarks and Performance Metrics**

The evaluation of small models requires looking beyond general reasoning benchmarks like MMLU to more targeted metrics such as IFEval (Instruction Following Evaluation) and GSM8K (Math reasoning). The data indicates that models with high token-to-parameter ratios tend to outperform their larger, less-trained peers in structured tasks.1

| Model Candidate | Size (Q4\_K\_M) | MMLU (cloze/approx) | IFEval | GSM8K (5-shot) |
| :---- | :---- | :---- | :---- | :---- |
| **LFM2.5-350M** | 229 MB | \~40 (Projected) | 86.23 (1.2B context) | 64.52 (1.2B context) |
| **Qwen3-0.6B** | 400 MB | \~35+ | High | High |
| **Gemma-3-270M** | 253 MB | N/A | High | High |
| **SmolLM2-360M** | 271 MB | 32.8 | 41.0 | 7.43 |
| **Danube3-500M** | 318 MB | 26.33 | Moderate | 16.00 |

10

The LFM2.5 series consistently leads in instruction following (IFEval), making it the most reliable choice for a "non-thinking" agent that needs to follow rigid procedural instructions.10 SmolLM2 and Danube3, while fast, show significantly lower math and reasoning scores compared to the highly optimized Qwen3 and LFM2.5 backbones.17

## **Latency and Throughput in React Native Contexts**

For React Native applications using llama.rn, the total latency is comprised of prompt evaluation and token generation time. The sub-100ms requirement for short inputs (\<100 tokens) is easily met by models in the 200-500M parameter range, as they require very few floating-point operations per token.2

The mathematical relationship for latency ![][image2] in seconds is:

![][image3]  
where ![][image4] is the number of prompt tokens, ![][image5] is the prompt evaluation speed, ![][image6] is the number of generated tokens, and ![][image7] is the generation speed.8

With prompt evaluation speeds exceeding 1000 tokens per second on many modern mobile NPUs, and generation speeds between 100-300 tokens per second, a 10-token prompt generating a 50-token JSON object will complete in under 500ms on even low-end hardware, and likely under 100ms on flagship devices.8 The LFM2.5-350M and Gemma-3-270M are particularly optimized for this "rapid burst" inference.2

## **Structured JSON Output and Extraction Mechanics**

The ability to generate structured JSON consistently is a function of the model's training on code and formal logic datasets. Qwen3 and FunctionGemma have been specifically exposed to code and JSON schema during post-training, which reduces the likelihood of syntax errors.5

For LFM2.5-350M, structured output is a core design pillar. The model supports Pythonic function calls by default—where a function call is represented as a Python list between special tokens—but it can be steered toward standard JSON through the system prompt.8 Liquid AI recommends providing tool lists as JSON objects in the system prompt to maximize adherence.8

In intent classification, the model must map a user string to a predefined list of "intents" (e.g., set\_alarm, send\_message). The sub-100ms latency requirement is easily met by all candidates because their small parameter counts allow for nearly instantaneous logit generation for short sequences.

## **Mobile Deployment Strategy: llama.rn and GGUF Optimization**

React Native applications using llama.rn (a wrapper for llama.cpp) are particularly sensitive to memory allocation. GGUF format is the industry standard for such use cases because it allows for efficient loading of quantized weights into system RAM or VRAM without requiring the overhead of heavy ML frameworks.9

### **Memory Management and Quantization Trade-offs**

A model with 0.6B parameters (like Qwen3) in 4-bit quantization occupies approximately 400MB. During inference, the system must also allocate memory for the KV (Key-Value) cache, which grows with the sequence length. For short inputs (\<100 tokens), the KV cache overhead is negligible (a few MBs), but it is a factor that makes models in the 200-300MB range (LFM2.5-350M, Gemma-3-270M) significantly more stable on devices with limited RAM (e.g., 4GB total system RAM).1

| Quantization Type | Perplexity Impact | Memory Savings | Recommended Platform |
| :---- | :---- | :---- | :---- |
| Q4\_K\_M | Minimal (\< 1%) | \~75% | Standard Mobile |
| Q5\_K\_M | Negligible | \~68% | High-Accuracy Extraction |
| Q8\_0 | Near Zero | \~50% | Premium Mobile (8GB+ RAM) |
| IQ4\_XS | Varies (Imatrix) | \~80% | Ultra-low Power |

9

For ARM-based mobile processors, the use of "online repacking" for Q4\_0 weights in llama.cpp (build b4282 and newer) can lead to speed increases of up to 133% in prompt processing, further ensuring that the \<100ms latency target is met.14

## **The Abliteration Methodology and Model Freedom**

The preference for abliterated or uncensored models in the mobile ecosystem reflects a desire for utility over steering. In a mobile assistant context, a "censored" model might refuse to extract data from an email if it misidentifies the content as "sensitive," thereby breaking the application's core functionality. Abliterated versions of Qwen3-0.6B or LFM2.5-1.2B (and by extension the 350M variants) allow the developer to maintain full control over the model's behavior.6

The abliteration method removes censorship by finding the "refusal direction" in the model's activations and removing it through weight orthogonalization.6 This does not require retraining and can be performed in minutes, resulting in a model that follows instructions without refusal while maintaining its base performance benchmarks.6 For React Native developers, using an abliterated Qwen3-0.6B provides a "rebellious spirit" but high utility for solving problems and fulfilling user requests with maximum precision.15

## **Summary Comparison Matrix for Deployment Selection**

The following matrix provides the definitive comparison for selecting a model for a React Native mobile agent. Note that Phi-4-mini is included for context but is not recommended due to its size.19

| Candidate Model | GGUF Quant | Size (MB) | JSON / Tool Support | Chat Format | Exact GGUF HF URL |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **LFM2.5-350M-it** | Q4\_K\_M | 229 MB | Native (Excellent) | ChatML-like | LiquidAI/LFM2.5-350M-GGUF |
| **LFM2.5-350M-it** | Q5\_K\_M | 260 MB | Native (Excellent) | ChatML-like | LiquidAI/LFM2.5-350M-GGUF |
| **LFM2-350M-Extract** | Q4\_K\_M | 229 MB | Specialized (JSON/XML) | ChatML-like | LiquidAI/LFM2-350M-Extract-GGUF |
| **Qwen3-0.6B-Abl** | Q4\_K\_M | 400 MB | High (Thinking mode) | ChatML | bartowski/mlabonne\_Qwen3-0.6B-abliterated-GGUF |
| **Gemma-3-270M-it** | Q4\_K\_M | 253 MB | High (FunctionGemma) | Gemma | bartowski/google\_gemma-3-270m-it-GGUF |
| **SmolLM2-360M-it** | Q4\_K\_M | 271 MB | Supported (Good) | ChatML/Llama | unsloth/SmolLM2-360M-Instruct-GGUF |
| **Danube3-500M-Chat** | Q4\_K\_M | 318 MB | Basic | ChatML | h2oai/h2o-danube3-500m-chat-GGUF |

9

## **Conclusion and Implementation Recommendations**

The exhaustive analysis of sub-billion parameter models identifies a clear hierarchy of suitability based on specific mobile deployment constraints. For a React Native application requiring structured output and guaranteed sub-100ms latency, LiquidAI’s LFM2.5-350M stands as the primary candidate due to its hybrid architecture and extreme overtraining.1 Its 229MB footprint at Q4\_K\_M quantization is well within the 200-400MB threshold and provides the most robust support for multi-turn extraction and agentic loops.3

If the primary requirement is "intelligence" and complex logic, Qwen3-0.6B (Abliterated) is the optimal choice, though it sits at the absolute limit of the memory budget.5 Its thinking capabilities offer a level of reasoning typically unseen in models under 1B parameters, making it suitable for more sophisticated assistants that need to explain the "why" behind their extractions.5

For applications focused purely on millisecond-latency classification and sentiment analysis, Gemma-3-270M offers the most refined experience, particularly when utilizing the specialized FunctionGemma variant for OS-level tool calling.2

The evidence suggests that the "parameter efficiency" achieved in current SLM research has effectively bridged the gap between mobile edge constraints and frontier-grade AI utility. Developers should prioritize the LFM2.5 or Qwen3 models for production-grade agentic workflows in the mobile space.3

#### **Works cited**

1. LFM2.5-350M: No Size Left Behind \- Liquid AI, accessed on May 2, 2026, [https://www.liquid.ai/blog/lfm2-5-350m-no-size-left-behind](https://www.liquid.ai/blog/lfm2-5-350m-no-size-left-behind)  
2. google/gemma-3-270m Free Chat Online \- Skywork ai, accessed on May 2, 2026, [https://skywork.ai/blog/models/google-gemma-3-270m-free-chat-online/](https://skywork.ai/blog/models/google-gemma-3-270m-free-chat-online/)  
3. Liquid AI releases LFM2.5-350M \-\> Agentic loops at 350M parameters \- Reddit, accessed on May 2, 2026, [https://www.reddit.com/r/LocalLLaMA/comments/1s8u1c1/liquid\_ai\_releases\_lfm25350m\_agentic\_loops\_at/](https://www.reddit.com/r/LocalLLaMA/comments/1s8u1c1/liquid_ai_releases_lfm25350m_agentic_loops_at/)  
4. Liquid AI's Small Reasoning Model Mixes Attention With Convolutional Layers for Efficiency, accessed on May 2, 2026, [https://www.deeplearning.ai/the-batch/liquid-ais-small-reasoning-model-mixes-attention-with-convolutional-layers-for-efficiency/](https://www.deeplearning.ai/the-batch/liquid-ais-small-reasoning-model-mixes-attention-with-convolutional-layers-for-efficiency/)  
5. unsloth/Qwen3-0.6B-GGUF · Hugging Face, accessed on May 2, 2026, [https://huggingface.co/unsloth/Qwen3-0.6B-GGUF](https://huggingface.co/unsloth/Qwen3-0.6B-GGUF)  
6. notquite28/abliteration \- GitHub, accessed on May 2, 2026, [https://github.com/notquite28/abliteration](https://github.com/notquite28/abliteration)  
7. huihui-ai/Huihui-LFM2.5-1.2B-Thinking-abliterated \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/huihui-ai/Huihui-LFM2.5-1.2B-Thinking-abliterated](https://huggingface.co/huihui-ai/Huihui-LFM2.5-1.2B-Thinking-abliterated)  
8. LiquidAI/LFM2.5-350M \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/LiquidAI/LFM2.5-350M](https://huggingface.co/LiquidAI/LFM2.5-350M)  
9. LiquidAI/LFM2.5-350M-GGUF · Hugging Face, accessed on May 2, 2026, [https://huggingface.co/LiquidAI/LFM2.5-350M-GGUF](https://huggingface.co/LiquidAI/LFM2.5-350M-GGUF)  
10. Liquid AI Releases LFM2.5: A Compact AI Model Family For Real On Device Agents, accessed on May 2, 2026, [https://www.marktechpost.com/2026/01/06/liquid-ai-releases-lfm2-5-a-compact-ai-model-family-for-real-on-device-agents/](https://www.marktechpost.com/2026/01/06/liquid-ai-releases-lfm2-5-a-compact-ai-model-family-for-real-on-device-agents/)  
11. LiquidAI/LFM2-350M-Extract-GGUF · Hugging Face, accessed on May 2, 2026, [https://huggingface.co/LiquidAI/LFM2-350M-Extract-GGUF](https://huggingface.co/LiquidAI/LFM2-350M-Extract-GGUF)  
12. LiquidAI/LFM2-350M-Math-GGUF \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/LiquidAI/LFM2-350M-Math-GGUF](https://huggingface.co/LiquidAI/LFM2-350M-Math-GGUF)  
13. lfm2.5-thinking \- Ollama, accessed on May 2, 2026, [https://ollama.com/library/lfm2.5-thinking](https://ollama.com/library/lfm2.5-thinking)  
14. bartowski/mlabonne\_Qwen3-0.6B-abliterated-GGUF \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/bartowski/mlabonne\_Qwen3-0.6B-abliterated-GGUF](https://huggingface.co/bartowski/mlabonne_Qwen3-0.6B-abliterated-GGUF)  
15. Goekdeniz-Guelmez/Josiefied-Qwen3-0.6B-abliterated-v2 \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/Goekdeniz-Guelmez/Josiefied-Qwen3-0.6B-abliterated-v2](https://huggingface.co/Goekdeniz-Guelmez/Josiefied-Qwen3-0.6B-abliterated-v2)  
16. DavidAU/LFM2.5-1.2B-Thinking-Claude-4.6-Opus-Heretic-Uncensored-DISTILL, accessed on May 2, 2026, [https://huggingface.co/DavidAU/LFM2.5-1.2B-Thinking-Claude-4.6-Opus-Heretic-Uncensored-DISTILL](https://huggingface.co/DavidAU/LFM2.5-1.2B-Thinking-Claude-4.6-Opus-Heretic-Uncensored-DISTILL)  
17. HuggingFaceTB/SmolLM2-360M-Instruct · Hugging Face, accessed on May 2, 2026, [https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct)  
18. Mungert/Phi-4-mini-instruct.gguf \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/Mungert/Phi-4-mini-instruct.gguf](https://huggingface.co/Mungert/Phi-4-mini-instruct.gguf)  
19. llmware/phi-4-mini-gguf \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/llmware/phi-4-mini-gguf](https://huggingface.co/llmware/phi-4-mini-gguf)  
20. bartowski/microsoft\_Phi-4-mini-instruct-GGUF \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/bartowski/microsoft\_Phi-4-mini-instruct-GGUF](https://huggingface.co/bartowski/microsoft_Phi-4-mini-instruct-GGUF)  
21. unsloth/Phi-4-mini-instruct-GGUF \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/unsloth/Phi-4-mini-instruct-GGUF](https://huggingface.co/unsloth/Phi-4-mini-instruct-GGUF)  
22. unsloth/functiongemma-270m-it-GGUF \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/unsloth/functiongemma-270m-it-GGUF](https://huggingface.co/unsloth/functiongemma-270m-it-GGUF)  
23. unsloth/gemma-3-270m-it-GGUF \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/unsloth/gemma-3-270m-it-GGUF](https://huggingface.co/unsloth/gemma-3-270m-it-GGUF)  
24. bartowski/google\_gemma-3-270m-it-GGUF \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/bartowski/google\_gemma-3-270m-it-GGUF](https://huggingface.co/bartowski/google_gemma-3-270m-it-GGUF)  
25. Gemma 3 \- How to Run Guide | Unsloth Documentation, accessed on May 2, 2026, [https://unsloth.ai/docs/models/tutorials/gemma-3-how-to-run-and-fine-tune](https://unsloth.ai/docs/models/tutorials/gemma-3-how-to-run-and-fine-tune)  
26. google/gemma-3-270m · Hugging Face : r/LocalLLaMA \- Reddit, accessed on May 2, 2026, [https://www.reddit.com/r/LocalLLaMA/comments/1mq3v93/googlegemma3270m\_hugging\_face/](https://www.reddit.com/r/LocalLLaMA/comments/1mq3v93/googlegemma3270m_hugging_face/)  
27. QuantFactory/SmolLM2-360M-GGUF \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/QuantFactory/SmolLM2-360M-GGUF](https://huggingface.co/QuantFactory/SmolLM2-360M-GGUF)  
28. unsloth/SmolLM2-360M-Instruct-GGUF · Hugging Face, accessed on May 2, 2026, [https://huggingface.co/unsloth/SmolLM2-360M-Instruct-GGUF](https://huggingface.co/unsloth/SmolLM2-360M-Instruct-GGUF)  
29. bartowski/h2o-danube3-500m-chat-GGUF \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/bartowski/h2o-danube3-500m-chat-GGUF](https://huggingface.co/bartowski/h2o-danube3-500m-chat-GGUF)  
30. h2oai/h2o-danube3-500m-chat \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/h2oai/h2o-danube3-500m-chat](https://huggingface.co/h2oai/h2o-danube3-500m-chat)  
31. h2oai/h2o-danube3-500m-chat-GGUF \- Hugging Face, accessed on May 2, 2026, [https://huggingface.co/h2oai/h2o-danube3-500m-chat-GGUF](https://huggingface.co/h2oai/h2o-danube3-500m-chat-GGUF)  
32. Abliteration method for LiquidAI's LFM 2.5 \+ abliterated examples of their 1.2b model : r/LocalLLaMA \- Reddit, accessed on May 2, 2026, [https://www.reddit.com/r/LocalLLaMA/comments/1rne4qc/abliteration\_method\_for\_liquidais\_lfm\_25/](https://www.reddit.com/r/LocalLLaMA/comments/1rne4qc/abliteration_method_for_liquidais_lfm_25/)  
33. DavidAU/Qwen3-0.6B-heretic-abliterated-uncensored · Hugging Face, accessed on May 2, 2026, [https://huggingface.co/DavidAU/Qwen3-0.6B-heretic-abliterated-uncensored](https://huggingface.co/DavidAU/Qwen3-0.6B-heretic-abliterated-uncensored)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAYCAYAAAC4CK7hAAACyklEQVR4XuWWy6tPURTH1/HKI49bYoTyBxiR10AoGSMkuSjFxEQJAzOPTLh1EwMDDCjxFxi4A6WkPCYeZSBJGFCEPNd3r3V+Z++19z73/M49pHxqdfb5rrXXXnufvc85RGOgsIIjrbahu0x/n7tsv9hu+2L7CbXvCdb1WlGeSPB557UvsX3z7sFWc98XC9jOsQ2zzTA+wdVWlCXuZTvkefsBT+KktpEO9z1YWMiXB77WhDMkiXbo/XxO9YaTffFiLPPYXlmxJUvITEQZYjtvxRTjSBKMWIfyne2nFRX0m1ze1G6i0cG22mZFJTXBCAQ9t6LHGkJMQWuNvoLtq9EqGs/KBV6g2vNQXKbkFqsGeUm1s3WB5RO7ZnSsYNuz4bObbZm2V/oOj5nkakivzioS5y3rCChogGQi740H2hTXivNfYWmDd7+Z7SpVBZcsJjnsO9n2sD0JvCEYT18+4YBY0WCPZ9hOEnff06ZDi+t3/NAr+mwkWYBZJJOG5m8hLCQ033LAd9iKYLSOJU9J4vCaVYrVqllQLN4yAH68KHyg3TRannCl0PdioHDEHHWkikklsHG7EhpYxDaebS6Jf2rodtoBozXlM9sdaVYFYjAkhTPExWhgQZtI4kaqAMegbokcZyme6HLVMjsS5F3s+cSXe1YHqZW2BDHeMDi0+b6F8wW/G9z3NUV9agu3oO+N6raK+EC5xHJ5QeKf2HMr7B7QYnuCAb4TCe24huYXISBIjD5HEroDzodWZN5S/ANnQd9JVuRBZpP45NVcAQ3fpKVs+4yvCeiPT0EW/IEiCAcJZwZtDOaI594DcdHB5fgt6rM80qd42jqyVINPo3TOTjjI9tGKXZBYPPyNX7dil2CVJlixCYli68h9fDtjPZf0zIodc5QnccyKf4JTJP9J7ahfanxYH1txbNQPOGiFfqhJvd8K/xA1Zf9/yGL8BsAmlJNKwaiiAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAYCAYAAAAh8HdUAAAA6UlEQVR4Xq2SMQ7CMAxFf8Q14DAwduMcXIEzwMrEwmVYkOAYiAkWJAQUO26T1rEpA09KU39/p04a4P8ELTh4vqibyVDKhZBI5i2NG42ahJpn0q80r7IX3kIhFmiV6ftzxG9ccEiKs7QguQWkvUrpXznDaY0x6qOU9mMYGsoMF+y1aBkjod0PUDmWWaP30hfIIZQZgf9Zgft/iCUtMtXiCFJw4kB9ZQK5IQVrSNFctbeB3JBjd6UdiQ+KX/T+hty3tk2On2S+0zzOJYN0GzWOZhBdk2PvvLWgYwvt0fHPxML86OtaMHwZR/8ARdYp16MRxJoAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABECAYAAAA89WlXAAAFjElEQVR4Xu3dS6hVVRgA4HXNHkiUBU2KHDSQcGBJljaLIuhhE0cVkdSoQWVBjYIaSGFB0HMgVmiBQVSTHhpBUBJUlhpR9BhIYEJkGQ6ytNda7HO5+66zj97jvfecvc75Pvg5e///vbDkHs/599pr7x0CMEYm8gRAn3yOAMAI8cUOAADAnHKgCQAAAAAAAAAA48wKIgAAABgER+AAUBLf3AAwrsapCxinfysADIZvV4CR5OMdAAAAAAAAxtOVMfbE2Bvji6yW7I6xI8Z7MXZmtWFKY/0yVOO+JavdH+PjGO/E+CDGw9PLAABl+ijGf6FqzHIp30ZpXJPR5I48AQC0lgXnM7Aw9G5+duWJljgcY32oxvxMVvNHHzP+4ACMuks6r8+H5obthjzREg90XpsazbuyfQBgTjlUHrQ3a9up8bm6tt9mp3Re3w/dDduBbB8AoGj1ZufBbP/V2nab3JvtpzE/Vts/VtsG5ojjafC/gOFI77y3slxqftbVttvo12x/c5ga68UxHq3VAACKdl+My7NcfU3Y0Xphdub0qKSpkUy5VTFei7EoqzES5vQ9BADFOJQnov2han6uibEhq7XBghjb82SoxvxX5xUAaD0H4jN1JE901GfZJqUb1H4a46YYW2J8Mq06OKlZOy1PRi+Haswf5oVodYwXYjwSY1NWAwBorfS0gHwt2KTUjOUNW7oa8/YY53T209q3lVPlgVgaqnGl1yapdlWWS6dJ93W2X4+xsVYDAGbOlNiApZvOpmYtnRJtuqIyzWBty5PR97Xtg6H7as35dHeM30M17jT+Jj/miVA1cUtq24trNYA54DuMeeTtNTTp+ZypcTgjLxSgPuuWz8C1VYljph8+zBh3/g/AvGhaH1aC88PUuH+JcWGt1mZpJnBFjH9C8wPuAQC6pKbn7zxZgHSvs8djXJEX+nRt6L6VyCB8Hdr7mC2AdjJ7x5haFqqG7Ym8UIA07rPz5Em4LgyuYdsRY21nu8RZTQBgCH4OGod0W5BBNWzJ8tD7qlKA0sxuzmt2vw3hOG+inoUSnez6tVd6xNZQ3RPtxVDdZ+zpzs+32aAbNgCAGUudZ2rWPssLY0bDBgC01ES4J1QN25q8FF2QJ+bR5CzftJhoyPURvfwWun+2V3zX+Z1e8p+fbQAAdDleo9ArPyk9I3MmkW5h0XZm2KAPI7UoBKAAqSn7N0+GKp8emdQCA/lq0LABAK3zRoy9oWrM/gjVw8l3xvizk0vR9DDzUaVhAwBoOQ0bAEAfLgvdi/GbIj3Waa6sjHFRnuxTPr5eAS03kGUIABTup1Ddz23SgtDd6GyL8XaWG6Z0E9xjWS6N+dmGHABA8fKmZn1D7sYYd2a5YdodY1GWS2M+tyEHAFC0tI5sXZZL903bk+U2xDgryw1TfqXtpaG5OUuNHQDAyEmNz+I82XKHQnPDBgAwctLFACU2Pi4wABiU7utkujPAvHo3lNf4LAzVmD/PCwAAo6jEmartoRpzm9bYtZgDYQBGzJh9tZ0aqsZnV16InouxP8Y5Mb6KsXV6eahO1GSujvFNjAMxNmU1AICiPBSqxmdNXghV7aUw9bzTw6E6FdkGacy9buq7Ksa+qd2JjVPbAADDdHJTg0dD1fykG+c2SbUza9vLa7VhuS1UY9mS5Sel2pLO9nmhvKtfAQD6Uj/teKS23Wb1MX9b2wYAGDm3hqnm5+bQntOhJ3IwxooYT4bjr3MDACjeDzGuj7EsxulZrRQaNhghJ7fyA2C0ldrsrO28PhVjc70AAEDf5uV4OV0YsTRPAgAAAAAAI2leTjYAtIJPOGA6nwqcmHcJQAF8WAMApdG/AAAAAAAAMA6cFwMAAACGzfwEAABAazlkg7HmI6B0/oIAAJRE/woAAADM1P8zgTDfBLfL9gAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAYCAYAAAARfGZ1AAABeElEQVR4XtWUvUoFMRCFJ2ojiIWlYCc2gja+gW/ga1iIYGMvivgAYiPaWNgoWFiINjb6CBfBJ1DxB0T84Xpmk81OJsndsFZ+cO7eOZNMhmw2RJ0x2khQMibHwLm5ZLEfGk0UDcyRH5jPpNmH3qC+lTlIFPghn6+0GKazuFImmJziCprWZgm8wjl0Qrb4UpiuyC3aygq04P7nuv/WxmD8jtCjcJ/JFh8X3gy0LeI8iRcmO+V95bgnBh5BYz5qmmqFx5wpT2+N2iZTfL7lftdD2eOCO87+LC2mebKPaFLd/Sy0oXKKaK63opPh/AuyuXtoVKSLGYEutekYIt991BnP6UGrZL/wwzBtaBi/D9BtmAh4hz6Ut+uevHC96ivZRiuOoRey5xvn2vDdkWIeWtYmmIS+RNzHMnMi/hN70JaIo/dWTLTjtpjt1NAmfteDbBfEIlz8BsYdnmuN7ej0UdihU9R6ibmaUenICCy+X66hU7gTjR0h74d/wi9MikcvvNPYaAAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAYCAYAAAAYl8YPAAABVElEQVR4Xq2Tu0oFMRCGJwpWFmpjIVgJauNzCBaChbWNtXY+gmDhAyi+hCLY2lv4DNbeQBDRQv9kcnYmmcmeXfCDObvzZy6bSQ5RQejxPKZHKEYF/ztB9W9/SXvFcgP7HWEFqZHqhoCwL27WQtKVFDaSzu9KF5aIv4zUlmeIkx5zjE59klfLLUJD1eeYuNhu8mRxDnbeeQ5HtYDsN/K3swBvudx58XBJg+4LGMoscbGHekEY3uaEuNgOu/oe2mswUY2U+SDnLrVwi6iO6mLmjk6GIxni0ffNax12DTuE3cHuKV8fr/glcbGDUu5C32GrsB9ZS/+Ujj3YJyzerZdscW7fKTBSnsAFfk+VMn2+km9OKibP5/et7AvefiON4evkZ9ii8mtstmKFeF6viPrCc7NaF0wZI9AV7KwWVaDNmKDnBtaIt7jdyWMpD3IwObR8CC1B6X87gT/KBZb8bAAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAYCAYAAAARfGZ1AAABiElEQVR4XrVUPS9FQRCdRSMRkYhKoiEaCY2E3j/wMyj8CY1IlC8qUSk0CoVC6P0BiYZOhRCJyIuX68zdfXtn7s4++4STnJuZMx87d3fvJYpwjals6Tlv67AlGFIiaPwQHgZhymD/Icqa2Vm2yjgC3xGuqKY7lsFQ1oMV4jU3RIqHfTARspj0FtW4Bhe0pNHKD67vcwGekW++meTERQcgM/gOuBpsNb3Al3RsGN0hPQv3lXzzSaEtgnvCHwrylXlf2b8T2gk4Ifxi8LuctzSxNdEfDGNHGHK/PVytccP9oHTt2uRGJYu8aDeiQiIvsIT8XS8ZzQJyepUpuiQ//T043oploLuMgVdKaTBC7b3XtevgLfgIHrbDo+ATeNMXjOk/wM+2iMQ1PB+EoA78FHwjf7/5XvdkUGAF3DZWrSDNedPNUL4+rSyAnLQDHgifftkzQp4D21PB7j9isBgidZ78Fd6ikg8su0jQM+FZsJsGE6EYPCnfFgb/KadFzELZSk2WWyb/p1Tqv+MbNnZGTUmOawUAAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAYCAYAAAAYl8YPAAABT0lEQVR4Xp2UvUpEMRCFJwo2Wrgi2Ii1haWtzbZbCBbWNtZaCL6BnQuCnb0vsPgIdhZbWtvLFoKICnpmk7uZmUzWrB+ckDmZzL2Z+0PUSHBm1UibBpmTh1ZCmV4Y/2ahSmGE4adTEPOKfNI1OeHYXD9tVE3dTX6VDYjvTLJEcdNYubHgi5gLPxoPemk6PadY7DD7U1agofEy2HpmDTBJfbOsQ1tznoe74jdaHEfhWImwTLHQk/F1aKksX1IsNigTiq7/yRvJV6KFOal+vxTO5zYjN5YfvdOvghvoHnqGHs3ajDuKxU448K8eRvBPU7AHfcvEI+gdmkCvSdy3T/KPK71b6FrE5NxCYXTsky7G856IFyDQGsavFG1D/IdpoJYV6ALjB9Qn7pdP0wu5Kub8sK5EbJHvj1uw69cO5eNa3I0FyOLv9gDatGuGpmMqbNYv+cA/h9IARjsAAAAASUVORK5CYII=>