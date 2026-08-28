from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class SLAStateCreate(BaseModel):
    ticket_id: UUID
    sla_policy_id: UUID
    response_due_at: datetime
    resolution_due_at: datetime

class SLAStateUpdate(BaseModel):
    first_response_at: datetime | None = None
    resolved_at: datetime | None = None
    breached: bool | None = None
    escalated_at: datetime | None = None

class SLAStateRead(BaseModel):
    id: UUID
    ticket_id: UUID
    sla_policy_id: UUID
    response_due_at: datetime
    resolution_due_at: datetime
    first_response_at: datetime | None
    resolved_at: datetime | None
    breached: bool
    escalated_at: datetime | None
    model_config = ConfigDict(from_attributes=True)