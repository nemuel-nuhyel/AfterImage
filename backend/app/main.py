from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth.router import router as auth_router
from .routers import evidence, reports, scenarios, sessions, studio


app = FastAPI(
    title="AfterMath API",
    version="0.2.0",
    description="Adversarial SOC investigation simulator backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(scenarios.router)
app.include_router(sessions.router)
app.include_router(evidence.router)
app.include_router(reports.router)
app.include_router(studio.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
