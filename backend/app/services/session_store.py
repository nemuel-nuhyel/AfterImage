from __future__ import annotations

import json

from ..database import ScenarioSessionRecord, get_db_session, init_db
from ..models.session import ScenarioSession


class SQLiteSessionStore:
    def __init__(self) -> None:
        init_db()

    def create(self, session: ScenarioSession) -> ScenarioSession:
        self.save(session)
        return session

    def get(self, session_id: str) -> ScenarioSession | None:
        with get_db_session() as db:
            record = db.get(ScenarioSessionRecord, session_id)
            if record is None:
                return None
            return _record_to_session(record)

    def save(self, session: ScenarioSession) -> ScenarioSession:
        with get_db_session() as db:
            db.merge(_session_to_record(session))
            db.commit()
        return session

    def clear(self) -> None:
        with get_db_session() as db:
            db.query(ScenarioSessionRecord).delete()
            db.commit()


def _session_to_record(session: ScenarioSession) -> ScenarioSessionRecord:
    return ScenarioSessionRecord(
        session_id=str(session.session_id),
        scenario_id=session.scenario_id,
        user_id=session.user_id,
        status=session.status,
        start_time=session.start_time.isoformat(),
        end_time=session.end_time.isoformat() if session.end_time else None,
        remaining_seconds=session.remaining_seconds,
        hints_used=session.hints_used,
        available_logs_json=json.dumps(session.available_logs),
        logs_json=json.dumps(session.logs),
        evidence_json=json.dumps([item.model_dump(mode="json") for item in session.evidence]),
        report_draft_json=(
            json.dumps(session.report_draft.model_dump(mode="json"))
            if session.report_draft
            else None
        ),
        final_score_json=(
            json.dumps(session.final_score.model_dump(mode="json")) if session.final_score else None
        ),
    )


def _record_to_session(record: ScenarioSessionRecord) -> ScenarioSession:
    payload = {
        "session_id": record.session_id,
        "scenario_id": record.scenario_id,
        "user_id": record.user_id,
        "status": record.status,
        "start_time": record.start_time,
        "end_time": record.end_time,
        "remaining_seconds": record.remaining_seconds,
        "hints_used": record.hints_used,
        "available_logs": json.loads(record.available_logs_json),
        "logs": json.loads(record.logs_json),
        "evidence": json.loads(record.evidence_json),
        "report_draft": (
            json.loads(record.report_draft_json) if record.report_draft_json else None
        ),
        "final_score": json.loads(record.final_score_json) if record.final_score_json else None,
    }
    return ScenarioSession.model_validate(payload)


session_store = SQLiteSessionStore()
