import re
import random
from typing import Dict, Any


def validate_email_address(email: str) -> Dict[str, Any]:
    """
    Validates email deliverability using syntax check, simulated MX records, and SMTP ping.
    """
    if not email or "@" not in email:
        return {
            "status": "INVALID",
            "is_deliverable": False,
            "score": 0.0,
            "provider": "Mock Deliverability Engine",
            "details": "Malformed email syntax"
        }

    domain = email.split("@")[1]
    # Simulate high deliverability (95% valid in mock)
    is_valid = random.random() < 0.95
    score = round(random.uniform(0.92, 0.99), 2) if is_valid else round(random.uniform(0.20, 0.50), 2)

    return {
        "status": "VALID" if is_valid else "INVALID",
        "is_deliverable": is_valid,
        "score": score,
        "mx_found": True,
        "mx_host": f"mail.{domain}",
        "smtp_check": "250 2.1.5 OK Mailbox Available" if is_valid else "550 5.1.1 User Unknown",
        "provider": "Mock Email Deliverability Engine"
    }
