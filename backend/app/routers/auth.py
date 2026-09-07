import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from backend.app.config import settings
from backend.app.core.supabase_client import make_anon_client, supabase, supabase_admin
from backend.app.database import get_db
from backend.app.dependencies import get_access_token, get_current_user, get_token_claims
from backend.app.models.enums import UserRole
from backend.app.models.user import User
from backend.app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    PasswordChangedResponse,
    RefreshRequest,
    SignUpRequest,
    TokenResponse,
)
from backend.app.schemas.user import UserRead

from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _verify_password(email: str, password: str):
    """Confirm a password against Supabase Auth and return the auth user.

    Uses a throwaway client so the module-level singleton never holds someone
    else's session. Returns None when the credentials are wrong.
    """
    client = make_anon_client()
    try:
        res = client.auth.sign_in_with_password({"email": email, "password": password})
    except Exception:
        return None
    finally:
        try:
            client.auth.sign_out(options={"scope": "local"})
        except Exception:
            pass
    return getattr(res, "user", None)


async def _apply_new_password(
    db: AsyncSession, *, auth_user_id: str, email: str, new_password: str
) -> None:
    try:
        await run_in_threadpool(
            supabase_admin.auth.admin.update_user_by_id,
            auth_user_id,
            {"password": new_password},
        )
    except Exception as exc:
        logger.warning("Password update rejected for %s: %s", email, exc)
        raise HTTPException(400, f"Password update rejected: {exc}")

    result = await db.execute(select(User).where(User.email == email))
    profile = result.scalar_one_or_none()
    if profile is not None:
        profile.must_change_password = False
        profile.password_changed_at = datetime.now(timezone.utc)
        await db.commit()


@router.post("/signup", status_code=201)
async def signup(payload: SignUpRequest, db: AsyncSession = Depends(get_db)):
    if not settings.ALLOW_PUBLIC_SIGNUP:
        raise HTTPException(403, "Public signup is disabled. Ask an administrator for an account.")

    try:
        res = supabase.auth.sign_up({"email": payload.email, "password": payload.password})
    except Exception as e:
        raise HTTPException(400, str(e))

    user = res.user
    if not user:
        raise HTTPException(400, "Signup failed")

    if not getattr(user, "identities", None):
        raise HTTPException(409, "Email already registered")

    email = user.email
    if not email:
        raise HTTPException(400, "Signup succeeded but returned no email address.")

    # Public signup ALWAYS creates a customer. Agents/admins are provisioned by
    # an admin via POST /users/invite-agent - never by self-service.
    new_user = User(
        id=user.id,
        email=email,
        password_hash="MANAGED_BY_SUPABASE_AUTH",
        phone_number=payload.phone_number,
        role=UserRole.customer,
        must_change_password=False,
    )
    db.add(new_user)

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        try:
            supabase_admin.auth.admin.delete_user(user.id)
        except Exception:
            logger.exception("Failed to clean up auth user %s after DB error", user.id)
        raise HTTPException(409, "Email already registered")
    await db.refresh(new_user)
    return {"message": "Signup successful", "user_id": str(new_user.id)}


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        res = supabase.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    except Exception as e:
        raise HTTPException(401, str(e))
    session = res.session
    user = res.user
    if session is None or user is None:
        raise HTTPException(401, "Invalid credentials")

    result = await db.execute(select(User).where(User.id == user.id))
    profile = result.scalar_one_or_none()

    return TokenResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
        user={
            "id": str(user.id),
            "email": user.email,
            "role": profile.role.value if profile else None,
            "must_change_password": bool(profile.must_change_password) if profile else False,
        },
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest):
    try:
        res = supabase.auth.refresh_session(payload.refresh_token)
    except Exception as e:
        raise HTTPException(401, str(e))
    session = res.session
    user = res.user
    if session is None or user is None:
        raise HTTPException(401, "Invalid refresh token")
    return TokenResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
        user={"id": str(user.id), "email": user.email},
    )


@router.post("/logout")
async def logout(
    token: str = Depends(get_access_token),
    claims: dict = Depends(get_token_claims),
):
    revoked = True
    try:
        await run_in_threadpool(supabase_admin.auth.admin.sign_out, token, "local")
    except Exception as exc:
        revoked = False
        logger.warning("Supabase sign_out failed for sub=%s: %s", claims.get("sub"), exc)
    return {"message": "Logged out", "session_revoked": revoked}


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password", response_model=PasswordChangedResponse)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Signed-in password change (also clears the first-login flag)."""
    auth_user = await run_in_threadpool(
        _verify_password, current_user.email, payload.current_password
    )
    if auth_user is None:
        raise HTTPException(401, "Current password is incorrect")

    await _apply_new_password(
        db,
        auth_user_id=str(current_user.id),
        email=current_user.email,
        new_password=payload.new_password,
    )
    return PasswordChangedResponse(message="Password updated")


@router.post("/forgot-password", response_model=PasswordChangedResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset from the login screen using the OLD password (no email link).

    Deliberately returns the same 401 for 'no such account' and 'wrong old
    password' so the endpoint cannot be used to enumerate addresses.
    """
    email = str(payload.email).strip().lower()
    auth_user = await run_in_threadpool(_verify_password, email, payload.current_password)
    if auth_user is None:
        raise HTTPException(401, "Email or current password is incorrect")

    await _apply_new_password(
        db,
        auth_user_id=str(auth_user.id),
        email=email,
        new_password=payload.new_password,
    )
    return PasswordChangedResponse(message="Password updated. Sign in with your new password.")