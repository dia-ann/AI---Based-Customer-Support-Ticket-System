from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.department import Department
from backend.app.models.enums import UserRole
from backend.app.schemas.user import UserRead, UserUpdate
from backend.app.crud.base import CRUDBase
from backend.app.dependencies import require_role
from backend.app.core.supabase_client import supabase_admin
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/users", tags=["Users"])
crud = CRUDBase(User)

SUPER_ADMIN_EMAIL = "admin@test.com"


def is_super_admin(user: User) -> bool:
    return user.email.strip().lower() == SUPER_ADMIN_EMAIL


class UserInvite(BaseModel):
    email: EmailStr


@router.post("/invite", response_model=UserRead, dependencies=[Depends(require_role(UserRole.admin))])
async def invite_user(payload: UserInvite, db: AsyncSession = Depends(get_db)):
    try:
        res = supabase_admin.auth.admin.invite_user_by_email(payload.email)
    except Exception as e:
        # Graceful fallback to direct user creation (useful if SMTP is not configured in Supabase)
        try:
            res = supabase_admin.auth.admin.create_user({
                "email": payload.email,
                "email_confirm": True,
                "password": "TemporaryPassword123!"
            })
        except Exception as inner_e:
            raise HTTPException(400, f"Supabase invitation failed: {str(e)} (fallback creation failed: {str(inner_e)})")
    
    user = res.user
    if not user:
        raise HTTPException(400, "Invitation/Creation failed to return a user.")
        
    # Check if the user already exists in the database
    existing_user = await db.get(User, user.id)
    if existing_user:
        return existing_user

    # Add to our local database
    new_user = User(
        id=user.id,
        email=user.email,
        password_hash="MANAGED_BY_SUPABASE_AUTH",
        role=UserRole.agent, # Default role for invited user
        is_active=True
    )
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except Exception:
        await db.rollback()
        raise HTTPException(409, "Email already registered in local database.")
        
    return new_user


@router.get("/", response_model=list[UserRead], dependencies=[Depends(require_role(UserRole.admin))])
async def list_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .where(User.email != SUPER_ADMIN_EMAIL)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserRead, dependencies=[Depends(require_role(UserRole.admin))])
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, user_id)
    if not obj or is_super_admin(obj):
        raise HTTPException(404, "User not found")
    return obj


@router.put("/{user_id}", response_model=UserRead, dependencies=[Depends(require_role(UserRole.admin))])
async def update_user(user_id: UUID, payload: UserUpdate, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, user_id)
    if not obj:
        raise HTTPException(404, "User not found")
    if is_super_admin(obj):
        raise HTTPException(403, "The seeded Super Admin cannot be changed")

    updates = payload.model_dump(exclude_unset=True)

    if "role" in updates or "department_id" in updates:
        next_role = updates.get("role", obj.role)
        next_department_id = updates.get("department_id", obj.department_id)

    if next_role == UserRole.admin:
        if not next_department_id:
            raise HTTPException(400, "Admins must be assigned to the Administration department")
        department = await db.get(Department, next_department_id)
        if not department:
            raise HTTPException(400, "Department not found")
        if department.name.strip().lower() != "administration":
            raise HTTPException(400, "Only the Administration department can assign admin role")
        updates["department_id"] = next_department_id
    elif next_role == UserRole.agent:
        if not next_department_id:
            raise HTTPException(400, "Agents must be assigned to a department")

        department = await db.get(Department, next_department_id)
        if not department:
            raise HTTPException(400, "Department not found")

        if department.name.strip().lower() == "administration":
            updates["role"] = UserRole.admin
            updates["department_id"] = next_department_id
        else:
            updates["role"] = UserRole.agent
            updates["department_id"] = next_department_id
    else:
        raise HTTPException(400, "Role management only supports Admin or Agent + Department")
    return await crud.update(db, obj, updates)


@router.delete("/{user_id}", status_code=204, dependencies=[Depends(require_role(UserRole.admin))])
async def delete_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, user_id)
    if not obj:
        raise HTTPException(404, "User not found")
    if is_super_admin(obj):
        raise HTTPException(403, "The seeded Super Admin cannot be changed")

    await crud.delete(db, obj)