from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .dependencies import get_current_active_user, get_db
from .models import User
from .schemas import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    LogoutResponse,
    RefreshRequest,
    SignupRequest,
    UserResponse,
)
from .security import AuthDependencyError
from .service import (
    DuplicateUserError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    auth_service,
    user_response,
)


router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(request_body: SignupRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    try:
        return auth_service.create_user(
            db,
            request_body,
            client_ip=_client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
    except DuplicateUserError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except AuthDependencyError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/login", response_model=AuthResponse)
def login(request_body: LoginRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    try:
        return auth_service.authenticate(
            db,
            email=request_body.email,
            password=request_body.password,
            client_ip=_client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
    except InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except AuthDependencyError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/refresh", response_model=AuthResponse)
def refresh(request_body: RefreshRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    try:
        return auth_service.refresh(
            db,
            refresh_token=request_body.refresh_token,
            client_ip=_client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
    except InvalidRefreshTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except AuthDependencyError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.post("/logout", response_model=LogoutResponse)
def logout(request_body: LogoutRequest, db: Session = Depends(get_db)) -> LogoutResponse:
    auth_service.logout(db, request_body.refresh_token)
    return LogoutResponse(logged_out=True)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_active_user)) -> UserResponse:
    return user_response(current_user)


def _client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else None
