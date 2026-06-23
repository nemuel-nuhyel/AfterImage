from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status

from ..models.session import (
    ClearEvidenceResponse,
    DeleteEvidenceResponse,
    EvidenceItem,
    MarkEvidenceRequest,
    ScenarioSession,
    UpdateEvidenceRequest,
)
from ..services.session_store import session_store


router = APIRouter(prefix="/api/v1/sessions/{session_id}/evidence", tags=["evidence"])


@router.post("", response_model=EvidenceItem, status_code=status.HTTP_201_CREATED)
def mark_evidence(session_id: str, request: MarkEvidenceRequest) -> EvidenceItem:
    session = _get_session_or_404(session_id)
    line_content = _get_log_line_or_404(session, request.log_file, request.line_number)

    evidence = EvidenceItem(
        id=uuid4(),
        log_file=request.log_file,
        line_number=request.line_number,
        line_content=line_content,
        note=request.note,
        marked_at=datetime.now(timezone.utc),
    )
    session.evidence.append(evidence)
    session_store.save(session)
    return evidence


@router.get("", response_model=list[EvidenceItem])
def list_evidence(session_id: str) -> list[EvidenceItem]:
    session = _get_session_or_404(session_id)
    return session.evidence


@router.put("/{evidence_id}", response_model=EvidenceItem)
def update_evidence_note(
    session_id: str,
    evidence_id: UUID,
    request: UpdateEvidenceRequest,
) -> EvidenceItem:
    session = _get_session_or_404(session_id)
    evidence = _get_evidence_or_404(session, evidence_id)
    evidence.note = request.note
    session_store.save(session)
    return evidence


@router.delete("/{evidence_id}", response_model=DeleteEvidenceResponse)
def delete_evidence(session_id: str, evidence_id: UUID) -> DeleteEvidenceResponse:
    session = _get_session_or_404(session_id)
    for index, evidence in enumerate(session.evidence):
        if evidence.id == evidence_id:
            session.evidence.pop(index)
            session_store.save(session)
            return DeleteEvidenceResponse(deleted=True)

    raise HTTPException(status_code=404, detail="Evidence item not found")


@router.delete("", response_model=ClearEvidenceResponse)
def clear_evidence(session_id: str) -> ClearEvidenceResponse:
    session = _get_session_or_404(session_id)
    cleared = len(session.evidence)
    session.evidence.clear()
    session_store.save(session)
    return ClearEvidenceResponse(cleared=cleared)


def _get_session_or_404(session_id: str) -> ScenarioSession:
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def _get_log_line_or_404(session: ScenarioSession, log_file: str, line_number: int) -> str:
    content = session.logs.get(log_file)
    if content is None:
        raise HTTPException(status_code=404, detail="Log file not found")

    lines = content.rstrip("\n").split("\n") if content else []
    if line_number > len(lines):
        raise HTTPException(status_code=404, detail="Log line not found")

    return lines[line_number - 1]


def _get_evidence_or_404(session: ScenarioSession, evidence_id: UUID) -> EvidenceItem:
    for evidence in session.evidence:
        if evidence.id == evidence_id:
            return evidence

    raise HTTPException(status_code=404, detail="Evidence item not found")
