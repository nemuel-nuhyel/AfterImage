from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException

from ..models.session import ReportDraft, ScenarioSession, SubmitReportResponse
from ..services.session_store import session_store


router = APIRouter(prefix="/api/v1/sessions/{session_id}/report", tags=["reports"])


@router.post("/draft", response_model=ReportDraft)
def save_report_draft(session_id: str, draft: ReportDraft) -> ReportDraft:
    session = _get_session_or_404(session_id)
    _validate_evidence_references(session, draft.evidence_references)
    session.report_draft = draft
    session_store.save(session)
    return draft


@router.get("/draft", response_model=ReportDraft)
def get_report_draft(session_id: str) -> ReportDraft:
    session = _get_session_or_404(session_id)
    if session.report_draft is None:
        return ReportDraft()
    return session.report_draft


@router.post("/submit", response_model=SubmitReportResponse)
def submit_report(session_id: str, report: ReportDraft) -> SubmitReportResponse:
    session = _get_session_or_404(session_id)
    _validate_evidence_references(session, report.evidence_references)

    submitted_report = report.model_copy(update={"submitted_at": datetime.now(timezone.utc)})
    session.report_draft = submitted_report
    session.status = "submitted"
    session.end_time = submitted_report.submitted_at
    session.remaining_seconds = 0
    session_store.save(session)

    return SubmitReportResponse(
        session_id=session.session_id,
        status="submitted",
        report=submitted_report,
    )


def _get_session_or_404(session_id: str) -> ScenarioSession:
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def _validate_evidence_references(
    session: ScenarioSession,
    evidence_references: list[UUID],
) -> None:
    valid_ids = {item.id for item in session.evidence}
    missing = [str(item_id) for item_id in evidence_references if item_id not in valid_ids]
    if missing:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Report references evidence not found in this session",
                "missing_evidence_ids": missing,
            },
        )
