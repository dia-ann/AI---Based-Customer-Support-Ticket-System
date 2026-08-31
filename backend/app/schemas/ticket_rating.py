from pydantic import BaseModel, Field
import uuid
from datetime import datetime

class TicketRatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    feedback: str | None = None

class TicketRatingRead(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    rating: int
    feedback: str | None
    created_at: datetime

    class Config:
        from_attributes = True
