# DocuMind Model Profiles & Inference Guide

DocuMind uses freely available open-weight models from Hugging Face for all embeddings, reranking, and local generation.

---

## 1. Configurable Profiles

### A. Laptop Profile (Default Development Target)
- **Target Hardware**: 8 – 16 GB RAM developer machine (Standard laptop / CPU only)
- **Embedding Model**: `BAAI/bge-small-en-v1.5`
  - Vector Dimension: `384`
  - Maximum Tokens: `512`
  - Query Instruction Prefix: `"Represent this sentence for searching relevant passages: "`
  - Normalization: L2 normalized
- **LLM**: `Qwen/Qwen2.5-3B-Instruct` (or verified 4-bit CPU quantization / llama.cpp)
- **Reranking**: Disabled initially to minimize CPU thread contention and RAM usage.
- **Context Window**: 4,096 tokens

### B. Quality Profile
- **Target Hardware**: 16 – 24 GB RAM / Dedicated GPU (NVIDIA RTX 3060+ or Apple Silicon)
- **Embedding Model**: `BAAI/bge-m3`
  - Vector Dimension: `1024`
  - Maximum Tokens: `8192`
  - Multi-lingual capability across 100+ languages
- **Reranker Model**: `BAAI/bge-reranker-v2-m3`
  - Cross-entropy scoring across top candidate chunks
- **LLM**: `Qwen/Qwen2.5-7B-Instruct`
- **Context Window**: 8,192 tokens

### C. Cloud Demonstration Adapter (Strictly Opt-In)
- **Target**: Cloud test environments with zero local RAM impact
- **Provider**: GitHub Models (e.g., `gpt-4o-mini`)
- **Activation**: Requires an administrator to explicitly check "Enable Cloud Adapter" in the System Settings page.
- **Security Notice**: Clear visual warning alerts users that document prompts leave the private host.

---

## 2. Vector Index Separation & Controlled Reindexing

Because embedding models project text into distinct vector dimensions (`384` vs `1024`), DocuMind enforces strict partition rules:
1. Every chunk stores its originating `embedding_model` and `embedding_dim`.
2. Vector retrieval queries only search chunks matching the active profile's model.
3. Switching profiles from **Laptop** to **Quality** triggers a controlled reindexing workflow (`POST /api/v1/admin/reindex`), re-encoding existing documents without conflating index dimensions.

---

## 3. Grounding & Anti-Hallucination Prompts

All queries utilize non-thinking generation:
- No internal chain-of-thought traces are exposed to end users.
- Material factual claims require bracketed references `[1]`, `[2]`.
- If evidence is absent, the system outputs: *"I couldn't find this information in the selected documents."*
