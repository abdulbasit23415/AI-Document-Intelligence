"""
DocuMind Core Constants & Configuration Definitions
"""

from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    QUEUED = "queued"
    PARSING = "parsing"
    OCR = "ocr"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    READY = "ready"
    FAILED = "failed"

class ExtractionType(str, Enum):
    CONTRACT = "contract_extraction"
    INVOICE = "invoice_extraction"
    SUMMARY = "summary"
    COMPARISON = "comparison"
    POLICY_QA = "policy_qa"

class ModelProfile(str, Enum):
    LAPTOP = "laptop"
    QUALITY = "quality"
    GITHUB_MODELS = "github_models"

MODEL_SPECS = {
    ModelProfile.LAPTOP: {
        "name": "Laptop Profile (Low-RAM / CPU optimized)",
        "embedding_model": "BAAI/bge-small-en-v1.5",
        "embedding_dim": 384,
        "reranker_model": None,
        "llm_name": "Qwen/Qwen2.5-3B-Instruct (4-bit CPU / quantized)",
        "context_window": 4096,
        "max_chunk_tokens": 500,
        "chunk_overlap": 50,
        "rerank_enabled": False,
        "target_ram": "8 - 12 GB",
    },
    ModelProfile.QUALITY: {
        "name": "Quality Profile (High accuracy)",
        "embedding_model": "BAAI/bge-m3",
        "embedding_dim": 1024,
        "reranker_model": "BAAI/bge-reranker-v2-m3",
        "llm_name": "Qwen/Qwen2.5-7B-Instruct (High Precision)",
        "context_window": 8192,
        "max_chunk_tokens": 800,
        "chunk_overlap": 100,
        "rerank_enabled": True,
        "target_ram": "16 - 24 GB / GPU",
    },
    ModelProfile.GITHUB_MODELS: {
        "name": "GitHub Models Demo Adapter (Cloud Opt-in)",
        "embedding_model": "BAAI/bge-small-en-v1.5",
        "embedding_dim": 384,
        "reranker_model": None,
        "llm_name": "github/gpt-4o-mini",
        "context_window": 8192,
        "max_chunk_tokens": 500,
        "chunk_overlap": 50,
        "rerank_enabled": False,
        "target_ram": "< 4 GB local",
        "cloud_export_warning": True
    }
}

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
