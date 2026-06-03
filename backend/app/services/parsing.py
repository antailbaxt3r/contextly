import re
from io import BytesIO

from pypdf import PdfReader


_WHITESPACE_RE = re.compile(r"[ \t]+")
_MULTILINE_RE = re.compile(r"\n{3,}")


def normalize(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = _WHITESPACE_RE.sub(" ", text)
    text = _MULTILINE_RE.sub("\n\n", text)
    return text.strip()


def parse_pdf(data: bytes) -> tuple[list[tuple[int, str]], int]:
    reader = PdfReader(BytesIO(data))
    pages: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages, start=1):
        try:
            raw = page.extract_text() or ""
        except Exception:
            raw = ""
        cleaned = normalize(raw)
        if cleaned:
            pages.append((i, cleaned))
    return pages, len(reader.pages)


def parse_text(data: bytes) -> tuple[list[tuple[int, str]], int]:
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        text = data.decode("utf-8", errors="replace")
    cleaned = normalize(text)
    return [(1, cleaned)] if cleaned else [], 1


def parse_document(data: bytes, mime_type: str) -> tuple[list[tuple[int, str]], int]:
    if mime_type == "application/pdf":
        return parse_pdf(data)
    if mime_type in ("text/plain", "text/markdown"):
        return parse_text(data)
    raise ValueError(f"Unsupported mime type: {mime_type}")
