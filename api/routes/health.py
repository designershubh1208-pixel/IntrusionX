from __future__ import annotations

from fastapi import APIRouter

from api.core.config import get_settings
from api.core.tigergraph import reset_conn
from api.models.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        tigergraph_host=settings.tg_host_https,
        graph=settings.graph_name,
        ai_available=settings.has_openai,
        version="2.0.0",
    )


@router.post("/reload", summary="Flush TigerGraph connection cache")
def reload_graph() -> dict:
    """
    Call this after pushing new data via the simulator.
    Forces the backend to drop its cached connection so the next
    request re-fetches fresh data from TigerGraph.
    """
    reset_conn()
    return {"ok": True, "message": "Connection cache cleared — next request will fetch fresh data."}
