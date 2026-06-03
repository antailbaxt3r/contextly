# Contextly

A document grounded question answering web application. Upload a PDF or text file, ask questions about it, and receive answers with citations that point back to the exact passages in the source document.

The entire RAG pipeline runs locally. No API keys are required.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Alembic
- Database: Postgres with the pgvector extension
- Queue: Redis with Celery workers for background ingestion
- Object storage: MinIO, S3 compatible
- Inference: Ollama running nomic-embed-text for embeddings and llama3.2:1b for generation
- Reranker: ms-marco-MiniLM-L-6-v2 cross encoder

## Running the application

```bash
cp .env.example .env
docker compose up --build
```

On the first boot, the ollama-init service downloads the embedding and generation models. This step takes a few minutes and runs only once.

Once the stack is up:

- Web interface: http://localhost:3000
- API: http://localhost:8000
- API documentation: http://localhost:8000/docs

## Resetting the state

```bash
docker compose down -v
```

This removes all volumes, including stored documents, embeddings, and downloaded models. The next start will rebuild the database and pull the models again.

## Project layout

```
backend/    FastAPI application, Celery worker, Alembic migrations
frontend/   Next.js application
```

## Postman collection

A Postman collection covering every endpoint is included at the repository root as `Contextly API.postman_collection.json`. Import it into Postman to test the API directly without using the web interface. Login and document upload requests automatically capture tokens and IDs into collection variables, so the requests can be run in sequence without manual copying.

