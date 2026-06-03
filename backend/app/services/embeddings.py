import time

import httpx

from app.config import settings


_TIMEOUT = httpx.Timeout(60.0, connect=10.0)


def embed_one(text: str, retries: int = 3) -> list[float]:
    url = f"{settings.ollama_base_url}/api/embeddings"
    payload = {
        "model": settings.embedding_model,
        "prompt": text,
        "options": {
            "num_ctx": 2048,
            "num_batch": 2048,
        },
        "keep_alive": "30m",
    }
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with httpx.Client(timeout=_TIMEOUT) as client:
                resp = client.post(url, json=payload)
                if resp.status_code != 200:
                    raise RuntimeError(
                        f"Ollama HTTP {resp.status_code} from {url}: {resp.text[:500]}"
                    )
                data = resp.json()
                vec = data.get("embedding")
                if not vec:
                    raise RuntimeError(f"Ollama returned no embedding: {data}")
                return vec
        except Exception as e:
            last_err = e
            time.sleep(2 ** attempt)
    raise RuntimeError(f"embed_one failed after {retries} retries: {last_err}")


def embed_batch(texts: list[str]) -> list[list[float]]:
    return [embed_one(t) for t in texts]
