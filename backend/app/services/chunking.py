from dataclasses import dataclass


@dataclass
class TextChunk:
    content: str
    page_start: int
    page_end: int


def _hard_split(text: str, max_chars: int, overlap: int) -> list[str]:
    if len(text) <= max_chars:
        return [text]
    step = max(1, max_chars - overlap)
    out = []
    for i in range(0, len(text), step):
        piece = text[i : i + max_chars]
        if piece:
            out.append(piece)
        if i + max_chars >= len(text):
            break
    return out


def chunk_page(text: str, max_chars: int, overlap: int) -> list[str]:
    if len(text) <= max_chars:
        return [text]

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        return _hard_split(text, max_chars, overlap)

    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        if len(para) > max_chars:
            if current:
                chunks.append(current)
                current = ""
            chunks.extend(_hard_split(para, max_chars, overlap))
            continue

        candidate = (current + "\n\n" + para) if current else para
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                chunks.append(current)
            if overlap > 0 and chunks:
                tail = chunks[-1][-overlap:]
                current = tail + "\n\n" + para
            else:
                current = para

    if current:
        chunks.append(current)

    return chunks


def chunk_pages(pages: list[tuple[int, str]], max_chars: int, overlap: int) -> list[TextChunk]:
    result: list[TextChunk] = []
    for page_num, page_text in pages:
        for piece in chunk_page(page_text, max_chars, overlap):
            result.append(TextChunk(content=piece, page_start=page_num, page_end=page_num))
    return result
