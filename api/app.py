from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.core.logging import configure_logging, get_logger
from api.routes import ai_analysis, attack_paths, graph_data, health, risk, simulate
from api.routes import simulator

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("CyberShield API starting up")
    yield
    logger.info("CyberShield API shutting down")


app = FastAPI(
    title="CyberShield AI",
    description="Predict and visualise cyber attack paths using TigerGraph + AI",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(attack_paths.router)
app.include_router(risk.router)
app.include_router(simulate.router)
app.include_router(ai_analysis.router)
app.include_router(graph_data.router)
app.include_router(simulator.router)


@app.get("/", include_in_schema=False)
def root():
    return {"product": "CyberShield AI", "version": "2.0.0", "docs": "/docs"}
