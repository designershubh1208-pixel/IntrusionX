from __future__ import annotations

import threading
from typing import Any

from pyTigerGraph import TigerGraphConnection

from api.core.config import get_settings
from api.core.logging import get_logger

logger = get_logger(__name__)
_lock = threading.Lock()
_conn: TigerGraphConnection | None = None


def _make_connection() -> TigerGraphConnection:
    settings = get_settings()
    if not settings.tg_credential:
        raise RuntimeError("TG_SECRET is not set in .env")
    conn = TigerGraphConnection(
        host=settings.tg_host_https,
        graphname=settings.graph_name,
        gsqlSecret=settings.tg_credential,
        tgCloud=settings.tg_cloud,
        apiToken=settings.tg_api_token or "",
    )
    # For pyTigerGraph compatibility, let the library set token/auth internals.
    # Manual auth-mode mutation can break on version differences.
    if not settings.tg_api_token:
        conn.getToken(secret=settings.tg_credential, setToken=True)
    logger.info("TigerGraph connection established → %s / %s", settings.tg_host_https, settings.graph_name)
    return conn


def get_conn() -> TigerGraphConnection:
    global _conn
    with _lock:
        if _conn is None:
            _conn = _make_connection()
        return _conn


def reset_conn() -> None:
    global _conn
    with _lock:
        _conn = None


def safe_get_vertices(conn: TigerGraphConnection, vertex_type: str) -> list[dict[str, Any]]:
    raw = conn.getVertices(vertex_type, fmt="py")
    return raw if isinstance(raw, list) else []


def safe_get_edges(conn: TigerGraphConnection, edge_type: str) -> list[dict[str, Any]]:
    raw = conn.getEdgesByType(edge_type, fmt="py")
    return raw if isinstance(raw, list) else []
