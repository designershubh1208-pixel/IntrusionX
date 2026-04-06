from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.core.logging import get_logger
from api.core.tigergraph import get_conn, reset_conn
from api.models.schemas import RiskScoreResponse
from api.services.graph_service import get_risk_scores

logger = get_logger(__name__)
router = APIRouter(prefix="/risk-score", tags=["risk"])


@router.get("", response_model=RiskScoreResponse)
def risk_score() -> RiskScoreResponse:
    try:
        conn = get_conn()
        return get_risk_scores(conn)
    except RuntimeError as exc:
        reset_conn()
        logger.error("TigerGraph error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error in risk-score")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
