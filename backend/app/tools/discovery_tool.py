import time
import random
from typing import List, Dict, Any

# Pool of realistic companies and names for mock discovery
FIRST_NAMES = ["Aarav", "Pooja", "Rohan", "Ananya", "Vikram", "Neha", "Aditya", "Sneha", "Kunal", "Meera", "Rahul", "Priya"]
LAST_NAMES = ["Patel", "Shah", "Mehta", "Desai", "Joshi", "Sharma", "Verma", "Gupta", "Trivedi", "Reddy", "Nair", "Kapoor"]
COMPANY_PREFIXES = ["Nova", "Apex", "Zenith", "Cloud", "Quantum", "Nexus", "Cyber", "Vortex", "Synthetix", "Pulse", "Infra", "Core"]
COMPANY_SUFFIXES = ["Tech", "Systems", "Solutions", "AI", "Software", "Labs", "Digital", "Networks", "Data", "Dynamics"]


def generate_mock_leads(industry: str, location: str, job_title: str, count: int) -> List[Dict[str, Any]]:
    """
    Simulates discovery through Apollo.io / Apify with realistic company names, roles, and contacts.
    """
    discovered: List[Dict[str, Any]] = []
    used_emails = set()

    for i in range(count):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        full_name = f"{fn} {ln}"
        
        comp_name = f"{random.choice(COMPANY_PREFIXES)}{random.choice(COMPANY_SUFFIXES)} {random.choice(['Ltd', 'Inc', 'Pvt Ltd'])}"
        domain = comp_name.lower().replace(" ", "").replace("ltd", "").replace("inc", "").replace("pvtltd", "") + ".com"
        
        email_prefix = f"{fn.lower()}.{ln.lower()}"
        if email_prefix in used_emails:
            email_prefix = f"{fn.lower()}{ln.lower()}{random.randint(10, 99)}"
        used_emails.add(email_prefix)

        email = f"{email_prefix}@{domain}"
        phone = f"+91 {random.randint(90000, 99999)} {random.randint(10000, 99999)}"

        discovered.append({
            "first_name": fn,
            "last_name": ln,
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "company_name": comp_name,
            "job_title": job_title or "HR Manager",
            "industry": industry or "Software / IT",
            "location": location or "Ahmedabad, Gujarat",
            "company_size": random.choice(["25-50", "50-100", "100-250", "250-500", "500-1000"]),
            "source": "AI_APOLLO_DISCOVERY",
            "raw_data": {
                "apollo_record_id": f"apl_{random.randint(100000, 999999)}",
                "extracted_location": location,
                "confidence_score": round(random.uniform(0.88, 0.99), 2)
            }
        })

    return discovered
