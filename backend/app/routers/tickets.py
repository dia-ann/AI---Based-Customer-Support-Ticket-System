from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models.ticket import Ticket
from backend.app.models.user import User
from backend.app.models.enums import UserRole, TicketStatus, TicketPriority
from backend.app.schemas.ticket import TicketCreate, TicketUpdate, TicketRead
from backend.app.crud.base import CRUDBase
from backend.app.dependencies import get_current_user, require_role

from backend.app.ai.classify_ticket import classify_ticket
from backend.app.models.category import Category
from backend.app.models.routing_rule import RoutingRule

router = APIRouter(prefix="/tickets", tags=["Tickets"])
crud = CRUDBase(Ticket)

@router.post("/", response_model=TicketRead, status_code=201)
async def create_ticket(payload: TicketCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    ai_result = classify_ticket(payload.subject, payload.body)

    category_row = (await db.execute(
        select(Category).where(Category.name == ai_result["category"]["label"])
    )).scalar_one_or_none()

    department_id = None
    if category_row:
        routing = (await db.execute(
            select(RoutingRule).where(RoutingRule.category_id == category_row.id)
        )).scalar_one_or_none()
        department_id = routing.department_id if routing else None

    data = {
        "customer_id": current_user.id,
        "subject": payload.subject,
        "body_redacted": ai_result["body_redacted"],
        "category_id": category_row.id if category_row else None,
        "department_id": department_id,
        "priority": ai_result["priority"]["label"],
        "classification_confidence": ai_result["category"]["confidence"],
        "status": "human_review" if ai_result["category"]["needs_human_review"] else "open",
    }
    return await crud.create(db, data)

@router.get("/", response_model=list[TicketRead])
async def list_tickets(
    status_: TicketStatus | None = Query(None, alias="status"),
    priority: TicketPriority | None = None,
    department_id: UUID | None = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Ticket)
    if current_user.role == UserRole.customer:
        query = query.where(Ticket.customer_id == current_user.id)
    elif current_user.role == UserRole.agent:
        query = query.where(Ticket.department_id == current_user.department_id)

    if status_:
        query = query.where(Ticket.status == status_)
    if priority:
        query = query.where(Ticket.priority == priority)
    if department_id:
        query = query.where(Ticket.department_id == department_id)

    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{ticket_id}", response_model=TicketRead)
async def get_ticket(ticket_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = await crud.get(db, ticket_id)
    if not obj:
        raise HTTPException(404, "Ticket not found")
    if current_user.role == UserRole.customer and obj.customer_id != current_user.id:
        raise HTTPException(403, "Not allowed")
    return obj

@router.put("/{ticket_id}", response_model=TicketRead, dependencies=[Depends(require_role(UserRole.admin, UserRole.agent))])
async def update_ticket(ticket_id: UUID, payload: TicketUpdate, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, ticket_id)
    if not obj:
        raise HTTPException(404, "Ticket not found")
    return await crud.update(db, obj, payload.model_dump(exclude_unset=True))

@router.delete("/{ticket_id}", status_code=204, dependencies=[Depends(require_role(UserRole.admin))])
async def delete_ticket(ticket_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, ticket_id)
    if not obj:
        raise HTTPException(404, "Ticket not found")
    await crud.delete(db, obj)