from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import (
    Citation,
    Chunk,
    Conversation,
    Document,
    DocumentStatus,
    Message,
    MessageRole,
    User,
)
from app.schemas import (
    CitationResponse,
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from app.services.embeddings import embed_one
from app.services.generation import answer_question, rewrite_query
from app.services.reranking import rerank
from app.services.retrieval import hybrid_search


router = APIRouter(prefix="/conversations", tags=["conversations"])


def _to_message_response(db: Session, msg: Message) -> MessageResponse:
    citations: list[CitationResponse] = []
    for c in sorted(msg.citations, key=lambda x: x.rank):
        chunk = db.get(Chunk, c.chunk_id)
        preview = (chunk.content[:240] + "...") if chunk and len(chunk.content) > 240 else (chunk.content if chunk else "")
        citations.append(
            CitationResponse(
                rank=c.rank,
                chunk_id=c.chunk_id,
                score=c.score,
                page_start=chunk.page_start if chunk else None,
                page_end=chunk.page_end if chunk else None,
                content_preview=preview,
            )
        )
    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        role=msg.role,
        content=msg.content,
        citations=citations,
        created_at=msg.created_at,
    )


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> ConversationResponse:
    doc = db.get(Document, payload.document_id)
    if not doc or doc.user_id != current.id:
        raise HTTPException(status_code=404, detail="Document not found")

    title = payload.title or f"Chat about {doc.original_filename}"
    conv = Conversation(user_id=current.id, document_id=doc.id, title=title)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return ConversationResponse.model_validate(conv)


@router.get("", response_model=list[ConversationResponse])
def list_conversations(
    document_id: UUID | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> list[ConversationResponse]:
    stmt = select(Conversation).where(Conversation.user_id == current.id)
    if document_id:
        stmt = stmt.where(Conversation.document_id == document_id)
    stmt = stmt.order_by(Conversation.updated_at.desc())
    convs = db.execute(stmt).scalars().all()
    return [ConversationResponse.model_validate(c) for c in convs]


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> ConversationResponse:
    conv = db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationResponse.model_validate(conv)


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def list_messages(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> list[MessageResponse]:
    conv = db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at.asc())
    ).scalars().all()
    return [_to_message_response(db, m) for m in msgs]


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> None:
    conv = db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
def post_message(
    conversation_id: UUID,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> MessageResponse:
    conv = db.get(Conversation, conversation_id)
    if not conv or conv.user_id != current.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    doc = db.get(Document, conv.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != DocumentStatus.ready:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Document is not ready (status={doc.status.value}). Try again once ingestion completes.",
        )

    user_msg = Message(conversation_id=conv.id, role=MessageRole.user, content=payload.content)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    history_rows = db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at.asc())
    ).scalars().all()
    history = [
        {"role": m.role.value, "content": m.content}
        for m in history_rows[:-1]
        if m.role in (MessageRole.user, MessageRole.assistant)
    ]

    standalone_query = rewrite_query(payload.content, history)
    query_embedding = embed_one(standalone_query)

    fused = hybrid_search(
        db,
        user_id=current.id,
        document_id=doc.id,
        query=standalone_query,
        query_embedding=query_embedding,
    )
    top_candidates = fused[:20]
    reranked = rerank(standalone_query, top_candidates)

    answer = answer_question(payload.content, history, reranked)

    retrieval_metadata = {
        "standalone_query": standalone_query,
        "candidates_considered": len(fused),
        "candidates_reranked": len(top_candidates),
        "final_chunks": [
            {
                "chunk_id": str(c.chunk_id),
                "page_start": c.page_start,
                "page_end": c.page_end,
                "fused_score": c.fused_score,
                "rerank_score": c.rerank_score,
            }
            for c in reranked
        ],
    }

    assistant_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.assistant,
        content=answer,
        retrieval_metadata=retrieval_metadata,
    )
    db.add(assistant_msg)
    db.flush()

    for rank_idx, c in enumerate(reranked, start=1):
        db.add(
            Citation(
                message_id=assistant_msg.id,
                chunk_id=c.chunk_id,
                rank=rank_idx,
                score=c.rerank_score,
            )
        )
    db.commit()
    db.refresh(assistant_msg)

    return _to_message_response(db, assistant_msg)
