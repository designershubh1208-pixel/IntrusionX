"""
Built-in demo scenarios — each one is a self-contained network topology with
different devices, vulnerabilities, and attack paths.  They are generated
entirely in Python so no extra TigerGraph data is needed.

Scenario IDs:
  live       — real data from TigerGraph (default)
  corporate  — typical enterprise network (laptops → servers → DBs)
  hospital   — healthcare IoT network (medical devices → patient records)
  cloud      — cloud-native microservices (containers → S3 → secrets)
  ics        — industrial control system (HMI → PLC → SCADA)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from api.models.schemas import GraphDataResponse, GraphEdge, GraphNode

ScenarioId = Literal["live", "corporate", "hospital", "cloud", "ics"]

SCENARIO_LABELS: dict[ScenarioId, str] = {
    "live":      "Live TigerGraph",
    "corporate": "Enterprise Network",
    "hospital":  "Healthcare IoT",
    "cloud":     "Cloud-Native",
    "ics":       "Industrial Control (ICS)",
}


@dataclass
class _Node:
    id: str
    label: str
    node_type: str          # attacker | device | vulnerability
    device_type: str = ""
    criticality: int = 0
    severity: int = 0
    is_vulnerable: bool = False


@dataclass
class _Edge:
    src: str
    tgt: str
    etype: str              # attacks | connected_to | has_vulnerability


@dataclass
class _Scenario:
    nodes: list[_Node] = field(default_factory=list)
    edges: list[_Edge] = field(default_factory=list)
    # The single top attack path (list of node ids, attacker first)
    attack_path: list[str] = field(default_factory=list)


# ── Scenario builders ─────────────────────────────────────────────────────────

def _corporate() -> _Scenario:
    nodes = [
        _Node("ATK1",  "APT-29",          "attacker"),
        _Node("WS1",   "Dev Workstation",  "device", "Workstation", 3),
        _Node("WS2",   "HR Laptop",        "device", "Laptop",      2),
        _Node("FW1",   "Perimeter FW",     "device", "Firewall",    6),
        _Node("SRV1",  "AD Server",        "device", "Server",      9),
        _Node("SRV2",  "File Server",      "device", "Server",      7),
        _Node("DB1",   "Finance DB",       "device", "Database",    10),
        _Node("DB2",   "HR Database",      "device", "Database",    8),
        _Node("V1",    "CVE-2023-23397",   "vulnerability", severity=9),
        _Node("V2",    "Pass-the-Hash",    "vulnerability", severity=8),
        _Node("V3",    "SMB Relay",        "vulnerability", severity=7),
        _Node("V4",    "SQL Injection",    "vulnerability", severity=9),
    ]
    edges = [
        _Edge("ATK1", "WS1",  "attacks"),
        _Edge("WS1",  "FW1",  "connected_to"),
        _Edge("WS2",  "FW1",  "connected_to"),
        _Edge("FW1",  "SRV1", "connected_to"),
        _Edge("SRV1", "SRV2", "connected_to"),
        _Edge("SRV1", "DB1",  "connected_to"),
        _Edge("SRV2", "DB2",  "connected_to"),
        _Edge("WS1",  "V1",   "has_vulnerability"),
        _Edge("FW1",  "V2",   "has_vulnerability"),
        _Edge("SRV1", "V3",   "has_vulnerability"),
        _Edge("DB1",  "V4",   "has_vulnerability"),
    ]
    return _Scenario(nodes, edges, ["ATK1", "WS1", "FW1", "SRV1", "DB1"])


def _hospital() -> _Scenario:
    nodes = [
        _Node("ATK2",  "Ransomware Bot",    "attacker"),
        _Node("MRI1",  "MRI Scanner",       "device", "Medical Device", 5),
        _Node("IOT1",  "Infusion Pump",     "device", "IoT",            4),
        _Node("IOT2",  "Patient Monitor",   "device", "IoT",            6),
        _Node("NUR1",  "Nurses Station PC", "device", "Workstation",    5),
        _Node("SRV3",  "PACS Server",       "device", "Server",         8),
        _Node("DB3",   "Patient Records",   "device", "Database",       10),
        _Node("DB4",   "Billing DB",        "device", "Database",       9),
        _Node("V5",    "Default Creds",     "vulnerability", severity=9),
        _Node("V6",    "Unpatched OS",      "vulnerability", severity=8),
        _Node("V7",    "No Encryption",     "vulnerability", severity=7),
        _Node("V8",    "CVE-2021-34527",    "vulnerability", severity=10),
    ]
    edges = [
        _Edge("ATK2", "IOT1",  "attacks"),
        _Edge("IOT1", "NUR1",  "connected_to"),
        _Edge("MRI1", "NUR1",  "connected_to"),
        _Edge("IOT2", "NUR1",  "connected_to"),
        _Edge("NUR1", "SRV3",  "connected_to"),
        _Edge("SRV3", "DB3",   "connected_to"),
        _Edge("SRV3", "DB4",   "connected_to"),
        _Edge("IOT1", "V5",    "has_vulnerability"),
        _Edge("NUR1", "V6",    "has_vulnerability"),
        _Edge("IOT2", "V7",    "has_vulnerability"),
        _Edge("SRV3", "V8",    "has_vulnerability"),
    ]
    return _Scenario(nodes, edges, ["ATK2", "IOT1", "NUR1", "SRV3", "DB3"])


def _cloud() -> _Scenario:
    nodes = [
        _Node("ATK3",  "Supply-Chain Actor",  "attacker"),
        _Node("CI1",   "CI/CD Pipeline",      "device", "Container",  5),
        _Node("K8S1",  "K8s API Server",      "device", "Container",  8),
        _Node("SVC1",  "Auth Microservice",   "device", "Container",  7),
        _Node("SVC2",  "Payment Service",     "device", "Container",  9),
        _Node("S3B1",  "Config S3 Bucket",    "device", "Storage",    6),
        _Node("SEC1",  "Secrets Manager",     "device", "Secrets",    10),
        _Node("DB5",   "RDS Postgres",        "device", "Database",   10),
        _Node("V9",    "Exposed Docker API",  "vulnerability", severity=9),
        _Node("V10",   "RBAC Misconfigured",  "vulnerability", severity=8),
        _Node("V11",   "Public S3 Bucket",    "vulnerability", severity=7),
        _Node("V12",   "Hardcoded Secret",    "vulnerability", severity=10),
    ]
    edges = [
        _Edge("ATK3", "CI1",   "attacks"),
        _Edge("CI1",  "K8S1",  "connected_to"),
        _Edge("K8S1", "SVC1",  "connected_to"),
        _Edge("K8S1", "SVC2",  "connected_to"),
        _Edge("SVC1", "S3B1",  "connected_to"),
        _Edge("S3B1", "SEC1",  "connected_to"),
        _Edge("SVC2", "DB5",   "connected_to"),
        _Edge("CI1",  "V9",    "has_vulnerability"),
        _Edge("K8S1", "V10",   "has_vulnerability"),
        _Edge("S3B1", "V11",   "has_vulnerability"),
        _Edge("SEC1", "V12",   "has_vulnerability"),
    ]
    return _Scenario(nodes, edges, ["ATK3", "CI1", "K8S1", "S3B1", "SEC1"])


def _ics() -> _Scenario:
    nodes = [
        _Node("ATK4",  "Nation-State APT",  "attacker"),
        _Node("ENG1",  "Engineering PC",    "device", "Workstation",  4),
        _Node("HMI1",  "HMI Terminal",      "device", "HMI",          7),
        _Node("HMI2",  "Backup HMI",        "device", "HMI",          6),
        _Node("PLC1",  "PLC Unit A",        "device", "PLC",          9),
        _Node("PLC2",  "PLC Unit B",        "device", "PLC",          8),
        _Node("SCADA", "SCADA Controller",  "device", "SCADA",        10),
        _Node("RTU1",  "Remote Terminal",   "device", "RTU",          7),
        _Node("V13",   "Modbus No Auth",    "vulnerability", severity=9),
        _Node("V14",   "VPN Bypass",        "vulnerability", severity=8),
        _Node("V15",   "Firmware RCE",      "vulnerability", severity=10),
        _Node("V16",   "Cleartext Comms",   "vulnerability", severity=6),
    ]
    edges = [
        _Edge("ATK4", "ENG1",  "attacks"),
        _Edge("ENG1", "HMI1",  "connected_to"),
        _Edge("ENG1", "HMI2",  "connected_to"),
        _Edge("HMI1", "PLC1",  "connected_to"),
        _Edge("HMI2", "PLC2",  "connected_to"),
        _Edge("PLC1", "SCADA", "connected_to"),
        _Edge("PLC2", "SCADA", "connected_to"),
        _Edge("SCADA","RTU1",  "connected_to"),
        _Edge("ENG1", "V14",   "has_vulnerability"),
        _Edge("HMI1", "V13",   "has_vulnerability"),
        _Edge("PLC1", "V15",   "has_vulnerability"),
        _Edge("SCADA","V16",   "has_vulnerability"),
    ]
    return _Scenario(nodes, edges, ["ATK4", "ENG1", "HMI1", "PLC1", "SCADA"])


# ── Converter ─────────────────────────────────────────────────────────────────

def _build_response(sc: _Scenario) -> GraphDataResponse:
    attack_path_set = set(sc.attack_path)
    attack_edge_set: set[tuple[str, str]] = set()
    for i in range(len(sc.attack_path) - 1):
        attack_edge_set.add((sc.attack_path[i], sc.attack_path[i + 1]))

    vuln_devices = {e.src for e in sc.edges if e.etype == "has_vulnerability"}

    graph_nodes = [
        GraphNode(
            id=n.id,
            label=n.label,
            node_type=n.node_type,
            device_type=n.device_type or None,
            criticality=n.criticality,
            severity=n.severity or None,
            on_attack_path=n.id in attack_path_set,
            is_vulnerable=n.id in vuln_devices or n.node_type == "vulnerability",
        )
        for n in sc.nodes
    ]

    graph_edges = [
        GraphEdge(
            id=f"{e.etype}_{i}_{e.src}_{e.tgt}",
            source=e.src,
            target=e.tgt,
            edge_type=e.etype,
            on_attack_path=(e.src, e.tgt) in attack_edge_set,
        )
        for i, e in enumerate(sc.edges)
    ]

    return GraphDataResponse(nodes=graph_nodes, edges=graph_edges)


# ── Public API ────────────────────────────────────────────────────────────────

_BUILDERS = {
    "corporate": _corporate,
    "hospital":  _hospital,
    "cloud":     _cloud,
    "ics":       _ics,
}


def get_scenario_graph(scenario_id: str) -> GraphDataResponse:
    builder = _BUILDERS.get(scenario_id)
    if builder is None:
        raise ValueError(f"Unknown scenario: {scenario_id!r}")
    return _build_response(builder())


def list_scenarios() -> list[dict]:
    return [
        {"id": sid, "label": label}
        for sid, label in SCENARIO_LABELS.items()
    ]
