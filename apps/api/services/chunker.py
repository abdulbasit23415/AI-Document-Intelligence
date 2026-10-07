import re
from typing import List, Dict, Any, Optional
from apps.api.services.parser import ParsedBlock

def estimate_token_count(text: str) -> int:
    # Fast token estimation (~1.3 tokens per word)
    words = len(re.findall(r'\w+|[^\w\s]', text))
    return max(1, int(words * 1.1))

class DocumentChunker:
    """
    Token-aware semantic chunker that respects headings, table headers,
    and page boundaries.
    """

    def __init__(self, max_tokens: int = 500, overlap_tokens: int = 50):
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens

    def chunk_blocks(
        self,
        blocks: List[ParsedBlock],
        workspace_id: str,
        document_id: str,
        version: int = 1
    ) -> List[Dict[str, Any]]:
        chunks: List[Dict[str, Any]] = []
        chunk_idx = 0

        current_text = ""
        current_page: Optional[int] = None
        current_section: Optional[str] = None
        current_bboxes: List[Dict[str, Any]] = []
        current_tokens = 0

        for block in blocks:
            block_tokens = estimate_token_count(block.text)

            # Special handling for tables: preserve table header if splitting
            if block.is_table and block.table_headers and block_tokens > self.max_tokens:
                # Flush existing buffer
                if current_text.strip():
                    chunks.append(self._build_chunk(
                        workspace_id, document_id, version, chunk_idx,
                        current_text.strip(), current_page, current_section,
                        current_bboxes, current_tokens
                    ))
                    chunk_idx += 1
                    current_text = ""
                    current_bboxes = []
                    current_tokens = 0

                # Split table rows with repeated headers
                table_chunks = self._split_table_block(block)
                for t_text in table_chunks:
                    t_toks = estimate_token_count(t_text)
                    chunks.append(self._build_chunk(
                        workspace_id, document_id, version, chunk_idx,
                        t_text, block.page_number, block.section_heading,
                        block.bounding_boxes, t_toks
                    ))
                    chunk_idx += 1
                continue

            # Check if block fits in current chunk
            # Also break chunk if section heading changes significantly
            heading_changed = (
                current_section is not None
                and block.section_heading is not None
                and current_section != block.section_heading
                and current_tokens > (self.max_tokens // 2)
            )

            if (current_tokens + block_tokens > self.max_tokens) or heading_changed:
                if current_text.strip():
                    chunks.append(self._build_chunk(
                        workspace_id, document_id, version, chunk_idx,
                        current_text.strip(), current_page, current_section,
                        current_bboxes, current_tokens
                    ))
                    chunk_idx += 1

                # Start new chunk with overlap if applicable
                overlap_text = ""
                if self.overlap_tokens > 0 and len(current_text) > 100:
                    sentences = re.split(r'(?<=[.!?])\s+', current_text)
                    if len(sentences) > 1:
                        overlap_text = sentences[-1] + " "

                current_text = overlap_text + block.text + "\n"
                current_page = block.page_number
                current_section = block.section_heading
                current_bboxes = list(block.bounding_boxes)
                current_tokens = estimate_token_count(current_text)
            else:
                if not current_text:
                    current_page = block.page_number
                    current_section = block.section_heading
                current_text += block.text + "\n"
                current_bboxes.extend(block.bounding_boxes)
                current_tokens += block_tokens

        # Flush final chunk
        if current_text.strip():
            chunks.append(self._build_chunk(
                workspace_id, document_id, version, chunk_idx,
                current_text.strip(), current_page, current_section,
                current_bboxes, current_tokens
            ))

        return chunks

    def _split_table_block(self, block: ParsedBlock) -> List[str]:
        lines = block.text.splitlines()
        if len(lines) <= 2:
            return [block.text]

        header = "\n".join(lines[:2])
        rows = lines[2:]
        sub_chunks: List[str] = []
        current_batch: List[str] = []

        for row in rows:
            current_batch.append(row)
            batch_text = header + "\n" + "\n".join(current_batch)
            if estimate_token_count(batch_text) >= self.max_tokens:
                sub_chunks.append(batch_text)
                current_batch = []

        if current_batch:
            sub_chunks.append(header + "\n" + "\n".join(current_batch))

        return sub_chunks or [block.text]

    def _build_chunk(
        self,
        workspace_id: str,
        document_id: str,
        version: int,
        chunk_idx: int,
        text: str,
        page: Optional[int],
        section: Optional[str],
        bboxes: List[Dict[str, Any]],
        tokens: int
    ) -> Dict[str, Any]:
        return {
            "workspace_id": workspace_id,
            "document_id": document_id,
            "version": version,
            "chunk_index": chunk_idx,
            "content": text,
            "page_number": page,
            "section_heading": section,
            "bounding_boxes": bboxes[:10] if bboxes else None,  # Cap coordinate payload
            "token_count": tokens,
        }

chunker_service = DocumentChunker()
