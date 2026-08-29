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
async def create_ticket(
    payload: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["customer_id"] = current_user.id
    ticket = await crud.create(db, data)

    # Fetch the joined data for the response
    return _ticket_to_read(ticket, current_user.email)


@router.get("/analytics")
async def ticket_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """Compute dashboard analytics from live ticket data."""
    # Total tickets
    total_q = await db.execute(select(sa_func.count(Ticket.id)))
    total_tickets = total_q.scalar() or 0

    # Status counts
    status_q = await db.execute(
        select(Ticket.status, sa_func.count(Ticket.id)).group_by(Ticket.status)
    )
    status_counts = dict(status_q.all())

    open_count = (
        status_counts.get(TicketStatus.open, 0)
        + status_counts.get(TicketStatus.pending, 0)
        + status_counts.get(TicketStatus.in_progress, 0)
    )
    resolved_count = status_counts.get(TicketStatus.resolved, 0)
    closed_count = status_counts.get(TicketStatus.closed, 0)

    # By category
    cat_q = await db.execute(
        select(Category.name, sa_func.count(Ticket.id))
        .outerjoin(Category, Ticket.category_id == Category.id)
        .group_by(Category.name)
    )
    tickets_by_category = [
        {"name": name or "Uncategorized", "count": count}
        for name, count in cat_q.all()
    ]

    # By priority
    prio_q = await db.execute(
        select(Ticket.priority, sa_func.count(Ticket.id)).group_by(Ticket.priority)
    )
    tickets_by_priority = [
        {"name": (p.value if p else "unset"), "count": c}
        for p, c in prio_q.all()
    ]

    # SLA compliance (breached vs total that have SLA states)
    sla_total_q = await db.execute(select(sa_func.count(SLAState.id)))
    sla_total = sla_total_q.scalar() or 0
    sla_breached_q = await db.execute(
        select(sa_func.count(SLAState.id)).where(SLAState.breached == True)
    )
    sla_breached = sla_breached_q.scalar() or 0
    sla_compliance = round((1 - sla_breached / sla_total) * 100, 1) if sla_total > 0 else 100

    # Calculate average response time
    from backend.app.models.reply import Reply
    first_reply_cte = (
        select(
            Reply.ticket_id,
            sa_func.min(Reply.created_at).label("first_reply_at")
        )
        .join(Ticket, Reply.ticket_id == Ticket.id)
        .where(Reply.author_id != Ticket.customer_id)
        .group_by(Reply.ticket_id)
        .cte("first_replies")
    )
    avg_response_q = await db.execute(
        select(
            sa_func.avg(
                extract("epoch", first_reply_cte.c.first_reply_at - Ticket.created_at)
            )
        )
        .join(first_reply_cte, Ticket.id == first_reply_cte.c.ticket_id)
    )
    avg_response_seconds = avg_response_q.scalar()
    avg_response_label = "N/A"
    if avg_response_seconds is not None:
        hours = int(avg_response_seconds // 3600)
        minutes = int((avg_response_seconds % 3600) // 60)
        if hours > 0:
            avg_response_label = f"{hours}h {minutes}m"
        else:
            avg_response_label = f"{minutes}m"

    # Agent performance: query resolved/closed tickets grouped by assigned agent
    agent_perf_q = await db.execute(
        select(
            User.id,
            User.email,
            sa_func.count(Ticket.id).label("solved_count"),
            sa_func.avg(
                extract("epoch", Ticket.updated_at - Ticket.created_at)
            ).label("avg_resolve_seconds")
        )
        .join(User, Ticket.assigned_agent_id == User.id)
        .where(Ticket.status.in_([TicketStatus.resolved, TicketStatus.closed]))
        .group_by(User.id, User.email)
        .order_by(sa_func.count(Ticket.id).desc())
    )
    agent_performance = []
    for row in agent_perf_q.all():
        avg_sec = row.avg_resolve_seconds
        avg_time_label = "N/A"
        if avg_sec is not None:
            hours = int(avg_sec // 3600)
            minutes = int((avg_sec % 3600) // 60)
            if hours > 0:
                avg_time_label = f"{hours}h {minutes}m"
            else:
                avg_time_label = f"{minutes}m"
        
        agent_performance.append({
            "id": str(row.id),
            "email": row.email,
            "name": row.email.split("@")[0].title().replace(".", " "),
            "solved_count": row.solved_count,
            "avg_time": avg_time_label,
            "rating": 4.8,
        })

    return {
        "total_tickets": total_tickets,
        "total_tickets_trend": 0,
        "open_count": open_count,
        "open_count_trend": 0,
        "resolved_count": resolved_count,
        "closed_count": closed_count,
        "avg_response_label": avg_response_label,
        "avg_response_trend": 0,
        "tickets_by_category": tickets_by_category,
        "tickets_by_priority": tickets_by_priority,
        "tickets_by_status": [
            {"name": s.value, "count": status_counts.get(s, 0)}
            for s in TicketStatus
        ],
        "sla_compliance": {
            "overall": sla_compliance,
            "response": sla_compliance,
            "resolution": sla_compliance,
            "csat": None,
        },
        "agent_performance": agent_performance,
    }


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