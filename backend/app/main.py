from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from .models.scenario import (
    ScenarioConfig,
    ScenarioDetail,
    ScenarioSessionResponse,
    ScenarioSummary,
    StartScenarioRequest,
)
from .models.session import ScenarioSessionRecord
from .services.log_synth import build_midnight_login_attempts_config


app = FastAPI(
    title="CyberRange AI API",
    version="0.1.0",
    description="Adversarial SOC investigation simulator backend.",
)


def _scenario_registry() -> dict[str, ScenarioConfig]:
    scenario = build_midnight_login_attempts_config()
    return {scenario.id: scenario}


def _session_seed(session_id: UUID) -> int:
    return session_id.int % 2_147_483_647


def _expires_at(
    mode: str,
    start_time: datetime,
    scenario: ScenarioConfig,
) -> datetime | None:
    if mode == "practice":
        return None
    return start_time + timedelta(seconds=scenario.time_limit)


def _remaining_seconds(expires_at: datetime | None, now: datetime) -> int | None:
    if expires_at is None:
        return None
    return max(int((expires_at - now).total_seconds()), 0)


@app.get("/api/v1/scenarios", response_model=list[ScenarioSummary])
def list_scenarios() -> list[ScenarioSummary]:
    scenarios = _scenario_registry().values()
    return [
        ScenarioSummary(
            id=scenario.id,
            title=scenario.title,
            difficulty=scenario.difficulty,
            time_limit=scenario.time_limit,
            hint_budget=scenario.hint_budget,
            timeline_day=scenario.timeline_day,
            description=scenario.description,
        )
        for scenario in scenarios
    ]


@app.get("/api/v1/scenarios/{scenario_id}", response_model=ScenarioDetail)
def get_scenario(scenario_id: str) -> ScenarioDetail:
    scenario = _scenario_registry().get(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    return ScenarioDetail(
        id=scenario.id,
        title=scenario.title,
        difficulty=scenario.difficulty,
        time_limit=scenario.time_limit,
        hint_budget=scenario.hint_budget,
        timeline_day=scenario.timeline_day,
        description=scenario.description,
        objectives=scenario.objectives,
        available_logs=list(scenario.logs.keys()),
    )


@app.post(
    "/api/v1/scenarios/{scenario_id}/start",
    response_model=ScenarioSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_scenario(
    scenario_id: str,
    request: StartScenarioRequest,
    db: Session = Depends(get_db),
) -> ScenarioSessionResponse:
    scenario = _scenario_registry().get(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    session_id = uuid4()
    start_time = datetime.now(timezone.utc)
    expires_at = _expires_at(request.mode, start_time, scenario)

    db.add(
        ScenarioSessionRecord(
            session_id=str(session_id),
            scenario_id=scenario.id,
            mode=request.mode,
            status="active",
            start_time=start_time,
            expires_at=expires_at,
            seed=_session_seed(session_id),
            hints_used=0,
        )
    )
    db.commit()

    return ScenarioSessionResponse(
        session_id=session_id,
        scenario_id=scenario.id,
        mode=request.mode,
        status="active",
        start_time=start_time,
        expires_at=expires_at,
        remaining_seconds=_remaining_seconds(expires_at, start_time),
        hints_used=0,
    )
