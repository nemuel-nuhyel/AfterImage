from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


LineLabel = Literal["critical", "supporting", "red_herring", "noise"]
ScenarioMode = Literal["practice", "timed", "exam"]
SessionStatus = Literal["active", "submitted", "expired", "abandoned"]


class ContainerConfig(BaseModel):
    image: str = Field(..., pattern=r"^[a-z0-9_./:-]+$")
    setup_script: str | None = None
    capabilities_drop: list[str] = Field(default_factory=lambda: ["NET_RAW", "SYS_ADMIN"])
    read_only: bool = True


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
    difficulty: Literal["beginner", "intermediate", "advanced"]
    time_limit: int = Field(..., ge=300, le=3600, description="Seconds")
    hint_budget: int = Field(default=3, ge=0, le=10)
    timeline_day: int = Field(..., ge=1, description="Position in fictional timeline")
    description: str = Field(..., max_length=500)
    objectives: list[str] = Field(..., min_length=1, max_length=5)
    containers: dict[str, ContainerConfig]
    logs: dict[str, LogConfig]
    expected_findings: ExpectedFindings
    grading_rubric: GradingRubric
    debate_questions: list[str] = Field(..., min_length=3, max_length=5)


class ScenarioSummary(BaseModel):
    id: str
    title: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    time_limit: int
    hint_budget: int
    timeline_day: int
    description: str


class ScenarioDetail(ScenarioSummary):
    objectives: list[str]
    available_logs: list[str]


class StartScenarioRequest(BaseModel):
    mode: ScenarioMode = "timed"


class ScenarioSessionResponse(BaseModel):
    session_id: UUID
    scenario_id: str
    mode: ScenarioMode
    status: SessionStatus
    start_time: datetime
    expires_at: datetime | None = None
    remaining_seconds: int | None = None
    hints_used: int = 0


class LogLineMetadata(BaseModel):
    log_file: str
    line_number: int = Field(..., ge=1)
    line_content: str
    label: LineLabel
    event_type: str
    timestamp: datetime | None = None
    source_event_index: int | None = None
    entities: dict[str, str] = Field(default_factory=dict)


class GeneratedLogFile(BaseModel):
    name: str
    content: str
    lines: list[str]
    metadata: list[LogLineMetadata]


class GeneratedScenarioLogs(BaseModel):
    scenario_id: str
    seed: int
    generated_at: datetime
    logs: dict[str, GeneratedLogFile]

    def metadata_by_label(self, label: LineLabel) -> list[LogLineMetadata]:
        return [
            item
            for log_file in self.logs.values()
            for item in log_file.metadata
            if item.label == label
        ]


class EvidenceItem(BaseModel):
    id: UUID
    log_file: str
    line_number: int
    line_content: str
    timestamp: datetime | None = None
    note: str = Field(default="", max_length=280)
    marked_at: datetime
