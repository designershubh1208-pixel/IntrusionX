from __future__ import annotations

import re

from pyTigerGraph import TigerGraphConnection

from api.core.config import get_settings
from api.core.logging import get_logger
from api.models.schemas import AIAnalysisRequest, AIAnalysisResponse, AIRecommendation
from api.services.graph_service import get_attack_paths

logger = get_logger(__name__)

_FALLBACK_RECS = [
    AIRecommendation(
        category="immediate",
        title="Isolate compromised entry device",
        detail="Disconnect the attacker's entry device from the network immediately to stop lateral movement.",
    ),
    AIRecommendation(
        category="short_term",
        title="Patch critical vulnerabilities",
        detail="Apply security patches to all devices on the detected attack path, prioritising those with severity ≥ 7.",
    ),
    AIRecommendation(
        category="long_term",
        title="Implement zero-trust segmentation",
        detail="Redesign network segments so that lateral movement from endpoint to database requires explicit authentication at each hop.",
    ),
]


def _parse_recommendations(text: str) -> list[AIRecommendation]:
    recs: list[AIRecommendation] = []
    categories = ["immediate", "short_term", "long_term"]
    bullets = re.split(r"\n[-•*]\s+|\n\d+\.\s+", text)
    for i, bullet in enumerate(bullets[1:4]):
        lines = bullet.strip().splitlines()
        title = lines[0].strip(" *:") if lines else f"Recommendation {i + 1}"
        detail = " ".join(l.strip() for l in lines[1:]) if len(lines) > 1 else bullet.strip()
        recs.append(
            AIRecommendation(
                category=categories[i] if i < len(categories) else "long_term",
                title=title[:120],
                detail=detail[:500] or bullet.strip()[:500],
            )
        )
    if not recs:
        recs = _FALLBACK_RECS
    return recs


def get_ai_analysis(conn: TigerGraphConnection, req: AIAnalysisRequest) -> AIAnalysisResponse:
    settings = get_settings()
    paths = get_attack_paths(conn, attacker_id=req.attacker_id, max_paths=3)

    if not paths:
        return AIAnalysisResponse(
            attacker_id=req.attacker_id,
            path=[],
            risk_score=0.0,
            recommendations=_FALLBACK_RECS,
            raw_analysis="No attack path detected.",
            ai_available=False,
        )

    idx = min(req.path_index, len(paths) - 1)
    chosen = paths[idx]
    path_str = " → ".join(chosen.path)

    if not settings.has_openai:
        logger.warning("OPENAI_API_KEY not set — returning static recommendations")
        return AIAnalysisResponse(
            attacker_id=req.attacker_id,
            path=chosen.path,
            risk_score=chosen.risk_score,
            recommendations=_FALLBACK_RECS,
            raw_analysis="AI analysis unavailable — set OPENAI_API_KEY in .env for live recommendations.",
            ai_available=False,
        )

    prompt = (
        "You are a senior cybersecurity analyst reviewing a predicted attack path.\n\n"
        f"Attack path: {path_str}\n"
        f"Risk score: {chosen.risk_score}/100 ({chosen.risk_band})\n"
        f"Vulnerabilities on path: {chosen.vuln_count} (severity sum: {chosen.vuln_severity_sum})\n\n"
        "Provide exactly 3 recommendations as a bullet list:\n"
        "- Immediate action (next 24 hours)\n"
        "- Short-term fix (next 2 weeks)\n"
        "- Long-term strategy (next quarter)\n\n"
        "Be specific, actionable, and concise. Reference the actual path nodes."
    )

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.3,
        )
        raw = response.choices[0].message.content or ""
        recs = _parse_recommendations(raw)
        logger.info("AI analysis generated for attacker=%s path_len=%d", req.attacker_id, len(chosen.path))
    except Exception as exc:
        logger.error("OpenAI call failed: %s", exc)
        raw = f"AI analysis failed: {exc}"
        recs = _FALLBACK_RECS

    return AIAnalysisResponse(
        attacker_id=req.attacker_id,
        path=chosen.path,
        risk_score=chosen.risk_score,
        recommendations=recs,
        raw_analysis=raw,
        ai_available=True,
    )
