from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import ValidationError

from ..models.scenario import (
    Difficulty,
    ReviewJob,
    ScenarioConfig,
    ScenarioDraft,
    ScenarioSummary,
    StudioDraftCreateRequest,
    StudioGenerateRequest,
    StudioSubmitRequest,
    ThreatDataItem,
    ValidationResult,
)
from ..services.studio_service import studio_service


router = APIRouter(prefix="/api/v1/studio", tags=["scenario-studio"])


@router.post("/generate", response_model=ScenarioDraft, status_code=status.HTTP_201_CREATED)
def generate_scenario(request: StudioGenerateRequest) -> ScenarioDraft:
    return studio_service.generate_scenario(request)


@router.post("/draft", response_model=ScenarioDraft, status_code=status.HTTP_201_CREATED)
def save_draft(request: StudioDraftCreateRequest) -> ScenarioDraft:
    return studio_service.create_draft(
        config=request.config,
        source_type=request.source_type,
        threat_intel_source=request.threat_intel_source,
    )


@router.get("/drafts", response_model=list[ScenarioDraft])
def list_drafts(status_filter: str | None = Query(default=None, alias="status")) -> list[ScenarioDraft]:
    return studio_service.list_drafts(status_filter)


@router.post("/submit", response_model=ReviewJob)
def submit_draft(request: StudioSubmitRequest) -> ReviewJob:
    try:
        return studio_service.submit_for_review(request.draft_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Draft not found") from None


@router.post("/review/{draft_id}", response_model=ReviewJob)
def submit_draft_by_path(draft_id: UUID) -> ReviewJob:
    try:
        return studio_service.submit_for_review(draft_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Draft not found") from None


@router.get("/review/{job_id}", response_model=ReviewJob)
def get_review_status(job_id: UUID) -> ReviewJob:
    job = studio_service.get_review_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Review job not found")
    return job


@router.post("/validate", response_model=ValidationResult)
def validate_scenario(raw_config: dict[str, Any]) -> ValidationResult:
    try:
        config = ScenarioConfig.model_validate(raw_config)
    except ValidationError as exc:
        return ValidationResult(
            valid=False,
            schema_valid=False,
            errors=[error["msg"] for error in exc.errors()],
        )
    return studio_service.validate_config(config)


@router.post("/upload", response_model=ScenarioDraft, status_code=status.HTTP_201_CREATED)
async def upload_scenario(request: Request) -> ScenarioDraft:
    try:
        raw = await request.json()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Upload endpoint currently accepts JSON request bodies.",
        ) from None

    config_payload = raw.get("config", raw) if isinstance(raw, dict) else raw
    try:
        config = ScenarioConfig.model_validate(config_payload)
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=[error["msg"] for error in exc.errors()],
        ) from exc

    return studio_service.create_draft(config=config, source_type="user_submitted")


@router.get("/threat-data", response_model=list[ThreatDataItem])
def browse_threat_data(
    source: str = "cve",
    keyword: str | None = None,
) -> list[ThreatDataItem]:
    return studio_service.browse_threat_data(source=source, keyword=keyword)


@router.get("/catalog", response_model=list[ScenarioSummary])
def browse_catalog(
    status_filter: str = Query(default="published", alias="status"),
    difficulty: Difficulty | None = None,
) -> list[ScenarioSummary]:
    return studio_service.list_catalog(status=status_filter, difficulty=difficulty)
