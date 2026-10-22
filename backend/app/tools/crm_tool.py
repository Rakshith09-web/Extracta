import random
from typing import Dict, Any


def sync_to_twenty_crm(lead_id: str, company_name: str, full_name: str, email: str) -> Dict[str, Any]:
    """
    Simulates checking existence and creating/updating a record in Twenty CRM.
    """
    record_id = f"tw_{random.randint(100000, 999999)}"
    return {
        "crm_name": "Twenty CRM",
        "crm_record_id": record_id,
        "sync_status": "SYNCED",
        "action": "RECORD_CREATED",
        "message": f"Lead {full_name} synced to Twenty CRM company {company_name}."
    }


def export_to_google_sheets(leads_count: int, sheet_title: str) -> Dict[str, Any]:
    """
    Simulates writing a batch of leads to a Google Sheet for sales review.
    """
    sheet_id = f"sheet_{random.randint(100000, 999999)}"
    return {
        "spreadsheet_id": sheet_id,
        "spreadsheet_url": f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit",
        "rows_appended": leads_count,
        "status": "READY_FOR_REVIEW"
    }
