from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models.scenario import LogContentResponse, LogFileInfo
from ..models.session import ScenarioSession, ScenarioSessionResponse
from ..services.session_store import session_store


router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


@router.get("/{session_id}", response_model=ScenarioSessionResponse)
def get_session(session_id: str) -> ScenarioSessionResponse:
    session = _get_session_or_404(session_id)
    return _session_response(session)


@router.get("/{session_id}/logs", response_model=list[LogFileInfo])
def list_session_logs(session_id: str) -> list[LogFileInfo]:
    session = _get_session_or_404(session_id)
    return [
        LogFileInfo(name=log_name, line_count=_line_count(session.logs[log_name]))
        for log_name in session.available_logs
    ]


@router.get("/{session_id}/logs/{file}", response_model=LogContentResponse)
def get_session_log(session_id: str, file: str) -> LogContentResponse:
    session = _get_session_or_404(session_id)
    content = session.logs.get(file)
    if content is None:
        raise HTTPException(status_code=404, detail="Log file not found")

    return LogContentResponse(
        session_id=session.session_id,
        log_file=file,
        line_count=_line_count(content),
        content=content,
    )


def _get_session_or_404(session_id: str) -> ScenarioSession:
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def _session_response(session: ScenarioSession) -> ScenarioSessionResponse:
    return ScenarioSessionResponse(
        session_id=session.session_id,
        scenario_id=session.scenario_id,
        status=session.status,
        start_time=session.start_time,
        remaining_seconds=session.remaining_seconds,
        hints_used=session.hints_used,
        available_logs=session.available_logs,
    )


def _line_count(content: str) -> int:
    if not content:
        return 0
    return len(content.rstrip("\n").split("\n"))
