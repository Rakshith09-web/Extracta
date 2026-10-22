from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseDiscoveryAdapter(ABC):
    """
    Abstract contract for B2B Company & Contact Discovery Providers (Apollo / Apify).
    """
    @abstractmethod
    async def discover_leads(
        self,
        industry: str,
        location: str,
        job_title: str,
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        pass


class BaseValidationAdapter(ABC):
    """
    Abstract contract for Email Validation Providers.
    """
    @abstractmethod
    async def validate_email(self, email: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        pass


class BaseEnrichmentAdapter(ABC):
    """
    Abstract contract for Prospect and Organization Enrichment.
    """
    @abstractmethod
    async def enrich_contact(self, company_name: str, full_name: str, email: Optional[str] = None) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        pass


class BaseCRMAdapter(ABC):
    """
    Abstract contract for CRM synchronization (Twenty CRM).
    """
    @abstractmethod
    async def sync_contact(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        pass


class BaseSheetsAdapter(ABC):
    """
    Abstract contract for Google Sheets review layer.
    """
    @abstractmethod
    async def export_leads(self, leads: List[Dict[str, Any]], sheet_title: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        pass
