from collections.abc import Iterator
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.session import ScenarioSessionRecord


client = TestClient(app)


@pytest.fixture()
def sqlite_api_client(tmp_path) -> Iterator[tuple[TestClient, sessionmaker[Session]]]:
    db_path = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Iterator[Session]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client, testing_session_local
    finally:
        app.dependency_overrides.clear()


def test_list_scenarios_returns_public_summary() -> None:
    response = client.get("/api/v1/scenarios")

    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) == 1

    scenario = scenarios[0]
    assert scenario == {
        "id": "midnight_login_attempts",
        "title": "Midnight Login Attempts",
        "difficulty": "beginner",
        "time_limit": 900,
        "hint_budget": 3,
        "timeline_day": 1,
        "description": (
            "A junior analyst notices unusual SSH activity on the development server "
            "during off-hours."
        ),
    }


def test_get_scenario_returns_public_detail() -> None:
    response = client.get("/api/v1/scenarios/midnight_login_attempts")

    assert response.status_code == 200
    scenario = response.json()

    assert scenario["id"] == "midnight_login_attempts"
    assert scenario["objectives"] == [
        "Identify brute-force authentication patterns",
        "Distinguish failed authentication from successful compromise",
        "Separate real evidence from suspicious-looking admin noise",
    ]
    assert scenario["available_logs"] == ["auth.log", "firewall.log"]


def test_get_scenario_does_not_expose_ground_truth() -> None:
    response = client.get("/api/v1/scenarios/midnight_login_attempts")

    assert response.status_code == 200
    response_text = response.text

    assert "expected_findings" not in response_text
    assert "grading_rubric" not in response_text
    assert "debate_questions" not in response_text
    assert "backup_svc" not in response_text
    assert "/etc/shadow" not in response_text
    assert "10.0.0.55" not in response_text


def test_get_unknown_scenario_returns_404() -> None:
    response = client.get("/api/v1/scenarios/not_real")

    assert response.status_code == 404
    assert response.json() == {"detail": "Scenario not found"}


def test_start_scenario_creates_sqlite_session(
    sqlite_api_client: tuple[TestClient, sessionmaker[Session]],
) -> None:
    test_client, testing_session_local = sqlite_api_client

    response = test_client.post(
        "/api/v1/scenarios/midnight_login_attempts/start",
        json={"mode": "timed"},
    )

    assert response.status_code == 201
    session = response.json()
    session_id = UUID(session["session_id"])

    assert session["scenario_id"] == "midnight_login_attempts"
    assert session["mode"] == "timed"
    assert session["status"] == "active"
    assert session["expires_at"] is not None
    assert session["remaining_seconds"] == 900
    assert session["hints_used"] == 0
    assert "seed" not in session

    with testing_session_local() as db:
        record = db.get(ScenarioSessionRecord, str(session_id))

    assert record is not None
    assert record.scenario_id == "midnight_login_attempts"
    assert record.mode == "timed"
    assert record.status == "active"
    assert record.seed > 0
    assert record.hints_used == 0


def test_start_practice_scenario_has_no_expiry(
    sqlite_api_client: tuple[TestClient, sessionmaker[Session]],
) -> None:
    test_client, _ = sqlite_api_client

    response = test_client.post(
        "/api/v1/scenarios/midnight_login_attempts/start",
        json={"mode": "practice"},
    )

    assert response.status_code == 201
    session = response.json()
    assert session["mode"] == "practice"
    assert session["expires_at"] is None
    assert session["remaining_seconds"] is None


def test_start_unknown_scenario_returns_404(
    sqlite_api_client: tuple[TestClient, sessionmaker[Session]],
) -> None:
    test_client, _ = sqlite_api_client

    response = test_client.post("/api/v1/scenarios/not_real/start", json={"mode": "timed"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Scenario not found"}
