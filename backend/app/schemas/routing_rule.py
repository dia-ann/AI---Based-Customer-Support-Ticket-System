from pydantic import BaseModel, ConfigDict
from uuid import UUID

class RoutingRuleCreate(BaseModel):
    category_id: UUID
    department_id: UUID

class RoutingRuleUpdate(BaseModel):
    category_id: UUID | None = None
    department_id: UUID | None = None

class RoutingRuleRead(BaseModel):
    id: UUID
    category_id: UUID
    department_id: UUID
    model_config = ConfigDict(from_attributes=True)