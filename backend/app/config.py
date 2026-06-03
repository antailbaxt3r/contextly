from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://contextly:contextly@postgres:5432/contextly"
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"

    s3_endpoint: str = "http://minio:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "documents"
    s3_region: str = "us-east-1"

    ollama_base_url: str = "http://ollama:11434"
    embedding_model: str = "nomic-embed-text"
    embedding_dim: int = 768
    llm_model: str = "llama3.2:1b"

    jwt_secret: str = "please-change-me"
    jwt_algorithm: str = "HS256"
    access_token_ttl_min: int = 60
    refresh_token_ttl_days: int = 7

    chunk_max_chars: int = 1500
    chunk_overlap_chars: int = 200
    retrieval_top_k: int = 30
    rerank_top_k: int = 6
    rrf_k: int = 60

    max_upload_bytes: int = 52_428_800
    allowed_mime_types: tuple[str, ...] = (
        "application/pdf",
        "text/plain",
        "text/markdown",
    )

    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
