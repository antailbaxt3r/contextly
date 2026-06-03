import httpx

from app.config import settings


_TIMEOUT = httpx.Timeout(180.0, connect=10.0)


def chat(messages: list[dict], temperature: float = 0.2, max_tokens: int | None = None) -> str:
    url = f"{settings.ollama_base_url}/api/chat"
    payload = {
        "model": settings.llm_model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": temperature},
        "keep_alive": "30m",
    }
    if max_tokens is not None:
        payload["options"]["num_predict"] = max_tokens

    with httpx.Client(timeout=_TIMEOUT) as client:
        resp = client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    msg = data.get("message") or {}
    content = msg.get("content", "")
    return content.strip()
