from __future__ import annotations

from pyTigerGraph import TigerGraphConnection

from api.core.logging import get_logger
from api.models.schemas import SimulateRequest, SimulateResponse, SimulationStep
from api.services.graph_service import get_attack_paths

logger = get_logger(__name__)

_ACTIONS = {
    0: ("Initial Access", "Attacker exploits entry vector to gain foothold on device"),
    1: ("Lateral Movement", "Attacker pivots using compromised credentials or open port"),
    2: ("Privilege Escalation", "Attacker escalates privileges on intermediate node"),
    3: ("Data Staging", "Attacker stages data for exfiltration"),
}


def build_simulation(conn: TigerGraphConnection, req: SimulateRequest) -> SimulateResponse:
    paths = get_attack_paths(conn, attacker_id=req.attacker_id)
    if not paths:
        return SimulateResponse(
            attacker_id=req.attacker_id,
            path=[],
            risk_score=0.0,
            risk_band="LOW",
            steps=[],
            assessment="No attack path found. Network appears secure.",
        )

    idx = min(req.path_index, len(paths) - 1)
    chosen = paths[idx]
    path = chosen.path

    steps: list[SimulationStep] = []
    for i in range(len(path) - 1):
        action_key = min(i, max(_ACTIONS.keys()))
        action, detail = _ACTIONS[action_key]
        steps.append(
            SimulationStep(
                step=i + 1,
                from_node=path[i],
                to_node=path[i + 1],
                action=action,
                detail=f"{detail}: {path[i]} → {path[i + 1]}",
            )
        )

    assessment = (
        f"Critical asset '{path[-1]}' is reachable in {chosen.hop_count} hops. "
        f"Risk: {chosen.risk_band} ({chosen.risk_score}/100). "
        "Immediate containment and patching required."
    )

    return SimulateResponse(
        attacker_id=req.attacker_id,
        path=path,
        risk_score=chosen.risk_score,
        risk_band=chosen.risk_band,
        steps=steps,
        assessment=assessment,
    )
