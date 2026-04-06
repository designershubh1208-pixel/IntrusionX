"""
ASGI entrypoint shim for platforms that run `uvicorn app:app` from repo root.
"""

from api.app import app

