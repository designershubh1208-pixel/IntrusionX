"""
CyberShield — Live Network Simulator
=====================================
Pushes different fake company network topologies directly into TigerGraph.
Your CyberShield dashboard will immediately reflect the new attack paths.

Usage (from repo root):
    .venv\\Scripts\\python scripts/network_simulator.py

Commands inside the simulator:
    list        — show all available network scenarios
    load <n>    — push scenario number n into TigerGraph and clear old data
    clear       — wipe all CS_* vertices from TigerGraph
    status      — show current vertex/edge counts in TigerGraph
    help        — show this help
    exit        — quit
"""
from __future__ import annotations

import os
import sys
import textwrap
import time
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv
from pyTigerGraph import TigerGraphConnection

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env", override=True)

# ── Colour helpers (works on Windows 10+ and all POSIX) ──────────────────────
R  = "\033[91m"
G  = "\033[92m"
Y  = "\033[93m"
B  = "\033[94m"
M  = "\033[95m"
C  = "\033[96m"
W  = "\033[97m"
DIM = "\033[2m"
RESET = "\033[0m"
BOLD = "\033[1m"

def c(color: str, text: str) -> str:
    return f"{color}{text}{RESET}"


# ── Data model ────────────────────────────────────────────────────────────────

@dataclass
class Device:
    id: str
    label: str
    device_type: str   # Laptop | Server | Database | Firewall | Router | IoT | Camera
    criticality: int   # 1-10

@dataclass
class Vulnerability:
    id: str
    title: str
    severity: int      # 1-10

@dataclass
class Attacker:
    id: str
    label: str

@dataclass
class NetworkScenario:
    name: str
    description: str
    devices: list[Device]
    vulnerabilities: list[Vulnerability]
    attackers: list[Attacker]
    connections: list[tuple[str, str]]          # (device_id, device_id)
    vuln_map: list[tuple[str, str]]             # (device_id, vuln_id)
    attack_entries: list[tuple[str, str]]       # (attacker_id, device_id)


# ── Scenarios ─────────────────────────────────────────────────────────────────

SCENARIOS: list[NetworkScenario] = [

    # ── 1. Small Office ───────────────────────────────────────────────────────
    NetworkScenario(
        name="Small Office (5 devices)",
        description="A tiny 5-device office: reception PC → file server → accountant DB. Easy to trace.",
        devices=[
            Device("PC1",  "Reception PC",   "Laptop",   2),
            Device("PC2",  "Manager Laptop", "Laptop",   3),
            Device("FS1",  "File Server",    "Server",   7),
            Device("DB1",  "Accounts DB",    "Database", 10),
            Device("RTR1", "Office Router",  "Router",   5),
        ],
        vulnerabilities=[
            Vulnerability("V1", "Default admin password",  9),
            Vulnerability("V2", "Unpatched SMB (MS17-010)", 10),
            Vulnerability("V3", "No firewall rules",       7),
        ],
        attackers=[
            Attacker("ATK1", "Script Kiddie"),
        ],
        connections=[
            ("PC1",  "RTR1"),
            ("PC2",  "RTR1"),
            ("RTR1", "FS1"),
            ("FS1",  "DB1"),
        ],
        vuln_map=[
            ("PC1",  "V1"),
            ("FS1",  "V2"),
            ("RTR1", "V3"),
        ],
        attack_entries=[("ATK1", "PC1")],
    ),

    # ── 2. Mid-size Corporate ─────────────────────────────────────────────────
    NetworkScenario(
        name="Mid-size Corporate (12 devices)",
        description="HR + finance departments, AD server, two DBs. Classic APT lateral-movement scenario.",
        devices=[
            Device("HR1",   "HR Laptop",       "Laptop",   2),
            Device("HR2",   "HR Laptop 2",     "Laptop",   2),
            Device("FIN1",  "Finance PC",      "Laptop",   4),
            Device("FW1",   "Perimeter FW",    "Firewall", 8),
            Device("AD1",   "Active Directory","Server",   9),
            Device("EX1",   "Exchange Mail",   "Server",   7),
            Device("FS2",   "Shared Drive",    "Server",   6),
            Device("DB2",   "HR Database",     "Database", 9),
            Device("DB3",   "Finance DB",      "Database", 10),
            Device("BK1",   "Backup Server",   "Server",   5),
            Device("PRINT1","Print Server",    "Server",   3),
            Device("VPN1",  "VPN Gateway",     "Server",   8),
        ],
        vulnerabilities=[
            Vulnerability("V4",  "CVE-2023-23397 (Outlook RCE)", 9),
            Vulnerability("V5",  "Pass-the-Hash via NTLM",       8),
            Vulnerability("V6",  "Kerberoasting — weak SPN",     7),
            Vulnerability("V7",  "SQL injection in HR portal",   9),
            Vulnerability("V8",  "Misconfigured VPN split-tunnel",6),
        ],
        attackers=[
            Attacker("APT1", "APT-29 (Cozy Bear)"),
            Attacker("APT2", "FIN7 (Carbanak)"),
        ],
        connections=[
            ("VPN1",  "FW1"),
            ("FW1",   "AD1"),
            ("FW1",   "EX1"),
            ("HR1",   "FW1"),
            ("HR2",   "FW1"),
            ("FIN1",  "FW1"),
            ("AD1",   "FS2"),
            ("AD1",   "PRINT1"),
            ("AD1",   "DB2"),
            ("EX1",   "DB2"),
            ("FS2",   "DB3"),
            ("AD1",   "BK1"),
        ],
        vuln_map=[
            ("EX1",  "V4"),
            ("AD1",  "V5"),
            ("AD1",  "V6"),
            ("DB2",  "V7"),
            ("VPN1", "V8"),
        ],
        attack_entries=[
            ("APT1", "EX1"),
            ("APT2", "VPN1"),
        ],
    ),

    # ── 3. E-Commerce Platform ────────────────────────────────────────────────
    NetworkScenario(
        name="E-Commerce Platform (10 devices)",
        description="Web app → API gateway → payment service → customer DB. Attacker targets credit card data.",
        devices=[
            Device("WEB1",  "Web Server (nginx)",   "Server",   6),
            Device("WEB2",  "Web Server 2",         "Server",   6),
            Device("LB1",   "Load Balancer",        "Server",   7),
            Device("API1",  "API Gateway",          "Server",   8),
            Device("AUTH1", "Auth Service",         "Server",   9),
            Device("PAY1",  "Payment Processor",    "Server",   10),
            Device("CART1", "Cart Service",         "Server",   5),
            Device("DB4",   "Customer DB (PII)",    "Database", 10),
            Device("DB5",   "Orders DB",            "Database", 8),
            Device("REDIS1","Redis Cache",          "Server",   4),
        ],
        vulnerabilities=[
            Vulnerability("V9",  "SSRF in image upload",       8),
            Vulnerability("V10", "JWT secret hardcoded",       9),
            Vulnerability("V11", "Stripe API key in env",      10),
            Vulnerability("V12", "No rate-limit on /login",    6),
            Vulnerability("V13", "Redis unauthenticated port", 7),
        ],
        attackers=[
            Attacker("CCARD", "Magecart Group"),
        ],
        connections=[
            ("LB1",   "WEB1"),
            ("LB1",   "WEB2"),
            ("WEB1",  "API1"),
            ("WEB2",  "API1"),
            ("API1",  "AUTH1"),
            ("API1",  "CART1"),
            ("API1",  "PAY1"),
            ("AUTH1", "DB4"),
            ("CART1", "DB5"),
            ("PAY1",  "DB4"),
            ("API1",  "REDIS1"),
        ],
        vuln_map=[
            ("WEB1",  "V9"),
            ("AUTH1", "V10"),
            ("PAY1",  "V11"),
            ("LB1",   "V12"),
            ("REDIS1","V13"),
        ],
        attack_entries=[("CCARD", "WEB1")],
    ),

    # ── 4. Hospital Network ───────────────────────────────────────────────────
    NetworkScenario(
        name="Hospital / Healthcare (9 devices)",
        description="Medical IoT devices connected to clinical systems. Ransomware entry via unpatched MRI scanner.",
        devices=[
            Device("MRI1",  "MRI Scanner",       "IoT",      5),
            Device("ECG1",  "ECG Monitor",       "IoT",      4),
            Device("PUMP1", "Infusion Pump",     "IoT",      6),
            Device("NUR1",  "Nurses Station",    "Laptop",   5),
            Device("DOC1",  "Doctor Workstation","Laptop",   5),
            Device("PACS1", "PACS Imaging Srv",  "Server",   8),
            Device("EHR1",  "EHR Server",        "Server",   9),
            Device("DB6",   "Patient Records",   "Database", 10),
            Device("DB7",   "Billing DB",        "Database", 9),
        ],
        vulnerabilities=[
            Vulnerability("V14", "Default vendor creds on MRI",  9),
            Vulnerability("V15", "Windows 7 (EOL) on NUR1",      8),
            Vulnerability("V16", "PrintNightmare (CVE-2021-34527)", 10),
            Vulnerability("V17", "Cleartext HL7 messaging",      7),
            Vulnerability("V18", "No DB encryption at rest",     8),
        ],
        attackers=[
            Attacker("RANSOM1", "REvil Ransomware"),
        ],
        connections=[
            ("MRI1",  "NUR1"),
            ("ECG1",  "NUR1"),
            ("PUMP1", "NUR1"),
            ("NUR1",  "PACS1"),
            ("DOC1",  "PACS1"),
            ("PACS1", "EHR1"),
            ("EHR1",  "DB6"),
            ("EHR1",  "DB7"),
        ],
        vuln_map=[
            ("MRI1",  "V14"),
            ("NUR1",  "V15"),
            ("PACS1", "V16"),
            ("EHR1",  "V17"),
            ("DB6",   "V18"),
        ],
        attack_entries=[("RANSOM1", "MRI1")],
    ),

    # ── 5. Cloud-Native Microservices ─────────────────────────────────────────
    NetworkScenario(
        name="Cloud-Native / Kubernetes (11 devices)",
        description="CI/CD pipeline compromised → K8s cluster lateral movement → secrets exfiltration.",
        devices=[
            Device("CICD1", "GitHub Actions Runner", "Server",    5),
            Device("REG1",  "Container Registry",    "Server",    6),
            Device("K8SM1", "K8s Master Node",       "Server",    9),
            Device("K8SW1", "K8s Worker Node 1",     "Server",    7),
            Device("K8SW2", "K8s Worker Node 2",     "Server",    7),
            Device("SVC1",  "Auth Microservice",     "Server",    8),
            Device("SVC2",  "Payment Microservice",  "Server",    10),
            Device("SVC3",  "Notification Service",  "Server",    4),
            Device("S3B1",  "S3 Config Bucket",      "Server",    7),
            Device("SEC1",  "AWS Secrets Manager",   "Server",    10),
            Device("RDS1",  "RDS PostgreSQL",        "Database",  10),
        ],
        vulnerabilities=[
            Vulnerability("V19", "Exposed Docker daemon socket",   10),
            Vulnerability("V20", "RBAC wildcard ClusterRole",       9),
            Vulnerability("V21", "Public S3 bucket (no auth)",      8),
            Vulnerability("V22", "Hardcoded AWS key in Dockerfile", 10),
            Vulnerability("V23", "Log4Shell in notification svc",   10),
        ],
        attackers=[
            Attacker("SUPPLY", "Supply-Chain Attacker"),
            Attacker("INSIDER","Malicious Insider"),
        ],
        connections=[
            ("CICD1", "REG1"),
            ("CICD1", "K8SM1"),
            ("REG1",  "K8SM1"),
            ("K8SM1", "K8SW1"),
            ("K8SM1", "K8SW2"),
            ("K8SW1", "SVC1"),
            ("K8SW1", "SVC2"),
            ("K8SW2", "SVC3"),
            ("SVC1",  "S3B1"),
            ("S3B1",  "SEC1"),
            ("SVC2",  "RDS1"),
            ("SEC1",  "RDS1"),
        ],
        vuln_map=[
            ("CICD1", "V19"),
            ("K8SM1", "V20"),
            ("S3B1",  "V21"),
            ("REG1",  "V22"),
            ("SVC3",  "V23"),
        ],
        attack_entries=[
            ("SUPPLY",  "CICD1"),
            ("INSIDER", "S3B1"),
        ],
    ),

    # ── 6. Industrial Control System (ICS/SCADA) ──────────────────────────────
    NetworkScenario(
        name="ICS / SCADA Power Grid (8 devices)",
        description="Nation-state attack on power grid: engineering laptop → HMI → PLC → SCADA → physical damage.",
        devices=[
            Device("ENG1",  "Engineering Laptop",  "Laptop",  4),
            Device("JUMP1", "Jump Server",         "Server",  7),
            Device("HMI1",  "HMI Terminal A",      "IoT",     8),
            Device("HMI2",  "HMI Terminal B",      "IoT",     7),
            Device("PLC1",  "PLC Unit (Siemens)",  "IoT",     9),
            Device("PLC2",  "PLC Unit (ABB)",      "IoT",     9),
            Device("SCADA1","SCADA Controller",    "Server",  10),
            Device("RTU1",  "Remote Terminal Unit","IoT",     8),
        ],
        vulnerabilities=[
            Vulnerability("V24", "VPN with default credentials",  9),
            Vulnerability("V25", "Modbus with no authentication", 10),
            Vulnerability("V26", "Firmware RCE (CVE-2019-13945)", 10),
            Vulnerability("V27", "Cleartext SCADA comms",         8),
            Vulnerability("V28", "USB autorun enabled on HMI",    7),
        ],
        attackers=[
            Attacker("NATION", "Sandworm (Nation-State APT)"),
        ],
        connections=[
            ("ENG1",  "JUMP1"),
            ("JUMP1", "HMI1"),
            ("JUMP1", "HMI2"),
            ("HMI1",  "PLC1"),
            ("HMI2",  "PLC2"),
            ("PLC1",  "SCADA1"),
            ("PLC2",  "SCADA1"),
            ("SCADA1","RTU1"),
        ],
        vuln_map=[
            ("ENG1",  "V24"),
            ("HMI1",  "V25"),
            ("PLC1",  "V26"),
            ("SCADA1","V27"),
            ("HMI2",  "V28"),
        ],
        attack_entries=[("NATION", "ENG1")],
    ),
]


# ── TigerGraph helpers ─────────────────────────────────────────────────────────

def _host() -> str:
    raw = os.environ.get("TG_HOST", "").strip().rstrip("/")
    if raw.startswith("http://") and "tgcloud" in raw.lower():
        return "https://" + raw.removeprefix("http://")
    return raw


def _get_token_via_https(host: str, secret: str) -> str:
    """
    Get a JWT token using the HTTPS REST++ endpoint (port 443).
    This avoids pyTigerGraph's default which tries port 14240 (GSQL port)
    and times out on TigerGraph Cloud instances.
    """
    import base64
    import requests

    creds = base64.b64encode(f"__GSQL__secret:{secret}".encode()).decode()
    url   = f"{host}:443/gsql/v1/tokens"
    r = requests.post(
        url,
        headers={
            "Authorization": f"Basic {creds}",
            "Content-Type":  "application/json",
        },
        timeout=30,
        verify=True,
    )
    if not r.ok:
        raise RuntimeError(f"Token request failed HTTP {r.status_code}: {r.text[:500]}")
    data = r.json()
    # Response is either {"token": "..."} or {"results": {"token": "..."}}
    token = (
        data.get("token")
        or (data.get("results") or {}).get("token")
        or (data.get("data") or {}).get("token")
    )
    if not token:
        raise RuntimeError(f"No token in response: {str(data)[:300]}")
    return token


def _connect() -> TigerGraphConnection:
    host   = _host()
    secret = os.environ.get("TG_SECRET", "").strip()
    graph  = (os.environ.get("CYBERSHIELD_GRAPH") or "CyberShieldGraph").strip()
    if not secret:
        print(c(R, "ERROR: TG_SECRET not set in .env"))
        sys.exit(1)
    print(c(DIM, f"  Connecting to {host} / {graph} …"))
    print(c(DIM,  "  (Getting token via HTTPS port 443 — may take 5-10s if instance is waking up)"))

    # Get token via HTTPS (port 443) — avoids GSQL port 14240 timeout
    jwt = _get_token_via_https(host, secret)

    conn = TigerGraphConnection(
        host=host,
        graphname=graph,
        tgCloud=True,
    )
    conn.apiToken  = jwt
    conn.authMode  = "token"
    conn._refresh_auth_headers()
    return conn


def _clear_all(conn: TigerGraphConnection) -> None:
    vtypes = [
        "CS_Device", "CS_Vulnerability", "CS_Attacker",
        "CS_User", "CS_IP", "CS_Asset", "CS_LogEvent",
        "CS_SecurityPatch", "CS_AttackMemory",
    ]
    for vt in vtypes:
        try:
            conn.delVertices(vt)
        except Exception:
            pass


def _push_scenario(conn: TigerGraphConnection, sc: NetworkScenario) -> None:
    _clear_all(conn)
    time.sleep(0.5)

    # Devices
    for d in sc.devices:
        conn.upsertVertex("CS_Device", d.id, {
            "device_type": d.device_type,
            "label":       d.label,
            "criticality": d.criticality,
        })

    # Vulnerabilities
    for v in sc.vulnerabilities:
        conn.upsertVertex("CS_Vulnerability", v.id, {
            "severity": v.severity,
            "title":    v.title,
        })

    # Attackers
    for a in sc.attackers:
        conn.upsertVertex("CS_Attacker", a.id, {"label": a.label})

    # Edges
    for src, tgt in sc.connections:
        conn.upsertEdge("CS_Device", src, "CS_connected_to", "CS_Device", tgt,
                        {}, vertexMustExist=True)

    for dev, vuln in sc.vuln_map:
        conn.upsertEdge("CS_Device", dev, "CS_has_vulnerability",
                        "CS_Vulnerability", vuln, {}, vertexMustExist=True)

    for atk, dev in sc.attack_entries:
        conn.upsertEdge("CS_Attacker", atk, "CS_attacks", "CS_Device", dev,
                        {}, vertexMustExist=True)


# ── CLI ───────────────────────────────────────────────────────────────────────

def _print_banner() -> None:
    print()
    print(c(BOLD + C, "╔══════════════════════════════════════════════════════╗"))
    print(c(BOLD + C, "║     CyberShield — Live Network Simulator             ║"))
    print(c(BOLD + C, "║     Push real data into TigerGraph & watch the       ║"))
    print(c(BOLD + C, "║     dashboard update in real-time                    ║"))
    print(c(BOLD + C, "╚══════════════════════════════════════════════════════╝"))
    print()


def _print_help() -> None:
    print(f"""
  {c(Y, 'list')}             — list all available scenarios
  {c(Y, 'load <n>')}         — push scenario n into TigerGraph (clears old data)
  {c(Y, 'clear')}            — wipe all CS_* data from TigerGraph
  {c(Y, 'status')}           — show current vertex/edge counts
  {c(Y, 'help')}             — show this message
  {c(Y, 'exit')} / {c(Y, 'quit')}     — exit
""")


def _print_scenarios() -> None:
    print()
    for i, sc in enumerate(SCENARIOS, 1):
        print(f"  {c(BOLD + W, str(i)+'.')} {c(G, sc.name)}")
        desc = textwrap.fill(sc.description, width=60, initial_indent="     ", subsequent_indent="     ")
        print(c(DIM, desc))
        print(f"     {c(B, str(len(sc.devices)))} devices  "
              f"{c(Y, str(len(sc.vulnerabilities)))} vulns  "
              f"{c(R, str(len(sc.attackers)))} attackers  "
              f"{c(M, str(len(sc.connections)))} connections")
        print()


def _print_status(conn: TigerGraphConnection) -> None:
    print()
    vtypes = [
        ("CS_Device",        B),
        ("CS_Vulnerability", Y),
        ("CS_Attacker",      R),
    ]
    for vt, color in vtypes:
        try:
            n = conn.getVertexCount(vt)
            print(f"  {color}{vt}{RESET}: {c(W, str(n))}")
        except Exception as e:
            print(f"  {vt}: {c(R, str(e)[:60])}")

    for et in ("CS_connected_to", "CS_has_vulnerability", "CS_attacks"):
        try:
            n = conn.getEdgeCount(et)
            print(f"  {c(DIM, et)}: {c(W, str(n))}")
        except Exception:
            pass
    print()


def main() -> None:
    # Enable ANSI on Windows
    if sys.platform == "win32":
        os.system("color")

    _print_banner()
    print(c(DIM, "  Initialising TigerGraph connection…"))

    try:
        conn = _connect()
        print(c(G, "  ✓ Connected!\n"))
    except Exception as e:
        print(c(R, f"  ✗ Connection failed: {e}"))
        sys.exit(1)

    _print_help()

    while True:
        try:
            raw = input(c(C, "simulator") + c(DIM, " ❯ ") + W).strip()
        except (EOFError, KeyboardInterrupt):
            print(c(Y, "\n  Goodbye!"))
            break

        if not raw:
            continue

        parts = raw.split()
        cmd   = parts[0].lower()

        if cmd in ("exit", "quit"):
            print(c(Y, "  Goodbye!"))
            break

        elif cmd == "help":
            _print_help()

        elif cmd == "list":
            _print_scenarios()

        elif cmd == "status":
            _print_status(conn)

        elif cmd == "clear":
            print(c(Y, "  Clearing all CS_* data from TigerGraph…"))
            try:
                _clear_all(conn)
                print(c(G, "  ✓ Cleared. Dashboard will show empty graph.\n"))
            except Exception as e:
                print(c(R, f"  ✗ Error: {e}\n"))

        elif cmd == "load":
            if len(parts) < 2 or not parts[1].isdigit():
                print(c(R, "  Usage: load <n>   (e.g. load 2)\n"))
                continue
            idx = int(parts[1]) - 1
            if idx < 0 or idx >= len(SCENARIOS):
                print(c(R, f"  Scenario must be between 1 and {len(SCENARIOS)}\n"))
                continue

            sc = SCENARIOS[idx]
            print()
            print(c(BOLD + G, f"  Loading: {sc.name}"))
            print(c(DIM,      f"  {sc.description}"))
            print()

            steps = [
                ("Clearing old data",        lambda: _clear_all(conn)),
                ("Upserting devices",        lambda: [conn.upsertVertex("CS_Device", d.id, {"device_type": d.device_type, "label": d.label, "criticality": d.criticality}) for d in sc.devices]),
                ("Upserting vulnerabilities",lambda: [conn.upsertVertex("CS_Vulnerability", v.id, {"severity": v.severity, "title": v.title}) for v in sc.vulnerabilities]),
                ("Upserting attackers",      lambda: [conn.upsertVertex("CS_Attacker", a.id, {"label": a.label}) for a in sc.attackers]),
                ("Creating connections",     lambda: [conn.upsertEdge("CS_Device", s, "CS_connected_to", "CS_Device", t, {}, vertexMustExist=True) for s, t in sc.connections]),
                ("Mapping vulnerabilities",  lambda: [conn.upsertEdge("CS_Device", d, "CS_has_vulnerability", "CS_Vulnerability", v, {}, vertexMustExist=True) for d, v in sc.vuln_map]),
                ("Setting attack entries",   lambda: [conn.upsertEdge("CS_Attacker", a, "CS_attacks", "CS_Device", d, {}, vertexMustExist=True) for a, d in sc.attack_entries]),
            ]

            ok = True
            for label, fn in steps:
                print(f"    {c(DIM, '→')} {label}…", end=" ", flush=True)
                try:
                    fn()
                    print(c(G, "✓"))
                except Exception as e:
                    print(c(R, f"✗  ({e})"))
                    ok = False
                    break

            if ok:
                print()
                print(c(BOLD + G, f"  ✓ Scenario loaded successfully!"))
                print()
                print(f"  {c(B, str(len(sc.devices)))} devices  "
                      f"{c(Y, str(len(sc.vulnerabilities)))} vulnerabilities  "
                      f"{c(R, str(len(sc.attackers)))} attackers")
                print()
                print(c(W, "  ─── Attack entry points ───"))
                for atk_id, dev_id in sc.attack_entries:
                    atk = next(a for a in sc.attackers if a.id == atk_id)
                    dev = next(d for d in sc.devices   if d.id == dev_id)
                    print(f"    {c(R, atk.label)} → {c(Y, dev.label)} (crit: {dev.criticality})")
                print()
                print(c(W, "  ─── Vulnerabilities ───"))
                for v in sc.vulnerabilities:
                    bar = c(R if v.severity >= 8 else Y, "█" * v.severity + "░" * (10 - v.severity))
                    print(f"    {bar} {v.severity:2d}/10  {v.title}")
                print()
                print(c(G + BOLD, "  Now refresh your CyberShield dashboard → Live tab!"))
                print(c(DIM,      "  http://localhost:5173/graph  (Network Graph page)"))
                print()
            else:
                print(c(R, "\n  Load failed — check TigerGraph connection.\n"))

        else:
            print(c(R, f"  Unknown command: '{cmd}'. Type 'help' for commands.\n"))


if __name__ == "__main__":
    main()
