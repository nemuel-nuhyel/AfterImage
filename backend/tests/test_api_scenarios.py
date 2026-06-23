import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.session_store import session_store


@pytest.fixture(autouse=True)
def clear_sessions() -> None:
    session_store.clear()


client = TestClient(app)


def test_list_scenarios_returns_json_config_summary() -> None:
    response = client.get("/api/v1/scenarios")

    assert response.status_code == 200
    scenarios = response.json()
    assert scenarios == [
        {
            "id": "scenario_1",
            "title": "SSH Reconnaissance",
            "difficulty": "beginner",
            "time_limit": 600,
            "hint_budget": 3,
            "timeline_day": 1,
            "description": "A junior analyst notices unusual activity on the development server.",
            "available_logs": ["auth.log", "firewall.log", "audit.log"],
        }
    ]


def test_get_scenario_returns_public_detail_without_log_answers() -> None:
    response = client.get("/api/v1/scenarios/scenario_1")

    assert response.status_code == 200
    scenario = response.json()

    assert scenario["id"] == "scenario_1"
    assert scenario["objectives"] == [
        "Identify brute-force SSH patterns",
        "Distinguish between failed and successful authentication",
        "Recognize that not all failed logins indicate an active attack",
        "Find the evidence of successful compromise hidden in the noise",
    ]
    assert "backup_svc" not in response.text
    assert "10.0.0.55" not in response.text


def test_start_scenario_creates_in_memory_session_and_returns_logs() -> None:
    response = client.post("/api/v1/scenarios/scenario_1/start")

    assert response.status_code == 201
    started = response.json()

    assert started["scenario_id"] == "scenario_1"
    assert started["status"] == "active"
    assert started["available_logs"] == ["auth.log", "firewall.log", "audit.log"]
    assert isinstance(started["session_id"], str)

    session_response = client.get(f"/api/v1/sessions/{started['session_id']}")
    assert session_response.status_code == 200
    session = session_response.json()
    assert session["session_id"] == started["session_id"]
    assert session["available_logs"] == ["auth.log", "firewall.log", "audit.log"]
    assert "logs" not in session


def test_list_session_logs_returns_available_files() -> None:
    started = client.post("/api/v1/scenarios/scenario_1/start").json()

    response = client.get(f"/api/v1/sessions/{started['session_id']}/logs")

    assert response.status_code == 200
    logs = response.json()
    assert [log["name"] for log in logs] == ["auth.log", "firewall.log", "audit.log"]
    assert all(log["line_count"] > 0 for log in logs)


def test_get_session_log_returns_generated_content() -> None:
    started = client.post("/api/v1/scenarios/scenario_1/start").json()

    response = client.get(f"/api/v1/sessions/{started['session_id']}/logs/auth.log")

    assert response.status_code == 200
    log = response.json()
    assert log["log_file"] == "auth.log"
    assert log["line_count"] > 0
    assert "Failed password for root from 10.0.0.55" in log["content"]
    assert "Accepted password for backup_svc from 10.0.0.55" in log["content"]


def test_unknown_scenario_and_session_return_404() -> None:
    assert client.get("/api/v1/scenarios/not_real").status_code == 404
    assert client.post("/api/v1/scenarios/not_real/start").status_code == 404
    assert client.get("/api/v1/sessions/not-real").status_code == 404


def test_unknown_log_file_returns_404() -> None:
    started = client.post("/api/v1/scenarios/scenario_1/start").json()

    response = client.get(f"/api/v1/sessions/{started['session_id']}/logs/unknown.log")

    assert response.status_code == 404
    assert response.json() == {"detail": "Log file not found"}
