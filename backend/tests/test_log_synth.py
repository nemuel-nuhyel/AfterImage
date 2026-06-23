from backend.app.services.log_synth import build_ssh_bruteforce_scenario, synthesize_logs


def test_log_synthesis_determinism() -> None:
    scenario = build_ssh_bruteforce_scenario()

    logs_a = synthesize_logs(scenario, seed=42)
    logs_b = synthesize_logs(scenario, seed=42)

    assert logs_a.model_dump(mode="json") == logs_b.model_dump(mode="json")


def test_different_seed_changes_generated_details() -> None:
    scenario = build_ssh_bruteforce_scenario()

    logs_a = synthesize_logs(scenario, seed=42)
    logs_b = synthesize_logs(scenario, seed=43)

    assert logs_a.logs["auth.log"].content != logs_b.logs["auth.log"].content


def test_ssh_bruteforce_generates_three_expected_logs() -> None:
    scenario = build_ssh_bruteforce_scenario()
    generated = synthesize_logs(scenario, seed=42)

    assert list(generated.logs.keys()) == ["auth.log", "firewall.log", "audit.log"]


def test_auth_log_contains_failed_and_successful_ssh_events() -> None:
    scenario = build_ssh_bruteforce_scenario()
    generated = synthesize_logs(scenario, seed=42)
    auth_log = generated.logs["auth.log"].content

    assert auth_log.count("Failed password for root from 10.0.0.55") == 150
    assert "Accepted password for backup_svc from 10.0.0.55" in auth_log
    assert "COMMAND=/usr/bin/cat /etc/shadow" in auth_log


def test_firewall_and_audit_logs_contain_compromise_trail() -> None:
    scenario = build_ssh_bruteforce_scenario()
    generated = synthesize_logs(scenario, seed=42)

    assert "[UFW ALLOW]" in generated.logs["firewall.log"].content
    assert "acct=\"backup_svc\"" in generated.logs["audit.log"].content
    assert "cmd=\"cat /etc/shadow\"" in generated.logs["audit.log"].content
