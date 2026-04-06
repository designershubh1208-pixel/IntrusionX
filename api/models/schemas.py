from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ── Graph data ────────────────────────────────────────────────────────────────

class GraphNode(BaseModel):
    id: str
    label: str
    node_type: str = Field(description="attacker | device | vulnerability | asset")
    device_type: str | None = None
    criticality: int = 0
    severity: int | None = None
    on_attack_path: bool = False
    is_vulnerable: bool = False


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    edge_type: str
    on_attack_path: bool = False


class GraphDataResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


# ── Attack paths ──────────────────────────────────────────────────────────────

class AttackPathResponse(BaseModel):
    attacker_id: str
    path: list[str]
    labels: list[str]
    risk_score: float = Field(ge=0, le=100)
    risk_band: Literal["LOW", "MEDIUM", "HIGH"]
    vuln_count: int
    vuln_severity_sum: int
    hop_count: int


# ── Risk score ────────────────────────────────────────────────────────────────

class DeviceRisk(BaseModel):
    device_id: str
    label: str
    device_type: str
    criticality: int
    severity_sum: int
    risk_score: float
    risk_band: Literal["LOW", "MEDIUM", "HIGH"]


class RiskScoreResponse(BaseModel):
    devices: list[DeviceRisk]
    highest_risk_device: str | None
    overall_risk: float


# ── Simulation ────────────────────────────────────────────────────────────────

class SimulateRequest(BaseModel):
    attacker_id: str = Field(default="Hacker1", examples=["Hacker1"])
    path_index: int = Field(default=0, ge=0, description="Which ranked path to simulate")


class SimulationStep(BaseModel):
    step: int
    from_node: str
    to_node: str
    action: str
    detail: str


class SimulateResponse(BaseModel):
    attacker_id: str
    path: list[str]
    risk_score: float
    risk_band: str
    steps: list[SimulationStep]
    assessment: str


# ── AI analysis ───────────────────────────────────────────────────────────────

class AIAnalysisRequest(BaseModel):
    attacker_id: str = Field(default="Hacker1")
    path_index: int = Field(default=0, ge=0)


class AIRecommendation(BaseModel):
    category: Literal["immediate", "short_term", "long_term"]
    title: str
    detail: str


class AIAnalysisResponse(BaseModel):
    attacker_id: str
    path: list[str]
    risk_score: float
    recommendations: list[AIRecommendation]
    raw_analysis: str
    ai_available: bool


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    tigergraph_host: str
    graph: str
    ai_available: bool
    version: str
