from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from api.core.logging import get_logger
from api.core.tigergraph import get_conn, reset_conn
from api.models.schemas import GraphDataResponse
from api.services.graph_service import get_graph_data
from api.services.scenarios import get_scenario_graph, list_scenarios

logger = get_logger(__name__)
router = APIRouter(prefix="/graph-data", tags=["graph"])


@router.get("/scenarios")
def scenarios() -> list[dict]:
    """List all available graph scenarios."""
    return list_scenarios()


@router.get("", response_model=GraphDataResponse)
def graph_data(
    scenario: str = Query(default="live", description="Scenario id: live | corporate | hospital | cloud | ics"),
) -> GraphDataResponse:
    if scenario != "live":
        try:
            return get_scenario_graph(scenario)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Default: pull from TigerGraph
    try:
        conn = get_conn()
        return get_graph_data(conn)
    except RuntimeError as exc:
        reset_conn()
        logger.error("TigerGraph error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error in graph-data")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
