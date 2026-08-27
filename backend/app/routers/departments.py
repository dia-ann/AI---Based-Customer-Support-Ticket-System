from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.department import Department
from backend.app.models.enums import UserRole
from backend.app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentRead
from backend.app.crud.base import CRUDBase
from backend.app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/departments", tags=["Departments"])
crud = CRUDBase(Department)

@router.post("/", response_model=DepartmentRead, status_code=201, dependencies=[Depends(require_role(UserRole.admin))])
async def create_department(payload: DepartmentCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create(db, payload.model_dump())

@router.get("/", response_model=list[DepartmentRead], dependencies=[Depends(get_current_user)])
async def list_departments(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.get_all(db, skip, limit)

@router.get("/{department_id}", response_model=DepartmentRead, dependencies=[Depends(get_current_user)])
async def get_department(department_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, department_id)
    if not obj:
        raise HTTPException(404, "Department not found")
    return obj

@router.put("/{department_id}", response_model=DepartmentRead, dependencies=[Depends(require_role(UserRole.admin))])
async def update_department(department_id: UUID, payload: DepartmentUpdate, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, department_id)
    if not obj:
        raise HTTPException(404, "Department not found")
    return await crud.update(db, obj, payload.model_dump(exclude_unset=True))

@router.delete("/{department_id}", status_code=204, dependencies=[Depends(require_role(UserRole.admin))])
async def delete_department(department_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, department_id)
    if not obj:
        raise HTTPException(404, "Department not found")
    await crud.delete(db, obj)