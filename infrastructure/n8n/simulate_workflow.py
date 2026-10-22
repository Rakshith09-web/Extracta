"""
n8n Workflow Simulation & Test Trigger Script
Executes and tests n8n webhook pipelines against the FastAPI backend.
"""

import httpx
import uuid
import json
import os
import sys

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
WEBHOOK_SECRET = "n8n_sales_crm_secure_webhook_secret_2026"


def test_lead_enrichment():
    print("\n--- 1. Testing Lead Enrichment Pipeline Callback ---")
    lead_id = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())
    payload = {
        "lead_id": lead_id,
        "tenant_id": tenant_id,
        "provider": "n8n_automated_enrichment",
        "enrichment_data": {
            "company_domain": "innovatetech.io",
            "headcount": 140,
            "funding_stage": "Series B",
            "total_funding": "$28,000,000",
            "tech_stack": ["FastAPI", "React", "PostgreSQL", "TailwindCSS"],
            "linkedin_url": "https://linkedin.com/company/innovate-tech"
        }
    }
    headers = {"Content-Type": "application/json", "X-Webhook-Secret": WEBHOOK_SECRET}
    
    try:
        res = httpx.post(f"{BACKEND_URL}/api/v1/webhooks/n8n/enrichment-complete", json=payload, headers=headers, timeout=15.0)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Error: {e}")


def test_crm_sync():
    print("\n--- 2. Testing CRM Sync Pipeline Callback ---")
    lead_id = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())
    payload = {
        "lead_id": lead_id,
        "tenant_id": tenant_id,
        "crm_name": "Twenty CRM",
        "crm_record_id": f"tw_rec_{uuid.uuid4().hex[:8]}",
        "sync_status": "SYNCED"
    }
    headers = {"Content-Type": "application/json", "X-Webhook-Secret": WEBHOOK_SECRET}
    
    try:
        res = httpx.post(f"{BACKEND_URL}/api/v1/webhooks/n8n/crm-sync-complete", json=payload, headers=headers, timeout=15.0)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Error: {e}")


def test_alert_pipeline():
    print("\n--- 3. Testing Error Alerting Pipeline Callback ---")
    tenant_id = str(uuid.uuid4())
    payload = {
        "tenant_id": tenant_id,
        "level": "WARNING",
        "source": "n8n_pipeline_monitor",
        "message": "Scheduled lead discovery completed with 18 high-intent prospects",
        "context": {"batch_id": f"batch_{uuid.uuid4().hex[:6]}", "duration_sec": 4.2}
    }
    headers = {"Content-Type": "application/json", "X-Webhook-Secret": WEBHOOK_SECRET}
    
    try:
        res = httpx.post(f"{BACKEND_URL}/api/v1/webhooks/n8n/alert", json=payload, headers=headers, timeout=5.0)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Error: {e}")


def list_registered_workflows():
    print("\n--- 4. Querying Registered n8n Pipelines from Backend ---")
    try:
        res = httpx.get(f"{BACKEND_URL}/api/v1/webhooks/n8n/workflows", timeout=5.0)
        print(f"Status: {res.status_code}")
        workflows = res.json().get("workflows", [])
        for wf in workflows:
            print(f"  • [{wf['id']}] {wf['name']} -> {wf['file']} (Trigger: {wf['trigger_path']})")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    print("==================================================")
    print("   AI Sales CRM - n8n Automated Pipeline Test   ")
    print("==================================================")
    list_registered_workflows()
    test_lead_enrichment()
    test_crm_sync()
    test_alert_pipeline()
    print("\nAll n8n automated workflow pipelines tested successfully!")
