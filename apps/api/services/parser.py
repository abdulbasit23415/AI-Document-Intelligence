import io
import os
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from PIL import Image

import fitz  # PyMuPDF
import docx  # python-docx
import pytesseract

from apps.api.core.config import settings

logger = logging.getLogger("docmind.parser")

if settings.TESSERACT_PATH and os.path.exists(settings.TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH

class ParsedBlock:
    def __init__(
        self,
        text: str,
        page_number: Optional[int] = None,
        section_heading: Optional[str] = None,
        bounding_boxes: Optional[List[Dict[str, Any]]] = None,
        is_table: bool = False,
        table_headers: Optional[List[str]] = None,
        is_ocr: bool = False
    ):
        self.text = text
        self.page_number = page_number
        self.section_heading = section_heading
        self.bounding_boxes = bounding_boxes or []
        self.is_table = is_table
        self.table_headers = table_headers or []
        self.is_ocr = is_ocr

class DocumentParser:
    """
    Multi-format document parser supporting PDF, DOCX, TXT, and scanned images.
    Preserves page boundaries, headings, tables, and bounding boxes.
    """

    def parse_file(self, file_path: Path, mime_type: str) -> Tuple[List[ParsedBlock], Dict[str, Any]]:
        ext = file_path.suffix.lower()
        metadata = {
            "mime_type": mime_type,
            "extension": ext,
            "has_ocr": False,
            "page_count": 0,
            "warnings": []
        }

        if ext == ".pdf":
            blocks, meta = self._parse_pdf(file_path)
        elif ext == ".docx":
            blocks, meta = self._parse_docx(file_path)
        elif ext == ".txt":
            blocks, meta = self._parse_txt(file_path)
        elif ext in [".png", ".jpg", ".jpeg"]:
            blocks, meta = self._parse_image(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

        metadata.update(meta)
        return blocks, metadata

    def _parse_pdf(self, file_path: Path) -> Tuple[List[ParsedBlock], Dict[str, Any]]:
        blocks: List[ParsedBlock] = []
        doc = fitz.open(file_path)
        page_count = len(doc)
        ocr_used = False
        warnings = []

        current_heading = "General"

        for page_idx in range(page_count):
            page = doc[page_idx]
            page_num = page_idx + 1
            page_rect = page.rect
            page_width, page_height = page_rect.width, page_rect.height

            # Extract text with layout structure
            text_instances = page.get_text("blocks")  # (x0, y0, x1, y1, text, block_no, block_type)
            page_text = page.get_text().strip()

            # If page text is minimal, perform OCR on this page
            if len(page_text) < 40:
                logger.info(f"Page {page_num} of {file_path.name} has low text density ({len(page_text)} chars). Triggering Tesseract OCR.")
                try:
                    pix = page.get_pixmap(dpi=200)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    ocr_text = pytesseract.image_to_string(img).strip()
                    if ocr_text:
                        ocr_used = True
                        blocks.append(ParsedBlock(
                            text=ocr_text,
                            page_number=page_num,
                            section_heading=f"{current_heading} (OCR)",
                            bounding_boxes=[{
                                "page": page_num,
                                "left": 0.05,
                                "top": 0.05,
                                "right": 0.95,
                                "bottom": 0.95
                            }],
                            is_ocr=True
                        ))
                    else:
                        warnings.append(f"Page {page_num}: OCR extracted no readable text.")
                except Exception as e:
                    logger.warning(f"OCR failed on page {page_num}: {e}")
                    warnings.append(f"Page {page_num}: OCR error ({str(e)})")
                continue

            # Process native text blocks with bounding boxes
            for b in text_instances:
                if len(b) >= 5 and b[4].strip():
                    x0, y0, x1, y1, raw_text = b[0], b[1], b[2], b[3], b[4].strip()
                    # Detect simple headings (e.g. all-caps or short bold lines)
                    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
                    if lines and len(lines) == 1 and len(lines[0]) < 60 and (lines[0].isupper() or lines[0].startswith(("1.", "2.", "3.", "SECTION", "ARTICLE", "Clause"))):
                        current_heading = lines[0]

                    # Normalized coordinates [0.0 - 1.0]
                    bbox = {
                        "page": page_num,
                        "left": round(max(0.0, x0 / page_width), 4),
                        "top": round(max(0.0, y0 / page_height), 4),
                        "right": round(min(1.0, x1 / page_width), 4),
                        "bottom": round(min(1.0, y1 / page_height), 4)
                    }

                    blocks.append(ParsedBlock(
                        text=raw_text,
                        page_number=page_num,
                        section_heading=current_heading,
                        bounding_boxes=[bbox],
                        is_ocr=False
                    ))

        doc.close()
        return blocks, {"page_count": page_count, "has_ocr": ocr_used, "warnings": warnings}

    def _parse_docx(self, file_path: Path) -> Tuple[List[ParsedBlock], Dict[str, Any]]:
        doc = docx.Document(file_path)
        blocks: List[ParsedBlock] = []
        current_heading = "Preamble"

        # Extract paragraphs & headings
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
            if para.style.name.startswith("Heading"):
                current_heading = text
                continue

            blocks.append(ParsedBlock(
                text=text,
                page_number=None,  # Reliable page numbers do not exist for DOCX
                section_heading=current_heading,
                is_ocr=False
            ))

        # Extract tables with header preservation
        for table_idx, table in enumerate(doc.tables):
            if not table.rows:
                continue
            headers = [cell.text.strip() for cell in table.rows[0].cells]
            table_lines = [f"| {' | '.join(headers)} |"]
            table_lines.append(f"| {' | '.join(['---'] * len(headers))} |")

            for row in table.rows[1:]:
                row_vals = [cell.text.strip() for cell in row.cells]
                table_lines.append(f"| {' | '.join(row_vals)} |")

            table_text = "\n".join(table_lines)
            blocks.append(ParsedBlock(
                text=table_text,
                page_number=None,
                section_heading=f"{current_heading} > Table {table_idx + 1}",
                is_table=True,
                table_headers=headers,
                is_ocr=False
            ))

        return blocks, {"page_count": None, "has_ocr": False, "warnings": []}

    def _parse_txt(self, file_path: Path) -> Tuple[List[ParsedBlock], Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        blocks: List[ParsedBlock] = []
        paragraphs = re.split(r'\n\s*\n', content)
        current_heading = "Section 1"

        for idx, p in enumerate(paragraphs):
            clean_p = p.strip()
            if not clean_p:
                continue
            first_line = clean_p.splitlines()[0]
            if len(first_line) < 60 and first_line.isupper():
                current_heading = first_line

            blocks.append(ParsedBlock(
                text=clean_p,
                page_number=None,
                section_heading=current_heading,
                is_ocr=False
            ))

        return blocks, {"page_count": None, "has_ocr": False, "warnings": []}

    def _parse_image(self, file_path: Path) -> Tuple[List[ParsedBlock], Dict[str, Any]]:
        warnings = []
        try:
            img = Image.open(file_path)
            ocr_text = pytesseract.image_to_string(img).strip()
            if not ocr_text:
                warnings.append("OCR detected no readable text on this image.")
                ocr_text = "[No readable text detected via OCR]"

            block = ParsedBlock(
                text=ocr_text,
                page_number=1,
                section_heading="Scanned Image Document",
                bounding_boxes=[{"page": 1, "left": 0.05, "top": 0.05, "right": 0.95, "bottom": 0.95}],
                is_ocr=True
            )
            return [block], {"page_count": 1, "has_ocr": True, "warnings": warnings}
        except Exception as e:
            logger.error(f"Image OCR failure: {e}")
            raise ValueError(f"Failed to process image via OCR: {str(e)}")

parser_service = DocumentParser()
