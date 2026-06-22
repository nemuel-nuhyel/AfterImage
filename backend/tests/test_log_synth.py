import pytest
from pydantic import ValidationError

from backend.app.models.scenario import GradingRubric
from backend.app.services.log_synth import (
    build_midnight_login_attempts_config,
    synthesize_logs,
)


def test_log_synthesis_determinism() -> None:
    config = build_midnight_login_attempts_config()

    logs_a = synthesize_logs(config, seed=42)
    logs_b = synthesize_logs(config, seed=42)

    assert logs_a.model_dump(mode="json") == logs_b.model_dump(mode="json")


def test_different_seed_changes_generated_details() -> None:
    config = build_midnight_login_attempts_config()

    logs_a = synthesize_logs(config, seed=42)
    logs_b = synthesize_logs(config, seed=43)

    assert logs_a.logs["auth.log"].content != logs_b.logs["auth.log"].content


def test_hidden_scenario_one_events_are_visible_but_marked_critical() -> None:
    config = build_midnight_login_attempts_config()
    generated = synthesize_logs(config, seed=42)

    all_content = "\n".join(log.content for log in generated.logs.values())
    critical_content = "\n".join(item.line_content for item in generated.metadata_by_label("critical"))

    assert "Accepted password for backup_svc from 10.0.0.55" in all_content
    assert "COMMAND=/usr/bin/cat /etc/shadow" in all_content
    assert "[UFW ALLOW]" in all_content

    assert "Accepted password for backup_svc from 10.0.0.55" in critical_content
    assert "COMMAND=/usr/bin/cat /etc/shadow" in critical_content
    assert "[UFW ALLOW]" in critical_content


def test_scenario_one_red_herrings_are_labeled_privately() -> None:
    config = build_midnight_login_attempts_config()
    generated = synthesize_logs(config, seed=42)

    red_herrings = generated.metadata_by_label("red_herring")
    red_herring_content = "\n".join(item.line_content for item in red_herrings)

    assert "Accepted publickey for admin from 192.168.1.10" in red_herring_content
    assert red_herring_content.count("Failed password for admin from 192.168.1.10") == 3


def test_scenario_one_supporting_event_counts() -> None:
    config = build_midnight_login_attempts_config()
    generated = synthesize_logs(config, seed=42)

    auth_supporting = [
        item
        for item in generated.logs["auth.log"].metadata
        if item.label == "supporting" and item.event_type == "failed_ssh"
    ]
    firewall_supporting = [
        item
        for item in generated.logs["firewall.log"].metadata
        if item.label == "supporting" and item.event_type == "blocked_connection"
    ]

    assert len(auth_supporting) == 150
    assert len(firewall_supporting) == 200


def test_metadata_line_numbers_match_visible_lines() -> None:
    config = build_midnight_login_attempts_config()
    generated = synthesize_logs(config, seed=42)

    for log_file in generated.logs.values():
        assert len(log_file.lines) == len(log_file.metadata)
        for item in log_file.metadata:
            assert log_file.lines[item.line_number - 1] == item.line_content


def test_grading_rubric_weights_must_sum_to_100() -> None:
    with pytest.raises(ValidationError):
        GradingRubric(
            detection_accuracy=30,
            evidence_quality=25,
            impact_analysis=25,
            response_plan=10,
        )
