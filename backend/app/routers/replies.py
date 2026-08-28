from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.reply import Reply
from backend.app.models.user import User
from backend.app.models.enums import UserRole
from backend.app.schemas.reply import ReplyCreate, ReplyRead
from backend.app.crud.base import CRUDBase
from backend.app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/replies", tags=["Replies"])
crud = CRUDBase(Reply)

@router.post("/", response_model=ReplyRead, status_code=201)
async def create_reply(payload: ReplyCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = payload.model_dump()
    data["author_id"] = current_user.id
    return await crud.create(db, data)

@router.get("/ticket/{ticket_id}", response_model=list[ReplyRead], dependencies=[Depends(get_current_user)])
async def list_replies_for_ticket(ticket_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Reply).where(Reply.ticket_id == ticket_id).order_by(Reply.created_at))
    return result.scalars().all()

@router.get("/{reply_id}", response_model=ReplyRead, dependencies=[Depends(get_current_user)])
async def get_reply(reply_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, reply_id)
    if not obj:
        raise HTTPException(404, "Reply not found")
    return obj

@router.delete("/{reply_id}", status_code=204, dependencies=[Depends(require_role(UserRole.admin))])
async def delete_reply(reply_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, reply_id)
    if not obj:
        raise HTTPException(404, "Reply not found")
    await crud.delete(db, obj)