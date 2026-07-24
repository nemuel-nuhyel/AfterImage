from __future__ import annotations

from datetime import datetime, timezone
import ipaddress
import json
import re
from typing import Literal
from uuid import UUID, uuid4

from ..models.scenario import (
    Difficulty,
    ExpectedFindings,
    GradingRubric,
    LogConfig,
    LogEvent,
    ReviewJob,
    ReviewResult,
    SafetyCheckResult,
    ScenarioConfig,
    ScenarioDraft,
    ScenarioSummary,
    StudioGenerateRequest,
    ThreatDataItem,
    ThreatIntelSource,
    ValidationResult,
)
from .log_synth import synthesize_logs
from .scenario_loader import load_all_scenarios


AUTO_APPROVAL_THRESHOLD = 0.85

_ALLOWED_IP_RANGES = tuple(
    ipaddress.ip_network(network)
    for network in (
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "192.0.2.0/24",
        "198.51.100.0/24",
        "203.0.113.0/24",
    )
)

_IP_PATTERN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
_REAL_COMPANIES = (
    "sony",
    "microsoft",
    "google",
    "amazon",
    "apple",
    "meta",
    "facebook",
    "tesla",
    "netflix",
    "equifax",
    "target corporation",
)
_CREDENTIAL_PATTERNS = (
    re.compile(r"\bpassword\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"\bpassword123\b", re.IGNORECASE),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
)
_EXPLOIT_COMMAND_PATTERNS = (
    re.compile(r"\bmsfvenom\b", re.IGNORECASE),
    re.compile(r"\bmeterpreter\b", re.IGNORECASE),
    re.compile(r"\bmsfconsole\b", re.IGNORECASE),
    re.compile(r"\bcurl\s+\S+\s*\|\s*(?:sh|bash)\b", re.IGNORECASE),
    re.compile(r"\bwget\s+\S+\s+-O-\s*\|\s*(?:sh|bash)\b", re.IGNORECASE),
    re.compile(r"\bpowershell(?:\.exe)?\s+-enc(?:odedcommand)?\b", re.IGNORECASE),
    re.compile(r"\bnc(?:at)?\s+-e\b", re.IGNORECASE),
)
_MALWARE_PATTERNS = (
    re.compile(r"(?:\\x[0-9a-fA-F]{2}){8,}"),
    re.compile(r"\b[A-Za-z0-9+/]{160,}={0,2}\b"),
)
_DESTRUCTIVE_COMMAND_PATTERNS = (
    re.compile(r"\brm\s+-rf\s+/", re.IGNORECASE),
    re.compile(r"\bformat\s+c:", re.IGNORECASE),
    re.compile(r"\bdel\s+/s\s+/q\s+c:\\", re.IGNORECASE),
    re.compile(r"\bRemove-Item\b.*\b-Recurse\b.*\bC:\\", re.IGNORECASE),
)


class StudioService:
    def __init__(self) -> None:
        self._drafts: dict[UUID, ScenarioDraft] = {}
        self._review_jobs: dict[UUID, ReviewJob] = {}

    def clear(self) -> None:
        self._drafts.clear()
        self._review_jobs.clear()

    def generate_scenario(self, request: StudioGenerateRequest) -> ScenarioDraft:
        config = _build_generated_scenario(request)
        threat_source = ThreatIntelSource(
            cve_id=request.cve_id,
            mitre_technique_id=request.technique_id,
            cisa_kev=request.source == "cisa_kev",
            epss_score=0.42 if request.source == "epss" else None,
            custom_topic=request.topic if request.source == "custom" else None,
        )
        return self.create_draft(
            config=config,
            source_type="ai_generated",
            threat_intel_source=threat_source,
        )

    def create_draft(
        self,
        *,
        config: ScenarioConfig,
        source_type: Literal["ai_generated", "user_submitted"],
        threat_intel_source: ThreatIntelSource | None = None,
    ) -> ScenarioDraft:
        now = _utc_now()
        draft = ScenarioDraft(
            draft_id=uuid4(),
            status="draft",
            config=config,
            source_type=source_type,
            threat_intel_source=threat_intel_source,
            safety_check_results=self.safety_check(config),
            created_at=now,
            updated_at=now,
        )
        self._drafts[draft.draft_id] = draft
        return draft

    def list_drafts(self, status: str | None = None) -> list[ScenarioDraft]:
        drafts = sorted(self._drafts.values(), key=lambda draft: draft.updated_at, reverse=True)
        if status is None:
            return drafts
        return [draft for draft in drafts if draft.status == status]

    def get_draft(self, draft_id: UUID) -> ScenarioDraft | None:
        return self._drafts.get(draft_id)

    def validate_config(self, config: ScenarioConfig) -> ValidationResult:
        safety = self.safety_check(config)
        return ValidationResult(
            valid=safety.passed,
            schema_valid=True,
            safety_check=safety,
            errors=safety.violations,
        )

    def submit_for_review(self, draft_id: UUID) -> ReviewJob:
        draft = self._drafts.get(draft_id)
        if draft is None:
            raise KeyError(str(draft_id))

        now = _utc_now()
        draft = draft.model_copy(
            update={
                "status": "pending_ai_review",
                "submitted_at": draft.submitted_at or now,
                "updated_at": now,
            }
        )
        self._drafts[draft_id] = draft

        job = ReviewJob(
            job_id=uuid4(),
            draft_id=draft_id,
            status="in_progress",
            started_at=now,
        )
        self._review_jobs[job.job_id] = job

        result = self.review_config(draft.config)
        completed_at = _utc_now()
        next_status = _next_status(result)
        updated_draft = draft.model_copy(
            update={
                "status": next_status,
                "ai_review_score": result.overall_score,
                "ai_review_feedback": result.feedback,
                "safety_check_results": self.safety_check(draft.config),
                "approved_at": completed_at if next_status in {"approved", "published"} else None,
                "updated_at": completed_at,
            }
        )
        self._drafts[draft_id] = updated_draft

        completed_job = job.model_copy(
            update={
                "status": "completed",
                "completed_at": completed_at,
                "result": result,
            }
        )
        self._review_jobs[completed_job.job_id] = completed_job
        return completed_job

    def get_review_job(self, job_id: UUID) -> ReviewJob | None:
        return self._review_jobs.get(job_id)

    def safety_check(self, config: ScenarioConfig) -> SafetyCheckResult:
        payload = json.dumps(config.model_dump(mode="json"), sort_keys=True)
        lowered = payload.lower()
        violations: list[str] = []

        invalid_ips = sorted(ip for ip in set(_IP_PATTERN.findall(payload)) if not _is_allowed_ip(ip))
        if invalid_ips:
            violations.append(f"Public or non-documentation IPs are not allowed: {', '.join(invalid_ips)}")

        matched_companies = [
            company for company in _REAL_COMPANIES if re.search(rf"\b{re.escape(company)}\b", lowered)
        ]
        if matched_companies:
            violations.append(f"Real company names are not allowed: {', '.join(matched_companies)}")

        credential_hits = _matching_patterns(_CREDENTIAL_PATTERNS, payload)
        if credential_hits:
            violations.append("Real credential-like values are not allowed.")

        exploit_hits = _matching_patterns(_EXPLOIT_COMMAND_PATTERNS, payload)
        if exploit_hits:
            violations.append("Exploit command patterns are not allowed.")

        malware_hits = _matching_patterns(_MALWARE_PATTERNS, payload)
        if malware_hits:
            violations.append("Malware or encoded payload patterns are not allowed.")

        destructive_hits = _matching_patterns(_DESTRUCTIVE_COMMAND_PATTERNS, payload)
        if destructive_hits:
            violations.append("Destructive command patterns are not allowed.")

        ip_validation = not invalid_ips
        no_real_companies = not matched_companies
        no_real_credentials = not credential_hits
        no_exploit_commands = not exploit_hits
        no_malware_code = not malware_hits
        no_destructive_commands = not destructive_hits

        return SafetyCheckResult(
            passed=all(
                (
                    ip_validation,
                    no_real_companies,
                    no_real_credentials,
                    no_exploit_commands,
                    no_malware_code,
                    no_destructive_commands,
                )
            ),
            ip_validation=ip_validation,
            no_real_companies=no_real_companies,
            no_real_credentials=no_real_credentials,
            no_exploit_commands=no_exploit_commands,
            no_malware_code=no_malware_code,
            no_destructive_commands=no_destructive_commands,
            violations=violations,
        )

    def review_config(self, config: ScenarioConfig) -> ReviewResult:
        safety = self.safety_check(config)
        events = [event for log_config in config.logs.values() for event in log_config.events]
        hidden_count = sum(1 for event in events if event.hidden)
        red_herring_count = sum(1 for event in events if event.red_herring)
        log_count = len(config.logs)
        evidence_payload = json.dumps(config.model_dump(mode="json"))

        realism_score = _score_bool(log_count > 0 and len(events) >= 3, high=0.9, low=0.55)
        objectives_clarity = _score_objectives(config.objectives)
        answer_fairness = _score_bool(
            bool(config.expected_findings.suspicious_ips)
            and all(ip in evidence_payload for ip in config.expected_findings.suspicious_ips),
            high=0.92,
            low=0.58,
        )
        evidence_sufficiency = min(1.0, 0.55 + hidden_count * 0.14 + log_count * 0.04)
        red_herring_balance = min(1.0, 0.55 + red_herring_count * 0.16)
        difficulty_calibration = _score_difficulty(config.difficulty, log_count, hidden_count)
        safety_score = 1.0 if safety.passed else 0.0
        debate_quality = min(1.0, 0.55 + len(config.debate_questions) * 0.11)
        log_generability = 1.0 if _can_generate_logs(config) else 0.0

        scores = [
            realism_score,
            objectives_clarity,
            answer_fairness,
            evidence_sufficiency,
            red_herring_balance,
            difficulty_calibration,
            safety_score,
            debate_quality,
            log_generability,
        ]
        overall_score = round(sum(scores) / len(scores), 2)
        passed = safety.passed and overall_score >= 0.75 and log_generability == 1.0
        suggestions = _review_suggestions(
            safety=safety,
            hidden_count=hidden_count,
            red_herring_count=red_herring_count,
            log_generability=log_generability,
            objectives_clarity=objectives_clarity,
            debate_quality=debate_quality,
        )

        return ReviewResult(
            realism_score=round(realism_score, 2),
            objectives_clarity=round(objectives_clarity, 2),
            answer_fairness=round(answer_fairness, 2),
            evidence_sufficiency=round(evidence_sufficiency, 2),
            red_herring_balance=round(red_herring_balance, 2),
            difficulty_calibration=round(difficulty_calibration, 2),
            safety_score=safety_score,
            debate_quality=round(debate_quality, 2),
            log_generability=log_generability,
            overall_score=overall_score,
            passed=passed,
            feedback="Ready for publication." if passed else "Scenario needs revision before publication.",
            revision_suggestions=suggestions,
        )

    def browse_threat_data(self, source: str = "cve", keyword: str | None = None) -> list[ThreatDataItem]:
        normalized_source = _normalize_source(source)
        items = [
            ThreatDataItem(
                source="cve",
                identifier="CVE-2024-6387",
                title="OpenSSH signal handler race condition",
                summary="Useful pattern for remote service exposure, authentication logs, and patch triage.",
                severity="high",
                epss_score=0.32,
            ),
            ThreatDataItem(
                source="mitre",
                identifier="T1110",
                title="Brute Force",
                summary="Repeated authentication attempts against services, web portals, or cloud identities.",
                severity="medium",
            ),
            ThreatDataItem(
                source="mitre",
                identifier="T1078",
                title="Valid Accounts",
                summary="Use of compromised, default, or service accounts to maintain access.",
                severity="medium",
            ),
            ThreatDataItem(
                source="cisa_kev",
                identifier="KEV-pattern-auth-service",
                title="Known exploited internet-facing service pattern",
                summary="Training-safe abstraction of public exploitation pressure against exposed services.",
                severity="high",
                epss_score=0.71,
            ),
        ]
        filtered = [item for item in items if normalized_source in {"custom", item.source}]
        if keyword:
            needle = keyword.lower()
            filtered = [
                item
                for item in filtered
                if needle in item.identifier.lower()
                or needle in item.title.lower()
                or needle in item.summary.lower()
            ]
        return filtered

    def list_catalog(self, status: str = "published", difficulty: Difficulty | None = None) -> list[ScenarioSummary]:
        summaries = [
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
            for scenario in load_all_scenarios()
        ]

        draft_summaries = [
            ScenarioSummary(
                id=draft.config.id,
                title=draft.config.title,
                difficulty=draft.config.difficulty,
                time_limit=draft.config.time_limit,
                hint_budget=draft.config.hint_budget,
                timeline_day=draft.config.timeline_day,
                description=draft.config.description,
                available_logs=draft.config.available_logs,
            )
            for draft in self._drafts.values()
            if draft.status == status or (status == "published" and draft.status == "approved")
        ]
        if difficulty is not None:
            summaries = [summary for summary in summaries if summary.difficulty == difficulty]
            draft_summaries = [summary for summary in draft_summaries if summary.difficulty == difficulty]
        return summaries + sorted(draft_summaries, key=lambda item: item.title)


def _build_generated_scenario(request: StudioGenerateRequest) -> ScenarioConfig:
    safe_topic = _safe_text(request.topic)
    title = _title_from_topic(safe_topic)
    scenario_id = _scenario_id(title)
    attacker_ip = "10.24.18.45"
    admin_ip = "192.168.1.10"
    user = "backup_svc"
    failed_count = 45 if request.difficulty == "beginner" else 95

    logs: dict[str, LogConfig] = {
        "auth.log": LogConfig(
            generator="auth_synth",
            noise_level=0.08,
            events=[
                LogEvent(
                    type="failed_ssh",
                    parameters={"user": "root", "ip": attacker_ip, "count": failed_count},
                    time_offset=0,
                ),
                LogEvent(
                    type="successful_ssh",
                    parameters={"user": user, "ip": attacker_ip},
                    hidden=True,
                    time_offset=780,
                ),
                LogEvent(
                    type="normal_admin",
                    parameters={"user": "admin", "ip": admin_ip},
                    red_herring=True,
                    time_offset=32400,
                ),
                LogEvent(
                    type="failed_ssh",
                    parameters={"user": "admin", "ip": admin_ip, "count": 2},
                    red_herring=True,
                    time_offset=32640,
                ),
            ],
        ),
        "firewall.log": LogConfig(
            generator="firewall_synth",
            noise_level=0.05,
            events=[
                LogEvent(
                    type="blocked_connection",
                    parameters={"src_ip": attacker_ip, "dst_port": 22, "count": failed_count},
                    time_offset=0,
                ),
                LogEvent(
                    type="allowed_connection",
                    parameters={"src_ip": attacker_ip, "dst_port": 22},
                    hidden=True,
                    time_offset=780,
                ),
            ],
        ),
    }

    if request.difficulty in {"intermediate", "advanced"}:
        logs["audit.log"] = LogConfig(
            generator="audit_synth",
            noise_level=0.05,
            events=[
                LogEvent(
                    type="user_auth_success",
                    parameters={"user": user, "ip": attacker_ip},
                    hidden=True,
                    time_offset=780,
                ),
                LogEvent(
                    type="credential_acquired",
                    parameters={"user": user},
                    hidden=True,
                    time_offset=782,
                ),
                LogEvent(
                    type="user_command",
                    parameters={"user": user, "command": "whoami"},
                    hidden=True,
                    time_offset=840,
                ),
            ],
        )

    if request.difficulty == "advanced":
        logs["auth.log"].events.append(
            LogEvent(
                type="sudo_escalation",
                parameters={"user": user, "command": "whoami"},
                hidden=True,
                time_offset=900,
            )
        )

    return ScenarioConfig(
        id=scenario_id,
        title=title,
        difficulty=request.difficulty,
        time_limit=request.time_limit,
        hint_budget=3 if request.difficulty != "advanced" else 2,
        timeline_day=1,
        description=(
            f"Fictional Acme Corp analysts investigate {safe_topic.lower()} signals across "
            "synthetic authentication and network logs."
        ),
        objectives=[
            "Identify repeated authentication failure patterns tied to one source.",
            "Correlate a successful login with prior failed attempts.",
            "Separate legitimate administrator activity from attacker activity.",
            "Defend whether the incident represents attempted or successful compromise.",
        ],
        containers={},
        logs=logs,
        expected_findings=ExpectedFindings(
            attack_type="Authentication brute-force with valid account use",
            suspicious_ips=[attacker_ip],
            target_accounts=["root", user],
            attack_succeeded=True,
            success_details=f"{user} accepted a login from {attacker_ip} after repeated failures.",
        ),
        grading_rubric=GradingRubric(
            detection_accuracy=30,
            evidence_quality=25,
            impact_analysis=25,
            response_plan=20,
        ),
        debate_questions=[
            "What evidence shows this was more than routine authentication noise?",
            "Which log line changes your assessment from attempted access to successful access?",
            "Why should the administrator activity be treated as a red herring?",
            "What additional containment step follows from the successful account use?",
        ],
    )


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _is_allowed_ip(value: str) -> bool:
    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        return False
    return any(address in network for network in _ALLOWED_IP_RANGES)


def _matching_patterns(patterns: tuple[re.Pattern[str], ...], payload: str) -> list[str]:
    return [pattern.pattern for pattern in patterns if pattern.search(payload)]


def _score_bool(condition: bool, *, high: float, low: float) -> float:
    return high if condition else low


def _score_objectives(objectives: list[str]) -> float:
    measurable_verbs = ("identify", "correlate", "distinguish", "separate", "defend", "recognize", "find")
    clear_count = sum(1 for objective in objectives if objective.lower().startswith(measurable_verbs))
    return min(1.0, 0.55 + clear_count * 0.11)


def _score_difficulty(difficulty: Difficulty, log_count: int, hidden_count: int) -> float:
    if difficulty == "beginner":
        return 0.88 if log_count <= 2 and hidden_count <= 2 else 0.76
    if difficulty == "intermediate":
        return 0.9 if log_count >= 2 and hidden_count >= 2 else 0.72
    return 0.9 if log_count >= 3 and hidden_count >= 4 else 0.7


def _can_generate_logs(config: ScenarioConfig) -> bool:
    try:
        synthesize_logs(config, seed=7)
    except Exception:
        return False
    return True


def _review_suggestions(
    *,
    safety: SafetyCheckResult,
    hidden_count: int,
    red_herring_count: int,
    log_generability: float,
    objectives_clarity: float,
    debate_quality: float,
) -> list[str]:
    suggestions: list[str] = []
    if not safety.passed:
        suggestions.extend(safety.violations)
    if hidden_count < 1:
        suggestions.append("Add at least one hidden event that reveals the true attack path.")
    if red_herring_count < 2:
        suggestions.append("Add at least two plausible red herring events.")
    if log_generability < 1.0:
        suggestions.append("Use supported log generators and event types.")
    if objectives_clarity < 0.85:
        suggestions.append("Rewrite learning objectives with measurable analyst actions.")
    if debate_quality < 0.85:
        suggestions.append("Add debate questions that challenge reasoning without revealing answers.")
    return suggestions


def _next_status(result: ReviewResult) -> str:
    if not result.passed:
        return "rejected" if result.safety_score < 1.0 else "needs_revision"
    category_scores = [
        result.realism_score,
        result.objectives_clarity,
        result.answer_fairness,
        result.evidence_sufficiency,
        result.red_herring_balance,
        result.difficulty_calibration,
        result.safety_score,
        result.debate_quality,
        result.log_generability,
    ]
    if result.overall_score >= AUTO_APPROVAL_THRESHOLD and all(
        score >= AUTO_APPROVAL_THRESHOLD for score in category_scores
    ):
        return "published"
    return "pending_human_review"


def _safe_text(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9 ._-]", "", value).strip()
    return cleaned or "Authentication Investigation"


def _title_from_topic(topic: str) -> str:
    words = [word.capitalize() for word in re.split(r"\s+", topic) if word]
    if not words:
        return "Authentication Investigation"
    return " ".join(words[:5])


def _scenario_id(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")
    return f"{slug[:37]}_studio"


def _normalize_source(source: str) -> str:
    lowered = source.lower()
    if lowered == "nvd":
        return "cve"
    if lowered in {"cve", "mitre", "cisa_kev", "custom", "epss"}:
        return lowered
    return "custom"


studio_service = StudioService()
