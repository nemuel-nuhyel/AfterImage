from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


SessionStatus = Literal["active", "submitted", "expired", "abandoned"]


class EvidenceItem(BaseModel):
    id: UUID
    log_file: str
    line_number: int = Field(..., ge=1)
    line_content: str
    timestamp: datetime | None = None
    note: str = Field(default="", max_length=280)
    marked_at: datetime


class MarkEvidenceRequest(BaseModel):
    log_file: str
    line_number: int = Field(..., ge=1)
    note: str = Field(default="", max_length=280)


class UpdateEvidenceRequest(BaseModel):
    note: str = Field(default="", max_length=280)


class DeleteEvidenceResponse(BaseModel):
    deleted: bool


class ClearEvidenceResponse(BaseModel):
    cleared: int


class SuspiciousEntity(BaseModel):
    type: Literal["ip", "user", "service", "file", "other"]
    value: str = Field(..., max_length=100)
    reasoning: str = Field(default="", max_length=500)


class ReportDraft(BaseModel):
    what_happened: str = Field(default="", max_length=2000)
    suspicious_entities: list[SuspiciousEntity] = Field(default_factory=list)
    attack_succeeded: bool | None = None
    success_confidence: int = Field(default=3, ge=1, le=5)
    evidence_references: list[UUID] = Field(default_factory=list)
    response_actions: list[str] = Field(default_factory=list)
    submitted_at: datetime | None = None


class SubmitReportResponse(BaseModel):
    session_id: UUID
    status: Literal["submitted"]
    report: ReportDraft


class ScoreBreakdown(BaseModel):
    overall: int = Field(..., ge=0, le=100)
    detection_accuracy: int
    evidence_quality: int
    impact_analysis: int
    response_plan: int
    time_bonus: int
    hint_penalty: int
    feedback: str
    missed_evidence: list[dict[str, Any]] = Field(default_factory=list)
    recommended_next: str | None = None


class ScenarioSession(BaseModel):
    session_id: UUID
    scenario_id: str
    user_id: str | None = None
    status: SessionStatus = "active"
    start_time: datetime
    end_time: datetime | None = None
    remaining_seconds: int | None = None
    hints_used: int = 0
    evidence: list[EvidenceItem] = Field(default_factory=list)
    report_draft: ReportDraft | None = None
    final_score: ScoreBreakdown | None = None
    available_logs: list[str] = Field(default_factory=list)
    logs: dict[str, str] = Field(default_factory=dict, exclude=True)


class ScenarioSessionResponse(BaseModel):
    session_id: UUID
    scenario_id: str
    status: SessionStatus
    start_time: datetime
    remaining_seconds: int | None = None
    hints_used: int = 0
    available_logs: list[str]
