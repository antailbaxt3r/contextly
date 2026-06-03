from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings


@dataclass
class RetrievedChunk:
    chunk_id: UUID
    content: str
    page_start: int | None
    page_end: int | None
    dense_rank: int | None = None
    sparse_rank: int | None = None
    fused_score: float = 0.0
    rerank_score: float | None = None


def _dense_search(
    db: Session,
    user_id: UUID,
    document_id: UUID,
    query_embedding: list[float],
    top_k: int,
) -> list[dict]:
    sql = text(
        """
        SELECT id, content, page_start, page_end,
               1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
        FROM chunks
        WHERE user_id = :user_id AND document_id = :document_id
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT :top_k
        """
    )
    rows = db.execute(
        sql,
        {
            "embedding": str(query_embedding),
            "user_id": user_id,
            "document_id": document_id,
            "top_k": top_k,
        },
    ).mappings().all()
    return [dict(r) for r in rows]


def _sparse_search(
    db: Session,
    user_id: UUID,
    document_id: UUID,
    query: str,
    top_k: int,
) -> list[dict]:
    sql = text(
        """
        SELECT id, content, page_start, page_end,
               ts_rank_cd(content_tsv, plainto_tsquery('english', :q)) AS rank
        FROM chunks
        WHERE user_id = :user_id
          AND document_id = :document_id
          AND content_tsv @@ plainto_tsquery('english', :q)
        ORDER BY rank DESC
        LIMIT :top_k
        """
    )
    rows = db.execute(
        sql,
        {"q": query, "user_id": user_id, "document_id": document_id, "top_k": top_k},
    ).mappings().all()
    return [dict(r) for r in rows]


def _rrf_fuse(
    dense: list[dict], sparse: list[dict], k: int
) -> dict[UUID, RetrievedChunk]:
    by_id: dict[UUID, RetrievedChunk] = {}

    for rank, row in enumerate(dense):
        cid = row["id"]
        rc = by_id.get(cid)
        if rc is None:
            rc = RetrievedChunk(
                chunk_id=cid,
                content=row["content"],
                page_start=row["page_start"],
                page_end=row["page_end"],
            )
            by_id[cid] = rc
        rc.dense_rank = rank
        rc.fused_score += 1.0 / (k + rank + 1)

    for rank, row in enumerate(sparse):
        cid = row["id"]
        rc = by_id.get(cid)
        if rc is None:
            rc = RetrievedChunk(
                chunk_id=cid,
                content=row["content"],
                page_start=row["page_start"],
                page_end=row["page_end"],
            )
            by_id[cid] = rc
        rc.sparse_rank = rank
        rc.fused_score += 1.0 / (k + rank + 1)

    return by_id


def hybrid_search(
    db: Session,
    user_id: UUID,
    document_id: UUID,
    query: str,
    query_embedding: list[float],
    top_k: int | None = None,
) -> list[RetrievedChunk]:
    top_k = top_k or settings.retrieval_top_k
    dense = _dense_search(db, user_id, document_id, query_embedding, top_k)
    sparse = _sparse_search(db, user_id, document_id, query, top_k)
    fused = _rrf_fuse(dense, sparse, settings.rrf_k)
    return sorted(fused.values(), key=lambda c: c.fused_score, reverse=True)
