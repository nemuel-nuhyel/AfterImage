from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import random

from ..models.scenario import (
    ContainerConfig,
    ExpectedFindings,
    GeneratedLogFile,
    GeneratedScenarioLogs,
    GradingRubric,
    LineLabel,
    LogConfig,
    LogEvent,
    LogLineMetadata,
    ScenarioConfig,
)


DEFAULT_BASE_TIME = datetime(2026, 6, 18, tzinfo=timezone.utc)
HOSTNAME = "dev-ubuntu"
TARGET_IP = "192.168.1.20"


@dataclass(frozen=True)
class _LogEntry:
    timestamp: datetime
    line: str
    label: LineLabel
    event_type: str
    source_event_index: int | None
    entities: dict[str, str]
    ordinal: int


def build_midnight_login_attempts_config() -> ScenarioConfig:
    return ScenarioConfig(
        id="midnight_login_attempts",
        title="Midnight Login Attempts",
        difficulty="beginner",
        time_limit=900,
        hint_budget=3,
        timeline_day=1,
        description=(
            "A junior analyst notices unusual SSH activity on the development server "
            "during off-hours."
        ),
        objectives=[
            "Identify brute-force authentication patterns",
            "Distinguish failed authentication from successful compromise",
            "Separate real evidence from suspicious-looking admin noise",
        ],
        containers={"victim": ContainerConfig(image="ubuntu:22.04")},
        logs={
            "auth.log": LogConfig(
                generator="auth_synth",
                noise_level=0.15,
                events=[
                    LogEvent(
                        type="failed_ssh",
                        parameters={
                            "user": "root",
                            "ip": "10.0.0.55",
                            "count": 150,
                            "time_window": "02:00-04:00",
                            "pattern": "incremental_delay",
                        },
                    ),
                    LogEvent(
                        type="successful_ssh",
                        hidden=True,
                        parameters={
                            "user": "backup_svc",
                            "ip": "10.0.0.55",
                            "time": "02:15:33",
                        },
                    ),
                    LogEvent(
                        type="sudo_escalation",
                        hidden=True,
                        parameters={
                            "user": "backup_svc",
                            "command": "cat /etc/shadow",
                            "time": "02:16:45",
                        },
                    ),
                    LogEvent(
                        type="normal_admin",
                        red_herring=True,
                        parameters={
                            "user": "admin",
                            "ip": "192.168.1.10",
                            "time": "09:00:00",
                        },
                    ),
                    LogEvent(
                        type="failed_ssh",
                        red_herring=True,
                        parameters={
                            "user": "admin",
                            "ip": "192.168.1.10",
                            "count": 3,
                            "time": "09:05:00",
                        },
                    ),
                ],
            ),
            "firewall.log": LogConfig(
                generator="firewall_synth",
                noise_level=0.1,
                events=[
                    LogEvent(
                        type="blocked_connection",
                        parameters={
                            "src_ip": "10.0.0.55",
                            "dst_port": 22,
                            "count": 200,
                            "time_window": "02:00-04:00",
                        },
                    ),
                    LogEvent(
                        type="allowed_connection",
                        hidden=True,
                        parameters={
                            "src_ip": "10.0.0.55",
                            "dst_port": 22,
                            "time": "02:15:33",
                        },
                    ),
                ],
            ),
        },
        expected_findings=ExpectedFindings(
            attack_type="SSH brute-force with successful credential compromise",
            suspicious_ips=["10.0.0.55"],
            target_accounts=["root", "backup_svc"],
            attack_succeeded=True,
            success_details="backup_svc was used successfully at 02:15:33, followed by sudo access.",
        ),
        grading_rubric=GradingRubric(
            detection_accuracy=30,
            evidence_quality=25,
            impact_analysis=25,
            response_plan=20,
        ),
        debate_questions=[
            "You concluded the attack failed. What explains the failed attempts stopping suddenly?",
            "What evidence would distinguish the attacker giving up from finding a valid credential?",
            "Why are the 09:05 admin failures more important than the 02:00 activity?",
            "What would firewall logs show if the SSH connection was eventually allowed?",
        ],
    )


def synthesize_logs(
    config: ScenarioConfig,
    *,
    seed: int = 42,
    base_time: datetime = DEFAULT_BASE_TIME,
) -> GeneratedScenarioLogs:
    logs: dict[str, GeneratedLogFile] = {}

    for log_name, log_config in config.logs.items():
        rng = random.Random(_child_seed(seed, log_name))
        if log_config.generator == "auth_synth":
            logs[log_name] = _synthesize_auth_log(log_name, log_config, rng, base_time)
        elif log_config.generator == "firewall_synth":
            logs[log_name] = _synthesize_firewall_log(log_name, log_config, rng, base_time)
        else:
            raise ValueError(f"Unsupported log generator: {log_config.generator}")

    return GeneratedScenarioLogs(
        scenario_id=config.id,
        seed=seed,
        generated_at=base_time,
        logs=logs,
    )


def _synthesize_auth_log(
    log_name: str,
    log_config: LogConfig,
    rng: random.Random,
    base_time: datetime,
) -> GeneratedLogFile:
    entries: list[_LogEntry] = []

    for index, event in enumerate(log_config.events):
        if event.type == "failed_ssh":
            _add_failed_ssh_entries(entries, event, index, rng, base_time)
        elif event.type == "successful_ssh":
            _add_successful_ssh_entry(entries, event, index, rng, base_time)
        elif event.type == "sudo_escalation":
            _add_sudo_escalation_entry(entries, event, index, base_time)
        elif event.type == "normal_admin":
            _add_normal_admin_entry(entries, event, index, rng, base_time)
        else:
            raise ValueError(f"Unsupported auth event type: {event.type}")

    _add_auth_noise(entries, log_config.noise_level, rng, base_time)
    return _build_log_file(log_name, entries)


def _synthesize_firewall_log(
    log_name: str,
    log_config: LogConfig,
    rng: random.Random,
    base_time: datetime,
) -> GeneratedLogFile:
    entries: list[_LogEntry] = []

    for index, event in enumerate(log_config.events):
        if event.type == "blocked_connection":
            _add_blocked_connection_entries(entries, event, index, rng, base_time)
        elif event.type == "allowed_connection":
            _add_allowed_connection_entry(entries, event, index, rng, base_time)
        else:
            raise ValueError(f"Unsupported firewall event type: {event.type}")

    _add_firewall_noise(entries, log_config.noise_level, rng, base_time)
    return _build_log_file(log_name, entries)


def _add_failed_ssh_entries(
    entries: list[_LogEntry],
    event: LogEvent,
    source_event_index: int,
    rng: random.Random,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    ip = str(event.param("ip"))
    count = int(event.param("count", 1))
    label: LineLabel = "red_herring" if event.red_herring else "supporting"
    timestamps = _event_timestamps(event, count, base_time)

    for timestamp in timestamps:
        port = rng.randint(42000, 60999)
        pid = rng.randint(1100, 9999)
        line = (
            f"{_syslog_timestamp(timestamp)} {HOSTNAME} sshd[{pid}]: "
            f"Failed password for {user} from {ip} port {port} ssh2"
        )
        _append_entry(
            entries,
            timestamp=timestamp,
            line=line,
            label=label,
            event_type=event.type,
            source_event_index=source_event_index,
            entities={"user": user, "ip": ip},
        )


def _add_successful_ssh_entry(
    entries: list[_LogEntry],
    event: LogEvent,
    source_event_index: int,
    rng: random.Random,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    ip = str(event.param("ip"))
    timestamp = _event_time(event, base_time)
    port = rng.randint(42000, 60999)
    pid = rng.randint(1100, 9999)
    line = (
        f"{_syslog_timestamp(timestamp)} {HOSTNAME} sshd[{pid}]: "
        f"Accepted password for {user} from {ip} port {port} ssh2"
    )
    _append_entry(
        entries,
        timestamp=timestamp,
        line=line,
        label="critical",
        event_type=event.type,
        source_event_index=source_event_index,
        entities={"user": user, "ip": ip},
    )


def _add_sudo_escalation_entry(
    entries: list[_LogEntry],
    event: LogEvent,
    source_event_index: int,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    command = str(event.param("command"))
    timestamp = _event_time(event, base_time)
    line = (
        f"{_syslog_timestamp(timestamp)} {HOSTNAME} sudo: {user} : "
        f"TTY=pts/1 ; PWD=/home/{user} ; USER=root ; COMMAND=/usr/bin/{command}"
    )
    _append_entry(
        entries,
        timestamp=timestamp,
        line=line,
        label="critical",
        event_type=event.type,
        source_event_index=source_event_index,
        entities={"user": user, "command": command},
    )


def _add_normal_admin_entry(
    entries: list[_LogEntry],
    event: LogEvent,
    source_event_index: int,
    rng: random.Random,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    ip = str(event.param("ip"))
    timestamp = _event_time(event, base_time)
    port = rng.randint(42000, 60999)
    pid = rng.randint(1100, 9999)
    line = (
        f"{_syslog_timestamp(timestamp)} {HOSTNAME} sshd[{pid}]: "
        f"Accepted publickey for {user} from {ip} port {port} ssh2"
    )
    _append_entry(
        entries,
        timestamp=timestamp,
        line=line,
        label="red_herring",
        event_type=event.type,
        source_event_index=source_event_index,
        entities={"user": user, "ip": ip},
    )


def _add_blocked_connection_entries(
    entries: list[_LogEntry],
    event: LogEvent,
    source_event_index: int,
    rng: random.Random,
    base_time: datetime,
) -> None:
    src_ip = str(event.param("src_ip"))
    dst_port = str(event.param("dst_port"))
    count = int(event.param("count", 1))
    timestamps = _event_timestamps(event, count, base_time)

    for timestamp in timestamps:
        source_port = rng.randint(42000, 60999)
        line = (
            f"{_syslog_timestamp(timestamp)} firewall kernel: [UFW BLOCK] "
            f"IN=eth0 OUT= MAC= SRC={src_ip} DST={TARGET_IP} LEN=60 "
            f"PROTO=TCP SPT={source_port} DPT={dst_port} WINDOW=64240 SYN"
        )
        _append_entry(
            entries,
            timestamp=timestamp,
            line=line,
            label="supporting",
            event_type=event.type,
            source_event_index=source_event_index,
            entities={"src_ip": src_ip, "dst_port": dst_port},
        )


def _add_allowed_connection_entry(
    entries: list[_LogEntry],
    event: LogEvent,
    source_event_index: int,
    rng: random.Random,
    base_time: datetime,
) -> None:
    src_ip = str(event.param("src_ip"))
    dst_port = str(event.param("dst_port"))
    timestamp = _event_time(event, base_time)
    source_port = rng.randint(42000, 60999)
    line = (
        f"{_syslog_timestamp(timestamp)} firewall kernel: [UFW ALLOW] "
        f"IN=eth0 OUT= MAC= SRC={src_ip} DST={TARGET_IP} LEN=60 "
        f"PROTO=TCP SPT={source_port} DPT={dst_port} WINDOW=64240 SYN"
    )
    _append_entry(
        entries,
        timestamp=timestamp,
        line=line,
        label="critical",
        event_type=event.type,
        source_event_index=source_event_index,
        entities={"src_ip": src_ip, "dst_port": dst_port},
    )


def _add_auth_noise(
    entries: list[_LogEntry],
    noise_level: float,
    rng: random.Random,
    base_time: datetime,
) -> None:
    count = round(noise_level * 40)
    users = ["deploy", "monitor", "svc_metrics", "jenkins"]

    for index in range(count):
        timestamp = base_time + timedelta(hours=1, minutes=index * 11 + rng.randint(0, 4))
        user = users[index % len(users)]
        pid = rng.randint(1100, 9999)
        line = (
            f"{_syslog_timestamp(timestamp)} {HOSTNAME} CRON[{pid}]: "
            f"pam_unix(cron:session): session opened for user {user} by (uid=0)"
        )
        _append_entry(
            entries,
            timestamp=timestamp,
            line=line,
            label="noise",
            event_type="auth_noise",
            source_event_index=None,
            entities={"user": user},
        )


def _add_firewall_noise(
    entries: list[_LogEntry],
    noise_level: float,
    rng: random.Random,
    base_time: datetime,
) -> None:
    count = round(noise_level * 30)
    ports = [80, 443, 123, 5353]

    for index in range(count):
        timestamp = base_time + timedelta(hours=1, minutes=index * 17 + rng.randint(0, 5))
        src_ip = f"172.16.{rng.randint(0, 3)}.{rng.randint(10, 240)}"
        dst_port = ports[index % len(ports)]
        source_port = rng.randint(42000, 60999)
        line = (
            f"{_syslog_timestamp(timestamp)} firewall kernel: [UFW BLOCK] "
            f"IN=eth0 OUT= MAC= SRC={src_ip} DST={TARGET_IP} LEN=52 "
            f"PROTO=UDP SPT={source_port} DPT={dst_port}"
        )
        _append_entry(
            entries,
            timestamp=timestamp,
            line=line,
            label="noise",
            event_type="firewall_noise",
            source_event_index=None,
            entities={"src_ip": src_ip, "dst_port": str(dst_port)},
        )


def _build_log_file(log_name: str, entries: list[_LogEntry]) -> GeneratedLogFile:
    sorted_entries = sorted(entries, key=lambda entry: (entry.timestamp, entry.ordinal))
    lines = [entry.line for entry in sorted_entries]
    metadata = [
        LogLineMetadata(
            log_file=log_name,
            line_number=index,
            line_content=entry.line,
            label=entry.label,
            event_type=entry.event_type,
            timestamp=entry.timestamp,
            source_event_index=entry.source_event_index,
            entities=entry.entities,
        )
        for index, entry in enumerate(sorted_entries, start=1)
    ]
    content = "\n".join(lines)
    if content:
        content += "\n"
    return GeneratedLogFile(name=log_name, content=content, lines=lines, metadata=metadata)


def _append_entry(
    entries: list[_LogEntry],
    *,
    timestamp: datetime,
    line: str,
    label: LineLabel,
    event_type: str,
    source_event_index: int | None,
    entities: dict[str, str],
) -> None:
    entries.append(
        _LogEntry(
            timestamp=timestamp,
            line=line,
            label=label,
            event_type=event_type,
            source_event_index=source_event_index,
            entities=entities,
            ordinal=len(entries),
        )
    )


def _event_timestamps(event: LogEvent, count: int, base_time: datetime) -> list[datetime]:
    time_window = event.param("time_window")
    if time_window:
        start, end = _parse_time_window(str(time_window), base_time)
        if count == 1:
            return [start]

        span_seconds = int((end - start).total_seconds())
        return [
            start + timedelta(seconds=round(index * span_seconds / (count - 1)))
            for index in range(count)
        ]

    start = _event_time(event, base_time)
    return [start + timedelta(seconds=index * 4) for index in range(count)]


def _event_time(event: LogEvent, base_time: datetime) -> datetime:
    if event.time_offset is not None:
        return base_time + timedelta(seconds=event.time_offset)

    time_value = event.param("time")
    if time_value is None:
        return base_time

    return _parse_clock_time(str(time_value), base_time)


def _parse_time_window(value: str, base_time: datetime) -> tuple[datetime, datetime]:
    start_raw, end_raw = value.split("-", maxsplit=1)
    start = _parse_clock_time(start_raw, base_time)
    end = _parse_clock_time(end_raw, base_time)
    if end < start:
        end += timedelta(days=1)
    return start, end


def _parse_clock_time(value: str, base_time: datetime) -> datetime:
    parts = [int(part) for part in value.split(":")]
    if len(parts) == 2:
        hour, minute = parts
        second = 0
    elif len(parts) == 3:
        hour, minute, second = parts
    else:
        raise ValueError(f"Invalid clock time: {value}")

    return base_time.replace(hour=hour, minute=minute, second=second, microsecond=0)


def _syslog_timestamp(timestamp: datetime) -> str:
    return f"{timestamp:%b} {timestamp.day:2d} {timestamp:%H:%M:%S}"


def _child_seed(seed: int, name: str) -> int:
    digest = hashlib.sha256(f"{seed}:{name}".encode("utf-8")).hexdigest()
    return int(digest[:16], 16)
