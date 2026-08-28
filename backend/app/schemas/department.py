from pydantic import BaseModel, ConfigDict
from uuid import UUID

class DepartmentCreate(BaseModel):
    name: str

class DepartmentUpdate(BaseModel):
    name: str | None = None

class DepartmentRead(BaseModel):
    id: UUID
    name: str
    model_config = ConfigDict(from_attributes=True)