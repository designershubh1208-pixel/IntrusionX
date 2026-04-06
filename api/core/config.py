from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[2]
# override=True ensures a server restart always picks up the latest .env values
load_dotenv(_ROOT / ".env", override=True)


class Settings:
    def __init__(self) -> None:
        self.tg_host: str = os.environ.get("TG_HOST", "").strip().rstrip("/")
        self.tg_secret: str = os.environ.get("TG_SECRET", "").strip()
        self.tg_api_token: str = os.environ.get("TG_API_TOKEN", "").strip()
        self.tg_cloud: bool = os.environ.get("TG_TGCLOUD", "false").lower() == "true"
        self.graph_name: str = (os.environ.get("CYBERSHIELD_GRAPH") or "CyberShieldGraph").strip()
        self.openai_api_key: str = os.environ.get("OPENAI_API_KEY", "").strip()
        self.openai_model: str = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip()
        self.log_level: str = os.environ.get("LOG_LEVEL", "INFO").upper()

    @property
    def tg_host_https(self) -> str:
        h = self.tg_host
        if h.startswith("http://") and "tgcloud" in h.lower():
            return "https://" + h.removeprefix("http://")
        return h

    @property
    def tg_credential(self) -> str:
        return self.tg_secret or self.tg_api_token

    @property
    def has_openai(self) -> bool:
        return bool(self.openai_api_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
