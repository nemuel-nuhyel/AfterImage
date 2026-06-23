from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.session_store import SQLiteSessionStore, session_store


def test_sqlite_store_persists_session_evidence_and_report() -> None:
    session_store.clear()
    client = TestClient(app)

    started = client.post("/api/v1/scenarios/scenario_1/start").json()
    session_id = started["session_id"]
    evidence = client.post(
        f"/api/v1/sessions/{session_id}/evidence",
        json={"log_file": "auth.log", "line_number": 1, "note": "Persistent evidence"},
    ).json()
    client.post(
        f"/api/v1/sessions/{session_id}/report/draft",
        json={
            "what_happened": "Persistent draft",
            "suspicious_entities": [],
            "attack_succeeded": True,
            "success_confidence": 4,
            "evidence_references": [evidence["id"]],
            "response_actions": ["Rotate credentials"],
        },
    )

    reloaded = SQLiteSessionStore().get(session_id)

    assert reloaded is not None
    assert str(reloaded.session_id) == session_id
    assert reloaded.logs["auth.log"]
    assert reloaded.evidence[0].note == "Persistent evidence"
    assert reloaded.report_draft is not None
    assert reloaded.report_draft.what_happened == "Persistent draft"
