from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.core.logging import get_logger
from api.core.tigergraph import get_conn, reset_conn
from api.models.schemas import AIAnalysisRequest, AIAnalysisResponse
from api.services.ai_service import get_ai_analysis

logger = get_logger(__name__)
router = APIRouter(prefix="/ai-analysis", tags=["ai"])


@router.post("", response_model=AIAnalysisResponse)
def ai_analysis(req: AIAnalysisRequest) -> AIAnalysisResponse:
    try:
        conn = get_conn()
        return get_ai_analysis(conn, req)
    except RuntimeError as exc:
        reset_conn()
        logger.error("TigerGraph error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error in ai-analysis")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
