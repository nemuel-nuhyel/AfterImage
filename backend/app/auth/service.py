from __future__ import annotations

import hashlib
import secrets
from uuid import uuid4

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .models import RefreshToken, User
from .schemas import AuthResponse, SignupRequest, UserResponse, UserRole
from .security import (
    access_token_expires_in,
    create_access_token,
    hash_password,
    refresh_token_expires_at,
    utc_now,
    verify_password,
)


class AuthError(Exception):
    pass


class DuplicateUserError(AuthError):
    pass


class InvalidCredentialsError(AuthError):
    pass


class InvalidRefreshTokenError(AuthError):
    pass


def _hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _new_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        role=UserRole(user.role),
        is_active=user.is_active,
        created_at=user.created_at,
    )


class AuthService:
    def create_user(
        self,
        db: Session,
        request: SignupRequest,
        *,
        client_ip: str | None,
        user_agent: str | None,
    ) -> AuthResponse:
        existing = db.scalar(
            select(User).where(or_(User.email == request.email, User.username == request.username))
        )
        if existing is not None:
            raise DuplicateUserError("Email or username is already registered")

        now = utc_now()
        user = User(
            email=request.email,
            username=request.username,
            display_name=request.display_name,
            hashed_password=hash_password(request.password),
            role=UserRole.user.value,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return self.issue_token_pair(db, user, client_ip=client_ip, user_agent=user_agent)

    def authenticate(
        self,
        db: Session,
        *,
        email: str,
        password: str,
        client_ip: str | None,
        user_agent: str | None,
    ) -> AuthResponse:
        user = db.scalar(select(User).where(User.email == email))
        if user is None or not user.is_active or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError("Invalid email or password")
        return self.issue_token_pair(db, user, client_ip=client_ip, user_agent=user_agent)

    def issue_token_pair(
        self,
        db: Session,
        user: User,
        *,
        client_ip: str | None,
        user_agent: str | None,
        family_id: str | None = None,
    ) -> AuthResponse:
        raw_refresh_token = _new_refresh_token()
        refresh_record = RefreshToken(
            user_id=user.id,
            token_hash=_hash_refresh_token(raw_refresh_token),
            family_id=family_id or str(uuid4()),
            expires_at=refresh_token_expires_at(),
            created_at=utc_now(),
            client_ip=client_ip,
            user_agent=user_agent,
        )
        db.add(refresh_record)
        db.commit()
        return AuthResponse(
            access_token=create_access_token(user_id=user.id, role=user.role),
            refresh_token=raw_refresh_token,
            expires_in=access_token_expires_in(),
            user=user_response(user),
        )

    def refresh(
        self,
        db: Session,
        *,
        refresh_token: str,
        client_ip: str | None,
        user_agent: str | None,
    ) -> AuthResponse:
        token_hash = _hash_refresh_token(refresh_token)
        record = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        now = utc_now()
        if record is None:
            raise InvalidRefreshTokenError("Invalid refresh token")
        if record.revoked_at is not None:
            self.revoke_family(db, record.family_id)
            raise InvalidRefreshTokenError("Refresh token reuse detected")
        if record.expires_at <= now:
            record.revoked_at = now
            db.commit()
            raise InvalidRefreshTokenError("Refresh token expired")

        user = db.get(User, record.user_id)
        if user is None or not user.is_active:
            raise InvalidRefreshTokenError("User unavailable")

        raw_refresh_token = _new_refresh_token()
        replacement = RefreshToken(
            user_id=user.id,
            token_hash=_hash_refresh_token(raw_refresh_token),
            family_id=record.family_id,
            expires_at=refresh_token_expires_at(),
            created_at=now,
            client_ip=client_ip,
            user_agent=user_agent,
        )
        db.add(replacement)
        db.flush()
        record.revoked_at = now
        record.replaced_by_token_id = replacement.id
        db.commit()

        return AuthResponse(
            access_token=create_access_token(user_id=user.id, role=user.role),
            refresh_token=raw_refresh_token,
            expires_in=access_token_expires_in(),
            user=user_response(user),
        )

    def logout(self, db: Session, refresh_token: str) -> None:
        record = db.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == _hash_refresh_token(refresh_token))
        )
        if record is not None and record.revoked_at is None:
            record.revoked_at = utc_now()
            db.commit()

    def revoke_family(self, db: Session, family_id: str) -> None:
        now = utc_now()
        records = db.scalars(
            select(RefreshToken).where(
                RefreshToken.family_id == family_id,
                RefreshToken.revoked_at.is_(None),
            )
        )
        for record in records:
            record.revoked_at = now
        db.commit()

    def get_user(self, db: Session, user_id: str) -> User | None:
        return db.get(User, user_id)


auth_service = AuthService()
