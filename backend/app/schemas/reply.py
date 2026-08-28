from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class ReplyCreate(BaseModel):
    ticket_id: UUID
    body: str
    is_auto_reply: bool = False

class ReplyRead(BaseModel):
    id: UUID
    ticket_id: UUID
    author_id: UUID | None
    is_auto_reply: bool
    body: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)