import logging
from uuid import UUID

from app.celery_app import celery_app
from app.config import settings
from app.db import SessionLocal
from app.models import Chunk, Document, DocumentStatus
from app.services.chunking import chunk_pages
from app.services.embeddings import embed_one
from app.services.parsing import parse_document
from app.services.storage import download_bytes


logger = logging.getLogger(__name__)


@celery_app.task(name="ingest_document", bind=True, max_retries=2)
def ingest_document_task(self, document_id: str) -> dict:
    doc_uuid = UUID(document_id)
    db = SessionLocal()
    try:
        doc = db.get(Document, doc_uuid)
        if not doc:
            return {"status": "missing", "document_id": document_id}

        try:
            doc.status = DocumentStatus.parsing
            db.commit()

            data = download_bytes(doc.storage_key)
            pages, page_count = parse_document(data, doc.mime_type)
            if not pages:
                raise RuntimeError("No extractable text in document")

            text_chunks = chunk_pages(pages, settings.chunk_max_chars, settings.chunk_overlap_chars)
            if not text_chunks:
                raise RuntimeError("No chunks produced from document")

            doc.status = DocumentStatus.embedding
            doc.page_count = page_count
            db.commit()

            for idx, tc in enumerate(text_chunks):
                vec = embed_one(tc.content)
                chunk = Chunk(
                    document_id=doc.id,
                    user_id=doc.user_id,
                    chunk_index=idx,
                    content=tc.content,
                    char_count=len(tc.content),
                    page_start=tc.page_start,
                    page_end=tc.page_end,
                    embedding=vec,
                )
                db.add(chunk)
                if idx % 16 == 15:
                    db.commit()
            db.commit()

            doc.chunk_count = len(text_chunks)
            doc.status = DocumentStatus.ready
            doc.error_message = None
            db.commit()

            return {
                "status": "ready",
                "document_id": document_id,
                "chunks": len(text_chunks),
                "pages": page_count,
            }

        except Exception as e:
            logger.exception("Ingestion failed for document %s", document_id)
            db.rollback()
            doc = db.get(Document, doc_uuid)
            if doc:
                doc.status = DocumentStatus.failed
                doc.error_message = str(e)[:1000]
                db.commit()
            raise
    finally:
        db.close()
