from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.routing_rule import RoutingRule
from backend.app.models.enums import UserRole
from backend.app.schemas.routing_rule import RoutingRuleCreate, RoutingRuleUpdate, RoutingRuleRead
from backend.app.crud.base import CRUDBase
from backend.app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/routing-rules", tags=["Routing Rules"])
crud = CRUDBase(RoutingRule)

@router.post("/", response_model=RoutingRuleRead, status_code=201, dependencies=[Depends(require_role(UserRole.admin))])
async def create_rule(payload: RoutingRuleCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create(db, payload.model_dump())

@router.get("/", response_model=list[RoutingRuleRead], dependencies=[Depends(get_current_user)])
async def list_rules(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.get_all(db, skip, limit)

@router.get("/{rule_id}", response_model=RoutingRuleRead, dependencies=[Depends(get_current_user)])
async def get_rule(rule_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, rule_id)
    if not obj:
        raise HTTPException(404, "Routing rule not found")
    return obj

@router.put("/{rule_id}", response_model=RoutingRuleRead, dependencies=[Depends(require_role(UserRole.admin))])
async def update_rule(rule_id: UUID, payload: RoutingRuleUpdate, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, rule_id)
    if not obj:
        raise HTTPException(404, "Routing rule not found")
    return await crud.update(db, obj, payload.model_dump(exclude_unset=True))

@router.delete("/{rule_id}", status_code=204, dependencies=[Depends(require_role(UserRole.admin))])
async def delete_rule(rule_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, rule_id)
    if not obj:
        raise HTTPException(404, "Routing rule not found")
    await crud.delete(db, obj)