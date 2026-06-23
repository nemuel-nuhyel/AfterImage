from __future__ import annotations

from pathlib import Path

from sqlalchemy import Integer, String, Text, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = BACKEND_ROOT / "data" / "cyberrange.db"
DATABASE_URL = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"


class Base(DeclarativeBase):
    pass


class ScenarioSessionRecord(Base):
    __tablename__ = "scenario_sessions"

    session_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    scenario_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    start_time: Mapped[str] = mapped_column(String(40), nullable=False)
    end_time: Mapped[str | None] = mapped_column(String(40), nullable=True)
    remaining_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hints_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    available_logs_json: Mapped[str] = mapped_column(Text, nullable=False)
    logs_json: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_json: Mapped[str] = mapped_column(Text, nullable=False)
    report_draft_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_score_json: Mapped[str | None] = mapped_column(Text, nullable=True)


def _ensure_sqlite_parent() -> None:
    DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)


_ensure_sqlite_parent()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
_initialized = False


def init_db(db_engine: Engine = engine) -> None:
    global _initialized
    Base.metadata.create_all(bind=db_engine)
    if db_engine is engine:
        _initialized = True


def get_db_session() -> Session:
    if not _initialized:
        init_db()
    return SessionLocal()
