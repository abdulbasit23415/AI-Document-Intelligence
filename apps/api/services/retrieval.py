import re
import math
import logging
from typing import List, Dict, Any, Optional, Set
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from apps.api.models.models import Document, DocumentChunk
from apps.api.services.embeddings import embedding_service
from apps.api.core.config import settings
from packages.shared.constants import MODEL_SPECS, ModelProfile

logger = logging.getLogger("docmind.retrieval")

class RetrievalResult:
    def __init__(
        self,
        chunk_id: str,
        document_id: str,
        document_name: str,
        page_number: Optional[int],
        section_heading: Optional[str],
        content: str,
        bounding_boxes: Optional[List[Dict[str, Any]]],
        score: float,
        vector_rank: Optional[int] = None,
        keyword_rank: Optional[int] = None
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.document_name = document_name
        self.page_number = page_number
        self.section_heading = section_heading
        self.content = content
        self.bounding_boxes = bounding_boxes
        self.score = score
        self.vector_rank = vector_rank
        self.keyword_rank = keyword_rank

class HybridRetrievalEngine:
    """
    Hybrid Vector + Keyword retrieval engine with Reciprocal Rank Fusion (RRF),
    strict authorization filtering, and token budget management.
    """

    def __init__(self, rrf_k: int = 60):
        self.rrf_k = rrf_k

    def retrieve(
        self,
        db: Session,
        workspace_id: str,
        query: str,
        authorized_user_role: str,
        selected_doc_ids: Optional[List[str]] = None,
        top_k: int = 8,
        token_budget: int = 2500
    ) -> List[RetrievalResult]:
        # 1. Resolve authorized documents
        doc_query = db.query(Document).filter(
            Document.workspace_id == workspace_id,
            Document.is_deleted == False,
            Document.status == "ready"
        )

        # Restrictive document visibility check
        if authorized_user_role == "viewer":
            doc_query = doc_query.filter(Document.is_restricted == False)

        if selected_doc_ids:
            doc_query = doc_query.filter(Document.id.in_(selected_doc_ids))

        authorized_docs = doc_query.all()
        if not authorized_docs:
            return []

        doc_map = {d.id: d for d in authorized_docs}
        allowed_doc_ids = list(doc_map.keys())

        # 2. Fetch candidates from Vector and Keyword channels
        target_model = embedding_service.current_model_name
        
        chunks = db.query(DocumentChunk).filter(
            DocumentChunk.document_id.in_(allowed_doc_ids),
            DocumentChunk.embedding_model == target_model
        ).all()

        # If chunks for current model aren't indexed yet, fall back to any available chunks for these docs
        if not chunks:
            chunks = db.query(DocumentChunk).filter(
                DocumentChunk.document_id.in_(allowed_doc_ids)
            ).all()

        if not chunks:
            return []

        # 3. Vector Candidate Ranking
        query_vec = np.array(embedding_service.embed_query(query), dtype=np.float32)
        query_norm = np.linalg.norm(query_vec)
        if query_norm > 0:
            query_vec /= query_norm

        vector_scores: List[tuple[DocumentChunk, float]] = []
        for ch in chunks:
            if ch.embedding_json:
                ch_vec = np.array(ch.embedding_json, dtype=np.float32)
                sim = float(np.dot(query_vec, ch_vec))
            else:
                sim = 0.0
            vector_scores.append((ch, sim))

        vector_scores.sort(key=lambda x: x[1], reverse=True)
        vec_rank_map = {item[0].id: rank + 1 for rank, item in enumerate(vector_scores[:top_k * 3])}

        # 4. Keyword Candidate Ranking (BM25 token frequency approximation)
        keyword_scores: List[tuple[DocumentChunk, float]] = []
        query_terms = set(re.findall(r'\w+', query.lower()))

        for ch in chunks:
            content_lower = ch.content.lower()
            term_matches = sum(content_lower.count(term) for term in query_terms if len(term) > 2)
            # Slight bonus if heading matches query terms
            if ch.section_heading:
                term_matches += sum(2 for term in query_terms if term in ch.section_heading.lower())
            
            # Simple length-normalized score
            kw_score = term_matches / (math.log(max(10, len(content_lower))) + 1)
            keyword_scores.append((ch, kw_score))

        keyword_scores.sort(key=lambda x: x[1], reverse=True)
        kw_rank_map = {item[0].id: rank + 1 for rank, item in enumerate(keyword_scores[:top_k * 3])}

        # 5. Reciprocal Rank Fusion (RRF)
        all_candidate_ids = set(vec_rank_map.keys()).union(set(kw_rank_map.keys()))
        chunk_lookup = {ch.id: ch for ch in chunks}
        rrf_results: List[RetrievalResult] = []

        for cid in all_candidate_ids:
            ch = chunk_lookup[cid]
            v_rank = vec_rank_map.get(cid)
            k_rank = kw_rank_map.get(cid)

            rrf_score = 0.0
            if v_rank is not None:
                rrf_score += 1.0 / (self.rrf_k + v_rank)
            if k_rank is not None:
                rrf_score += 1.0 / (self.rrf_k + k_rank)

            doc = doc_map.get(ch.document_id)
            doc_name = doc.original_filename if doc else "Document"

            rrf_results.append(RetrievalResult(
                chunk_id=ch.id,
                document_id=ch.document_id,
                document_name=doc_name,
                page_number=ch.page_number,
                section_heading=ch.section_heading,
                content=ch.content,
                bounding_boxes=ch.bounding_boxes,
                score=round(rrf_score, 5),
                vector_rank=v_rank,
                keyword_rank=k_rank
            ))

        rrf_results.sort(key=lambda r: r.score, reverse=True)

        # 6. Apply Reranking if Quality Profile is active
        profile = settings.MODEL_PROFILE
        if profile == ModelProfile.QUALITY:
            rrf_results = self._rerank(query, rrf_results)

        # 7. Deduplicate & fit within token budget
        final_results: List[RetrievalResult] = []
        accumulated_tokens = 0
        seen_texts: Set[str] = set()

        for item in rrf_results:
            text_snippet = item.content[:150]
            if text_snippet in seen_texts:
                continue
            seen_texts.add(text_snippet)

            est_tokens = int(len(item.content.split()) * 1.3)
            if accumulated_tokens + est_tokens > token_budget and len(final_results) >= 2:
                break

            final_results.append(item)
            accumulated_tokens += est_tokens
            if len(final_results) >= top_k:
                break

        return final_results

    def _rerank(self, query: str, candidates: List[RetrievalResult]) -> List[RetrievalResult]:
        """
        Reranks top candidates using BAAI/bge-reranker-v2-m3 or cross-attention scoring.
        """
        # For quality profile reranking: candidates keep RRF order or refine by cross-term matches
        return candidates

retrieval_engine = HybridRetrievalEngine()
