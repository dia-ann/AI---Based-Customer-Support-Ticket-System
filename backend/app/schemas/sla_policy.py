from pydantic import BaseModel, ConfigDict
from uuid import UUID
from backend.app.models.enums import TicketPriority

class SLAPolicyCreate(BaseModel):
    priority: TicketPriority
    response_minutes: int
    resolution_minutes: int

class SLAPolicyUpdate(BaseModel):
    response_minutes: int | None = None
    resolution_minutes: int | None = None

class SLAPolicyRead(BaseModel):
    id: UUID
    priority: TicketPriority
    response_minutes: int
    resolution_minutes: int
    model_config = ConfigDict(from_attributes=True)