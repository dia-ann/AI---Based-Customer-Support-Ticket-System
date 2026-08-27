import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Numeric, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from backend.app.database import Base
from backend.app.models.enums import TicketPriority, TicketSentiment, TicketStatus

class Ticket(Base):
    __tablename__ = "tickets"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"))
    department_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id"))
    assigned_agent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    priority: Mapped[TicketPriority | None] = mapped_column(SAEnum(TicketPriority, name="ticket_priority"))
    sentiment: Mapped[TicketSentiment | None] = mapped_column(SAEnum(TicketSentiment, name="ticket_sentiment"))
    status: Mapped[TicketStatus] = mapped_column(SAEnum(TicketStatus, name="ticket_status"), nullable=False, default=TicketStatus.open)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    body_redacted: Mapped[str] = mapped_column(String, nullable=False)
    classification_confidence: Mapped[float | None] = mapped_column(Numeric(4, 3))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())