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
from backend.app.models.ticket_rating import TicketRating
from backend.app.schemas.ticket_rating import TicketRatingCreate, TicketRatingRead
from datetime import datetime, timedelta

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
    needs_triage: bool | None = Query(None),  # <--- NEW PARAM
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
    elif current_user.role == UserRole.admin:
        if not status_:
            query = query.where(Ticket.status.notin_([TicketStatus.resolved, TicketStatus.closed]))

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

    # Triage Panel filtering - Admins only
    if needs_triage is not None and current_user.role == UserRole.admin:
        if needs_triage:
            query = query.where(
                # If it's NOT manually overridden by an admin (1.0)
                (Ticket.classification_confidence.is_(None) | (Ticket.classification_confidence != 1.0)) &
                (
                    (Ticket.category_id.is_(None)) |
                    (Ticket.classification_confidence < 0.6) |
                    (Ticket.department_id.is_(None))
                )
            )
        else:
            query = query.where(
                # If it WAS manually overridden (1.0) OR it successfully passed AI triage automatically
                (Ticket.classification_confidence == 1.0) |
                (
                    (Ticket.category_id.is_not(None)) &
                    (Ticket.classification_confidence >= 0.6) &
                    (Ticket.department_id.is_not(None))
                )
            )
    query = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    return [
        _ticket_to_read(ticket, customer_email, sla_due_at)
        for ticket, customer_email, sla_due_at in rows
    ]


@router.get("/analytics")
async def get_analytics(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_role(UserRole.admin, UserRole.agent))):
    now = datetime.now()
    five_days_ago = now - timedelta(days=5)
    ten_days_ago = now - timedelta(days=10)

    # 1. Totals & Trend
    total_query = select(sa_func.count()).select_from(Ticket)
    total_tickets = (await db.execute(total_query)).scalar() or 0

    recent_query = select(sa_func.count()).select_from(Ticket).where(Ticket.created_at >= five_days_ago)
    recent_tickets = (await db.execute(recent_query)).scalar() or 0

    past_query = select(sa_func.count()).select_from(Ticket).where(Ticket.created_at >= ten_days_ago, Ticket.created_at < five_days_ago)
    past_tickets = (await db.execute(past_query)).scalar() or 0

    if past_tickets > 0:
        total_tickets_trend = round(((recent_tickets - past_tickets) / past_tickets) * 100, 1)
    else:
        total_tickets_trend = 100.0 if recent_tickets > 0 else 0.0

    # 2. Status Counts
    status_counts_query = select(Ticket.status, sa_func.count()).group_by(Ticket.status)
    status_counts_rows = (await db.execute(status_counts_query)).all()
    status_counts = {k.name: v for k, v in status_counts_rows}

    open_count = status_counts.get("open", 0)
    in_progress_count = status_counts.get("in_progress", 0)
    pending_count = status_counts.get("pending", 0)
    resolved_count = status_counts.get("resolved", 0)
    closed_count = status_counts.get("closed", 0)

    tickets_by_status = [
        {"name": "open", "count": open_count},
        {"name": "in_progress", "count": in_progress_count},
        {"name": "pending", "count": pending_count},
        {"name": "resolved", "count": resolved_count},
        {"name": "closed", "count": closed_count},
    ]

    # 3. Category Breakdown
    cat_query = select(Category.name, sa_func.count()).select_from(Ticket).join(Category, Ticket.category_id == Category.id).group_by(Category.name)
    cat_rows = (await db.execute(cat_query)).all()
    tickets_by_category = [{"name": r[0], "count": r[1]} for r in cat_rows]

    # 4. CSAT (Average Rating)
    csat_query = select(sa_func.avg(TicketRating.rating)).select_from(TicketRating)
    csat_val = (await db.execute(csat_query)).scalar()
    csat = round(float(csat_val), 1) if csat_val else "N/A"

    # 5. Agent Performance
    agent_query = (
        select(
            User.id,
            User.email,
            sa_func.sum(case((Ticket.status.notin_([TicketStatus.resolved, TicketStatus.closed]), 1), else_=0)),
            sa_func.sum(case((Ticket.status == TicketStatus.closed, 1), else_=0))
        )
        .select_from(Ticket)
        .join(User, Ticket.assigned_agent_id == User.id)
        .group_by(User.id)
    )
    agent_rows = (await db.execute(agent_query)).all()
    
    agent_performance = []
    for row in agent_rows:
        agent_performance.append({
            "id": str(row[0]),
            "name": row[1].split('@')[0],
            "unresolved_count": int(row[2] or 0),
            "closed_count": int(row[3] or 0),
            "avg_time": "1h", # Placeholder
            "rating": csat # Placeholder
        })

    return {
        "total_tickets": total_tickets,
        "total_tickets_trend": total_tickets_trend,
        "avg_response_label": "1h 30m", # Placeholder
        "avg_response_trend": 0.0,
        "resolved_count": resolved_count,
        "closed_count": closed_count,
        "open_count": open_count,
        "sla_compliance": {
            "csat": str(csat)
        },
        "tickets_by_category": tickets_by_category,
        "tickets_by_status": tickets_by_status,
        "agent_performance": agent_performance
    }

@router.post("/{ticket_id}/rate", response_model=TicketRatingRead, status_code=201)
async def rate_ticket(
    ticket_id: UUID, 
    payload: TicketRatingCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Verify ticket belongs to customer and is resolved/closed
    ticket = await crud.get(db, ticket_id)
    if not ticket:
        raise HTTPException(404, "Ticket not found")
    if ticket.customer_id != current_user.id:
        raise HTTPException(403, "Not allowed")
    if ticket.status not in (TicketStatus.resolved, TicketStatus.closed):
        raise HTTPException(400, "Can only rate resolved or closed tickets")
        
    # Check if already rated
    existing = (await db.execute(select(TicketRating).where(TicketRating.ticket_id == ticket_id))).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Ticket already rated")
        
    rating = TicketRating(
        ticket_id=ticket_id,
        rating=payload.rating,
        feedback=payload.feedback
    )
    db.add(rating)
    await db.commit()
    await db.refresh(rating)
    return rating


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