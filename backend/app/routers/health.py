import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db


router = APIRouter(tags=["health"])


@router.get("/healthz")
def liveness() -> dict:
    return {"status": "ok"}


@router.get("/readyz")
def readiness(db: Session = Depends(get_db)) -> dict:
    checks: dict[str, str] = {}

    try:
        db.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as e:
        checks["postgres"] = f"fail: {e}"

    try:
        with httpx.Client(timeout=5.0) as client:
            r = client.get(f"{settings.ollama_base_url}/api/tags")
            r.raise_for_status()
        checks["ollama"] = "ok"
    except Exception as e:
        checks["ollama"] = f"fail: {e}"

    if any(v != "ok" for v in checks.values()):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=checks)
    return {"status": "ok", "checks": checks}
