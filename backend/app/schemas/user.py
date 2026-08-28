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
    model_config = ConfigDict(from_attributes=True)
    is_active: bool

class UserUpdate(BaseModel):
    role: UserRole | None = None
    department_id: UUID | None = None
    is_active: bool | None = None