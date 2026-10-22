import random
from typing import Dict, Any

TECH_STACKS = [
    ["React", "Python", "FastAPI", "PostgreSQL", "AWS"],
    ["Next.js", "TypeScript", "Node.js", "MongoDB", "GCP"],
    ["Vue.js", "Django", "Docker", "Kubernetes", "Redis"],
    ["Angular", "Java Spring Boot", "Oracle", "Azure"],
    ["React Native", "Go", "GraphQL", "Snowflake", "Kafka"]
]

FUNDING_ROUNDS = ["Seed ($1.5M)", "Series A ($8.5M)", "Series B ($22M)", "Bootstrapped / Profitable", "Series C ($45M)"]


def enrich_lead_intelligence(company_name: str, full_name: str) -> Dict[str, Any]:
    """
    Simulates fetching third-party enrichment (Apollo / LinkedIn / Clearbit).
    """
    clean_name = full_name.lower().replace(" ", "-")
    return {
        "linkedin_url": f"https://www.linkedin.com/in/{clean_name}",
        "company_funding": random.choice(FUNDING_ROUNDS),
        "tech_stack": random.choice(TECH_STACKS),
        "annual_revenue": random.choice(["$2M - $5M", "$5M - $10M", "$10M - $25M", "$25M - $50M"]),
        "year_founded": random.randint(2014, 2023),
        "provider": "Apollo.io Intelligence"
    }
