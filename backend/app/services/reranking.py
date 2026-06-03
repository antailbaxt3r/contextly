from sentence_transformers import CrossEncoder

from app.config import settings
from app.services.retrieval import RetrievedChunk


_reranker: CrossEncoder | None = None


def get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder(settings.reranker_model)
    return _reranker


def rerank(query: str, candidates: list[RetrievedChunk], top_k: int | None = None) -> list[RetrievedChunk]:
    if not candidates:
        return []
    top_k = top_k or settings.rerank_top_k
    model = get_reranker()
    pairs = [(query, c.content) for c in candidates]
    scores = model.predict(pairs)
    for c, s in zip(candidates, scores):
        c.rerank_score = float(s)
    ranked = sorted(candidates, key=lambda c: c.rerank_score or 0.0, reverse=True)
    return ranked[:top_k]
