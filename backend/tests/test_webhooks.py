import json
import uuid
import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
WEBHOOK_SECRET = "n8n_sales_crm_secure_webhook_secret_2026"


def test_n8n_webhook_auth_protection():
    """
    Test 1: Verify requests without valid X-Webhook-Secret are rejected with HTTP 401.
    """
    res = client.post("/api/v1/webhooks/n8n/enrichment-complete", json={})
    assert res.status_code == 401
    assert "Invalid or missing X-Webhook-Secret" in res.json().get("detail", "")

    # Invalid secret
    res_bad = client.post(
        "/api/v1/webhooks/n8n/enrichment-complete",
        headers={"X-Webhook-Secret": "wrong_secret_123"},
        json={}
    )
    assert res_bad.status_code == 401


def test_n8n_alert_webhook():
    """
    Test 2: Verify alert webhook accepts operational alerts and returns HTTP 200.
    """
    payload = {
        "tenant_id": str(uuid.uuid4()),
        "level": "WARNING",
        "source": "n8n_test_suite",
        "message": "Automated workflow test notification",
        "context": {"test_run_id": "tr_102"}
    }
    res = client.post(
        "/api/v1/webhooks/n8n/alert",
        headers={"X-Webhook-Secret": WEBHOOK_SECRET},
        json=payload
    )
    assert res.status_code == 200
    assert res.json().get("status") == "RECORDED"


def test_n8n_workflow_json_files():
    """
    Test 3: Validate syntax and integrity of all 3 n8n workflow definition files.
    """
    workflow_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "infrastructure", "n8n", "workflows")
    )
    assert os.path.exists(workflow_dir), f"Workflow directory must exist at {workflow_dir}"

    expected_files = [
        "lead_enrichment_pipeline.json",
        "crm_sync_pipeline.json",
        "error_alerting_pipeline.json",
        "scheduled_search_pipeline.json"
    ]

    for fname in expected_files:
        fpath = os.path.join(workflow_dir, fname)
        assert os.path.exists(fpath), f"Workflow file {fname} not found"
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert "name" in data
            assert "nodes" in data
            assert len(data["nodes"]) >= 3
            assert "connections" in data


def test_list_n8n_workflows_endpoint():
    """
    Test 4: Verify GET /api/v1/webhooks/n8n/workflows returns all registered pipelines.
    """
    res = client.get("/api/v1/webhooks/n8n/workflows")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ACTIVE"
    assert len(data["workflows"]) == 4


def test_n8n_workflow_service_dispatcher():
    """
    Test 5: Verify N8nWorkflowService dispatches webhook triggers with fallback simulation.
    """
    import asyncio
    from app.services.n8n_service import N8nWorkflowService
    
    tenant_id = uuid.uuid4()
    lead_id = uuid.uuid4()
    
    async def _run_checks():
        # 1. Lead enrichment dispatch
        res_enrich = await N8nWorkflowService.trigger_lead_enrichment(
            lead_id=lead_id,
            email="alex.mercer@innovate.tech",
            company_name="Innovate Tech",
            tenant_id=tenant_id
        )
        assert res_enrich["status"] in ["SUCCESS", "SIMULATED"]

        # 2. Pipeline alert dispatch
        res_alert = await N8nWorkflowService.send_pipeline_alert(
            level="WARNING",
            source="unit_test",
            message="Dispatcher verification message",
            tenant_id=tenant_id
        )
        assert res_alert["status"] in ["SUCCESS", "SIMULATED"]

    asyncio.run(_run_checks())
