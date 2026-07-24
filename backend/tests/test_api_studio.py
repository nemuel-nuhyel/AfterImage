import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.scenario_loader import load_scenario
from backend.app.services.studio_service import studio_service


@pytest.fixture(autouse=True)
def clear_studio() -> None:
    studio_service.clear()


client = TestClient(app)


def test_generate_scenario_creates_safe_draft() -> None:
    response = client.post(
        "/api/v1/studio/generate",
        json={
            "topic": "SSH brute force",
            "difficulty": "intermediate",
            "source": "mitre",
            "technique_id": "T1110",
        },
    )

    assert response.status_code == 201
    draft = response.json()
    assert draft["status"] == "draft"
    assert draft["source_type"] == "ai_generated"
    assert draft["threat_intel_source"]["mitre_technique_id"] == "T1110"
    assert draft["safety_check_results"]["passed"] is True
    assert "auth.log" in draft["config"]["logs"]
    assert "firewall.log" in draft["config"]["logs"]


def test_safety_check_blocks_real_company_names() -> None:
    payload = load_scenario("scenario_1").model_dump(mode="json")
    payload["description"] = "Attack on Sony Corporation using noisy authentication attempts."

    response = client.post("/api/v1/studio/validate", json=payload)

    assert response.status_code == 200
    result = response.json()
    assert result["valid"] is False
    assert result["safety_check"]["no_real_companies"] is False
    assert "sony" in result["errors"][0].lower()


def test_safety_check_allows_normal_security_vocabulary() -> None:
    payload = load_scenario("scenario_1").model_dump(mode="json")
    payload["description"] = "Brute force attack using credential stuffing signals."

    response = client.post("/api/v1/studio/validate", json=payload)

    assert response.status_code == 200
    result = response.json()
    assert result["valid"] is True
    assert result["safety_check"]["passed"] is True


def test_ip_validation_enforces_private_or_documentation_ranges() -> None:
    payload = load_scenario("scenario_1").model_dump(mode="json")
    payload["logs"]["auth.log"]["events"][0]["parameters"]["ip"] = "8.8.8.8"

    response = client.post("/api/v1/studio/validate", json=payload)

    assert response.status_code == 200
    result = response.json()
    assert result["valid"] is False
    assert result["safety_check"]["ip_validation"] is False
    assert "8.8.8.8" in result["errors"][0]


def test_submit_draft_runs_review_and_updates_status() -> None:
    generated = client.post(
        "/api/v1/studio/generate",
        json={"topic": "Credential abuse", "difficulty": "intermediate", "source": "custom"},
    ).json()

    response = client.post("/api/v1/studio/submit", json={"draft_id": generated["draft_id"]})

    assert response.status_code == 200
    job = response.json()
    assert job["status"] == "completed"
    assert job["result"]["passed"] is True
    assert job["result"]["overall_score"] >= 0.85

    drafts = client.get("/api/v1/studio/drafts").json()
    assert drafts[0]["draft_id"] == generated["draft_id"]
    assert drafts[0]["status"] == "published"
    assert drafts[0]["ai_review_score"] == job["result"]["overall_score"]


def test_threat_data_and_catalog_endpoints() -> None:
    threat_response = client.get("/api/v1/studio/threat-data?source=mitre&keyword=brute")
    assert threat_response.status_code == 200
    threat_items = threat_response.json()
    assert threat_items[0]["identifier"] == "T1110"

    catalog_response = client.get("/api/v1/studio/catalog?status=published&difficulty=beginner")
    assert catalog_response.status_code == 200
    catalog = catalog_response.json()
    assert catalog[0]["id"] == "scenario_1"
