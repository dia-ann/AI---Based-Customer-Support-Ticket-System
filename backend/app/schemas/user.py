from pydantic import BaseModel, ConfigDict, EmailStr
from uuid import UUID
from datetime import datetime
from backend.app.models.enums import UserRole


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole
    department_id: UUID | None
    created_at: datetime
    is_active: bool
    must_change_password: bool = False
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    role: UserRole | None = None
    department_id: UUID | None = None
    is_active: bool | None = None


class AgentInvite(BaseModel):
    """Admin -> Settings -> Agent Management -> Invite Agent."""

    email: EmailStr
    department_id: UUID


class AgentInviteResponse(BaseModel):
    user: UserRead
    department_name: str
    email_sent: bool
    reinvited: bool = False
    detail: str
    temporary_password: str | None = None