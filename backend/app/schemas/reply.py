from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class ReplyCreate(BaseModel):
    ticket_id: UUID
    body: str
    is_auto_reply: bool = False
    is_internal_note: bool = False

class ReplyRead(BaseModel):
    id: UUID
    ticket_id: UUID
    author_id: UUID | None
    author_email: str | None = None
    is_auto_reply: bool
    is_internal_note: bool
    body: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)