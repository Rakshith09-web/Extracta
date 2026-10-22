# n8n Automated Workflows for AI Sales CRM

This directory contains **production-ready n8n workflow definitions** for automated lead enrichment, Twenty CRM synchronization, and incident alerting.

---

## 📁 Workflows in this Directory

1. **`workflows/lead_enrichment_pipeline.json`**:
   - **Trigger**: Webhook from FastAPI when a prospect lead is discovered.
   - **Actions**: Validates payload, fetches organization intelligence (headcount, funding, tech stack), and posts back to `POST /api/v1/webhooks/n8n/enrichment-complete`.
   - **Error Handling**: Automatically routes payload errors to the alerting node.

2. **`workflows/crm_sync_pipeline.json`**:
   - **Trigger**: Webhook when a lead status changes to `APPROVED`.
   - **Actions**: Provisions contact and company records into Twenty CRM, creates external mappings, and calls `POST /api/v1/webhooks/n8n/crm-sync-complete`.

3. **`workflows/error_alerting_pipeline.json`**:
   - **Trigger**: Webhook on agent execution failures or rate limit violations.
   - **Actions**: Formats high-priority incident notifications and logs an audit record in `POST /api/v1/webhooks/n8n/alert`.

---

## 🚀 How to Import and Run in n8n

### Option A: Import into Cloud or Local n8n UI
1. Open your n8n dashboard (e.g. `http://localhost:5678`).
2. Click **Workflows** → **Add Workflow** (top right) → Click the **`...` (Menu)** → **Import from File**.
3. Select any of the `.json` files inside `workflows/`.
4. Update the `http://backend:8000` URL in the HTTP Request nodes to match your backend host if running outside Docker.
5. Click **Save** and toggle the workflow to **Active**.

---

## 🔒 Webhook Authentication

All webhook endpoints require the secret header:
```http
X-Webhook-Secret: n8n_sales_crm_secure_webhook_secret_2026
```
This protects your backend receivers against unauthorized requests.