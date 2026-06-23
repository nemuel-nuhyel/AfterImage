from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


Difficulty = Literal["beginner", "intermediate", "advanced"]
ScenarioMode = Literal["practice", "timed", "exam"]
DraftStatus = Literal[
    "draft",
    "pending_ai_review",
    "needs_revision",
    "pending_human_review",
    "approved",
    "rejected",
    "published",
]


class ContainerConfig(BaseModel):
    image: str = Field(default="ubuntu:22.04", pattern=r"^[a-z0-9_./:-]+$")
    setup_script: str | None = None
    capabilities_drop: list[str] = Field(default_factory=lambda: ["NET_RAW", "SYS_ADMIN"])
    read_only: bool = True
    enabled: bool = False


class LogEvent(BaseModel):
    model_config = ConfigDict(extra="allow")

    type: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    hidden: bool = False
    red_herring: bool = False
    time_offset: int | None = Field(default=None, description="Seconds from scenario start")

    def param(self, name: str, default: Any = None) -> Any:
        if name in self.parameters:
            return self.parameters[name]
        if self.model_extra and name in self.model_extra:
            return self.model_extra[name]
        return default


class LogConfig(BaseModel):
    generator: str = Field(..., pattern=r"^[a-z_]+$")
    events: list[LogEvent]
    noise_level: float = Field(default=0.1, ge=0.0, le=1.0)


class ExpectedFindings(BaseModel):
    attack_type: str
    suspicious_ips: list[str] = Field(..., min_length=1)
    target_accounts: list[str] | None = None
    attack_succeeded: bool
    success_details: str | None = None


class GradingRubric(BaseModel):
    detection_accuracy: int = Field(..., ge=0, le=100)
    evidence_quality: int = Field(..., ge=0, le=100)
    impact_analysis: int = Field(..., ge=0, le=100)
    response_plan: int = Field(..., ge=0, le=100)

    @model_validator(mode="after")
    def sum_to_100(self) -> "GradingRubric":
        total = (
            self.detection_accuracy
            + self.evidence_quality
            + self.impact_analysis
            + self.response_plan
        )
        if total != 100:
            raise ValueError(f"Rubric weights must sum to 100, got {total}")
        return self


class ScenarioConfig(BaseModel):
    id: str = Field(..., pattern=r"^[a-z0-9_]+$", max_length=50)
    title: str = Field(..., max_length=100)
    difficulty: Difficulty
    time_limit: int = Field(..., ge=300, le=3600, description="Seconds")
    hint_budget: int = Field(default=3, ge=0, le=10)
    timeline_day: int = Field(..., ge=1, description="Position in fictional timeline")
    description: str = Field(..., max_length=500)
    objectives: list[str] = Field(..., min_length=1, max_length=5)
    containers: dict[str, ContainerConfig] = Field(default_factory=dict)
    logs: dict[str, LogConfig]
    expected_findings: ExpectedFindings
    grading_rubric: GradingRubric
    debate_questions: list[str] = Field(..., min_length=1, max_length=5)

    @property
    def available_logs(self) -> list[str]:
        return list(self.logs.keys())


class ScenarioSummary(BaseModel):
    id: str
    title: str
    difficulty: Difficulty
    time_limit: int
    hint_budget: int
    timeline_day: int
    description: str
    available_logs: list[str]


class ScenarioDetail(ScenarioSummary):
    objectives: list[str]


class StartScenarioRequest(BaseModel):
    mode: ScenarioMode = "timed"


class StartScenarioResponse(BaseModel):
    session_id: UUID
    scenario_id: str
    status: Literal["active"]
    available_logs: list[str]


class GeneratedLogFile(BaseModel):
    name: str
    content: str
    lines: list[str]


class GeneratedScenarioLogs(BaseModel):
    scenario_id: str
    seed: int
    generated_at: datetime
    logs: dict[str, GeneratedLogFile]


class LogFileInfo(BaseModel):
    name: str
    line_count: int


class LogContentResponse(BaseModel):
    session_id: UUID
    log_file: str
    line_count: int
    content: str


class ThreatIntelSource(BaseModel):
    cve_id: str | None = None
    mitre_technique_id: str | None = None
    cisa_kev: bool = False
    epss_score: float | None = Field(default=None, ge=0.0, le=1.0)
    custom_topic: str | None = None


class SafetyCheckResult(BaseModel):
    passed: bool
    ip_validation: bool
    no_real_companies: bool
    no_real_credentials: bool
    no_exploit_commands: bool
    no_malware_code: bool
    no_destructive_commands: bool
    violations: list[str] = Field(default_factory=list)


class ReviewResult(BaseModel):
    realism_score: float = Field(..., ge=0.0, le=1.0)
    objectives_clarity: float = Field(..., ge=0.0, le=1.0)
    answer_fairness: float = Field(..., ge=0.0, le=1.0)
    evidence_sufficiency: float = Field(..., ge=0.0, le=1.0)
    red_herring_balance: float = Field(..., ge=0.0, le=1.0)
    difficulty_calibration: float = Field(..., ge=0.0, le=1.0)
    safety_score: float = Field(..., ge=0.0, le=1.0)
    debate_quality: float = Field(..., ge=0.0, le=1.0)
    log_generability: float = Field(..., ge=0.0, le=1.0)
    overall_score: float = Field(..., ge=0.0, le=1.0)
    passed: bool
    feedback: str
    revision_suggestions: list[str] = Field(default_factory=list)


class ReviewJob(BaseModel):
    job_id: UUID
    draft_id: UUID
    status: Literal["queued", "in_progress", "completed", "failed"]
    started_at: datetime | None = None
    completed_at: datetime | None = None
    result: ReviewResult | None = None


class ScenarioDraft(BaseModel):
    draft_id: UUID
    author_id: str | None = None
    status: DraftStatus
    config: ScenarioConfig
    source_type: Literal["ai_generated", "user_submitted"]
    threat_intel_source: ThreatIntelSource | None = None
    ai_review_score: float | None = Field(default=None, ge=0.0, le=1.0)
    ai_review_feedback: str | None = None
    safety_check_results: SafetyCheckResult | None = None
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None = None
    approved_at: datetime | None = None
    approved_by: str | None = None
