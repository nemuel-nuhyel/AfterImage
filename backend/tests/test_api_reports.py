from uuid import uuid4

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


def _mark_evidence(client: TestClient, session_id: str) -> str:
    response = client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "auth.log", "line_number": 1, "note": "Failed root login"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def _report_payload(evidence_id: str) -> dict:
    return {
        "what_happened": "A brute-force SSH pattern occurred against root and needs review.",
        "suspicious_entities": [
            {
                "type": "ip",
                "value": "10.0.0.55",
                "reasoning": "Repeated failed SSH attempts originated from this address.",
            }
        ],
        "attack_succeeded": True,
        "success_confidence": 4,
        "evidence_references": [evidence_id],
        "response_actions": ["Disable compromised account", "Rotate service credentials"],
    }


def test_get_report_draft_returns_empty_default(client: TestClient) -> None:
    session_id = _start_session(client)

    response = client.get(f"/api/v1/sessions/{session_id}/report/draft")

    assert response.status_code == 200
    draft = response.json()
    assert draft["what_happened"] == ""
    assert draft["suspicious_entities"] == []
    assert draft["attack_succeeded"] is None
    assert draft["success_confidence"] == 3
    assert draft["evidence_references"] == []
    assert draft["response_actions"] == []
    assert draft["submitted_at"] is None


def test_save_and_load_report_draft(client: TestClient) -> None:
    session_id = _start_session(client)
    evidence_id = _mark_evidence(client, session_id)
    payload = _report_payload(evidence_id)

    save_response = client.post(f"/api/v1/sessions/{session_id}/report/draft", json=payload)
    load_response = client.get(f"/api/v1/sessions/{session_id}/report/draft")

    assert save_response.status_code == 200
    assert load_response.status_code == 200
    assert load_response.json()["what_happened"] == payload["what_happened"]
    assert load_response.json()["evidence_references"] == [evidence_id]
    assert load_response.json()["submitted_at"] is None


def test_submit_report_marks_session_submitted(client: TestClient) -> None:
    session_id = _start_session(client)
    evidence_id = _mark_evidence(client, session_id)

    response = client.post(
        f"/api/v1/sessions/{session_id}/report/submit",
        json=_report_payload(evidence_id),
    )

    assert response.status_code == 200
    submitted = response.json()
    assert submitted["session_id"] == session_id
    assert submitted["status"] == "submitted"
    assert submitted["report"]["submitted_at"] is not None
    assert submitted["report"]["evidence_references"] == [evidence_id]

    session = client.get(f"/api/v1/sessions/{session_id}").json()
    assert session["status"] == "submitted"
    assert session["remaining_seconds"] == 0


def test_report_rejects_unknown_evidence_reference(client: TestClient) -> None:
    session_id = _start_session(client)
    missing_id = str(uuid4())

    response = client.post(
        f"/api/v1/sessions/{session_id}/report/draft",
        json=_report_payload(missing_id),
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": {
            "message": "Report references evidence not found in this session",
            "missing_evidence_ids": [missing_id],
        }
    }


def test_report_endpoints_return_404_for_unknown_session(client: TestClient) -> None:
    response = client.get("/api/v1/sessions/not-real/report/draft")

    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}
