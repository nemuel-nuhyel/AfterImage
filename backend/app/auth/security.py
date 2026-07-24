from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from typing import Any


ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
ALGORITHM = "HS256"
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "dev-only-aftermath-secret-key-change-before-production",
)

_password_hash: Any | None = None


class AuthDependencyError(RuntimeError):
    pass


def _load_password_hash() -> Any:
    global _password_hash
    if _password_hash is not None:
        return _password_hash
    try:
        from pwdlib import PasswordHash
    except ImportError as exc:
        raise AuthDependencyError(
            "pwdlib[argon2] is required for password hashing. Install backend requirements."
        ) from exc
    _password_hash = PasswordHash.recommended()
    return _password_hash


def _load_jwt() -> Any:
    try:
        from jose import jwt
    except ImportError as exc:
        raise AuthDependencyError(
            "python-jose[cryptography] is required for JWT handling. Install backend requirements."
        ) from exc
    return jwt


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def hash_password(password: str) -> str:
    return _load_password_hash().hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return bool(_load_password_hash().verify(password, hashed_password))


def create_access_token(*, user_id: str, role: str) -> str:
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "typ": "access",
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return _load_jwt().encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    payload = _load_jwt().decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("typ") != "access":
        raise ValueError("Invalid token type")
    return payload


def access_token_expires_in() -> int:
    return ACCESS_TOKEN_EXPIRE_MINUTES * 60


def refresh_token_expires_at() -> datetime:
    return utc_now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
