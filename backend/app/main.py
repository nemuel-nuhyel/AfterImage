from __future__ import annotations

from fastapi import FastAPI

from .routers import evidence, reports, scenarios, sessions


app = FastAPI(
    title="AfterMath API",
    version="0.1.0",
    description="Adversarial SOC investigation simulator backend.",
)

app.include_router(scenarios.router)
app.include_router(sessions.router)
app.include_router(evidence.router)
app.include_router(reports.router)
