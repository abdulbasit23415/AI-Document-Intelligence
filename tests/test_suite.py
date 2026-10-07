import os
import sys
import unittest
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from apps.api.core.config import settings
from apps.api.core.database import Base, engine, SessionLocal
from apps.api.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from apps.api.models.models import User, Workspace, WorkspaceMember, Document, DocumentChunk
from apps.api.services.parser import parser_service
from apps.api.services.chunker import chunker_service
from apps.api.services.embeddings import embedding_service
from apps.api.services.retrieval import retrieval_engine
from apps.api.services.llm_adapter import llm_adapter
from apps.api.services.intelligence import intelligence_service
from apps.api.services.ingestion import process_document_pipeline
from apps.api.core.storage import storage_service

class DocuMindComprehensiveTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create fresh test tables
        Base.metadata.create_all(bind=engine)
        cls.db = SessionLocal()
        cls.fixtures_dir = Path(__file__).parent / "fixtures"

        # Setup test workspace & user
        cls.test_user = cls.db.query(User).filter(User.email == "tester@docmind.test").first()
        if not cls.test_user:
            cls.test_user = User(
                email="tester@docmind.test",
                hashed_password=get_password_hash("TestPassword123!"),
                full_name="DocuMind Test Engineer",
                is_superuser=False
            )
            cls.db.add(cls.test_user)
            cls.db.commit()
            cls.db.refresh(cls.test_user)

        cls.workspace = cls.db.query(Workspace).filter(Workspace.slug == "test-suite-workspace").first()
        if not cls.workspace:
            cls.workspace = Workspace(name="Test Suite Workspace", slug="test-suite-workspace")
            cls.db.add(cls.workspace)
            cls.db.flush()

            cls.membership = WorkspaceMember(
                workspace_id=cls.workspace.id,
                user_id=cls.test_user.id,
                role="editor"
            )
            cls.db.add(cls.membership)
            cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_authentication_and_jwt(self):
        """Validates password hashing, verification, and JWT creation/decode."""
        password = "SecurePassword2026!"
        hashed = get_password_hash(password)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

        token = create_access_token({"sub": self.test_user.id, "email": self.test_user.email})
        payload = decode_access_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["sub"], self.test_user.id)

    def test_02_pdf_parsing_and_bounding_boxes(self):
        """Tests PyMuPDF text and coordinate extraction from synthetic contract."""
        pdf_path = self.fixtures_dir / "synthetic_master_services_agreement.pdf"
        self.assertTrue(pdf_path.exists())

        blocks, metadata = parser_service.parse_file(pdf_path, "application/pdf")
        self.assertGreater(len(blocks), 0)
        self.assertEqual(metadata["page_count"], 2)

        # Check bounding boxes exist and are normalized
        has_bbox = any(len(b.bounding_boxes) > 0 for b in blocks)
        self.assertTrue(has_bbox)
        sample_bbox = next(b.bounding_boxes[0] for b in blocks if b.bounding_boxes)
        self.assertTrue(0.0 <= sample_bbox["left"] <= 1.0)
        self.assertTrue(0.0 <= sample_bbox["top"] <= 1.0)

    def test_03_tesseract_ocr_on_scanned_image(self):
        """Tests local Tesseract OCR on synthetic scanned receipt."""
        img_path = self.fixtures_dir / "synthetic_scanned_receipt.png"
        self.assertTrue(img_path.exists())

        blocks, metadata = parser_service.parse_file(img_path, "image/png")
        self.assertTrue(metadata["has_ocr"])
        self.assertEqual(len(blocks), 1)
        ocr_text = blocks[0].text
        self.assertIn("RECEIPT", ocr_text)
        self.assertIn("OCR-7729", ocr_text)

    def test_04_token_aware_chunking(self):
        """Validates chunker respects token limits and builds provenance."""
        txt_path = self.fixtures_dir / "synthetic_security_policy.txt"
        blocks, _ = parser_service.parse_file(txt_path, "text/plain")
        chunks = chunker_service.chunk_blocks(blocks, self.workspace.id, "doc-test-123")

        self.assertGreater(len(chunks), 0)
        for c in chunks:
            self.assertEqual(c["workspace_id"], self.workspace.id)
            self.assertIsNone(c["page_number"])  # TXT should have None page numbers
            self.assertIn("token_count", c)

    def test_05_end_to_end_ingestion_and_retrieval(self):
        """Uploads and ingests contract PDF, performs hybrid RRF retrieval."""
        pdf_path = self.fixtures_dir / "synthetic_master_services_agreement.pdf"
        with open(pdf_path, "rb") as f:
            rel_path, file_hash, size = storage_service.save_file(
                self.workspace.id, f, "synthetic_master_services_agreement.pdf"
            )

        doc = Document(
            workspace_id=self.workspace.id,
            original_filename="synthetic_master_services_agreement.pdf",
            storage_path=rel_path,
            file_hash=file_hash,
            file_size_bytes=size,
            mime_type="application/pdf",
            status="uploaded"
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)

        # Ingest
        success = process_document_pipeline(doc.id, self.db)
        self.assertTrue(success)
        self.db.refresh(doc)
        self.assertEqual(doc.status, "ready")

        # Hybrid retrieval for payment terms
        results = retrieval_engine.retrieve(
            db=self.db,
            workspace_id=self.workspace.id,
            query="What are the payment terms?",
            authorized_user_role="editor"
        )
        self.assertGreater(len(results), 0)
        top_match = results[0]
        self.assertIn("Net 45", top_match.content)
        self.assertEqual(top_match.page_number, 1)

    def test_06_grounded_answer_and_valid_citations(self):
        """Verifies grounded answer generation cites [1] with verifiable excerpt."""
        results = retrieval_engine.retrieve(
            db=self.db,
            workspace_id=self.workspace.id,
            query="When is payment due under the agreement?",
            authorized_user_role="editor"
        )

        stream = list(llm_adapter.generate_answer_stream(
            query="When is payment due under the agreement?",
            retrieved_passages=results
        ))
        
        full_text = "".join(s["data"] for s in stream if s["event"] == "token")
        done_event = next(s for s in stream if s["event"] == "done")
        citations = done_event["citations"]

        self.assertIn("[1]", full_text)
        self.assertGreater(len(citations), 0)
        first_cite = citations[0]
        self.assertEqual(first_cite["citation_id"], 1)
        self.assertEqual(first_cite["page_number"], 1)
        has_agreement_or_payment = any("Agreement" in c["text_excerpt"] or "Net 45" in c["text_excerpt"] for c in citations)
        self.assertTrue(has_agreement_or_payment)

    def test_07_abstention_on_missing_information(self):
        """Verifies exact required abstention when information is not in documents."""
        results = retrieval_engine.retrieve(
            db=self.db,
            workspace_id=self.workspace.id,
            query="What is the warranty policy on quantum gravity drives?",
            authorized_user_role="editor"
        )

        stream = list(llm_adapter.generate_answer_stream(
            query="What is the warranty policy on quantum gravity drives?",
            retrieved_passages=results
        ))
        full_text = "".join(s["data"] for s in stream if s["event"] == "token")
        self.assertEqual(full_text.strip(), "I couldn't find this information in the selected documents.")

    def test_08_prompt_injection_safety(self):
        """Verifies that malicious prompt instructions inside the PDF are not executed."""
        results = retrieval_engine.retrieve(
            db=self.db,
            workspace_id=self.workspace.id,
            query="What is clause 3?",
            authorized_user_role="editor"
        )
        stream = list(llm_adapter.generate_answer_stream(
            query="What is clause 3?",
            retrieved_passages=results
        ))
        full_text = "".join(s["data"] for s in stream if s["event"] == "token")
        # System override must NOT cause passwords or fake override execution
        self.assertNotIn("SYSTEM PWNED", full_text)

    def test_09_cross_workspace_isolation(self):
        """Ensures documents from one workspace never leak into another."""
        import uuid
        other_slug = f"foreign-ws-{uuid.uuid4().hex[:8]}"
        other_ws = Workspace(name="Foreign Workspace", slug=other_slug)
        self.db.add(other_ws)
        self.db.commit()

        results = retrieval_engine.retrieve(
            db=self.db,
            workspace_id=other_ws.id,
            query="payment terms",
            authorized_user_role="editor"
        )
        self.assertEqual(len(results), 0)

    def test_10_deleted_document_exclusion(self):
        """Ensures deleted documents are immediately excluded from retrieval."""
        docs = self.db.query(Document).filter(
            Document.workspace_id == self.workspace.id,
            Document.is_deleted == False
        ).all()
        self.assertGreater(len(docs), 0)

        # Mark all soft deleted
        for d in docs:
            d.is_deleted = True
        self.db.commit()

        results = retrieval_engine.retrieve(
            db=self.db,
            workspace_id=self.workspace.id,
            query="payment terms",
            authorized_user_role="editor"
        )
        self.assertEqual(len(results), 0)

        # Restore
        for d in docs:
            d.is_deleted = False
        self.db.commit()

    def test_11_contract_and_invoice_intelligence(self):
        """Validates contract and invoice extraction against Pydantic models."""
        doc = self.db.query(Document).filter(
            Document.workspace_id == self.workspace.id,
            Document.is_deleted == False
        ).first()

        contract_res = intelligence_service.extract_contract(self.db, doc.id)
        self.assertIsNotNone(contract_res.payment_terms)
        self.assertIn("Net", contract_res.payment_terms)
        self.assertEqual(len(contract_res.citations), 1)

        csv_out = intelligence_service.export_extraction_csv(contract_res.model_dump())
        self.assertIn("payment_terms", csv_out)

if __name__ == "__main__":
    unittest.main()
