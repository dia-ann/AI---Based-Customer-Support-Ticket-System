from pydantic import BaseModel, ConfigDict
from uuid import UUID

class CategoryCreate(BaseModel):
    name: str
    description: str | None = None

class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class CategoryRead(BaseModel):
    id: UUID
    name: str
    description: str | None
    model_config = ConfigDict(from_attributes=True)