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

router = APIRouter(prefix="/users", tags=["Users"])
crud = CRUDBase(User)

SUPER_ADMIN_EMAIL = "admin@test.com"


def is_super_admin(user: User) -> bool:
    return user.email.strip().lower() == SUPER_ADMIN_EMAIL


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