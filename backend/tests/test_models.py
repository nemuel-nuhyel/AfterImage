from datetime import datetime, timezone
from uuid import uuid4

import pytest
from pydantic import ValidationError

from backend.app.models.scenario import (
    GradingRubric,
    ReviewResult,
    SafetyCheckResult,
    ScenarioConfig,
    ScenarioDraft,
)
from backend.app.services.scenario_loader import load_scenario


def test_scenario_config_validation() -> None:
    sample = {
        "id": "scenario_1",
        "title": "SSH Reconnaissance",
        "difficulty": "beginner",
        "time_limit": 600,
        "hint_budget": 3,
        "timeline_day": 1,
        "description": "Identify brute-force patterns in SSH authentication logs.",
        "objectives": ["Detect brute-force", "Identify compromised account"],
        "containers": {},
        "logs": {
            "auth.log": {
                "generator": "auth_synth",
                "events": [
                    {
                        "type": "failed_ssh",
                        "parameters": {"user": "root", "ip": "10.0.0.55"},
                        "hidden": False,
                        "red_herring": False,
                        "time_offset": 0,
                    }
                ],
                "noise_level": 0.1,
            }
        },
        "expected_findings": {
            "attack_type": "SSH brute-force",
            "suspicious_ips": ["10.0.0.55"],
            "attack_succeeded": True,
        },
        "grading_rubric": {
            "detection_accuracy": 30,
            "evidence_quality": 25,
            "impact_analysis": 25,
            "response_plan": 20,
        },
        "debate_questions": ["Why did you prioritize the admin failures?"],
    }

    config = ScenarioConfig(**sample)

    assert config.id == "scenario_1"
    assert config.available_logs == ["auth.log"]
    assert config.grading_rubric.detection_accuracy == 30


def test_grading_rubric_weights_must_sum_to_100() -> None:
    with pytest.raises(ValidationError):
        GradingRubric(
            detection_accuracy=30,
            evidence_quality=25,
            impact_analysis=25,
            response_plan=10,
        )


def test_load_scenario_validates_json_config() -> None:
    config = load_scenario("scenario_1")

    assert config.id == "scenario_1"
    assert config.title == "SSH Reconnaissance"
    assert list(config.logs.keys()) == ["auth.log", "firewall.log", "audit.log"]
    assert config.expected_findings.attack_succeeded is True


def test_scenario_studio_models_validate() -> None:
    config = load_scenario("scenario_1")
    review = ReviewResult(
        realism_score=0.9,
        objectives_clarity=0.9,
        answer_fairness=0.9,
        evidence_sufficiency=0.9,
        red_herring_balance=0.9,
        difficulty_calibration=0.9,
        safety_score=1.0,
        debate_quality=0.9,
        log_generability=0.9,
        overall_score=0.92,
        passed=True,
        feedback="Ready for review.",
    )
    draft = ScenarioDraft(
        draft_id=uuid4(),
        status="pending_human_review",
        config=config,
        source_type="user_submitted",
        ai_review_score=review.overall_score,
        ai_review_feedback=review.feedback,
        safety_check_results=SafetyCheckResult(
            passed=True,
            ip_validation=True,
            no_real_companies=True,
            no_real_credentials=True,
            no_exploit_commands=True,
            no_malware_code=True,
            no_destructive_commands=True,
        ),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    assert draft.config.id == "scenario_1"
    assert draft.safety_check_results is not None
    assert draft.safety_check_results.passed is True
