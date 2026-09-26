import logging
import secrets
from datetime import datetime, timezone
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from backend.app.core import mailer
from backend.app.core.supabase_client import supabase_admin
from backend.app.crud.base import CRUDBase
from backend.app.models.user import User
from backend.app.models.department import Department
from backend.app.models.enums import UserRole, AgentTier
from backend.app.schemas.user import AgentInvite, AgentInviteResponse, UserRead
from backend.app.services.manager_service import validate_single_department_manager


logger = logging.getLogger(__name__)
user_crud = CRUDBase(User)


async def delete_auth_user_quietly(auth_user_id: str) -> None:
    try:
        await run_in_threadpool(supabase_admin.auth.admin.delete_user, auth_user_id)
    except Exception:
        logger.exception("Failed to clean up auth user %s", auth_user_id)


def _find_auth_user_id_by_email(email: str) -> str | None:
    page = 1
    per_page = 50
    target = email.strip().lower()
    while True:
        res = supabase_admin.auth.admin.list_users(page=page, per_page=per_page)
        users = getattr(res, "users", None) or []
        for u in users:
            if getattr(u, "email", "").strip().lower() == target:
                return str(u.id)
        if len(users) < per_page:
            return None
        page += 1


async def invite_agent_workflow(
    payload: AgentInvite,
    db: AsyncSession,
    admin: User,
) -> AgentInviteResponse:
    """Provisions Supabase Auth account, local profile, and Brevo invite email."""
    email = payload.email.strip().lower()
    department = await db.get(Department, payload.department_id)
    if not department:
        raise HTTPException(400, "Department not found")

    temp_password = f"Ag!{secrets.token_urlsafe(9)}"

    # 1. Supabase Auth Provisioning
    created_auth_user = False
    reinvited = False
    try:
        res = await run_in_threadpool(
            supabase_admin.auth.admin.create_user,
            {
                "email": email,
                "password": temp_password,
                "email_confirm": True,
                "user_metadata": {
                    "first_name": payload.first_name,
                    "last_name": payload.last_name,
                    "role": "agent",
                },
            },
        )
        auth_user_id = str(res.user.id)
        created_auth_user = True
    except HTTPException:
        raise
    except Exception as exc:
        existing_id = await run_in_threadpool(_find_auth_user_id_by_email, email)
        if not existing_id:
            raise HTTPException(400, f"Could not create the agent in Supabase Auth: {exc}")
        try:
            await run_in_threadpool(
                supabase_admin.auth.admin.update_user_by_id,
                existing_id,
                {"password": temp_password, "email_confirm": True},
            )
        except Exception as inner_exc:
            raise HTTPException(
                400,
                f"Agent already exists in Supabase Auth but password could not be reset: {inner_exc}",
            )
        auth_user_id = existing_id
        reinvited = True

    # 2. Database Profile Writing
    now = datetime.now(timezone.utc)
    try:
        result = await db.execute(select(User).where(User.email == email))
        profile = result.scalar_one_or_none()
        if profile is None:
            profile = await db.get(User, UUID(auth_user_id))
        elif str(profile.id) != auth_user_id:
            raise HTTPException(
                409,
                f"A profile for {email} already exists with id {profile.id}, but Supabase Auth has {auth_user_id}.",
            )

        # Single Manager Invariant
        if payload.agent_tier == AgentTier.manager:
            try:
                await validate_single_department_manager(
                    db, department.id, exclude_user_id=profile.id if profile else None
                )
            except ValueError as exc:
                raise HTTPException(400, str(exc))


        if profile is None:
            profile = User(
                id=UUID(auth_user_id),
                email=email,
                password_hash="MANAGED_BY_SUPABASE_AUTH",
                role=UserRole.agent,
                department_id=department.id,
                is_active=True,
                first_name=payload.first_name,
                last_name=payload.last_name,
                agent_tier=payload.agent_tier,
                must_change_password=True,
                invited_at=now,
                invited_by=admin.id,
            )
            db.add(profile)
        else:
            profile.role = UserRole.agent
            profile.department_id = department.id
            profile.first_name = payload.first_name
            profile.last_name = payload.last_name
            profile.agent_tier = payload.agent_tier
            profile.is_active = True
            profile.must_change_password = True
            profile.invited_at = now
            profile.invited_by = admin.id
            reinvited = True

        await db.commit()
        await db.refresh(profile)
    except HTTPException:
        await db.rollback()
        if created_auth_user:
            await delete_auth_user_quietly(auth_user_id)
        raise
    except Exception:
        await db.rollback()
        logger.exception("Failed to persist invited agent %s", email)
        if created_auth_user:
            await delete_auth_user_quietly(auth_user_id)
        raise HTTPException(500, "Agent created in Auth but the profile write failed")

    # 3. Brevo Email
    email_sent = True
    try:
        await run_in_threadpool(
            mailer.send_agent_invite_email,
            to=email,
            temporary_password=temp_password,
            department_name=department.name,
            first_name=payload.first_name,
            last_name=payload.last_name,
            agent_tier=payload.agent_tier,
        )
    except Exception as exc:
        email_sent = False
        logger.warning("Brevo email send failed for %s: %s", email, exc)

    detail = (
        f"Invitation emailed to {email}"
        if email_sent
        else "Agent created, but the invitation email could not be sent. Share password manually."
    )

    return AgentInviteResponse(
        user=UserRead.model_validate(profile),
        department_name=department.name,
        email_sent=email_sent,
        reinvited=reinvited,
        detail=detail,
        temporary_password=None if email_sent else temp_password,
    )
