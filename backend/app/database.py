from __future__ import annotations

import os
from pathlib import Path
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = PROJECT_ROOT / "data" / "cyberrange.db"
DATABASE_URL = os.getenv("CYBERRANGE_DB_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")


class Base(DeclarativeBase):
    pass


def _engine_args(database_url: str) -> dict:
    if database_url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {}


def _ensure_sqlite_parent(database_url: str) -> None:
    if not database_url.startswith("sqlite:///") or database_url == "sqlite:///:memory:":
        return

    raw_path = database_url.removeprefix("sqlite:///")
    Path(raw_path).parent.mkdir(parents=True, exist_ok=True)


_ensure_sqlite_parent(DATABASE_URL)
engine = create_engine(DATABASE_URL, **_engine_args(DATABASE_URL))
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
_initialized = False


def init_db(db_engine: Engine = engine) -> None:
    global _initialized
    Base.metadata.create_all(bind=db_engine)
    if db_engine is engine:
        _initialized = True


def get_db() -> Iterator[Session]:
    if not _initialized:
        init_db()

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
