from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from ..models.scenario import ScenarioConfig, ScenarioMode
from ..models.session import ScenarioSession
from .log_synth import synthesize_logs
from .scenario_loader import load_all_scenarios
from .session_store import SQLiteSessionStore, session_store


class ScenarioService:
    def __init__(
        self,
        store: SQLiteSessionStore,
        scenarios: list[ScenarioConfig] | None = None,
    ) -> None:
        loaded_scenarios = scenarios if scenarios is not None else load_all_scenarios()
        self._scenarios: dict[str, ScenarioConfig] = {
            scenario.id: scenario for scenario in loaded_scenarios
        }
        self._store = store

    def list_scenarios(self) -> list[ScenarioConfig]:
        return list(self._scenarios.values())

    def get_scenario(self, scenario_id: str) -> ScenarioConfig | None:
        return self._scenarios.get(scenario_id)

    def start_scenario(self, scenario_id: str, mode: ScenarioMode = "timed") -> ScenarioSession:
        scenario = self.get_scenario(scenario_id)
        if scenario is None:
            raise KeyError(scenario_id)

        session_id = uuid4()
        seed = _session_seed(session_id)
        generated = synthesize_logs(scenario, seed=seed)
        session = ScenarioSession(
            session_id=session_id,
            scenario_id=scenario.id,
            status="active",
            start_time=datetime.now(timezone.utc),
            remaining_seconds=None if mode == "practice" else scenario.time_limit,
            available_logs=scenario.available_logs,
            logs={name: log.content for name, log in generated.logs.items()},
        )
        return self._store.create(session)


def _session_seed(session_id: UUID) -> int:
    return session_id.int % 2_147_483_647


scenario_service = ScenarioService(session_store)
