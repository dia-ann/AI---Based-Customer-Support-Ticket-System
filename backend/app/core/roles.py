from backend.app.models.enums import UserRole

COMPANY_DOMAINS = {
    "test.com",
    "ritgoa.ac.in",
    "aiemgoa.ac.in",
    "pccegoa.edu.in",
}

def is_company_domain(email: str) -> bool:
    """Check if the email belongs to an allowed company domain."""
    domain = email.rsplit("@", 1)[-1].strip().lower() if "@" in email else ""
    return domain in COMPANY_DOMAINS

def role_for_email(email: str) -> UserRole:
    domain = email.rsplit("@", 1)[-1].strip().lower()
    return UserRole.agent if domain in COMPANY_DOMAINS else UserRole.customer