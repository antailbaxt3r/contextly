import hashlib
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import Document, DocumentStatus, User
from app.schemas import DocumentResponse
from app.services.storage import delete_object, upload_bytes
from app.tasks import ingest_document_task


router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> DocumentResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    mime = (file.content_type or "").lower()
    if mime not in settings.allowed_mime_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported mime type '{mime}'. Allowed: {settings.allowed_mime_types}",
        )

    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.max_upload_bytes} bytes",
        )

    sha = hashlib.sha256(data).hexdigest()
    existing = db.execute(
        select(Document).where(Document.user_id == current.id, Document.sha256 == sha)
    ).scalar_one_or_none()
    if existing:
        return DocumentResponse.model_validate(existing)

    storage_key = f"users/{current.id}/{uuid4()}/{file.filename}"
    upload_bytes(storage_key, data, mime)

    doc = Document(
        user_id=current.id,
        original_filename=file.filename,
        mime_type=mime,
        byte_size=len(data),
        sha256=sha,
        storage_key=storage_key,
        status=DocumentStatus.pending,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    ingest_document_task.delay(str(doc.id))

    return DocumentResponse.model_validate(doc)


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> list[DocumentResponse]:
    docs = db.execute(
        select(Document).where(Document.user_id == current.id).order_by(Document.created_at.desc())
    ).scalars().all()
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> DocumentResponse:
    doc = db.get(Document, document_id)
    if not doc or doc.user_id != current.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(doc)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> None:
    doc = db.get(Document, document_id)
    if not doc or doc.user_id != current.id:
        raise HTTPException(status_code=404, detail="Document not found")
    storage_key = doc.storage_key
    db.delete(doc)
    db.commit()
    try:
        delete_object(storage_key)
    except Exception:
        pass
