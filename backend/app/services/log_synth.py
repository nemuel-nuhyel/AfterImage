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
    LogConfig,
    LogEvent,
    ScenarioConfig,
)


DEFAULT_BASE_TIME = datetime(2026, 6, 18, tzinfo=timezone.utc)
HOSTNAME = "dev-ubuntu"
TARGET_IP = "192.168.1.20"


@dataclass(frozen=True)
class _LogEntry:
    timestamp: datetime
    line: str
    ordinal: int


def build_ssh_bruteforce_scenario() -> ScenarioConfig:
    return ScenarioConfig(
        id="ssh_bruteforce",
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
        containers={"victim": ContainerConfig()},
        logs={
            "auth.log": LogConfig(
                generator="auth_synth",
                noise_level=0.1,
                events=[
                    LogEvent(
                        type="failed_ssh",
                        parameters={"user": "root", "ip": "10.0.0.55", "count": 150},
                        time_offset=0,
                    ),
                    LogEvent(
                        type="successful_ssh",
                        parameters={"user": "backup_svc", "ip": "10.0.0.55"},
                        hidden=True,
                        time_offset=933,
                    ),
                    LogEvent(
                        type="sudo_escalation",
                        parameters={"user": "backup_svc", "command": "cat /etc/shadow"},
                        hidden=True,
                        time_offset=1005,
                    ),
                    LogEvent(
                        type="normal_admin",
                        parameters={"user": "admin", "ip": "192.168.1.10"},
                        red_herring=True,
                        time_offset=32400,
                    ),
                    LogEvent(
                        type="failed_ssh",
                        parameters={"user": "admin", "ip": "192.168.1.10", "count": 3},
                        red_herring=True,
                        time_offset=32700,
                    ),
                ],
            ),
            "firewall.log": LogConfig(
                generator="firewall_synth",
                noise_level=0.05,
                events=[
                    LogEvent(
                        type="blocked_connection",
                        parameters={"src_ip": "10.0.0.55", "dst_port": 22, "count": 200},
                        time_offset=0,
                    ),
                    LogEvent(
                        type="allowed_connection",
                        parameters={"src_ip": "10.0.0.55", "dst_port": 22},
                        hidden=True,
                        time_offset=933,
                    ),
                ],
            ),
            "audit.log": LogConfig(
                generator="audit_synth",
                noise_level=0.05,
                events=[
                    LogEvent(
                        type="user_auth_success",
                        parameters={"user": "backup_svc", "ip": "10.0.0.55"},
                        hidden=True,
                        time_offset=933,
                    ),
                    LogEvent(
                        type="credential_acquired",
                        parameters={"user": "backup_svc"},
                        hidden=True,
                        time_offset=935,
                    ),
                    LogEvent(
                        type="user_command",
                        parameters={"user": "backup_svc", "command": "cat /etc/shadow"},
                        hidden=True,
                        time_offset=1005,
                    ),
                    LogEvent(
                        type="file_open",
                        parameters={"user": "backup_svc", "file": "/etc/shadow"},
                        hidden=True,
                        time_offset=1006,
                    ),
                ],
            ),
        },
        expected_findings=ExpectedFindings(
            attack_type="SSH brute-force with credential compromise",
            suspicious_ips=["10.0.0.55"],
            target_accounts=["root", "backup_svc"],
            attack_succeeded=True,
            success_details=(
                "Attacker used backup_svc at 02:15:33, then escalated with sudo "
                "to read /etc/shadow."
            ),
        ),
        grading_rubric=GradingRubric(
            detection_accuracy=30,
            evidence_quality=25,
            impact_analysis=25,
            response_plan=20,
        ),
        debate_questions=[
            "You concluded the attack failed. What explains 150 failed attempts followed by a gap?",
            "What evidence distinguishes the attacker giving up from finding a valid credential?",
            "Why prioritize the 09:05 admin failures over the 02:00 activity?",
            "What would firewall logs show if the SSH connection was eventually allowed?",
        ],
    )


def synthesize_logs(
    scenario: ScenarioConfig,
    *,
    seed: int = 42,
    base_time: datetime = DEFAULT_BASE_TIME,
) -> GeneratedScenarioLogs:
    logs: dict[str, GeneratedLogFile] = {}

    for log_name, log_config in scenario.logs.items():
        rng = random.Random(_child_seed(seed, log_name))
        if log_config.generator == "auth_synth":
            logs[log_name] = _synthesize_auth_log(log_name, log_config, rng, base_time)
        elif log_config.generator == "firewall_synth":
            logs[log_name] = _synthesize_firewall_log(log_name, log_config, rng, base_time)
        elif log_config.generator == "audit_synth":
            logs[log_name] = _synthesize_audit_log(log_name, log_config, rng, base_time)
        else:
            raise ValueError(f"Unsupported log generator: {log_config.generator}")

    return GeneratedScenarioLogs(
        scenario_id=scenario.id,
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

    for event in log_config.events:
        if event.type == "failed_ssh":
            _add_failed_ssh_entries(entries, event, rng, base_time)
        elif event.type == "successful_ssh":
            _add_successful_ssh_entry(entries, event, rng, base_time)
        elif event.type == "sudo_escalation":
            _add_sudo_escalation_entry(entries, event, base_time)
        elif event.type == "normal_admin":
            _add_normal_admin_entry(entries, event, rng, base_time)
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

    for event in log_config.events:
        if event.type == "blocked_connection":
            _add_blocked_connection_entries(entries, event, rng, base_time)
        elif event.type == "allowed_connection":
            _add_allowed_connection_entry(entries, event, rng, base_time)
        else:
            raise ValueError(f"Unsupported firewall event type: {event.type}")

    _add_firewall_noise(entries, log_config.noise_level, rng, base_time)
    return _build_log_file(log_name, entries)


def _synthesize_audit_log(
    log_name: str,
    log_config: LogConfig,
    rng: random.Random,
    base_time: datetime,
) -> GeneratedLogFile:
    entries: list[_LogEntry] = []

    for event in log_config.events:
        if event.type == "user_auth_success":
            _add_audit_user_auth(entries, event, rng, base_time)
        elif event.type == "credential_acquired":
            _add_audit_credential(entries, event, rng, base_time)
        elif event.type == "user_command":
            _add_audit_user_command(entries, event, rng, base_time)
        elif event.type == "file_open":
            _add_audit_file_open(entries, event, rng, base_time)
        else:
            raise ValueError(f"Unsupported audit event type: {event.type}")

    _add_audit_noise(entries, log_config.noise_level, rng, base_time)
    return _build_log_file(log_name, entries)


def _add_failed_ssh_entries(
    entries: list[_LogEntry],
    event: LogEvent,
    rng: random.Random,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    ip = str(event.param("ip"))
    count = int(event.param("count", 1))

    for timestamp in _event_timestamps(event, count, base_time, spacing_seconds=4):
        _append(
            entries,
            timestamp,
            (
                f"{_syslog_timestamp(timestamp)} {HOSTNAME} sshd[{rng.randint(1100, 9999)}]: "
                f"Failed password for {user} from {ip} port {rng.randint(42000, 60999)} ssh2"
            ),
        )


def _add_successful_ssh_entry(
    entries: list[_LogEntry],
    event: LogEvent,
    rng: random.Random,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    ip = str(event.param("ip"))
    timestamp = _event_time(event, base_time)
    _append(
        entries,
        timestamp,
        (
            f"{_syslog_timestamp(timestamp)} {HOSTNAME} sshd[{rng.randint(1100, 9999)}]: "
            f"Accepted password for {user} from {ip} port {rng.randint(42000, 60999)} ssh2"
        ),
    )


def _add_sudo_escalation_entry(
    entries: list[_LogEntry],
    event: LogEvent,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    command = str(event.param("command"))
    timestamp = _event_time(event, base_time)
    _append(
        entries,
        timestamp,
        (
            f"{_syslog_timestamp(timestamp)} {HOSTNAME} sudo: {user} : "
            f"TTY=pts/1 ; PWD=/home/{user} ; USER=root ; COMMAND=/usr/bin/{command}"
        ),
    )


def _add_normal_admin_entry(
    entries: list[_LogEntry],
    event: LogEvent,
    rng: random.Random,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    ip = str(event.param("ip"))
    timestamp = _event_time(event, base_time)
    _append(
        entries,
        timestamp,
        (
            f"{_syslog_timestamp(timestamp)} {HOSTNAME} sshd[{rng.randint(1100, 9999)}]: "
            f"Accepted publickey for {user} from {ip} port {rng.randint(42000, 60999)} ssh2"
        ),
    )


def _add_blocked_connection_entries(
    entries: list[_LogEntry],
    event: LogEvent,
    rng: random.Random,
    base_time: datetime,
) -> None:
    src_ip = str(event.param("src_ip"))
    dst_port = str(event.param("dst_port"))
    count = int(event.param("count", 1))

    for timestamp in _event_timestamps(event, count, base_time, spacing_seconds=3):
        _append(
            entries,
            timestamp,
            (
                f"{_syslog_timestamp(timestamp)} firewall kernel: [UFW BLOCK] "
                f"IN=eth0 OUT= MAC= SRC={src_ip} DST={TARGET_IP} LEN=60 "
                f"PROTO=TCP SPT={rng.randint(42000, 60999)} DPT={dst_port} WINDOW=64240 SYN"
            ),
        )


def _add_allowed_connection_entry(
    entries: list[_LogEntry],
    event: LogEvent,
    rng: random.Random,
    base_time: datetime,
) -> None:
    src_ip = str(event.param("src_ip"))
    dst_port = str(event.param("dst_port"))
    timestamp = _event_time(event, base_time)
    _append(
        entries,
        timestamp,
        (
            f"{_syslog_timestamp(timestamp)} firewall kernel: [UFW ALLOW] "
            f"IN=eth0 OUT= MAC= SRC={src_ip} DST={TARGET_IP} LEN=60 "
            f"PROTO=TCP SPT={rng.randint(42000, 60999)} DPT={dst_port} WINDOW=64240 SYN"
        ),
    )


def _add_audit_user_auth(
    entries: list[_LogEntry],
    event: LogEvent,
    rng: random.Random,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    ip = str(event.param("ip"))
    timestamp = _event_time(event, base_time)
    _append(
        entries,
        timestamp,
        (
            f"type=USER_AUTH msg=audit({_audit_timestamp(timestamp)}:{rng.randint(1000, 2000)}): "
            f"pid={rng.randint(1100, 9999)} uid=0 auid=4294967295 ses=4294967295 "
            f"msg='op=login acct=\"{user}\" exe=\"/usr/sbin/sshd\" "
            f"hostname={ip} addr={ip} terminal=ssh res=success'"
        ),
    )


def _add_audit_credential(
    entries: list[_LogEntry],
    event: LogEvent,
    rng: random.Random,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    timestamp = _event_time(event, base_time)
    _append(
        entries,
        timestamp,
        (
            f"type=CRED_ACQ msg=audit({_audit_timestamp(timestamp)}:{rng.randint(2001, 3000)}): "
            f"pid={rng.randint(1100, 9999)} uid=0 auid=1002 ses=12 "
            f"msg='op=PAM:setcred acct=\"{user}\" exe=\"/usr/sbin/sshd\" "
            "terminal=ssh res=success'"
        ),
    )


def _add_audit_user_command(
    entries: list[_LogEntry],
    event: LogEvent,
    rng: random.Random,
    base_time: datetime,
) -> None:
    user = str(event.param("user"))
    command = str(event.param("command"))
    timestamp = _event_time(event, base_time)
    _append(
        entries,
        timestamp,
        (
            f"type=USER_CMD msg=audit({_audit_timestamp(timestamp)}:{rng.randint(3001, 4000)}): "
            f"pid={rng.randint(1100, 9999)} uid=1002 auid=1002 ses=12 "
            f"msg='cwd=\"/home/{user}\" cmd=\"{command}\" terminal=pts/1 res=success'"
        ),
    )


def _add_audit_file_open(
    entries: list[_LogEntry],
    event: LogEvent,
    rng: random.Random,
    base_time: datetime,
) -> None:
    file_path = str(event.param("file"))
    timestamp = _event_time(event, base_time)
    _append(
        entries,
        timestamp,
        (
            f"type=SYSCALL msg=audit({_audit_timestamp(timestamp)}:{rng.randint(4001, 5000)}): "
            "arch=c000003e syscall=openat success=yes exit=3 a0=ffffff9c "
            f"a1=7ffdc0 a2=0 a3=0 items=1 uid=0 euid=0 exe=\"/usr/bin/cat\" "
            f"name=\"{file_path}\" key=\"shadow-read\""
        ),
    )


def _add_auth_noise(
    entries: list[_LogEntry],
    noise_level: float,
    rng: random.Random,
    base_time: datetime,
) -> None:
    users = ["deploy", "monitor", "svc_metrics", "jenkins", "www-data"]
    for index in range(round(noise_level * 50)):
        timestamp = base_time + timedelta(hours=1, minutes=index * 11 + rng.randint(0, 4))
        user = users[index % len(users)]
        _append(
            entries,
            timestamp,
            (
                f"{_syslog_timestamp(timestamp)} {HOSTNAME} CRON[{rng.randint(1100, 9999)}]: "
                f"pam_unix(cron:session): session opened for user {user} by (uid=0)"
            ),
        )


def _add_firewall_noise(
    entries: list[_LogEntry],
    noise_level: float,
    rng: random.Random,
    base_time: datetime,
) -> None:
    ports = [80, 443, 123, 5353]
    for index in range(round(noise_level * 40)):
        timestamp = base_time + timedelta(hours=1, minutes=index * 17 + rng.randint(0, 5))
        src_ip = f"172.16.{rng.randint(0, 3)}.{rng.randint(10, 240)}"
        dst_port = ports[index % len(ports)]
        _append(
            entries,
            timestamp,
            (
                f"{_syslog_timestamp(timestamp)} firewall kernel: [UFW BLOCK] "
                f"IN=eth0 OUT= MAC= SRC={src_ip} DST={TARGET_IP} LEN=52 "
                f"PROTO=UDP SPT={rng.randint(42000, 60999)} DPT={dst_port}"
            ),
        )


def _add_audit_noise(
    entries: list[_LogEntry],
    noise_level: float,
    rng: random.Random,
    base_time: datetime,
) -> None:
    accounts = ["deploy", "monitor", "jenkins"]
    for index in range(round(noise_level * 30)):
        timestamp = base_time + timedelta(hours=1, minutes=index * 13 + rng.randint(0, 4))
        account = accounts[index % len(accounts)]
        _append(
            entries,
            timestamp,
            (
                f"type=USER_ACCT msg=audit({_audit_timestamp(timestamp)}:{rng.randint(5001, 7000)}): "
                f"pid={rng.randint(1100, 9999)} uid=0 auid=4294967295 ses=4294967295 "
                f"msg='op=PAM:accounting acct=\"{account}\" exe=\"/usr/sbin/cron\" "
                "hostname=? addr=? terminal=cron res=success'"
            ),
        )


def _build_log_file(name: str, entries: list[_LogEntry]) -> GeneratedLogFile:
    sorted_entries = sorted(entries, key=lambda entry: (entry.timestamp, entry.ordinal))
    lines = [entry.line for entry in sorted_entries]
    content = "\n".join(lines)
    if content:
        content += "\n"
    return GeneratedLogFile(name=name, content=content, lines=lines)


def _append(entries: list[_LogEntry], timestamp: datetime, line: str) -> None:
    entries.append(_LogEntry(timestamp=timestamp, line=line, ordinal=len(entries)))


def _event_timestamps(
    event: LogEvent,
    count: int,
    base_time: datetime,
    *,
    spacing_seconds: int,
) -> list[datetime]:
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
    return [start + timedelta(seconds=index * spacing_seconds) for index in range(count)]


def _event_time(event: LogEvent, base_time: datetime) -> datetime:
    if event.time_offset is not None:
        return base_time + timedelta(seconds=event.time_offset)

    time_value = event.param("time")
    if time_value is not None:
        return _clock_time(base_time, str(time_value))

    return base_time


def _parse_time_window(value: str, base_time: datetime) -> tuple[datetime, datetime]:
    start_raw, end_raw = value.split("-", maxsplit=1)
    start = _clock_time(base_time, start_raw)
    end = _clock_time(base_time, end_raw)
    if end < start:
        end += timedelta(days=1)
    return start, end


def _clock_time(base_time: datetime, value: str) -> datetime:
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


def _audit_timestamp(timestamp: datetime) -> str:
    return f"{int(timestamp.timestamp())}.000"


def _child_seed(seed: int, name: str) -> int:
    digest = hashlib.sha256(f"{seed}:{name}".encode("utf-8")).hexdigest()
    return int(digest[:16], 16)
