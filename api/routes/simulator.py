from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.core.logging import get_logger
from api.core.tigergraph import get_conn, reset_conn

logger = get_logger(__name__)
router = APIRouter(prefix="/simulator", tags=["simulator"])


class LoadRequest(BaseModel):
    scenario: int = Field(ge=1, le=6, description="Scenario number 1-6")


# ── Scenario definitions (mirror of scripts/network_simulator.py) ─────────────

def _scenario_1(conn):
    """Small Office — 5 devices"""
    _clear(conn)
    devices = [
        ("PC1",  "Reception PC",   "Laptop",   2),
        ("PC2",  "Manager Laptop", "Laptop",   3),
        ("FS1",  "File Server",    "Server",   7),
        ("DB1",  "Accounts DB",    "Database", 10),
        ("RTR1", "Office Router",  "Router",   5),
    ]
    vulns = [
        ("V1", "Default admin password",   9),
        ("V2", "Unpatched SMB (MS17-010)", 10),
        ("V3", "No firewall rules",        7),
    ]
    attackers = [("ATK1", "Script Kiddie")]
    connections = [("PC1","RTR1"),("PC2","RTR1"),("RTR1","FS1"),("FS1","DB1")]
    vuln_map    = [("PC1","V1"),("FS1","V2"),("RTR1","V3")]
    entries     = [("ATK1","PC1")]
    _push(conn, devices, vulns, attackers, connections, vuln_map, entries)
    return "Small Office (5 devices)"


def _scenario_2(conn):
    """Mid-size Corporate — 12 devices"""
    _clear(conn)
    devices = [
        ("HR1","HR Laptop","Laptop",2),("HR2","HR Laptop 2","Laptop",2),
        ("FIN1","Finance PC","Laptop",4),("FW1","Perimeter FW","Firewall",8),
        ("AD1","Active Directory","Server",9),("EX1","Exchange Mail","Server",7),
        ("FS2","Shared Drive","Server",6),("DB2","HR Database","Database",9),
        ("DB3","Finance DB","Database",10),("BK1","Backup Server","Server",5),
        ("PRINT1","Print Server","Server",3),("VPN1","VPN Gateway","Server",8),
    ]
    vulns = [
        ("V4","CVE-2023-23397 (Outlook RCE)",9),("V5","Pass-the-Hash via NTLM",8),
        ("V6","Kerberoasting — weak SPN",7),("V7","SQL injection in HR portal",9),
        ("V8","Misconfigured VPN split-tunnel",6),
    ]
    attackers = [("APT1","APT-29 (Cozy Bear)"),("APT2","FIN7 (Carbanak)")]
    connections = [
        ("VPN1","FW1"),("FW1","AD1"),("FW1","EX1"),("HR1","FW1"),("HR2","FW1"),
        ("FIN1","FW1"),("AD1","FS2"),("AD1","PRINT1"),("AD1","DB2"),
        ("EX1","DB2"),("FS2","DB3"),("AD1","BK1"),
    ]
    vuln_map = [("EX1","V4"),("AD1","V5"),("AD1","V6"),("DB2","V7"),("VPN1","V8")]
    entries  = [("APT1","EX1"),("APT2","VPN1")]
    _push(conn, devices, vulns, attackers, connections, vuln_map, entries)
    return "Mid-size Corporate (12 devices)"


def _scenario_3(conn):
    """E-Commerce — 10 devices"""
    _clear(conn)
    devices = [
        ("WEB1","Web Server (nginx)","Server",6),("WEB2","Web Server 2","Server",6),
        ("LB1","Load Balancer","Server",7),("API1","API Gateway","Server",8),
        ("AUTH1","Auth Service","Server",9),("PAY1","Payment Processor","Server",10),
        ("CART1","Cart Service","Server",5),("DB4","Customer DB (PII)","Database",10),
        ("DB5","Orders DB","Database",8),("REDIS1","Redis Cache","Server",4),
    ]
    vulns = [
        ("V9","SSRF in image upload",8),("V10","JWT secret hardcoded",9),
        ("V11","Stripe API key in env",10),("V12","No rate-limit on /login",6),
        ("V13","Redis unauthenticated port",7),
    ]
    attackers = [("CCARD","Magecart Group")]
    connections = [
        ("LB1","WEB1"),("LB1","WEB2"),("WEB1","API1"),("WEB2","API1"),
        ("API1","AUTH1"),("API1","CART1"),("API1","PAY1"),
        ("AUTH1","DB4"),("CART1","DB5"),("PAY1","DB4"),("API1","REDIS1"),
    ]
    vuln_map = [("WEB1","V9"),("AUTH1","V10"),("PAY1","V11"),("LB1","V12"),("REDIS1","V13")]
    entries  = [("CCARD","WEB1")]
    _push(conn, devices, vulns, attackers, connections, vuln_map, entries)
    return "E-Commerce Platform (10 devices)"


def _scenario_4(conn):
    """Hospital — 9 devices"""
    _clear(conn)
    devices = [
        ("MRI1","MRI Scanner","IoT",5),("ECG1","ECG Monitor","IoT",4),
        ("PUMP1","Infusion Pump","IoT",6),("NUR1","Nurses Station","Laptop",5),
        ("DOC1","Doctor Workstation","Laptop",5),("PACS1","PACS Imaging Srv","Server",8),
        ("EHR1","EHR Server","Server",9),("DB6","Patient Records","Database",10),
        ("DB7","Billing DB","Database",9),
    ]
    vulns = [
        ("V14","Default vendor creds on MRI",9),("V15","Windows 7 (EOL) on NUR1",8),
        ("V16","PrintNightmare (CVE-2021-34527)",10),("V17","Cleartext HL7 messaging",7),
        ("V18","No DB encryption at rest",8),
    ]
    attackers = [("RANSOM1","REvil Ransomware")]
    connections = [
        ("MRI1","NUR1"),("ECG1","NUR1"),("PUMP1","NUR1"),
        ("NUR1","PACS1"),("DOC1","PACS1"),("PACS1","EHR1"),
        ("EHR1","DB6"),("EHR1","DB7"),
    ]
    vuln_map = [("MRI1","V14"),("NUR1","V15"),("PACS1","V16"),("EHR1","V17"),("DB6","V18")]
    entries  = [("RANSOM1","MRI1")]
    _push(conn, devices, vulns, attackers, connections, vuln_map, entries)
    return "Hospital / Healthcare (9 devices)"


def _scenario_5(conn):
    """Cloud / Kubernetes — 11 devices"""
    _clear(conn)
    devices = [
        ("CICD1","GitHub Actions Runner","Server",5),("REG1","Container Registry","Server",6),
        ("K8SM1","K8s Master Node","Server",9),("K8SW1","K8s Worker Node 1","Server",7),
        ("K8SW2","K8s Worker Node 2","Server",7),("SVC1","Auth Microservice","Server",8),
        ("SVC2","Payment Microservice","Server",10),("SVC3","Notification Service","Server",4),
        ("S3B1","S3 Config Bucket","Server",7),("SEC1","AWS Secrets Manager","Server",10),
        ("RDS1","RDS PostgreSQL","Database",10),
    ]
    vulns = [
        ("V19","Exposed Docker daemon socket",10),("V20","RBAC wildcard ClusterRole",9),
        ("V21","Public S3 bucket (no auth)",8),("V22","Hardcoded AWS key in Dockerfile",10),
        ("V23","Log4Shell in notification svc",10),
    ]
    attackers = [("SUPPLY","Supply-Chain Attacker"),("INSIDER","Malicious Insider")]
    connections = [
        ("CICD1","REG1"),("CICD1","K8SM1"),("REG1","K8SM1"),
        ("K8SM1","K8SW1"),("K8SM1","K8SW2"),("K8SW1","SVC1"),
        ("K8SW1","SVC2"),("K8SW2","SVC3"),("SVC1","S3B1"),
        ("S3B1","SEC1"),("SVC2","RDS1"),("SEC1","RDS1"),
    ]
    vuln_map = [("CICD1","V19"),("K8SM1","V20"),("S3B1","V21"),("REG1","V22"),("SVC3","V23")]
    entries  = [("SUPPLY","CICD1"),("INSIDER","S3B1")]
    _push(conn, devices, vulns, attackers, connections, vuln_map, entries)
    return "Cloud-Native / Kubernetes (11 devices)"


def _scenario_6(conn):
    """ICS / SCADA — 8 devices"""
    _clear(conn)
    devices = [
        ("ENG1","Engineering Laptop","Laptop",4),("JUMP1","Jump Server","Server",7),
        ("HMI1","HMI Terminal A","IoT",8),("HMI2","HMI Terminal B","IoT",7),
        ("PLC1","PLC Unit (Siemens)","IoT",9),("PLC2","PLC Unit (ABB)","IoT",9),
        ("SCADA1","SCADA Controller","Server",10),("RTU1","Remote Terminal Unit","IoT",8),
    ]
    vulns = [
        ("V24","VPN with default credentials",9),("V25","Modbus with no authentication",10),
        ("V26","Firmware RCE (CVE-2019-13945)",10),("V27","Cleartext SCADA comms",8),
        ("V28","USB autorun enabled on HMI",7),
    ]
    attackers = [("NATION","Sandworm (Nation-State APT)")]
    connections = [
        ("ENG1","JUMP1"),("JUMP1","HMI1"),("JUMP1","HMI2"),
        ("HMI1","PLC1"),("HMI2","PLC2"),("PLC1","SCADA1"),
        ("PLC2","SCADA1"),("SCADA1","RTU1"),
    ]
    vuln_map = [("ENG1","V24"),("HMI1","V25"),("PLC1","V26"),("SCADA1","V27"),("HMI2","V28")]
    entries  = [("NATION","ENG1")]
    _push(conn, devices, vulns, attackers, connections, vuln_map, entries)
    return "ICS / SCADA Power Grid (8 devices)"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clear(conn) -> None:
    for vt in ["CS_Device","CS_Vulnerability","CS_Attacker","CS_User","CS_IP",
               "CS_Asset","CS_LogEvent","CS_SecurityPatch","CS_AttackMemory"]:
        try:
            conn.delVertices(vt)
        except Exception:
            pass


def _push(conn, devices, vulns, attackers, connections, vuln_map, entries) -> None:
    for did, lbl, dtype, crit in devices:
        conn.upsertVertex("CS_Device", did, {"device_type": dtype, "label": lbl, "criticality": crit})
    for vid, title, sev in vulns:
        conn.upsertVertex("CS_Vulnerability", vid, {"severity": sev, "title": title})
    for aid, lbl in attackers:
        conn.upsertVertex("CS_Attacker", aid, {"label": lbl})
    for src, tgt in connections:
        conn.upsertEdge("CS_Device", src, "CS_connected_to", "CS_Device", tgt, {}, vertexMustExist=True)
    for dev, vuln in vuln_map:
        conn.upsertEdge("CS_Device", dev, "CS_has_vulnerability", "CS_Vulnerability", vuln, {}, vertexMustExist=True)
    for atk, dev in entries:
        conn.upsertEdge("CS_Attacker", atk, "CS_attacks", "CS_Device", dev, {}, vertexMustExist=True)


_LOADERS = {1: _scenario_1, 2: _scenario_2, 3: _scenario_3,
            4: _scenario_4, 5: _scenario_5, 6: _scenario_6}


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/load")
def load_scenario(req: LoadRequest) -> dict:
    """
    Push a network scenario directly into TigerGraph.
    Called from the dashboard — no need for the CLI simulator.
    """
    try:
        conn = get_conn()
        loader = _LOADERS[req.scenario]
        name = loader(conn)
        reset_conn()   # flush cache so next /graph-data call re-reads fresh data
        logger.info("Simulator: loaded scenario %d — %s", req.scenario, name)
        return {"ok": True, "message": f"Loaded: {name}"}
    except Exception as exc:
        reset_conn()
        logger.exception("Simulator load failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
