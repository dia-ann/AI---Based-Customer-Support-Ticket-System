import logging

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from backend.app.database import get_db
from backend.app.core.supabase_client import supabase, supabase_admin
from backend.app.schemas.auth import SignUpRequest, LoginRequest, RefreshRequest, TokenResponse
from backend.app.schemas.user import UserRead
from backend.app.models.user import User
from backend.app.dependencies import get_access_token, get_current_user, get_token_claims
from backend.app.core.roles import role_for_email

from uuid import UUID
from sqlalchemy import update

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup", status_code=201)
async def signup(payload: SignUpRequest, db: AsyncSession = Depends(get_db)):
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

    new_user = User(
        id=user.id,
        email=email,
        password_hash="MANAGED_BY_SUPABASE_AUTH",
        phone_number=payload.phone_number,
        role=role_for_email(email),
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
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db),):
    try:
        res = supabase.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    except Exception as e:
        raise HTTPException(401, str(e))
    session = res.session
    user = res.user
    if session is None or user is None:
        raise HTTPException(401, "Invalid credentials")
    return TokenResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
        user={"id": str(user.id), "email": user.email},
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
        logger.warning(
            "Supabase sign_out failed for sub=%s: %s", claims.get("sub"), exc
        )
    return {
        "message": "Logged out",
        "session_revoked": revoked,
    }

@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
