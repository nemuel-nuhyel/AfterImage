from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from ..models.scenario import (
    ScenarioDetail,
    ScenarioSummary,
    StartScenarioRequest,
    StartScenarioResponse,
)
from ..services.scenario_service import scenario_service


router = APIRouter(prefix="/api/v1/scenarios", tags=["scenarios"])


@router.get("", response_model=list[ScenarioSummary])
def list_scenarios() -> list[ScenarioSummary]:
    return [
        ScenarioSummary(
            id=scenario.id,
            title=scenario.title,
            difficulty=scenario.difficulty,
            time_limit=scenario.time_limit,
            hint_budget=scenario.hint_budget,
            timeline_day=scenario.timeline_day,
            description=scenario.description,
            available_logs=scenario.available_logs,
        )
        for scenario in scenario_service.list_scenarios()
    ]


@router.get("/{scenario_id}", response_model=ScenarioDetail)
def get_scenario(scenario_id: str) -> ScenarioDetail:
    scenario = scenario_service.get_scenario(scenario_id)
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
        available_logs=scenario.available_logs,
        objectives=scenario.objectives,
    )


@router.post(
    "/{scenario_id}/start",
    response_model=StartScenarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_scenario(
    scenario_id: str,
    request: StartScenarioRequest | None = None,
) -> StartScenarioResponse:
    try:
        session = scenario_service.start_scenario(
            scenario_id,
            mode=request.mode if request is not None else "timed",
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Scenario not found") from None

    return StartScenarioResponse(
        session_id=session.session_id,
        scenario_id=session.scenario_id,
        status="active",
        available_logs=session.available_logs,
    )
