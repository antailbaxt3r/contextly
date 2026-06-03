import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, conversations, documents, health


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


app = FastAPI(
    title="Contextly API",
    version="0.1.0",
    description="Document-grounded question answering with a local RAG pipeline.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")


@app.on_event("startup")
def warm_reranker() -> None:
    from app.services.reranking import get_reranker

    get_reranker()
