from __future__ import annotations

import json
from pathlib import Path

from ..models.scenario import ScenarioConfig


BACKEND_ROOT = Path(__file__).resolve().parents[2]
SCENARIO_ROOT = BACKEND_ROOT / "data" / "scenarios"


def load_scenario(scenario_id: str) -> ScenarioConfig:
    config_path = SCENARIO_ROOT / scenario_id / "config.json"
    if not config_path.exists():
        raise FileNotFoundError(f"Scenario {scenario_id} not found")

    return load_scenario_file(config_path)


def load_all_scenarios(scenario_root: Path = SCENARIO_ROOT) -> list[ScenarioConfig]:
    configs: list[ScenarioConfig] = []
    for config_path in sorted(scenario_root.glob("*/config.json")):
        configs.append(load_scenario_file(config_path))
    return configs


def load_scenario_file(config_path: Path) -> ScenarioConfig:
    with config_path.open(encoding="utf-8") as file:
        data = json.load(file)

    return ScenarioConfig(**data)
