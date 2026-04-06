from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from api.core.logging import get_logger
from api.core.tigergraph import get_conn, reset_conn
from api.models.schemas import AttackPathResponse
from api.services.graph_service import get_attack_paths

logger = get_logger(__name__)
router = APIRouter(prefix="/attack-paths", tags=["attack-paths"])


@router.get("", response_model=list[AttackPathResponse])
def list_attack_paths(
    attacker_id: str | None = Query(None, description="Filter by attacker ID"),
    limit: int = Query(20, ge=1, le=100),
) -> list[AttackPathResponse]:
    try:
        conn = get_conn()
        return get_attack_paths(conn, attacker_id=attacker_id, max_paths=limit)
    except RuntimeError as exc:
        reset_conn()
        logger.error("TigerGraph error: %s", exc)
        raise HTTPException(status_code=503, detail=f"Graph database unavailable: {exc}") from exc
    except Exception as exc:
        logger.exception("Unexpected error in attack-paths")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
