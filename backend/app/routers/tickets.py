from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func as sa_func, case, extract
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from backend.app.database import get_db
from backend.app.models.ticket import Ticket
from backend.app.models.user import User
from backend.app.models.sla_state import SLAState
from backend.app.models.category import Category
from backend.app.models.enums import UserRole, TicketStatus, TicketPriority
from backend.app.schemas.ticket import TicketCreate, TicketUpdate, TicketRead
from backend.app.crud.base import CRUDBase
from backend.app.dependencies import get_current_user, require_role

from backend.app.ai.classify_ticket import classify_ticket
from backend.app.models.routing_rule import RoutingRule

router = APIRouter(prefix="/tickets", tags=["Tickets"])
crud = CRUDBase(Ticket)

# ── helpers ──────────────────────────────────────────────────────────
CustomerUser = aliased(User, name="customer_user")


def _ticket_to_read(ticket: Ticket, customer_email: str | None, sla_due_at=None) -> dict:
    """Build a TicketRead-compatible dict from a Ticket ORM object + joined fields."""
    return TicketRead(
        id=ticket.id,
        customer_id=ticket.customer_id,
        customer_email=customer_email,
        category_id=ticket.category_id,
        department_id=ticket.department_id,
        assigned_agent_id=ticket.assigned_agent_id,
        priority=ticket.priority,
        sentiment=ticket.sentiment,
        status=ticket.status,
        subject=ticket.subject,
        body_redacted=ticket.body_redacted,
        classification_confidence=ticket.classification_confidence,
        sla_due_at=sla_due_at,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


# ── CRUD ─────────────────────────────────────────────────────────────

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
    assigned_to_me: bool | None = Query(None),
    unassigned: bool | None = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Ticket, User.email.label("customer_email"), SLAState.resolution_due_at)
        .outerjoin(User, Ticket.customer_id == User.id)
        .outerjoin(SLAState, SLAState.ticket_id == Ticket.id)
    )

    # Role-based filtering
    if current_user.role == UserRole.customer:
        query = query.where(Ticket.customer_id == current_user.id)
    elif current_user.role == UserRole.agent:
        query = query.where(Ticket.department_id == current_user.department_id)

    # Query param filters
    if status_:
        query = query.where(Ticket.status == status_)
    if priority:
        query = query.where(Ticket.priority == priority)
    if department_id:
        query = query.where(Ticket.department_id == department_id)
    if assigned_to_me:
        query = query.where(Ticket.assigned_agent_id == current_user.id)
    if unassigned:
        query = query.where(Ticket.assigned_agent_id.is_(None))

    query = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    return [
        _ticket_to_read(ticket, customer_email, sla_due_at)
        for ticket, customer_email, sla_due_at in rows
    ]


@router.get("/{ticket_id}", response_model=TicketRead)
async def get_ticket(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Ticket, User.email.label("customer_email"), SLAState.resolution_due_at)
        .outerjoin(User, Ticket.customer_id == User.id)
        .outerjoin(SLAState, SLAState.ticket_id == Ticket.id)
        .where(Ticket.id == ticket_id)
    )
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(404, "Ticket not found")

    ticket, customer_email, sla_due_at = row
    if current_user.role == UserRole.customer and ticket.customer_id != current_user.id:
        raise HTTPException(403, "Not allowed")

    return _ticket_to_read(ticket, customer_email, sla_due_at)


@router.put("/{ticket_id}", response_model=TicketRead, dependencies=[Depends(require_role(UserRole.admin, UserRole.agent))])
async def update_ticket(ticket_id: UUID, payload: TicketUpdate, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, ticket_id)
    if not obj:
        raise HTTPException(404, "Ticket not found")
    updated = await crud.update(db, obj, payload.model_dump(exclude_unset=True))

    # Fetch joined data for response
    query = (
        select(User.email, SLAState.resolution_due_at)
        .select_from(Ticket)
        .outerjoin(User, Ticket.customer_id == User.id)
        .outerjoin(SLAState, SLAState.ticket_id == Ticket.id)
        .where(Ticket.id == ticket_id)
    )
    result = await db.execute(query)
    row = result.first()
    customer_email = row[0] if row else None
    sla_due_at = row[1] if row else None

    return _ticket_to_read(updated, customer_email, sla_due_at)


@router.delete("/{ticket_id}", status_code=204, dependencies=[Depends(require_role(UserRole.admin))])
async def delete_ticket(ticket_id: UUID, db: AsyncSession = Depends(get_db)):
    obj = await crud.get(db, ticket_id)
    if not obj:
        raise HTTPException(404, "Ticket not found")
    await crud.delete(db, obj)