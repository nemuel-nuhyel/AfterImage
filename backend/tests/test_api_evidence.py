import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.session_store import session_store


@pytest.fixture(autouse=True)
def clear_sessions() -> None:
    session_store.clear()


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


def _start_session(client: TestClient) -> str:
    response = client.post("/api/v1/scenarios/scenario_1/start")
    assert response.status_code == 201
    return response.json()["session_id"]


def test_mark_evidence_captures_log_line_content(client: TestClient) -> None:
    session_id = _start_session(client)

    response = client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "auth.log", "line_number": 1, "note": "Start of brute-force pattern"},
    )

    assert response.status_code == 201
    evidence = response.json()
    assert evidence["log_file"] == "auth.log"
    assert evidence["line_number"] == 1
    assert evidence["note"] == "Start of brute-force pattern"
    assert "Failed password for root from 10.0.0.55" in evidence["line_content"]
    assert evidence["id"]
    assert evidence["marked_at"]


def test_list_evidence_returns_marked_items(client: TestClient) -> None:
    session_id = _start_session(client)
    client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "auth.log", "line_number": 1},
    )
    client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "firewall.log", "line_number": 1},
    )

    response = client.get(f"/api/v1/sessions/{session_id}/evidence")

    assert response.status_code == 200
    evidence = response.json()
    assert [item["log_file"] for item in evidence] == ["auth.log", "firewall.log"]


def test_update_evidence_note(client: TestClient) -> None:
    session_id = _start_session(client)
    created = client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "auth.log", "line_number": 1},
    ).json()

    response = client.put(
        f"/api/v1/sessions/{session_id}/evidence/{created['id']}",
        json={"note": "Relevant failed login sequence."},
    )

    assert response.status_code == 200
    assert response.json()["note"] == "Relevant failed login sequence."


def test_delete_one_evidence_item(client: TestClient) -> None:
    session_id = _start_session(client)
    first = client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "auth.log", "line_number": 1},
    ).json()
    client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "firewall.log", "line_number": 1},
    )

    response = client.delete(f"/api/v1/sessions/{session_id}/evidence/{first['id']}")

    assert response.status_code == 200
    assert response.json() == {"deleted": True}
    remaining = client.get(f"/api/v1/sessions/{session_id}/evidence").json()
    assert len(remaining) == 1
    assert remaining[0]["log_file"] == "firewall.log"


def test_clear_evidence(client: TestClient) -> None:
    session_id = _start_session(client)
    client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "auth.log", "line_number": 1},
    )
    client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "firewall.log", "line_number": 1},
    )

    response = client.delete(f"/api/v1/sessions/{session_id}/evidence")

    assert response.status_code == 200
    assert response.json() == {"cleared": 2}
    assert client.get(f"/api/v1/sessions/{session_id}/evidence").json() == []


def test_mark_evidence_validates_session_log_and_line(client: TestClient) -> None:
    session_id = _start_session(client)

    missing_session = client.post(
        "/api/v1/sessions/not-real/evidence",
        json={"log_file": "auth.log", "line_number": 1},
    )
    missing_log = client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "missing.log", "line_number": 1},
    )
    missing_line = client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "auth.log", "line_number": 99999},
    )
    invalid_line = client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "auth.log", "line_number": 0},
    )

    assert missing_session.status_code == 404
    assert missing_log.status_code == 404
    assert missing_log.json() == {"detail": "Log file not found"}
    assert missing_line.status_code == 404
    assert missing_line.json() == {"detail": "Log line not found"}
    assert invalid_line.status_code == 422
