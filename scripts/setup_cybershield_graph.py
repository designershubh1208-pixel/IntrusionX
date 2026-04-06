"""
CyberShield AI — create graph schema, install queries, load demo data on TigerGraph Cloud.

Uses this connection pattern:
  TG_HOST, TG_SECRET, and CYBERSHIELD_GRAPH (default CyberShieldGraph).

Vertex/edge types are prefixed CS_* so they can coexist with other graphs on the same instance.

Run from repo root:
  .venv\\Scripts\\python scripts/setup_cybershield_graph.py
"""
from __future__ import annotations

import base64
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv
from pyTigerGraph import TigerGraphConnection

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")


def _host() -> str:
    raw = os.environ["TG_HOST"].strip().rstrip("/")
    if raw.startswith("http://") and "tgcloud" in raw.lower():
        return "https://" + raw.removeprefix("http://")
    return raw


def _graph_name() -> str:
    g = (os.environ.get("CYBERSHIELD_GRAPH") or "CyberShieldGraph").strip() or "CyberShieldGraph"
    if g.lower() == "cursor":
        return "CyberShieldGraph"
    return g


def post_gsql_ddl(sql: str) -> str:
    h = _host()
    secret = os.environ.get("TG_SECRET") or os.environ.get("TG_API_TOKEN", "")
    if not secret:
        raise RuntimeError("Set TG_SECRET to your GSQL secret.")
    creds = base64.b64encode(f"__GSQL__secret:{secret}".encode()).decode()
    r = requests.post(
        f"{h}:443/gsql/v1/statements",
        data=sql.encode("utf-8"),
        headers={
            "Authorization": f"Basic {creds}",
            "Content-Type": "text/plain",
            "X-User-Agent": "pyTigerGraph",
        },
        verify=True,
        timeout=300,
    )
    if not r.ok:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:4000]}")
    text = r.text
    if "Semantic Check Fails" in text or "Syntax Error" in text:
        raise RuntimeError(text[:8000])
    return text


def drop_query_if_exists(name: str) -> None:
    try:
        post_gsql_ddl(f"DROP QUERY {name}")
    except RuntimeError as e:
        msg = str(e).lower()
        if any(
            x in msg
            for x in (
                "does not exist",
                "cannot find",
                "unknown query",
                "could not be found",
                "not be found anywhere",
            )
        ):
            return
        raise


def ddl_graph(g: str) -> str:
    return f"""
USE GLOBAL

CREATE VERTEX CS_Device (
  PRIMARY_ID id STRING,
  device_type STRING,
  label STRING,
  criticality INT
)

CREATE VERTEX CS_Vulnerability (
  PRIMARY_ID id STRING,
  severity INT,
  title STRING
)

CREATE VERTEX CS_Attacker (
  PRIMARY_ID id STRING,
  label STRING
)

CREATE VERTEX CS_User (
  PRIMARY_ID id STRING,
  name STRING,
  role STRING
)

CREATE VERTEX CS_IP (
  PRIMARY_ID id STRING,
  address STRING,
  reputation STRING
)

CREATE VERTEX CS_Asset (
  PRIMARY_ID id STRING,
  name STRING,
  asset_type STRING,
  criticality INT
)

CREATE VERTEX CS_LogEvent (
  PRIMARY_ID id STRING,
  event_type STRING,
  severity STRING
)

CREATE VERTEX CS_SecurityPatch (
  PRIMARY_ID id STRING,
  kb_id STRING,
  description STRING
)

CREATE VERTEX CS_AttackMemory (
  PRIMARY_ID id STRING,
  attacker_id STRING,
  path_json STRING,
  risk_score DOUBLE,
  outcome STRING,
  recorded_at STRING
)

CREATE DIRECTED EDGE CS_connected_to (FROM CS_Device, TO CS_Device)
CREATE DIRECTED EDGE CS_has_vulnerability (FROM CS_Device, TO CS_Vulnerability)
CREATE DIRECTED EDGE CS_attacks (FROM CS_Attacker, TO CS_Device)
CREATE DIRECTED EDGE CS_accessed_by (FROM CS_User, TO CS_Device)
CREATE DIRECTED EDGE CS_can_reach (FROM CS_IP, TO CS_Device)
CREATE DIRECTED EDGE CS_affects (FROM CS_Device, TO CS_Asset)
CREATE DIRECTED EDGE CS_generated_log (FROM CS_Device, TO CS_LogEvent)
CREATE DIRECTED EDGE CS_protected_by (FROM CS_Device, TO CS_SecurityPatch)
CREATE DIRECTED EDGE CS_remembers (FROM CS_Attacker, TO CS_AttackMemory)

CREATE GRAPH {g} (
  CS_Device,
  CS_Vulnerability,
  CS_Attacker,
  CS_User,
  CS_IP,
  CS_Asset,
  CS_LogEvent,
  CS_SecurityPatch,
  CS_AttackMemory,
  CS_connected_to,
  CS_has_vulnerability,
  CS_attacks,
  CS_accessed_by,
  CS_can_reach,
  CS_affects,
  CS_generated_log,
  CS_protected_by,
  CS_remembers
)
"""


def ddl_queries(g: str) -> str:
    return f"""
USE GRAPH {g}

CREATE QUERY cs_risk_per_device() FOR GRAPH {g} {{
  SumAccum<INT> @sev_sum;
  Start = {{CS_Device.*}};
  R = SELECT dv
      FROM Start:dv -(CS_has_vulnerability:e)-> CS_Vulnerability:v
      ACCUM dv.@sev_sum += v.severity;
  PRINT R AS devices_with_risk;
}}

CREATE QUERY cs_attack_entry_points() FOR GRAPH {g} {{
  Att = {{CS_Attacker.*}};
  R = SELECT dev
      FROM Att:atk -(CS_attacks:e)-> CS_Device:dev;
  PRINT R AS entry_devices;
}}

INSTALL QUERY cs_risk_per_device
INSTALL QUERY cs_attack_entry_points
"""


def _apply_jwt(conn: TigerGraphConnection, secret: str) -> None:
    tok = conn.getToken(secret=secret)
    jwt = tok[0] if isinstance(tok, tuple) else tok
    conn.apiToken = jwt
    conn.authMode = "token"
    conn._refresh_auth_headers()


def load_demo_data(conn: TigerGraphConnection) -> None:
    # Devices — fake company network
    devices = [
        ("Laptop1", "Laptop", "Finance Laptop 1", 3),
        ("Laptop2", "Laptop", "Eng Laptop 2", 3),
        ("Laptop3", "Laptop", "Sales Laptop 3", 2),
        ("Server1", "Server", "App Server East", 7),
        ("Server2", "Server", "Auth Server", 8),
        ("Server3", "Server", "Backup Server", 4),
        ("Database1", "Database", "Customer DB", 10),
        ("Database2", "Database", "Analytics DB", 6),
    ]
    for did, dtype, lbl, crit in devices:
        conn.upsertVertex(
            "CS_Device", did, {"device_type": dtype, "label": lbl, "criticality": crit}
        )

    vulns = [
        ("WeakPassword", 8, "Weak password policy"),
        ("OpenPort", 7, "RDP open to WAN"),
        ("CVE-2024-XYZ", 9, "Remote code execution"),
        ("Misconfig_S3", 6, "Public bucket metadata"),
        ("LegacyTLS", 5, "TLS 1.0 enabled"),
    ]
    for vid, sev, title in vulns:
        conn.upsertVertex("CS_Vulnerability", vid, {"severity": sev, "title": title})

    attackers = [("Hacker1", "APT North"), ("Hacker2", "Ransomware Bot")]
    for aid, lbl in attackers:
        conn.upsertVertex("CS_Attacker", aid, {"label": lbl})

    users = [
        ("U1", "Alice", "analyst"),
        ("U2", "Bob", "admin"),
        ("U3", "Carol", "contractor"),
    ]
    for uid, name, role in users:
        conn.upsertVertex("CS_User", uid, {"name": name, "role": role})

    ips = [
        ("IP1", "203.0.113.50", "malicious"),
        ("IP2", "198.51.100.10", "suspicious"),
    ]
    for iid, addr, rep in ips:
        conn.upsertVertex("CS_IP", iid, {"address": addr, "reputation": rep})

    assets = [
        ("A1", "Customer PII", "data", 10),
        ("A2", "Payment Records", "data", 9),
    ]
    for aid, name, atype, crit in assets:
        conn.upsertVertex("CS_Asset", aid, {"name": name, "asset_type": atype, "criticality": crit})

    logs = [
        ("LOG1", "failed_login", "medium"),
        ("LOG2", "priv_escalation", "high"),
    ]
    for lid, et, sev in logs:
        conn.upsertVertex("CS_LogEvent", lid, {"event_type": et, "severity": sev})

    patches = [
        ("PATCH1", "KB5034441", "Patch RDP / harden port rules"),
        ("PATCH2", "KB5034129", "Credential policy update"),
    ]
    for pid, kb, desc in patches:
        conn.upsertVertex("CS_SecurityPatch", pid, {"kb_id": kb, "description": desc})

    # Topology: attacker -> laptop -> servers -> databases
    connected = [
        ("Laptop1", "Server1"),
        ("Laptop2", "Server1"),
        ("Laptop3", "Server3"),
        ("Server1", "Server2"),
        ("Server2", "Database1"),
        ("Server1", "Database2"),
        ("Server3", "Database2"),
    ]
    for a, b in connected:
        conn.upsertEdge(
            "CS_Device",
            a,
            "CS_connected_to",
            "CS_Device",
            b,
            {},
            vertexMustExist=True,
        )

    has_v = [
        ("Laptop1", "WeakPassword"),
        ("Server1", "OpenPort"),
        ("Server2", "CVE-2024-XYZ"),
        ("Database1", "Misconfig_S3"),
        ("Server3", "LegacyTLS"),
    ]
    for dv, vv in has_v:
        conn.upsertEdge(
            "CS_Device",
            dv,
            "CS_has_vulnerability",
            "CS_Vulnerability",
            vv,
            {},
            vertexMustExist=True,
        )

    conn.upsertEdge(
        "CS_Attacker", "Hacker1", "CS_attacks", "CS_Device", "Laptop1", {}, vertexMustExist=True
    )
    conn.upsertEdge(
        "CS_Attacker", "Hacker2", "CS_attacks", "CS_Device", "Laptop3", {}, vertexMustExist=True
    )

    conn.upsertEdge(
        "CS_User", "U1", "CS_accessed_by", "CS_Device", "Laptop1", {}, vertexMustExist=True
    )
    conn.upsertEdge(
        "CS_User", "U2", "CS_accessed_by", "CS_Device", "Server2", {}, vertexMustExist=True
    )

    conn.upsertEdge(
        "CS_IP", "IP1", "CS_can_reach", "CS_Device", "Laptop1", {}, vertexMustExist=True
    )

    conn.upsertEdge(
        "CS_Device", "Database1", "CS_affects", "CS_Asset", "A1", {}, vertexMustExist=True
    )
    conn.upsertEdge(
        "CS_Device", "Database1", "CS_affects", "CS_Asset", "A2", {}, vertexMustExist=True
    )

    conn.upsertEdge(
        "CS_Device", "Laptop1", "CS_generated_log", "CS_LogEvent", "LOG1", {}, vertexMustExist=True
    )
    conn.upsertEdge(
        "CS_Device", "Server2", "CS_generated_log", "CS_LogEvent", "LOG2", {}, vertexMustExist=True
    )

    conn.upsertEdge(
        "CS_Device", "Server1", "CS_protected_by", "CS_SecurityPatch", "PATCH1", {}, vertexMustExist=True
    )
    conn.upsertEdge(
        "CS_Device", "Laptop1", "CS_protected_by", "CS_SecurityPatch", "PATCH2", {}, vertexMustExist=True
    )

    # Memory-based learning (sample history)
    conn.upsertVertex(
        "CS_AttackMemory",
        "MEM1",
        {
            "attacker_id": "Hacker1",
            "path_json": '["Hacker1","Laptop1","Server1","Database1"]',
            "risk_score": 0.91,
            "outcome": "data_exfil_blocked",
            "recorded_at": "2025-11-01T12:00:00Z",
        },
    )
    conn.upsertEdge(
        "CS_Attacker", "Hacker1", "CS_remembers", "CS_AttackMemory", "MEM1", {}, vertexMustExist=True
    )


def main() -> int:
    GRAPH = _graph_name()
    secret = os.environ.get("TG_SECRET") or os.environ.get("TG_API_TOKEN", "")
    if not secret:
        print("Set TG_SECRET in .env", file=sys.stderr)
        return 1

    print("Host:", _host())
    print("Graph:", GRAPH)

    print("Creating CyberShield schema (GSQL)...")
    try:
        out = post_gsql_ddl(ddl_graph(GRAPH))
        print(out[:4000])
    except RuntimeError as e:
        msg = str(e)
        if any(
            x in msg.lower()
            for x in ("already exists", "alreadyexist", "used by another", "failed to create")
        ):
            print("Schema may already exist; continuing to queries/data.", file=sys.stderr)
        else:
            print(msg, file=sys.stderr)
            return 1

    print("Installing queries (GSQL)...")
    for qn in ("cs_risk_per_device", "cs_attack_entry_points"):
        drop_query_if_exists(qn)
    try:
        qout = post_gsql_ddl(ddl_queries(GRAPH))
        print(qout[:4000])
    except RuntimeError as e:
        msg = str(e)
        print("Query install note:", msg[:1500], file=sys.stderr)
        if "Syntax Error" in msg or "Semantic Check" in msg:
            return 1

    print("Loading demo data (REST upsert)...")
    conn = TigerGraphConnection(
        host=_host(),
        graphname=GRAPH,
        gsqlSecret=secret,
        tgCloud=True,
    )
    _apply_jwt(conn, secret)
    load_demo_data(conn)

    print("CS_Device count:", conn.getVertexCount("CS_Device"))
    print("CS_attacks count:", conn.getEdgeCount("CS_attacks"))
    print("CS_connected_to count:", conn.getEdgeCount("CS_connected_to"))
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
