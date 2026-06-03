import re

from app.services.llm import chat
from app.services.retrieval import RetrievedChunk


_REFERENCE_WORDS_RE = re.compile(
    r"\b(it|its|this|that|these|those|they|them|their|theirs|"
    r"he|she|his|her|him|hers|"
    r"the\s+(one|first|second|third|last|other|same|former|latter|previous|next))\b",
    re.IGNORECASE,
)


SYSTEM_PROMPT = (
    "You are a careful assistant that answers questions about a single document. "
    "Use ONLY the provided context. If the context does not contain enough information "
    "to answer, say so honestly and do not invent facts. "
    "Cite sources inline using the bracketed numbers that appear before each context block, "
    "for example [1] or [2, 3]."
)

REWRITE_SYSTEM_PROMPT = (
    "You rewrite a follow-up user question into a standalone question that can be "
    "understood without the chat history. Output only the rewritten question, nothing else."
)


def build_context_block(chunks: list[RetrievedChunk]) -> str:
    parts: list[str] = []
    for i, c in enumerate(chunks, start=1):
        page_info = f" (page {c.page_start})" if c.page_start else ""
        parts.append(f"[{i}]{page_info}\n{c.content}")
    return "\n\n".join(parts)


def answer_question(
    question: str,
    history: list[dict],
    chunks: list[RetrievedChunk],
) -> str:
    context_block = build_context_block(chunks) if chunks else "(no relevant context found)"
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history[-6:])
    messages.append(
        {
            "role": "user",
            "content": (
                f"Context:\n{context_block}\n\n"
                f"Question: {question}\n\n"
                f"Answer using only the context above and cite with bracketed numbers."
            ),
        }
    )
    return chat(messages, temperature=0.2)


def _needs_rewrite(question: str, history: list[dict]) -> bool:
    if not history:
        return False
    return bool(_REFERENCE_WORDS_RE.search(question))


def rewrite_query(question: str, history: list[dict]) -> str:
    if not _needs_rewrite(question, history):
        return question
    convo_text = "\n".join(f"{m['role']}: {m['content']}" for m in history[-6:])
    messages = [
        {"role": "system", "content": REWRITE_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Chat history:\n{convo_text}\n\n"
                f"Follow-up question: {question}\n\n"
                f"Standalone question:"
            ),
        },
    ]
    try:
        return chat(messages, temperature=0.0, max_tokens=128) or question
    except Exception:
        return question
