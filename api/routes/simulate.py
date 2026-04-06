from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.core.logging import get_logger
from api.core.tigergraph import get_conn, reset_conn
from api.models.schemas import SimulateRequest, SimulateResponse
from api.services.simulation_service import build_simulation

logger = get_logger(__name__)
router = APIRouter(prefix="/simulate", tags=["simulation"])


@router.post("", response_model=SimulateResponse)
def simulate(req: SimulateRequest) -> SimulateResponse:
    try:
        conn = get_conn()
        return build_simulation(conn, req)
    except RuntimeError as exc:
        reset_conn()
        logger.error("TigerGraph error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error in simulate")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
