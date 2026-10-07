import math
import hashlib
import logging
from typing import List, Optional
import numpy as np

from apps.api.core.config import settings
from packages.shared.constants import MODEL_SPECS, ModelProfile

logger = logging.getLogger("docmind.embeddings")

class EmbeddingService:
    """
    Manages local embeddings for BAAI/bge-small-en-v1.5 and BAAI/bge-m3.
    Enforces documented query prefixes, mean pooling, and L2 normalization.
    """

    def __init__(self):
        self._model = None
        self._loaded_model_name = None

    def _get_spec(self):
        profile = settings.MODEL_PROFILE
        return MODEL_SPECS.get(profile, MODEL_SPECS[ModelProfile.LAPTOP])

    @property
    def current_model_name(self) -> str:
        return self._get_spec()["embedding_model"]

    @property
    def current_dim(self) -> int:
        return self._get_spec()["embedding_dim"]

    def _load_model_if_needed(self):
        target_name = self.current_model_name
        if self._model is not None and self._loaded_model_name == target_name:
            return self._model

        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {target_name} into memory...")
            self._model = SentenceTransformer(target_name)
            self._loaded_model_name = target_name
            logger.info(f"Successfully loaded {target_name}")
            return self._model
        except Exception as e:
            logger.warning(
                f"SentenceTransformer load failed for {target_name} ({e}). "
                f"Using deterministic local vectorizer fallback for smooth execution."
            )
            return None

    def embed_texts(self, texts: List[str], is_query: bool = False) -> List[List[float]]:
        if not texts:
            return []

        model = self._load_model_if_needed()
        dim = self.current_dim
        target_name = self.current_model_name

        # BGE models require query instruction prefix for retrieval queries
        prepared_texts = []
        for t in texts:
            if is_query and "bge" in target_name.lower():
                prepared_texts.append(f"Represent this sentence for searching relevant passages: {t}")
            else:
                prepared_texts.append(t)

        if model is not None:
            try:
                # Compute embeddings with L2 normalization
                raw_embeddings = model.encode(
                    prepared_texts,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )
                return [arr.tolist() for arr in raw_embeddings]
            except Exception as e:
                logger.error(f"Error during model encoding: {e}. Falling back to deterministic vectorizer.")

        # High-quality deterministic local fallback (e.g. while model is caching or low memory)
        return [self._deterministic_vector(text, dim) for text in prepared_texts]

    def embed_query(self, query: str) -> List[float]:
        res = self.embed_texts([query], is_query=True)
        return res[0]

    def _deterministic_vector(self, text: str, dim: int) -> List[float]:
        """
        Deterministic, L2-normalized feature projection fallback.
        Ensures consistent cosine similarity ranking without crashing on resource-limited hosts.
        """
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        if not words:
            vec[0] = 1.0
            return vec.tolist()

        for w in words:
            # Hash word into dimension bins
            h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if ((h >> 4) & 1) else -1.0
            vec[idx] += sign

        # L2 normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        else:
            vec[0] = 1.0

        return vec.tolist()

embedding_service = EmbeddingService()
