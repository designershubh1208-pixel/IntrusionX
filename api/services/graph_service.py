from __future__ import annotations

from collections import deque
from typing import Any

from pyTigerGraph import TigerGraphConnection

from api.core.logging import get_logger
from api.core.tigergraph import safe_get_edges, safe_get_vertices
from api.models.schemas import (
    AttackPathResponse,
    DeviceRisk,
    GraphDataResponse,
    GraphEdge,
    GraphNode,
    RiskScoreResponse,
)

logger = get_logger(__name__)


# ── Low-level graph helpers ───────────────────────────────────────────────────

def _edge_pairs(conn: TigerGraphConnection, edge_type: str) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    for row in safe_get_edges(conn, edge_type):
        fid = row.get("from_id") or row.get("From_id")
        tid = row.get("to_id") or row.get("To_id")
        if fid and tid:
            out.append((str(fid), str(tid)))
    return out


def _vertex_map(conn: TigerGraphConnection, vtype: str) -> dict[str, dict[str, Any]]:
    m: dict[str, dict[str, Any]] = {}
    for v in safe_get_vertices(conn, vtype):
        vid = v.get("v_id") or v.get("vertex_id")
        attrs = v.get("attributes") or {}
        if vid and isinstance(attrs, dict):
            m[str(vid)] = attrs
    return m


def _risk_band(score: float) -> str:
    if score >= 75:
        return "HIGH"
    if score >= 45:
        return "MEDIUM"
    return "LOW"


def _is_critical(attrs: dict[str, Any]) -> bool:
    return (attrs.get("device_type") or "").lower() == "database" or int(attrs.get("criticality") or 0) >= 9


def _is_excluded_device(device_id: str, attrs: dict[str, Any]) -> bool:
    """
    Filter out scanner utility nodes (like Nmap Scanner) from all outputs.
    This keeps dashboard and graph views focused on target infrastructure.
    """
    text = " ".join(
        [
            device_id,
            str(attrs.get("label") or ""),
            str(attrs.get("device_type") or ""),
        ]
    ).lower()
    return "nmap" in text or "scanner" in text


def _bfs(
    att: str,
    entry: str,
    adj: dict[str, list[str]],
    dev_attrs: dict[str, dict[str, Any]],
    max_depth: int = 16,
) -> list[list[str]]:
    found: list[list[str]] = []
    q: deque[tuple[str, list[str], int]] = deque([(entry, [att, entry], 0)])
    while q:
        node, path, depth = q.popleft()
        if depth >= max_depth:
            continue
        for nb in adj.get(node, []):
            if nb in path:
                continue
            np = path + [nb]
            if _is_critical(dev_attrs.get(nb, {})):
                found.append(np)
            else:
                q.append((nb, np, depth + 1))
    return found


# ── Public service functions ──────────────────────────────────────────────────

def get_attack_paths(
    conn: TigerGraphConnection,
    attacker_id: str | None = None,
    max_paths: int = 20,
) -> list[AttackPathResponse]:
    attacks = _edge_pairs(conn, "CS_attacks")
    if attacker_id:
        attacks = [(a, d) for a, d in attacks if a == attacker_id]

    dev_attrs = _vertex_map(conn, "CS_Device")
    excluded_devices: set[str] = {
        did for did, attrs in dev_attrs.items() if _is_excluded_device(did, attrs)
    }

    attacks = [(a, d) for a, d in attacks if d not in excluded_devices]

    adj: dict[str, list[str]] = {}
    for a, b in _edge_pairs(conn, "CS_connected_to"):
        if a in excluded_devices or b in excluded_devices:
            continue
        adj.setdefault(a, []).append(b)

    vuln_sev: dict[str, int] = {}
    for v in safe_get_vertices(conn, "CS_Vulnerability"):
        vid = v.get("v_id")
        attrs = v.get("attributes") or {}
        if vid:
            vuln_sev[str(vid)] = int((attrs.get("severity") or 5))

    vuln_map: dict[str, list[tuple[str, int]]] = {}
    for dev, vuln_id in _edge_pairs(conn, "CS_has_vulnerability"):
        if dev in excluded_devices:
            continue
        vuln_map.setdefault(dev, []).append((vuln_id, vuln_sev.get(vuln_id, 5)))

    results: list[AttackPathResponse] = []
    for att, entry in attacks:
        for path in _bfs(att, entry, adj, dev_attrs):
            devices = [p for p in path if p != att]
            vuln_count = sum(len(vuln_map.get(d, [])) for d in devices)
            sev_sum = sum(s for d in devices for _, s in vuln_map.get(d, []))
            labels = [str(dev_attrs.get(d, {}).get("label") or d) for d in devices]
            hop_len = max(0, len(path) - 2)
            score = round(min(100.0, 38.0 + hop_len * 7.0 + sev_sum * 3.2 + vuln_count * 3.5), 1)
            results.append(
                AttackPathResponse(
                    attacker_id=att,
                    path=path,
                    labels=labels,
                    risk_score=score,
                    risk_band=_risk_band(score),
                    vuln_count=vuln_count,
                    vuln_severity_sum=sev_sum,
                    hop_count=hop_len,
                )
            )

    results.sort(key=lambda r: -r.risk_score)
    return results[:max_paths]


def get_risk_scores(conn: TigerGraphConnection) -> RiskScoreResponse:
    dev_attrs = _vertex_map(conn, "CS_Device")
    excluded_devices: set[str] = {
        did for did, attrs in dev_attrs.items() if _is_excluded_device(did, attrs)
    }
    vuln_sev: dict[str, int] = {}
    for v in safe_get_vertices(conn, "CS_Vulnerability"):
        vid = v.get("v_id")
        attrs = v.get("attributes") or {}
        if vid:
            vuln_sev[str(vid)] = int((attrs.get("severity") or 5))

    dev_sev: dict[str, int] = {}
    for dev, vuln_id in _edge_pairs(conn, "CS_has_vulnerability"):
        if dev in excluded_devices:
            continue
        dev_sev[dev] = dev_sev.get(dev, 0) + vuln_sev.get(vuln_id, 5)

    devices: list[DeviceRisk] = []
    for did, attrs in dev_attrs.items():
        if did in excluded_devices:
            continue
        sev = dev_sev.get(did, 0)
        crit = int(attrs.get("criticality") or 0)
        score = round(min(100.0, sev * 4.5 + crit * 3.0), 1)
        devices.append(
            DeviceRisk(
                device_id=did,
                label=str(attrs.get("label") or did),
                device_type=str(attrs.get("device_type") or "unknown"),
                criticality=crit,
                severity_sum=sev,
                risk_score=score,
                risk_band=_risk_band(score),
            )
        )

    devices.sort(key=lambda d: -d.risk_score)
    overall = round(sum(d.risk_score for d in devices) / len(devices), 1) if devices else 0.0
    return RiskScoreResponse(
        devices=devices,
        highest_risk_device=devices[0].device_id if devices else None,
        overall_risk=overall,
    )


def get_graph_data(conn: TigerGraphConnection) -> GraphDataResponse:
    paths = get_attack_paths(conn, max_paths=1)
    attack_path_nodes: set[str] = set(paths[0].path) if paths else set()
    attack_path_edges: set[tuple[str, str]] = set()
    if paths:
        p = paths[0].path
        for i in range(len(p) - 1):
            attack_path_edges.add((p[i], p[i + 1]))

    dev_attrs = _vertex_map(conn, "CS_Device")
    excluded_devices: set[str] = {
        did for did, attrs in dev_attrs.items() if _is_excluded_device(did, attrs)
    }
    vuln_attrs = _vertex_map(conn, "CS_Vulnerability")
    att_attrs = _vertex_map(conn, "CS_Attacker")

    vuln_devices: set[str] = {
        dev for dev, _ in _edge_pairs(conn, "CS_has_vulnerability") if dev not in excluded_devices
    }

    nodes: list[GraphNode] = []
    for did, attrs in dev_attrs.items():
        if did in excluded_devices:
            continue
        nodes.append(
            GraphNode(
                id=did,
                label=str(attrs.get("label") or did),
                node_type="device",
                device_type=str(attrs.get("device_type") or "unknown"),
                criticality=int(attrs.get("criticality") or 0),
                on_attack_path=did in attack_path_nodes,
                is_vulnerable=did in vuln_devices,
            )
        )
    for vid, attrs in vuln_attrs.items():
        nodes.append(
            GraphNode(
                id=vid,
                label=str(attrs.get("title") or vid),
                node_type="vulnerability",
                severity=int(attrs.get("severity") or 5),
                on_attack_path=False,
                is_vulnerable=True,
            )
        )
    for aid, attrs in att_attrs.items():
        nodes.append(
            GraphNode(
                id=aid,
                label=str(attrs.get("label") or aid),
                node_type="attacker",
                on_attack_path=aid in attack_path_nodes,
            )
        )

    edges: list[GraphEdge] = []
    for etype in ("CS_connected_to", "CS_attacks", "CS_has_vulnerability"):
        for i, (src, tgt) in enumerate(_edge_pairs(conn, etype)):
            if src in excluded_devices or tgt in excluded_devices:
                continue
            edges.append(
                GraphEdge(
                    id=f"{etype}_{i}_{src}_{tgt}",
                    source=src,
                    target=tgt,
                    edge_type=etype,
                    on_attack_path=(src, tgt) in attack_path_edges,
                )
            )

    return GraphDataResponse(nodes=nodes, edges=edges)
