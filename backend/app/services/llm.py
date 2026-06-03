import httpx

from app.config import settings


_TIMEOUT = httpx.Timeout(600.0, connect=10.0)

DEFAULT_NUM_CTX = 4096
DEFAULT_NUM_PREDICT = 512


def chat(messages: list[dict], temperature: float = 0.2, max_tokens: int | None = None) -> str:
    url = f"{settings.ollama_base_url}/api/chat"
    options: dict = {
        "temperature": temperature,
        "num_ctx": DEFAULT_NUM_CTX,
        "num_predict": max_tokens if max_tokens is not None else DEFAULT_NUM_PREDICT,
    }
    payload = {
        "model": settings.llm_model,
        "messages": messages,
        "stream": False,
        "options": options,
        "keep_alive": "30m",
    }

    with httpx.Client(timeout=_TIMEOUT) as client:
        resp = client.post(url, json=payload)
        if resp.status_code != 200:
            raise RuntimeError(
                f"Ollama HTTP {resp.status_code} from {url}: {resp.text[:500]}"
            )
        data = resp.json()

    msg = data.get("message") or {}
    content = msg.get("content", "")
    return content.strip()
