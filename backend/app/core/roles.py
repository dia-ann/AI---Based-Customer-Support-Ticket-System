from backend.app.models.enums import UserRole

COMPANY_DOMAINS = {
    "persistent.com",
    "ritgoa.ac.in",
    "aiemgoa.ac.in",
    "pccegoa.edu.in",
}

def role_for_email(email: str) -> UserRole:
    domain = email.rsplit("@", 1)[-1].strip().lower()
    return UserRole.agent if domain in COMPANY_DOMAINS else UserRole.customer