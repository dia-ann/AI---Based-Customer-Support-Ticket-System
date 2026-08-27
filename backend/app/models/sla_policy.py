import uuid
from sqlalchemy import Integer, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.database import Base
from backend.app.models.enums import TicketPriority

class SLAPolicy(Base):
    __tablename__ = "sla_policies"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    priority: Mapped[TicketPriority] = mapped_column(SAEnum(TicketPriority, name="ticket_priority"), unique=True, nullable=False)
    response_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    resolution_minutes: Mapped[int] = mapped_column(Integer, nullable=False)