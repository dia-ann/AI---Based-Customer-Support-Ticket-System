import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    agent = "agent"
    customer = "customer"

class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class TicketSentiment(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"

class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    pending = "pending"
    resolved = "resolved"
    closed = "closed"