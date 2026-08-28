from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from backend.app.models.enums import TicketPriority, TicketSentiment, TicketStatus

class TicketCreate(BaseModel):
    subject: str
    body_redacted: str
    category_id: UUID | None = None
    department_id: UUID | None = None
    priority: TicketPriority | None = None

class TicketUpdate(BaseModel):
    category_id: UUID | None = None
    department_id: UUID | None = None
    assigned_agent_id: UUID | None = None
    priority: TicketPriority | None = None
    sentiment: TicketSentiment | None = None
    status: TicketStatus | None = None
    classification_confidence: Decimal | None = None

class TicketRead(BaseModel):
    id: UUID
    customer_id: UUID
    category_id: UUID | None
    department_id: UUID | None
    assigned_agent_id: UUID | None
    priority: TicketPriority | None
    sentiment: TicketSentiment | None
    status: TicketStatus
    subject: str
    body_redacted: str
    classification_confidence: Decimal | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)